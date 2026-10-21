-- ==============================================================================
-- MIGRAÇÃO: INTEGRAÇÃO MERCADO PAGO CHECKOUT PRO (SANDBOX & PRODUÇÃO)
-- COMPATIBILIDADE: PostgreSQL 15+ / Supabase
-- OBJETIVO: Rastreamento seguro, auditoria antifraude e controle de idempotência
-- ==============================================================================

-- 1. ADICIONAR CAMPOS DO MERCADO PAGO NA TABELA ORDERS
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
ADD COLUMN IF NOT EXISTS mp_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS mp_payment_type TEXT,
ADD COLUMN IF NOT EXISTS mp_merchant_order_id TEXT,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. GARANTIR VALOR DEFAULT 'pending' PARA payment_status
ALTER TABLE public.orders 
ALTER COLUMN payment_status SET DEFAULT 'pending';

-- 3. CRIAR ÍNDICES PARA CONSULTAS RÁPIDAS DE WEBHOOKS E RECONCILIAÇÃO
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id ON public.orders(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON public.orders(mp_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 4. TABELA DE AUDITORIA DE EVENTOS DE PAGAMENTO (LOG DE WEBHOOKS)
-- Registra todas as notificações recebidas para prevenir contestações e auditar fraudes
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'mercadopago',
    event_type TEXT NOT NULL,
    mp_payment_id TEXT,
    payload JSONB NOT NULL,
    ip_address TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_order_id ON public.payment_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_payment_id ON public.payment_audit_logs(mp_payment_id);

-- 5. PROCEDIMENTO ATÔMICO DE ATUALIZAÇÃO DE STATUS DE PAGAMENTO (IDEMPOTENTE)
-- Garante que chamadas duplicadas do Webhook não alterem duas vezes o status
CREATE OR REPLACE FUNCTION public.process_mp_payment_webhook(
    p_order_id UUID,
    p_mp_payment_id TEXT,
    p_status TEXT,                -- 'approved', 'pending', 'rejected', 'cancelled', 'refunded'
    p_payment_type TEXT,          -- 'credit_card', 'bank_transfer' (Pix), 'ticket' (Boleto)
    p_merchant_order_id TEXT,
    p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_new_payment_status payment_status;
    v_new_order_status order_status;
BEGIN
    -- 1. Buscar o pedido com LOCK PESSIMISTA
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado.');
    END IF;

    -- 2. Idempotência: Se o pedido já estiver como 'paid' e receber nova notificação de 'approved', ignorar
    IF v_order.payment_status = 'paid' AND p_status = 'approved' THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Pagamento já processado anteriormente. Nenhuma ação necessária.',
            'order_id', p_order_id
        );
    END IF;

    -- 3. Mapear status do Mercado Pago para os Enums internos
    IF p_status = 'approved' THEN
        v_new_payment_status := 'paid'::payment_status;
        -- Transição de pedido: se estava 'pending', avança para 'artwork_analysis' ou 'in_production'
        v_new_order_status := 'artwork_analysis'::order_status;
    ELSIF p_status IN ('rejected', 'cancelled') THEN
        v_new_payment_status := 'failed'::payment_status;
        v_new_order_status := 'cancelled'::order_status;
    ELSIF p_status = 'refunded' THEN
        v_new_payment_status := 'refunded'::payment_status;
        v_new_order_status := 'cancelled'::order_status;
    ELSE
        v_new_payment_status := 'pending'::payment_status;
        v_new_order_status := v_order.status;
    END IF;

    -- 4. Atualizar registro do pedido
    UPDATE public.orders
    SET 
        payment_status = v_new_payment_status,
        status = v_new_order_status,
        mp_payment_id = p_mp_payment_id,
        mp_status = p_status,
        mp_payment_type = p_payment_type,
        mp_merchant_order_id = p_merchant_order_id,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 5. Gravar registro no log de auditoria
    INSERT INTO public.payment_audit_logs (
        order_id,
        provider,
        event_type,
        mp_payment_id,
        payload,
        verified
    ) VALUES (
        p_order_id,
        'mercadopago',
        'payment.' || p_status,
        p_mp_payment_id,
        p_raw_payload,
        TRUE
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'previous_status', v_order.payment_status,
        'new_status', v_new_payment_status
    );
END;
$$;
