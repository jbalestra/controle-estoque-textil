-- ==============================================================================
-- SCHEMA DDL: PLATAFORMA DE E-COMMERCE TÊXTIL SOB MEDIDA & CUSTOMIZÁVEL
-- COMPATIBILIDADE: PostgreSQL 15+ / Supabase
-- AUTOR: Engenharia de Software & Arquitetura de Soluções
-- ==============================================================================

-- 1. EXTENSÕES OBRIGATÓRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE DOMÍNIO
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('ready_made', 'custom_made');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',              -- Pedido recebido, aguardando início
        'artwork_analysis',     -- Análise técnica da arte enviada pelo cliente
        'in_production',        -- Corte, estamparia e costura
        'ready_for_shipping',   -- Controle de qualidade finalizado, embalado
        'shipped',              -- Postado / em trânsito
        'delivered',            -- Entregue ao cliente
        'cancelled'             -- Cancelado (estorno e devolução de estoque)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE PERFIS DE USUÁRIOS (Extensão de auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    company_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE TECIDOS / INSUMOS (ESTOQUE PRIMÁRIO DE MATÉRIA-PRIMA)
CREATE TABLE IF NOT EXISTS public.fabrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,                       -- Código interno/SKU do tecido (ex: TEC-ALG-001)
    name TEXT NOT NULL,                             -- Nome comercial (ex: Algodão Pima Peruano)
    composition TEXT NOT NULL,                      -- ex: 100% Algodão 60 fios
    description TEXT,
    texture_url TEXT NOT NULL,                      -- Imagem de textura seamless/tileable para o canvas
    sample_thumbnail_url TEXT NOT NULL,             -- Foto miniatura da amostra física
    available_meters NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (available_meters >= 0),
    reserved_meters NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (reserved_meters >= 0),
    min_stock_alert NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    cost_per_meter NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00 CHECK (price_multiplier >= 1.00),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE PRODUTOS BASE E PRODUTOS PRONTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    product_type product_type NOT NULL DEFAULT 'custom_made',
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    required_meters NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (required_meters >= 0), -- Consumo de tecido por unidade
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),              -- Estoque físico para 'ready_made'
    base_mockup_url TEXT NOT NULL,                  -- PNG com transparência da peça vazia
    mask_mockup_url TEXT,                           -- Máscara para mapeamento UV / recorte de textura
    printable_bounds JSONB NOT NULL DEFAULT '{"x": 150, "y": 120, "width": 300, "height": 380}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'paid',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA DE CUSTOMIZAÇÃO DO ITEM (PRODUTOS SOB MEDIDA)
CREATE TABLE IF NOT EXISTS public.order_item_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE UNIQUE,
    fabric_id UUID NOT NULL REFERENCES public.fabrics(id) ON DELETE RESTRICT,
    consumed_meters NUMERIC(10, 2) NOT NULL CHECK (consumed_meters >= 0),
    artwork_file_url TEXT,                          -- URL do arquivo enviado pelo cliente em alta resolução (Supabase Storage)
    artwork_original_name TEXT,
    custom_text TEXT,                               -- Texto bordado / estampado
    font_id TEXT,                                   -- Identificador da fonte (ex: 'Playfair Display')
    text_color TEXT,                                -- Hex da cor da linha ou tinta
    canvas_snapshot_url TEXT,                       -- Imagem preview renderizada na aprovação do carrinho
    transform_matrix JSONB NOT NULL DEFAULT '{}'::jsonb, -- Coordenadas exatas: x, y, scale, rotation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_fabrics_active_stock ON public.fabrics (is_active, available_meters);
