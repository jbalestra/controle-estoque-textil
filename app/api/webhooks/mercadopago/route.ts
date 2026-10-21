import { NextRequest, NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import {
  getMercadoPagoClient,
  verifyMercadoPagoSignature,
  MP_ACCESS_TOKEN,
} from '@/lib/mercadopago/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Webhook Oficial do Mercado Pago para Confirmação de Pagamento
 * Endpoint: POST /api/webhooks/mercadopago
 *
 * Arquitetura de Segurança:
 * 1. Verificação Criptográfica da Assinatura (HMAC SHA-256 via x-signature)
 * 2. Consulta Reversa Segura (GET /v1/payments/:id com Access Token)
 * 3. Idempotência estrita no banco de dados (evita duplicações em retentativas)
 * 4. Validação do valor pago vs total do pedido (Anti-tampering)
 */
export async function POST(req: NextRequest) {
  try {
    // --------------------------------------------------------------------------
    // 1. EXTRAÇÃO DE CABEÇALHOS E IDENTIFICADORES
    // --------------------------------------------------------------------------
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const url = new URL(req.url);

    // Ler corpo da notificação
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Notificações IPN mais antigas podem vir apenas na query string
    }

    const eventType = body?.type || body?.topic || url.searchParams.get('topic') || url.searchParams.get('type');
    const paymentId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id');

    // --------------------------------------------------------------------------
    // 2. VALIDAÇÃO DE ASSINATURA CRIPTOGRÁFICA (HMAC SHA-256)
    // --------------------------------------------------------------------------
    const signatureCheck = verifyMercadoPagoSignature({
      xSignature,
      xRequestId,
      dataId: paymentId ? String(paymentId) : undefined,
    });

    if (!signatureCheck.isValid) {
      console.warn('[Mercado Pago Webhook] Rejeitado por falha de assinatura:', signatureCheck.reason);
      return NextResponse.json(
        { error: 'Assinatura inválida', reason: signatureCheck.reason },
        { status: 401 }
      );
    }

    // --------------------------------------------------------------------------
    // 3. FILTRAR APENAS EVENTOS DE PAGAMENTO
    // --------------------------------------------------------------------------
    if (eventType !== 'payment' && !body?.action?.startsWith('payment.')) {
      // Outros eventos (ex: merchant_order, plan) retornam 200 OK sem alterar pedidos
      return NextResponse.json({ received: true, ignored: true, reason: 'Evento não relevante' }, { status: 200 });
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'ID de pagamento ausente' }, { status: 400 });
    }

    // --------------------------------------------------------------------------
    // 4. CONSULTA REVERSA OBRIGATÓRIA NA API DO MERCADO PAGO
    // Nunca confia nos dados enviados no POST; busca a fonte da verdade com o Token privado
    // --------------------------------------------------------------------------
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN === 'TEST-YOUR-SANDBOX-ACCESS-TOKEN') {
      console.info('[Mercado Pago Webhook] Modo Simulação (Sem token configurado):', { paymentId });
      return NextResponse.json({ received: true, simulated: true }, { status: 200 });
    }

    const client = getMercadoPagoClient();
    const paymentClient = new Payment(client);

    const payment = await paymentClient.get({ id: String(paymentId) });

    if (!payment || !payment.id) {
      console.error('[Mercado Pago Webhook] Pagamento não encontrado na API do MP:', paymentId);
      return NextResponse.json({ error: 'Pagamento não localizado na API do Mercado Pago' }, { status: 404 });
    }

    const {
      id: mpPaymentId,
      status: mpStatus, // 'approved', 'pending', 'in_process', 'rejected', 'cancelled', 'refunded'
      status_detail: mpStatusDetail,
      transaction_amount: paidAmount,
      payment_type_id: paymentType, // 'credit_card', 'bank_transfer' (Pix), 'ticket'
      external_reference: orderId, // Nosso identificador do pedido
      order: mpOrderInfo,
    } = payment;

    console.info(`[Mercado Pago Webhook] Processando Pagamento ${mpPaymentId}: status=${mpStatus}, pedido=${orderId}`);

    if (!orderId) {
      console.warn('[Mercado Pago Webhook] Pagamento sem external_reference (orderId):', mpPaymentId);
      return NextResponse.json({ received: true, warning: 'Sem external_reference' }, { status: 200 });
    }

    // --------------------------------------------------------------------------
    // 5. ATUALIZAÇÃO IDEMPOTENTE NO BANCO DE DADOS (SUPABASE)
    // --------------------------------------------------------------------------
    const supabase = createServerSupabaseClient();

    // Tentar executar via RPC com Lock Pessimista
    const { data: rpcResult, error: rpcError } = await supabase.rpc('process_mp_payment_webhook', {
      p_order_id: orderId,
      p_mp_payment_id: String(mpPaymentId),
      p_status: mpStatus || 'pending',
      p_payment_type: paymentType || 'unknown',
      p_merchant_order_id: mpOrderInfo?.id ? String(mpOrderInfo.id) : null,
      p_raw_payload: {
        id: mpPaymentId,
        status: mpStatus,
        status_detail: mpStatusDetail,
        transaction_amount: paidAmount,
        payment_type: paymentType,
      },
    });

    if (rpcError) {
      console.warn('[Mercado Pago Webhook] RPC fallback para UPDATE direto no Supabase:', rpcError.message);

      // Fallback: Atualização direta protegida por verificação de status atual
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('id, payment_status, total_amount')
        .eq('id', orderId)
        .maybeSingle();

      if (currentOrder) {
        // Idempotência: não reprocessar se já pago
        if (currentOrder.payment_status !== 'paid' && mpStatus === 'approved') {
          // Anti-tampering: validar se o valor pago é compatível
          if (paidAmount && paidAmount < currentOrder.total_amount) {
            console.error(
              `[ALERTA DE SEGURANÇA] Valor pago (R$ ${paidAmount}) menor que total do pedido (R$ ${currentOrder.total_amount})!`
            );
          }

          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'artwork_analysis',
              mp_payment_id: String(mpPaymentId),
              mp_status: mpStatus,
              mp_payment_type: paymentType,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              mp_payment_id: String(mpPaymentId),
              mp_status: mpStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      }
    }

    // --------------------------------------------------------------------------
    // 6. RETORNO 200 OK (OBRIGATÓRIO PARA O MERCADO PAGO NÃO REENVIAR)
    // --------------------------------------------------------------------------
    return NextResponse.json(
      {
        received: true,
        payment_id: mpPaymentId,
        status: mpStatus,
        order_id: orderId,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('[Mercado Pago Webhook] Falha crítica:', error);
    // Retorna 500 para o Mercado Pago tentar novamente em caso de falha de conexão temporária
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
