'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createOrderInputSchema, CreateOrderInput } from '@/lib/validations/order';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createCustomOrderAction(
  rawInput: CreateOrderInput
): Promise<ActionResponse<{ orderId: string; orderNumber: string; totalAmount: number }>> {
  try {
    // 1. Validação Estrita de Input via Zod no Servidor
    const parseResult = createOrderInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Dados do pedido inválidos.';
      return { success: false, error: firstError };
    }

    const { customer_id, customer_name, customer_email, customer_phone, shipping_address, items } =
      parseResult.data;

    // 2. Inicializar Cliente Supabase com permissões do servidor
    const supabase = createServerSupabaseClient();

    // 3. Execução da Stored Procedure com Lock Pessimista (SELECT ... FOR UPDATE)
    // Garante atomicidade: se o tecido esgotar durante a concorrência, a transação aborta
    const { data, error } = await supabase.rpc('create_custom_order_transaction', {
      p_customer_id: customer_id || null,
      p_customer_name: customer_name,
      p_customer_email: customer_email,
      p_customer_phone: customer_phone || null,
      p_shipping_address: shipping_address,
      p_items: items,
    });

    if (error) {
      console.error('Erro na Stored Procedure de Pedido:', error.message);
      // Extrair mensagens personalizadas de exceção disparadas pelo PL/pgSQL
      return {
        success: false,
        error: error.message || 'Falha ao processar e reservar estoque para o pedido.',
      };
    }

    // 4. Invalidação de Cache no Next.js (atualizar visão de estoque do lojista e cliente)
    revalidatePath('/seller/inventory');
    revalidatePath('/seller/orders');
    revalidatePath('/catalog');

    return {
      success: true,
      data: {
        orderId: data.order_id,
        orderNumber: data.order_number,
        totalAmount: Number(data.total_amount),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno inesperado no servidor.';
    console.error('Falha crítica na Server Action createCustomOrderAction:', err);
    return {
      success: false,
      error: message,
    };
  }
}
