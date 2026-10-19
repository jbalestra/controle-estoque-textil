'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/database';

export interface StoreProduct extends Product {
  categoryLabel: string;
  pixPrice: string;
  originalPrice: string;
  discountPercent: string;
  isCustomizable: boolean;
  gender: string;
  original_price?: number;
  discount_percentage?: number;
}

export const INITIAL_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-bag-001',
    sku: 'BAG-TOT-001',
    title: 'Bolsa Tote Canvas & Couro Legítimo',
    slug: 'bolsa-tote-canvas',
    description: 'Bolsa tote confeccionada em lona pesada de algodão com alças reforçadas em couro natural e acabamento premium.',
    product_type: 'ready_made',
    base_price: 289.9,
    original_price: 350.0,
    discount_percentage: 17,
    required_meters: 1.2,
    stock_quantity: 18,
    base_mockup_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Bolsas & Acessórios • Pronta Entrega',
    pixPrice: '289,90',
    originalPrice: '350,00',
    discountPercent: '17% off',
    isCustomizable: true,
    gender: 'Feminino',
  },
  {
    id: 'prod-bag-002',
    sku: 'BAG-TIR-002',
    title: 'Bolsa Tiracolo Minimalista Couro Caramelo',
    slug: 'bolsa-tiracolo-couro',
    description: 'Design contemporâneo compacto com fechamento magnético e divisórias internas forradas em veludo.',
    product_type: 'ready_made',
    base_price: 249.9,
    original_price: 310.0,
    discount_percentage: 19,
    required_meters: 0.9,
    stock_quantity: 6,
    base_mockup_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Bolsas & Acessórios • Edição Limitada',
    pixPrice: '249,90',
    originalPrice: '310,00',
    discountPercent: '19% off',
    isCustomizable: true,
    gender: 'Feminino',
  },
  {
    id: 'prod-bag-003',
    sku: 'BAG-TRA-003',
    title: 'Bolsa Transversal Estruturada Champagne',
    slug: 'bolsa-transversal-champagne',
    description: 'Bolsa de ombro sofisticada com acabamento em textura nobre e alça regulável.',
    product_type: 'ready_made',
    base_price: 319.9,
    original_price: 390.0,
    discount_percentage: 18,
    required_meters: 1.0,
    stock_quantity: 3,
    base_mockup_url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Bolsas Premium • Restam Poucas!',
    pixPrice: '319,90',
    originalPrice: '390,00',
    discountPercent: '18% off',
    isCustomizable: false,
    gender: 'Feminino',
  },
  {
    id: 'prod-bag-004',
    sku: 'BAG-CLU-004',
    title: 'Bolsa Clutch Envelope Festa em Cetim',
    slug: 'bolsa-clutch-festa',
    description: 'Elegância para ocasiões especiais com fecho dourado em metal escovado.',
    product_type: 'ready_made',
    base_price: 179.9,
    original_price: 220.0,
    discount_percentage: 18,
    required_meters: 0.6,
    stock_quantity: 12,
    base_mockup_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Bolsas de Festa & Noite',
    pixPrice: '179,90',
    originalPrice: '220,00',
    discountPercent: '18% off',
    isCustomizable: true,
    gender: 'Feminino',
  },
  {
    id: 'prod-bag-005',
    sku: 'BAG-MOC-005',
    title: 'Mochila Urbana Alfaiataria & Canvas',
    slug: 'mochila-urbana-canvas',
    description: 'Mochila reforçada com compartimento para notebook de até 15.6 polegadas e bolso antifurto.',
    product_type: 'ready_made',
    base_price: 349.9,
    original_price: 420.0,
    discount_percentage: 16,
    required_meters: 1.8,
    stock_quantity: 15,
    base_mockup_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Mochilas & Viagem',
    pixPrice: '349,90',
    originalPrice: '420,00',
    discountPercent: '16% off',
    isCustomizable: true,
    gender: 'Unissex',
  },
  {
    id: 'prod-bag-006',
    sku: 'BAG-SHO-006',
    title: 'Bolsa Handbag Vintage Couro Café',
    slug: 'bolsa-handbag-vintage',
    description: 'Bolsa clássica de mão em couro rústico envelhecido com costuras manuais.',
    product_type: 'ready_made',
    base_price: 320.0,
    original_price: 399.0,
    discount_percentage: 20,
    required_meters: 1.1,
    stock_quantity: 0,
    base_mockup_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Bolsas & Acessórios',
    pixPrice: '320,00',
    originalPrice: '399,00',
    discountPercent: '20% off',
    isCustomizable: true,
    gender: 'Feminino',
  },
  {
    id: 'prod-001',
    sku: 'CAM-ALF-001',
    title: 'Camisa Alfaiataria Sob Medida Masculina',
    slug: 'camisa-alfaiataria',
    description: 'Camisa personalizada com corte sob medida e bordado artesanal de iniciais.',
    product_type: 'custom_made',
    base_price: 249.9,
    original_price: 299.9,
    discount_percentage: 17,
    required_meters: 2.2,
    stock_quantity: 8,
    base_mockup_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Sob Medida • Personalizável',
    pixPrice: '249,90',
    originalPrice: '299,90',
    discountPercent: '17% off',
    isCustomizable: true,
    gender: 'Masculino',
  },
  {
    id: 'prod-002',
    sku: 'BLA-LIN-002',
    title: 'Blazer Linho Puro Italiano Estruturado',
    slug: 'camisa-alfaiataria',
    description: 'Blazer confeccionado em puro linho europeu com forro acetinado e caimento sob medida.',
    product_type: 'custom_made',
    base_price: 449.9,
    original_price: 520.0,
    discount_percentage: 13,
    required_meters: 3.5,
    stock_quantity: 4,
    base_mockup_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Alfaiataria Premium',
    pixPrice: '449,90',
    originalPrice: '520,00',
    discountPercent: '13% off',
    isCustomizable: true,
    gender: 'Masculino',
  },
  {
    id: 'prod-004',
    sku: 'TSH-STR-004',
    title: 'Camiseta Heavyweight Streetwear Boxy',
    slug: 'camisa-alfaiataria',
    description: 'Camiseta em algodão 260g com área pronta para estampas personalizadas em alta definição.',
    product_type: 'ready_made',
    base_price: 109.9,
    original_price: 139.9,
    discount_percentage: 21,
    required_meters: 1.4,
    stock_quantity: 25,
    base_mockup_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: 'Streetwear Custom',
    pixPrice: '109,90',
    originalPrice: '139,90',
    discountPercent: '21% off',
    isCustomizable: true,
    gender: 'Unissex',
  },
];

