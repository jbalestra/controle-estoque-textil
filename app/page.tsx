'use client';

import React, { useState } from 'react';
import { NikeProductCard } from '@/components/nike/NikeProductCard';
import { useProducts, StoreProduct } from '@/lib/products-store';

export default function NikeStorefront() {
  const { products, isLoaded } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStockFilter, setSelectedStockFilter] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState('Destaques');

  // Filtragem dinâmica por abas rápidas
  let filtered = products.filter((p) => p.is_active !== false);

  if (selectedCategory) {
    if (selectedCategory === 'Bolsas & Acessórios') {
      filtered = filtered.filter(
        (p) =>
          p.categoryLabel.toLowerCase().includes('bolsa') ||
          p.categoryLabel.toLowerCase().includes('mochila') ||
          p.title.toLowerCase().includes('bolsa') ||
          p.title.toLowerCase().includes('mochila')
      );
    } else {
      filtered = filtered.filter(
        (p) =>
          p.categoryLabel.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          p.title.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
  }

  if (selectedStockFilter) {
    if (selectedStockFilter === 'Pronta Entrega (Em Estoque)') {
      filtered = filtered.filter((p) => p.stock_quantity > 0);
    } else if (selectedStockFilter === 'Últimas Unidades') {
      filtered = filtered.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5);
    }
  }

  // Ordenação
  if (selectedSort === 'MenorPreco') {
    filtered.sort((a, b) => a.base_price - b.base_price);
  } else if (selectedSort === 'MaiorPreco') {
    filtered.sort((a, b) => b.base_price - a.base_price);
  } else if (selectedSort === 'MaiorEstoque') {
    filtered.sort((a, b) => b.stock_quantity - a.stock_quantity);
  }

  const totalInStock = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const bagProductsCount = products.filter(
    (p) =>
      p.categoryLabel.toLowerCase().includes('bolsa') ||
      p.title.toLowerCase().includes('bolsa') ||
      p.categoryLabel.toLowerCase().includes('mochila')
  ).length;

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* CORPO DO CATÁLOGO ESTILO NIKE */}
      <main className="mx-auto max-w-[1536px] px-6 py-6 lg:px-12">
        {/* BREADCRUMB */}
        <nav className="flex text-xs font-semibold text-[#707072] space-x-1.5 mb-2">
          <span className="hover:text-black cursor-pointer">Bags House</span>
          <span>/</span>
          <span className="hover:text-black cursor-pointer">Coleção 2026</span>
          <span>/</span>
          <span className="text-black">Nécessaires & Bolsas Personalizadas</span>
        </nav>

        {/* TÍTULO DA CATEGORIA & CONTROLES SUPERIORES */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black lg:text-3xl">
              Bags House • Coleção de Nécessaires & Bolsas ({filtered.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Estoque total atualizado: <span className="font-bold text-emerald-600">{totalInStock} unidades</span> disponíveis para entrega imediata.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-black">
            {/* Ordenar Por */}
            <div className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-slate-500">Ordenar por:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="Destaques">Em destaque</option>
                <option value="MaiorEstoque">Maior Estoque</option>
                <option value="MenorPreco">Menor Preço</option>
                <option value="MaiorPreco">Maior Preço</option>
              </select>
            </div>
          </div>
        </div>

        {/* ATALHO RÁPIDO DE ABAS DE CATEGORIA */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedStockFilter(null);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              !selectedCategory && !selectedStockFilter
                ? 'bg-black text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setSelectedCategory('Bolsas & Acessórios')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'Bolsas & Acessórios'
                ? 'bg-black text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>👜 Bolsas & Acessórios</span>
            <span className="rounded-full bg-slate-300/60 px-1.5 py-0.2 text-[10px] font-bold">
              {bagProductsCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedStockFilter('Pronta Entrega (Em Estoque)')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedStockFilter === 'Pronta Entrega (Em Estoque)'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pronta Entrega com Estoque</span>
          </button>
          <button
            onClick={() => setSelectedStockFilter('Últimas Unidades')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedStockFilter === 'Últimas Unidades'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>⚡ Restam Poucas</span>
          </button>
        </div>

        {/* GRID DE PRODUTOS COMPLETO (LARGURA TOTAL) */}
        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <span className="text-3xl">👜</span>
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                Nenhum produto encontrado com os filtros selecionados
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Tente limpar os filtros para ver todas as bolsas e produtos do catálogo.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedStockFilter(null);
                }}
                className="mt-4 rounded-full bg-black px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product) => (
                <NikeProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

            {/* BANNER INFORMATIVO BY YOU AO FINAL DA PÁGINA */}
            <div className="mt-16 rounded-3xl bg-[#0d0d0f] p-8 md:p-12 text-center flex flex-col items-center border border-amber-500/20 shadow-2xl relative overflow-hidden">
              <div className="mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-amber-500/40 bg-black shadow-lg">
                <img src="/logo.png" alt="Bags House" className="h-full w-full object-cover" />
              </div>
              <span className="text-xs font-black tracking-widest uppercase text-amber-400">
                BAGS HOUSE • NÉCESSAIRES PERSONALIZADAS & SOB MEDIDA
              </span>
              <h3 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight max-w-xl">
                Nécessaires e bolsas com monogramas e personalização exclusiva em tempo real.
              </h3>
              <p className="mt-3 text-sm text-slate-400 max-w-lg">
                Selecione o modelo desejado, consulte a quantidade em estoque em tempo real e personalize acabamentos, tecidos e bordados.
              </p>
              <a
                href="/customize/bolsa-tote-canvas"
                className="mt-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-xs font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                Personalizar uma Peça Agora
              </a>
            </div>
          </div>
      </main>
    </div>
  );
}
