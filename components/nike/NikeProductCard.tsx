'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/database';

import { useCart } from '@/lib/cart-context';

interface NikeProductCardProps {
  product: Product & {
    categoryLabel: string;
    pixPrice: string;
    originalPrice: string;
    discountPercent: string;
    isCustomizable: boolean;
  };
  onOpenCustomizer?: (product: Product) => void;
}

export function NikeProductCard({ product, onOpenCustomizer }: NikeProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem, items } = useCart();

  const hasStock = product.stock_quantity > 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  // Verifica se o item já está no carrinho
  const inCartItem = items.find((i) => i.productId === product.id && !i.isCustomized);
  const qtyInCart = inCartItem?.quantity || 0;

  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasStock) return;

    addItem({
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      categoryLabel: product.categoryLabel,
      basePrice: product.base_price,
      unitPrice: product.base_price,
      quantity: 1,
      maxStock: product.stock_quantity,
      imageUrl: product.base_mockup_url,
      isCustomized: false,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="group relative flex flex-col font-sans transition-all">
      {/* Imagem do Produto com fundo neutro característico da Nike */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f6f6f6] transition-all group-hover:bg-[#eaeaea]">
        <img
          src={product.base_mockup_url}
          alt={product.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Botão de Favoritar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-black shadow-sm transition-transform hover:scale-110 active:scale-95"
          aria-label="Adicionar aos favoritos"
        >
          <svg
            className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-black'}`}
            fill={isFavorited ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Badges superiores */}
        <div className="absolute left-3.5 top-3.5 z-10 flex flex-col gap-1.5">
          {product.isCustomizable && (
            <div className="rounded-full bg-black/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
              Personalizável (By You)
            </div>
          )}
          {qtyInCart > 0 && (
            <div className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-sm">
              {qtyInCart} na sacola
            </div>
          )}
        </div>

        {/* BADGE DE QUANTIDADE EM ESTOQUE NO CANTO DA FOTO */}
        <div className="absolute left-3.5 bottom-3.5 z-10">
          {hasStock ? (
            isLowStock ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                Últimas {product.stock_quantity} un!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                {product.stock_quantity} em estoque
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Esgotado
            </span>
          )}
        </div>

        {/* Ação rápida hover */}
        <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex gap-2">
          {hasStock ? (
            <>
              {product.isCustomizable ? (
                <Link
                  href={`/customize/${product.slug}`}
                  className="flex-1 flex items-center justify-center rounded-full bg-black py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:bg-slate-800 active:scale-95 text-center"
                >
                  Personalizar
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleQuickAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-amber-500 py-2.5 text-xs font-black text-black shadow-lg transition-transform hover:bg-amber-400 active:scale-95 text-center"
              >
                <span>+ Sacola</span>
              </button>
            </>
          ) : (
            <Link
              href={`/customize/${product.slug}`}
              className="flex w-full items-center justify-center rounded-full bg-slate-900 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:bg-slate-800"
            >
              Ver Detalhes
            </Link>
          )}
        </div>
      </div>

      {/* Informações de Produto (Tipografia e espaçamento idênticos à Nike) */}
      <div className="mt-3 flex flex-col space-y-1">
        <span className="text-xs font-semibold text-[#707072] uppercase tracking-wide">
          {product.categoryLabel}
        </span>

        <Link
          href={`/customize/${product.slug}`}
          className="text-sm font-bold text-black hover:underline line-clamp-1"
        >
          {product.title}
        </Link>

        {/* INDICADOR VISÍVEL DE QUANTIDADE EM ESTOQUE PARA O COMPRADOR */}
        <div className="flex items-center gap-2 pt-0.5">
          {hasStock ? (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Estoque disponível: <strong>{product.stock_quantity} un</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded-md border border-rose-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Sem estoque no momento</span>
            </div>
          )}
        </div>

        {product.required_meters > 0 && (
          <span className="text-[11px] text-slate-500">
            Consumo fábrica: <strong>{product.required_meters}m</strong> de tecido
          </span>
        )}

        {/* Preço estilo Nike: Preço no Pix + Preço De + % OFF */}
        <div className="pt-1 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-black">
              R$ {product.pixPrice}
            </span>
            {product.discountPercent && product.discountPercent.trim() !== '' && product.discountPercent !== '0% off' && (
              <>
                <span className="text-xs text-[#707072] line-through">
                  R$ {product.originalPrice}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                  {product.discountPercent}
                </span>
              </>
            )}
          </div>

          {/* BOTÃO COMPACTO VISÍVEL EM DISPOSITIVOS MÓVEIS OU SEM HOVER */}
          {hasStock && (
            <button
              type="button"
              onClick={handleQuickAddToCart}
              className="rounded-full bg-black hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-extrabold active:scale-95 transition-all shadow-xs flex items-center gap-1"
              title="Adicionar à sacola"
            >
              <span>{justAdded ? '✓ Adicionado' : '+ Sacola'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default NikeProductCard;
