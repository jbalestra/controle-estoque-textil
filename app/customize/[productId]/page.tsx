'use client';

import React from 'react';
import Link from 'next/link';
import { ProductCustomizer } from '@/components/customizer/ProductCustomizer';
import { Product, Fabric } from '@/types/database';
import { useProducts, INITIAL_PRODUCTS } from '@/lib/products-store';

const mockFabrics: Fabric[] = [
  {
    id: 'f1111111-9c0b-4ef8-bb6d-6bb9bd380a01',
    code: 'TEC-ALG-PIMA',
    name: 'Algodão Pima Peruano 80 Fios',
    composition: '100% Algodão Pima Extra Macio',
    texture_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&auto=format&fit=crop&q=80',
    sample_thumbnail_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=200&auto=format&fit=crop&q=80',
    available_meters: 45.5,
    reserved_meters: 6.6,
    min_stock_alert: 5.0,
    cost_per_meter: 32.0,
    price_multiplier: 1.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f2222222-9c0b-4ef8-bb6d-6bb9bd380a02',
    code: 'TEC-LIN-PURO',
    name: 'Linho Puro Rústico Champagne',
    composition: '100% Linho Europeu Puro',
    texture_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&auto=format&fit=crop&q=80',
    sample_thumbnail_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=200&auto=format&fit=crop&q=80',
    available_meters: 18.0,
    reserved_meters: 4.4,
    min_stock_alert: 5.0,
    cost_per_meter: 58.0,
    price_multiplier: 1.15,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f3333333-9c0b-4ef8-bb6d-6bb9bd380a03',
    code: 'TEC-SEDA-SATIN',
    name: 'Seda Mulberry Acetinada',
    composition: '100% Seda Natural Nobre',
    texture_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    sample_thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    available_meters: 15.0,
    reserved_meters: 0.0,
    min_stock_alert: 5.0,
    cost_per_meter: 110.0,
    price_multiplier: 1.3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface CustomizePageProps {
  params: {
    productId: string;
  };
}

export default function CustomizePage({ params }: CustomizePageProps) {
  const { products } = useProducts();
  const currentSlug = params?.productId;
  const foundProduct =
    products.find((p) => p.slug === currentSlug || p.id === currentSlug) ||
    INITIAL_PRODUCTS.find((p) => p.slug === currentSlug || p.id === currentSlug) ||
    products[0] ||
    INITIAL_PRODUCTS[0];

  return (
    <main className="min-h-screen bg-[#fafafa] py-6 font-sans">
      <div className="mx-auto max-w-7xl px-4">
        {/* Navegação de Retorno estilo Nike By You */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-bold text-black hover:text-slate-600 transition-colors"
          >
            <span className="mr-1">&larr;</span> Voltar ao Catálogo
          </Link>
          <div className="flex items-center gap-2">
            {foundProduct.stock_quantity > 0 ? (
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
                ● {foundProduct.stock_quantity} unidades em estoque
              </span>
            ) : (
              <span className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
                ✕ Esgotado
              </span>
            )}
            <span className="rounded-full bg-black px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
              Ateliê By You • Customização Ativa
            </span>
          </div>
        </div>

        {/* Módulo de Customização Interativa com Canvas */}
        <ProductCustomizer product={foundProduct} fabrics={mockFabrics} />
      </div>
    </main>
  );
}