const STORAGE_KEY = 'atelie_products_store_v1';

export function getStoredProducts(): StoreProduct[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Garante que campos de desconto estejam preenchidos
      return parsed.map((p) => {
        const original =
          p.original_price ||
          parseFloat(String(p.originalPrice || '').replace(',', '.')) ||
          p.base_price;
        const discount =
          p.discount_percentage !== undefined
            ? p.discount_percentage
            : p.discountPercent
            ? parseInt(p.discountPercent, 10) || 0
            : 0;

        return {
          ...p,
          original_price: original,
          discount_percentage: discount,
        };
      });
    }
  } catch (e) {
    console.error('Erro ao ler produtos do localStorage:', e);
  }
  return INITIAL_PRODUCTS;
}

export function saveStoredProducts(products: StoreProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('atelie_products_updated'));
  } catch (e) {
    console.error('Erro ao salvar produtos no localStorage:', e);
  }
}

export function updateProductStock(productId: string, newStock: number): StoreProduct[] {
  const current = getStoredProducts();
  const safeStock = Math.max(0, Math.floor(newStock));
  const updated = current.map((p) =>
    p.id === productId ? { ...p, stock_quantity: safeStock, updated_at: new Date().toISOString() } : p
  );
  saveStoredProducts(updated);
  return updated;
}

