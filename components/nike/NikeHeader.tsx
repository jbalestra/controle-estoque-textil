'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
        {/* BARRA SUPERIOR DE UTILITÁRIOS (IDÊNTICA À NIKE) */}
        <div className="bg-[#f5f5f5] text-[11px] text-[#707072] font-medium border-b border-[#e5e5e5]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
            {/* Ícones de marca à esquerda (Jordan / Converse / Ateliê) */}
            <div className="flex items-center gap-4">
              <span className="font-extrabold text-black tracking-wider text-xs">ATELIÊ</span>
              <span className="text-[10px] text-slate-400 font-bold">BY YOU</span>
            </div>

            {/* LINKS À DIREITA (CONFORME PADRÃO DA LOJA) */}
            <div className="flex items-center gap-3">
              <span className="hover:text-black cursor-pointer hidden md:inline">Acessibilidade</span>
              <span className="text-slate-300 hidden md:inline">|</span>
              <span className="hover:text-black cursor-pointer hidden md:inline">Encontre uma loja</span>
              <span className="text-slate-300 hidden md:inline">|</span>
              <span className="hover:text-black cursor-pointer">Acompanhe seu pedido</span>
              <span className="text-slate-300">|</span>
              <span className="hover:text-black cursor-pointer">Ajuda</span>
            </div>
          </div>
        </div>

        {/* BARRA PRINCIPAL DE NAVEGAÇÃO DA NIKE */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo Estilo Nike */}
          <Link href="/" className="flex items-center gap-2 group">
            <svg
              className="h-8 w-14 fill-black transition-transform group-hover:scale-105"
              viewBox="0 0 24 24"
            >
              {/* Ícone estilizado Swoosh moderno */}
              <path d="M21.707 5.293c-.391-.391-1.023-.391-1.414 0l-12 12c-.391.391-1.023.391-1.414 0l-4-4c-.391-.391-1.023-.391-1.414 0s-.391 1.023 0 1.414l4.707 4.707c.391.391 1.023.391 1.414 0l12.707-12.707c.391-.391.391-1.023 0-1.414z" />
            </svg>
            <span className="text-xl font-black tracking-tighter text-black">
              ATELIÊ<span className="text-indigo-600">.</span>
            </span>
          </Link>

          {/* Ferramentas: Busca, Wishlist e Sacola */}
          <div className="flex items-center gap-3">
            {/* Input de Busca estilo Nike */}
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar produtos, tecidos..."
                className="w-44 lg:w-56 rounded-full bg-[#f5f5f5] py-2 pl-9 pr-4 text-xs text-black placeholder-[#707072] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all"
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

        {/* TICKER DE PROMOÇÕES / AVISOS NIKE BY YOU */}
        <div className="bg-[#f7f7f7] border-t border-[#e5e5e5] py-2 text-center text-xs font-semibold text-black">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <span>&lsaquo;</span>
            <span className="font-extrabold tracking-tight uppercase">PERSONALIZAÇÃO EXCLUSIVA:</span>
            <span className="font-normal text-slate-700">
              Personalize sua bolsa com bordados, monogramas e fontes exclusivas em tempo real.
            </span>
            <Link
              href="/customize/bolsa-tote-canvas"
              className="underline font-bold hover:text-indigo-600 transition-colors ml-1"
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
