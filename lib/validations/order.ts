import { z } from 'zod';

export const shippingAddressSchema = z.object({
  recipient_name: z.string().min(2, 'Nome do destinatário obrigatório').max(120, 'Nome muito longo'),
  street: z.string().min(2, 'Rua obrigatória').max(160, 'Rua muito longa'),
  number: z.string().min(1, 'Número obrigatório').max(20, 'Número muito longo'),
  complement: z.string().max(100, 'Complemento muito longo').optional().nullable(),
  neighborhood: z.string().min(2, 'Bairro obrigatório').max(100, 'Bairro muito longo'),
  city: z.string().min(2, 'Cidade obrigatória').max(100, 'Cidade muito longa'),
  state: z.string().length(2, 'UF com 2 letras'),
  postal_code: z.string().min(8, 'CEP inválido').max(10, 'CEP inválido'),
  country: z.string().max(60).default('Brasil'),
});

export const transformMatrixSchema = z.object({
  x: z.number(),
  y: z.number(),
  scaleX: z.number().positive(),
  scaleY: z.number().positive(),
  rotation: z.number(),
  canvasWidth: z.number().positive(),
  canvasHeight: z.number().positive(),
});

export const orderItemCustomizationInputSchema = z.object({
  fabric_id: z.string().uuid('ID de tecido inválido'),
  artwork_url: z.string().url('URL da arte inválida').optional().nullable(),
  artwork_name: z.string().optional().nullable(),
  custom_text: z.string().max(60, 'Texto não pode exceder 60 caracteres').optional().nullable(),
  font_id: z.string().optional().nullable(),
  text_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor hexadecimal inválida').optional().nullable(),
  snapshot_url: z.string().url('URL de snapshot inválida').optional().nullable(),
  transform_matrix: transformMatrixSchema.default({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    canvasWidth: 600,
    canvasHeight: 600,
  }),
});

export const orderItemInputSchema = z.object({
  product_id: z.string().min(1, 'ID de produto obrigatório').max(100),
  product_title: z.string().max(160).optional().nullable(),
  unit_price: z.number().positive().max(100000).optional().nullable(),
  quantity: z.number().int().positive('Quantidade mínima é 1').max(500, 'Quantidade máxima excedida'),
  fabric_id: z.string().min(1).max(100).optional().nullable(),
  artwork_url: z.string().url().max(2048).optional().nullable(),
  artwork_name: z.string().max(255).optional().nullable(),
  custom_text: z.string().max(60, 'Texto não pode exceder 60 caracteres').optional().nullable(),
  font_id: z.string().max(80).optional().nullable(),
  text_color: z.string().max(20).optional().nullable(),
  snapshot_url: z.string().url().max(2048).optional().nullable(),
  transform_matrix: transformMatrixSchema.optional(),
});

export const createOrderInputSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().min(3, 'Nome completo obrigatório').max(120, 'Nome muito longo'),
  customer_email: z.string().email('E-mail válido é obrigatório').max(160, 'E-mail muito longo'),
  customer_phone: z.string().min(10, 'Telefone com DDD obrigatório').max(25, 'Telefone inválido').optional().nullable(),
  shipping_address: shippingAddressSchema,
  items: z.array(orderItemInputSchema).min(1, 'O pedido deve conter pelo menos 1 item').max(50, 'Limite de itens por pedido excedido'),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
