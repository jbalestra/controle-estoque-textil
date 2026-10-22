import { MercadoPagoConfig } from 'mercadopago';
import crypto from 'crypto';

/**
 * Configuração Segura do Mercado Pago (Sandbox & Produção)
 * Garante que chaves privadas (Access Token) fiquem estritamente no servidor.
 */

export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';
export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

// Detecta se estamos operando em Sandbox (credenciais de teste começam com TEST-)
export const IS_SANDBOX =
  MP_ACCESS_TOKEN.startsWith('TEST-') ||
  (process.env.MP_SANDBOX_MODE === 'true' && !MP_ACCESS_TOKEN.startsWith('APP_USR-'));

/**
 * Instância singleton do cliente Mercado Pago
 */
export function getMercadoPagoClient(idempotencyKey?: string) {
  if (!MP_ACCESS_TOKEN) {
    console.warn(
      '[Mercado Pago] ATENÇÃO: MP_ACCESS_TOKEN não configurado no .env.local. Configure sua credencial de Sandbox.'
    );
  }

  return new MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN,
    options: {
      timeout: 10000,
      idempotencyKey: idempotencyKey || undefined,
    },
  });
}

/**
 * Obtém a URL base da aplicação para retornos (back_urls) e Webhooks
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Validação de Assinatura do Webhook do Mercado Pago (HMAC SHA-256)
 * Previne ataques de injeção ou notificações falsas de pagamento.
 *
 * Header x-signature esperado no formato:
 * ts=1700000000,v1=abcdef123456...
 */
export function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature?: string | null;
  xRequestId?: string | null;
  dataId?: string | null;
}): { isValid: boolean; reason?: string } {
  // Se não houver segredo configurado no ambiente de desenvolvimento, logar alerta
  if (!MP_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'development' || IS_SANDBOX) {
      console.warn(
        '[Mercado Pago Webhook] MP_WEBHOOK_SECRET não configurado. Em modo Sandbox/Dev, permitindo validação.'
      );
      return { isValid: true };
    }
    return { isValid: false, reason: 'MP_WEBHOOK_SECRET ausente no servidor' };
  }

  if (!xSignature || !xRequestId || !dataId) {
    return { isValid: false, reason: 'Cabeçalhos x-signature, x-request-id ou data.id ausentes' };
  }

  try {
    // 1. Extrair ts (timestamp) e v1 (hash) do header x-signature
    const parts = xSignature.split(',');
    let ts: string | undefined;
    let v1: string | undefined;

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) {
      return { isValid: false, reason: 'Formato inválido do cabeçalho x-signature' };
    }

    // 2. Prevenir Replay Attacks (rejeitar notificações com mais de 10 minutos de idade)
    const timestampMs = parseInt(ts, 10) * 1000;
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    if (Math.abs(now - timestampMs) > tenMinutes) {
      return { isValid: false, reason: 'Notificação expirada (possível Replay Attack)' };
    }

    // 3. Montar o manifesto de verificação conforme especificação oficial do Mercado Pago:
    // "id:[data.id];request-id:[x-request-id];ts:[ts];"
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // 4. Calcular HMAC SHA-256 usando o Webhook Secret
    const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    // 5. Comparação em tempo constante (evita Timing Attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'utf-8'),
      Buffer.from(v1, 'utf-8')
    );

    return { isValid, reason: isValid ? undefined : 'Assinatura HMAC divergente' };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { isValid: false, reason: `Erro ao validar assinatura: ${errMessage}` };
  }
}