export function updateProductDiscount(productId: string, discountPercentage: number): StoreProduct[] {
  const current = getStoredProducts();
  const safeDiscount = Math.max(0, Math.min(90, Math.round(discountPercentage)));

  const updated = current.map((p) => {
    if (p.id !== productId) return p;

    // Preço original de referência (sem desconto)
    const refOriginal =
      p.original_price ||
      parseFloat(String(p.originalPrice || '').replace(',', '.')) ||
      p.base_price;

    if (safeDiscount === 0) {
      return {
        ...p,
        original_price: refOriginal,
        discount_percentage: 0,
        discountPercent: '',
        base_price: refOriginal,
        originalPrice: refOriginal.toFixed(2).replace('.', ','),
        pixPrice: (refOriginal * 0.95).toFixed(2).replace('.', ','),
        updated_at: new Date().toISOString(),
      };
    }

    const discountedPrice = refOriginal * (1 - safeDiscount / 100);
    const pixVal = discountedPrice * 0.95;

    return {
      ...p,
      original_price: refOriginal,
      discount_percentage: safeDiscount,
      discountPercent: `${safeDiscount}% off`,
      base_price: Number(discountedPrice.toFixed(2)),
      originalPrice: refOriginal.toFixed(2).replace('.', ','),
      pixPrice: pixVal.toFixed(2).replace('.', ','),
      updated_at: new Date().toISOString(),
    };
  });

  saveStoredProducts(updated);
  return updated;
}

export function addStoreProduct(newProduct: Partial<StoreProduct>): StoreProduct[] {
  const current = getStoredProducts();
  const slug = (newProduct.title || 'bolsa')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const rawOriginal =
    Number(newProduct.original_price) ||
    Number(newProduct.base_price) ||
    299.9;
  const discountPct = Math.max(0, Math.min(90, Number(newProduct.discount_percentage) || 0));

  const finalPrice = discountPct > 0 ? rawOriginal * (1 - discountPct / 100) : rawOriginal;
  const pix = (finalPrice * 0.95).toFixed(2).replace('.', ',');
  const original = rawOriginal.toFixed(2).replace('.', ',');
  const discountStr = discountPct > 0 ? `${discountPct}% off` : '';

  const product: StoreProduct = {
    id: `prod-bag-${Date.now()}`,
    sku: newProduct.sku || `BAG-${Math.floor(100 + Math.random() * 900)}`,
    title: newProduct.title || 'Nova Bolsa Artesanal',
    slug: slug || 'nova-bolsa',
    description: newProduct.description || 'Bolsa com acabamento sob medida e confecção artesanal de alto padrão.',
    product_type: 'ready_made',
    base_price: Number(finalPrice.toFixed(2)),
    original_price: rawOriginal,
    discount_percentage: discountPct,
    required_meters: 1.0,
    stock_quantity: Math.max(0, Number(newProduct.stock_quantity) || 0),
    base_mockup_url:
      newProduct.base_mockup_url ||
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80',
    printable_bounds: { x: 180, y: 160, width: 240, height: 300 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categoryLabel: newProduct.categoryLabel || 'Bolsas & Acessórios',
    pixPrice: pix,
    originalPrice: original,
    discountPercent: discountStr,
    isCustomizable: newProduct.isCustomizable ?? true,
    gender: newProduct.gender || 'Feminino',
  };

  const updated = [product, ...current];
  saveStoredProducts(updated);
  return updated;
}

export function deleteStoreProduct(productId: string): StoreProduct[] {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== productId);
  saveStoredProducts(updated);
  return updated;
}

export function updateFullProduct(productId: string, data: Partial<StoreProduct>): StoreProduct[] {
  const current = getStoredProducts();
  const updated = current.map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p,
      ...data,
      stock_quantity: data.stock_quantity !== undefined ? Math.max(0, data.stock_quantity) : p.stock_quantity,
      updated_at: new Date().toISOString(),
    };
  });
  saveStoredProducts(updated);
  return updated;
}

export function updateProductImage(productId: string, imageUrl: string): StoreProduct[] {
  return updateFullProduct(productId, { base_mockup_url: imageUrl });
}

export function useProducts() {
  const [products, setProducts] = useState<StoreProduct[]>(INITIAL_PRODUCTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProducts(getStoredProducts());
    setIsLoaded(true);

    const handleUpdate = () => {
      setProducts(getStoredProducts());
    };

    window.addEventListener('atelie_products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('atelie_products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { products, isLoaded };
}
