import { z } from 'zod';

export const shippingAddressSchema = z.object({
  recipient_name: z.string().min(2, 'Nome do destinatário obrigatório'),
  street: z.string().min(2, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(2, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF com 2 letras'),
  postal_code: z.string().min(8, 'CEP inválido'),
  country: z.string().default('Brasil'),
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
  product_id: z.string().uuid('ID de produto inválido'),
  quantity: z.number().int().positive('Quantidade mínima é 1'),
  fabric_id: z.string().uuid().optional().nullable(),
  artwork_url: z.string().url().optional().nullable(),
  artwork_name: z.string().optional().nullable(),
  custom_text: z.string().optional().nullable(),
  font_id: z.string().optional().nullable(),
  text_color: z.string().optional().nullable(),
  snapshot_url: z.string().url().optional().nullable(),
  transform_matrix: transformMatrixSchema.optional(),
});

export const createOrderInputSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().min(3, 'Nome completo obrigatório'),
  customer_email: z.string().email('E-mail válido é obrigatório'),
  customer_phone: z.string().min(10, 'Telefone com DDD obrigatório').optional().nullable(),
  shipping_address: shippingAddressSchema,
  items: z.array(orderItemInputSchema).min(1, 'O pedido deve conter pelo menos 1 item'),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
