'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/database';

import { StoreProduct, INITIAL_PRODUCTS } from './products-data';
export { type StoreProduct, INITIAL_PRODUCTS };

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
