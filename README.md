# Plataforma E-commerce de Produtos Têxteis Sob Medida & Customizáveis

Arquitetura de software de alta performance desenvolvida para e-commerce têxtil interativo com controle multinível de estoque e pipeline de produção sob medida.

---

## 1. Visão Geral da Arquitetura

```
+---------------------------------------------------------------------------------------+
|                                    NEXT.JS (APP ROUTER)                               |
|                                                                                       |
|   +---------------------------------------+   +-----------------------------------+   |
|   |         ÁREA DO CLIENTE               |   |        PAINEL DO VENDEDOR         |   |
|   |  - Customizador Interativo Canvas 2D  |   |  - Pipeline Kanban de Produção    |   |
|   |  - Seletor Dinâmico de Tecidos        |   |  - Controle Estoque Matéria-Prima |   |
|   |  - Upload HD & Tipografia Google      |   |  - Download de Arte Original HD   |   |
|   +-------------------+-------------------+   +-----------------+-----------------+   |
|                       |                                         |                     |
|                       +--------------------+--------------------+                     |
|                                            |                                          |
|                                [ SERVER ACTIONS / RPC ]                               |
|                                 Validação Zod + Atomicidade                           |
+--------------------------------------------|------------------------------------------+
                                             |
                                             v
+---------------------------------------------------------------------------------------+
|                               POSTGRESQL 15+ / SUPABASE                               |
|                                                                                       |
|   +---------------------------+   +----------------------+   +--------------------+   |
|   |   fabrics (Insumos)       |   | products             |   | orders             |   |
|   |   - available_meters      |   | - required_meters    |   | - status (Kanban)  |   |
|   |   - price_multiplier      |   | - printable_bounds   |   | - order_number     |   |
|   +-------------+-------------+   +-----------+----------+   +----------+---------+   |
|                 ^                             ^                         |             |
|                 |                             |                         v             |
|                 +-----------------------------+---------------> order_items           |
|                                                                         |             |
|                                                                         v             |
|                                                           order_item_customizations   |
|                                                           - artwork_file_url          |
|                                                           - transform_matrix (JSONB)  |
|                                                                                       |
|   [ Stored Procedure: create_custom_order_transaction ]                              |
|   - Concorrência protegida com: SELECT ... FOR UPDATE                                 |
|   - Row Level Security (RLS) habilitado                                               |
+---------------------------------------------------------------------------------------+
```

---

## 2. Destaques Técnicos

### A. Prevenção de Concorrência & Overselling de Tecidos
Diferente de e-commerces tradicionais onde o estoque é unitário por produto, em produtos sob medida o consumo é **volumétrico/fracionário por metragem de tecido** (`available_meters - (required_meters * quantity)`).
A Stored Procedure `create_custom_order_transaction` utiliza:
```sql
SELECT * FROM public.fabrics WHERE id = v_item.fabric_id FOR UPDATE;
```
Isso garante que transações concorrentes aguardem em fila de bloqueio e **jamais vendam mais metros de tecido do que a fábrica tem fisicamente disponível**. Caso a metragem esgote, uma exceção é disparada e toda a transação sofre rollback atômico.

### B. Canvas Interativo em Tempo Real
O componente `ProductCustomizer.tsx` realiza a composição multi-camada:
1. **Camada de Textura do Tecido**: Renderizada via `ctx.createPattern` com imagens seamless tileables.
2. **Camada da Peça Base**: Mesclada via `globalCompositeOperation = 'multiply'` para projetar a trama do tecido sobre as dobras do produto.
3. **Delimitação de Área Estampável**: Guia tracejada suave para orientar o cliente.
4. **Camada de Arte do Cliente**: Suporte a arraste, zoom/escala, rotação e upload de até 15MB.
5. **Tipografia Google Fonts**: Carregamento assíncrono dinâmico de fontes pré-aprovadas com simulação de relevo de linha de bordado.

---

## 3. Configuração do Supabase Storage

Para os arquivos de arte em alta resolução e snapshots dos pedidos, crie os seguintes buckets no Supabase:

1. `customer-artworks` (Privado / Acesso autenticado ou via Signed URLs):
   - Tipos MIME permitidos: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `application/pdf`
   - Limite de tamanho: 25MB
2. `order-snapshots` (Público ou Privado):
   - Armazena as miniaturas PNG geradas no canvas no momento da compra.

---

## 4. Estrutura dos Arquivos Criados

- `supabase/migrations/20240101000000_textile_ecommerce_schema.sql`: DDL completo, Enums, Índices, RLS e RPC PL/pgSQL atômica.
- `types/database.ts`: Tipagens e interfaces TypeScript completas do domínio.
- `lib/validations/order.ts`: Schemas de validação Zod para frontend e backend.
- `lib/supabase/client.ts` e `lib/supabase/server.ts`: Clientes Supabase configurados para Client Components e Server Actions.
- `components/customizer/ProductCustomizer.tsx`: Componente de customização e preview em tempo real.
- `actions/create-custom-order.ts`: Server Action com chamada da Stored Procedure e revalidação de rotas.
- `components/seller/ProductionKanban.tsx`: Pipeline de produção e controle de pedidos para lojistas.
- `components/seller/FabricInventoryManager.tsx`: Gestão de insumos e matérias-primas têxteis.
- `app/customize/[productId]/page.tsx`: Rota de exemplo para testes.