CREATE INDEX IF NOT EXISTS idx_products_type_active ON public.products (product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_customizations_fabric_id ON public.order_item_customizations (fabric_id);

-- ==============================================================================
-- PROCEDIMENTO ATÔMICO DE CRIAÇÃO DE PEDIDO COM LOCK PESSIMISTA
-- Previne Race Conditions e Overselling de Tecidos e Produtos
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_custom_order_transaction(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_shipping_address JSONB,
    p_items JSONB -- Array de objetos JSON: { product_id, quantity, fabric_id, artwork_url, artwork_name, custom_text, font_id, text_color, transform_matrix, snapshot_url }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_amount NUMERIC(10, 2) := 0.00;
    v_item RECORD;
    v_product RECORD;
    v_fabric RECORD;
    v_item_unit_price NUMERIC(10, 2);
    v_item_total_price NUMERIC(10, 2);
    v_order_item_id UUID;
    v_required_meters_total NUMERIC(10, 2);
BEGIN
    -- 1. Gerar número de pedido legível (ex: PED-20261002-XXXX)
    v_order_number := 'PED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));

    -- 2. Criar cabeçalho do pedido com total temporário
    INSERT INTO public.orders (
        order_number,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        total_amount,
        status,
        payment_status
    ) VALUES (
        v_order_number,
        p_customer_id,
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        p_shipping_address,
        0.00,
        'pending',
        'paid'
    ) RETURNING id INTO v_order_id;

    -- 3. Iterar sobre os itens do pedido com LOCK PESSIMISTA (SELECT FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (
        product_id UUID,
        quantity INTEGER,
        fabric_id UUID,
        artwork_url TEXT,
        artwork_name TEXT,
        custom_text TEXT,
        font_id TEXT,
        text_color TEXT,
        transform_matrix JSONB,
        snapshot_url TEXT
    ) LOOP
        -- A. Buscar e Bloquear Produto
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_item.product_id AND is_active = TRUE
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produto não encontrado ou inativo (ID: %)', v_item.product_id;
        END IF;

        -- Validação de quantidade
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Quantidade inválida para o produto %', v_product.title;
        END IF;

        v_item_unit_price := v_product.base_price;

        -- B. Caso seja produto sob medida (custom_made), validar e debitar TECIDO
        IF v_product.product_type = 'custom_made' THEN
            IF v_item.fabric_id IS NULL THEN
                RAISE EXCEPTION 'Tecido obrigatório para produto sob medida: %', v_product.title;
            END IF;

            -- Bloqueio pessimista da linha do tecido para evitar condição de corrida
            SELECT * INTO v_fabric
            FROM public.fabrics
            WHERE id = v_item.fabric_id AND is_active = TRUE
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Tecido não encontrado ou inativo (ID: %)', v_item.fabric_id;
            END IF;

            v_required_meters_total := v_product.required_meters * v_item.quantity;

            -- Verificação de estoque disponível de insumo
            IF v_fabric.available_meters < v_required_meters_total THEN
                RAISE EXCEPTION 'Estoque de tecido insuficiente para "%". Disponível: %m, Necessário: %m',
                    v_fabric.name, v_fabric.available_meters, v_required_meters_total;
            END IF;

            -- Debitar o estoque de matéria-prima
            UPDATE public.fabrics
            SET available_meters = available_meters - v_required_meters_total,
                updated_at = NOW()
            WHERE id = v_item.fabric_id;

            -- Aplicar multiplicador de custo do tecido premium ao preço unitário
            v_item_unit_price := ROUND(v_product.base_price * v_fabric.price_multiplier, 2);

        ELSE
            -- Produto pronto (ready_made): validar e debitar estoque de prateleira
            IF v_product.stock_quantity < v_item.quantity THEN
                RAISE EXCEPTION 'Estoque insuficiente para o produto "%". Disponível: %, Solicitado: %',
                    v_product.title, v_product.stock_quantity, v_item.quantity;
            END IF;

            UPDATE public.products
            SET stock_quantity = stock_quantity - v_item.quantity,
                updated_at = NOW()
            WHERE id = v_item.product_id;
        END IF;

        -- C. Calcular total do item
        v_item_total_price := v_item_unit_price * v_item.quantity;
        v_total_amount := v_total_amount + v_item_total_price;

        -- D. Inserir order_items
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_order_id,
            v_item.product_id,
            v_item.quantity,
            v_item_unit_price,
            v_item_total_price
        ) RETURNING id INTO v_order_item_id;

        -- E. Inserir customização caso exista
        IF v_product.product_type = 'custom_made' THEN
            INSERT INTO public.order_item_customizations (
                order_item_id,
                fabric_id,
                consumed_meters,
                artwork_file_url,
                artwork_original_name,
                custom_text,
                font_id,
                text_color,
                canvas_snapshot_url,
                transform_matrix
            ) VALUES (
                v_order_item_id,
                v_item.fabric_id,
                v_required_meters_total,
                v_item.artwork_url,
                v_item.artwork_name,
                v_item.custom_text,
                v_item.font_id,
                v_item.text_color,
                v_item.snapshot_url,
                COALESCE(v_item.transform_matrix, '{}'::jsonb)
            );
        END IF;

    END LOOP;

    -- 4. Atualizar o valor total consolidado do pedido
    UPDATE public.orders
    SET total_amount = v_total_amount,
        updated_at = NOW()
    WHERE id = v_order_id;

    -- 5. Retornar dados do pedido criado
    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount
    );
END;
$$;

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_customizations ENABLE ROW LEVEL SECURITY;

-- Regras para Perfis
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Regras para Tecidos (Catálogo público para leitura de tecidos ativos com estoque)
CREATE POLICY "Leitura pública de tecidos ativos com estoque"
ON public.fabrics FOR SELECT
USING (is_active = TRUE AND available_meters > 0);

CREATE POLICY "Vendedores e admins gerenciam tecidos"
ON public.fabrics FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('seller', 'admin')
    )
);

-- Regras para Produtos
CREATE POLICY "Leitura pública de produtos ativos"
ON public.products FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Vendedores e admins gerenciam produtos"
ON public.products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('seller', 'admin')
    )
);

-- Regras para Pedidos
CREATE POLICY "Clientes visualizam seus próprios pedidos"
ON public.orders FOR SELECT
USING (
    auth.uid() = customer_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('seller', 'admin')
    )
);

CREATE POLICY "Vendedores e admins atualizam pedidos"
ON public.orders FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('seller', 'admin')
    )
);

-- Regras para Itens e Customizações
CREATE POLICY "Acesso a itens de pedidos permitidos"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('seller', 'admin')
        ))
    )
);

CREATE POLICY "Acesso a customizações de pedidos permitidos"
ON public.order_item_customizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.order_items
        JOIN public.orders ON orders.id = order_items.order_id
        WHERE order_items.id = order_item_customizations.order_item_id
        AND (orders.customer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('seller', 'admin')
        ))
    )
);
