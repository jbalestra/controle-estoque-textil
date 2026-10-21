'use client';

import React, { useState } from 'react';
import Link from 'next/link';
// @ts-ignore
import { usePathname } from 'next/navigation';

export function NikeHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(1);

  if (pathname?.startsWith('/lojista')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm font-sans">
        {/* BARRA SUPERIOR DE UTILITÁRIOS */}
        <div className="bg-[#0f0f10] text-[11px] text-[#b3b3b3] font-medium border-b border-[#222]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
            {/* Nome da Marca à esquerda */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-400 tracking-wider text-xs">BAGS HOUSE</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest hidden sm:inline">• Nécessaires Personalizadas</span>
            </div>

            {/* LINKS À DIREITA */}
            <div className="flex items-center gap-3">
              <span className="hover:text-white cursor-pointer hidden md:inline">Acessibilidade</span>
              <span className="text-zinc-700 hidden md:inline">|</span>
              <span className="hover:text-white cursor-pointer hidden md:inline">Encontre uma loja</span>
              <span className="text-zinc-700 hidden md:inline">|</span>
              <span className="hover:text-white cursor-pointer">Acompanhe seu pedido</span>
              <span className="text-zinc-700">|</span>
              <span className="hover:text-white cursor-pointer">Ajuda</span>
            </div>
          </div>
        </div>

        {/* BARRA PRINCIPAL DE NAVEGAÇÃO */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
          {/* Logo Bags House com imagem oficial */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-xl bg-black border border-amber-500/30 shadow-md transition-all group-hover:scale-105 group-hover:border-amber-400 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Logo Bags House"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-black">
                  BAGS
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-600">
                  HOUSE
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">
                Nécessaires Personalizadas
              </span>
            </div>
          </Link>

          {/* Ferramentas: Busca, Wishlist e Sacola */}
          <div className="flex items-center gap-3">
            {/* Input de Busca */}
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar nécessaires, bolsas..."
                className="w-44 lg:w-56 rounded-full bg-[#f5f5f5] py-2 pl-9 pr-4 text-xs text-black placeholder-[#707072] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Favoritos */}
            <button
              className="p-2 rounded-full hover:bg-slate-100 text-black transition-colors"
              aria-label="Favoritos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Sacola de Compras com contador */}
            <Link
              href="/customize/bolsa-tote-canvas"
              className="relative p-2 rounded-full hover:bg-slate-100 text-black transition-colors"
              aria-label="Sacola"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* TICKER DE PROMOÇÕES / AVISOS */}
        <div className="bg-[#f9f9f9] border-t border-[#e5e5e5] py-2 text-center text-xs font-semibold text-black">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <span>&lsaquo;</span>
            <span className="font-extrabold tracking-tight uppercase text-amber-700">BAGS HOUSE EXCLUSIVA:</span>
            <span className="font-normal text-slate-700">
              Personalize sua nécessaire com monogramas, bordados e acabamentos nobres em tempo real.
            </span>
            <Link
              href="/customize/bolsa-tote-canvas"
              className="underline font-bold hover:text-amber-600 transition-colors ml-1"
            >
              Personalizar Agora
            </Link>
            <span>&rsaquo;</span>
          </div>
        </div>
      </header>
    </>
  );
}
export default NikeHeader;
