export type UserRole = 'customer' | 'seller' | 'admin';
export type ProductType = 'ready_made' | 'custom_made';
export type OrderStatus =
  | 'pending'
  | 'artwork_analysis'
  | 'in_production'
  | 'ready_for_shipping'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  company_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fabric {
  id: string;
  code: string;
  name: string;
  composition: string;
  description?: string | null;
  texture_url: string;
  sample_thumbnail_url: string;
  available_meters: number;
  reserved_meters: number;
  min_stock_alert: number;
  cost_per_meter: number;
  price_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrintableBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  slug: string;
  description?: string | null;
  product_type: ProductType;
  base_price: number;
  required_meters: number;
  stock_quantity: number;
  base_mockup_url: string;
  mask_mockup_url?: string | null;
  printable_bounds: PrintableBounds;
  is_active: boolean;
  discount_percent?: number;
  discount_percentage?: number;
  original_price?: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  recipient_name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface TransformMatrix {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface OrderItemCustomization {
  id: string;
  order_item_id: string;
  fabric_id: string;
  consumed_meters: number;
  artwork_file_url?: string | null;
  artwork_original_name?: string | null;
  custom_text?: string | null;
  font_id?: string | null;
  text_color?: string | null;
  canvas_snapshot_url?: string | null;
  transform_matrix: TransformMatrix;
  created_at: string;
  fabric?: Fabric;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
  customization?: OrderItemCustomization;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address: ShippingAddress;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}
