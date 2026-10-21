'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    openCheckout,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    couponCode,
    couponDiscount,
    couponDiscountAmount,
    totalItems,
    subtotal,
    pixDiscountAmount,
    totalPix,
    totalCard,
    freeShippingThreshold,
    isFreeShipping,
    amountToFreeShipping,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Fechar gaveta com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Evita scroll da página de trás quando o carrinho está aberto
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponInput.trim()) return;

    const applied = applyCoupon(couponInput);
    if (applied) {
      setCouponSuccess(`Cupom "${couponInput.toUpperCase()}" aplicado com sucesso!`);
      setCouponInput('');
    } else {
      setCouponError('Cupom inválido ou expirado. Tente "BAGS10" para 10% OFF.');
    }
  };

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isCartOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* PAINEL LATERAL (SLIDE-OVER) */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out font-sans ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Sacola de Compras"
      >
        {/* CABEÇALHO DA SACOLA */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-amber-400 font-black shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Sua Sacola</span>
                {totalItems > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-bold">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Bags House • Compre múltiplos itens juntos</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-black transition-colors"
            aria-label="Fechar sacola"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BARRA DE PROGRESSO DE FRETE GRÁTIS */}
        <div className="border-b border-slate-100 bg-amber-50/50 px-6 py-3">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            {isFreeShipping ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span>🎉</span>
                <span>Parabéns! <strong>FRETE GRÁTIS</strong> desbloqueado!</span>
              </span>
            ) : (
              <span className="text-slate-700">
                Faltam <strong className="text-amber-700">R$ {amountToFreeShipping.toFixed(2).replace('.', ',')}</strong> para <strong>FRETE GRÁTIS</strong>!
              </span>
            )}
            <span className="text-[11px] font-extrabold text-slate-500">
              {freeShippingProgress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isFreeShipping
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
              }`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* LISTA DE ITENS DO CARRINHO */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 mb-4 border border-amber-200/60 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Sua sacola está vazia
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-xs">
                Explore nosso catálogo, escolha suas peças e adicione quantas desejar para comprar de uma única vez.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 rounded-full bg-black px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                Explorar Coleção de Bolsas
              </button>
            </div>
          ) : (
            items.map((item) => {
              const itemTotal = (item.unitPrice * item.quantity).toFixed(2).replace('.', ',');
              const isMaxStockReached = item.maxStock > 0 && item.quantity >= item.maxStock;

              return (
                <div key={item.id} className="py-4 flex gap-3.5 group">
                  {/* FOTO OU SNAPSHOT DO CANVAS PERSONALIZADO */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                    <img
                      src={item.customization?.previewSnapshotUrl || item.imageUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover object-center"
                    />
                    {item.isCustomized && (
                      <span className="absolute bottom-1 left-1 right-1 rounded-md bg-black/85 backdrop-blur-xs py-0.5 text-center text-[9px] font-extrabold uppercase tracking-wider text-amber-400">
                        Personalizado
                      </span>
                    )}
                  </div>

                  {/* INFORMAÇÕES E CONTROLES */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/customize/${item.productSlug}`}
                          onClick={closeCart}
                          className="text-xs font-extrabold text-slate-900 hover:text-amber-600 transition-colors line-clamp-1"
                        >
                          {item.productTitle}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                          title="Remover item da sacola"
                          aria-label="Remover item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* DETALHES DE PERSONALIZAÇÃO SE HOUVER */}
                      {item.isCustomized && item.customization && (
                        <div className="mt-1 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-200/70 space-y-0.5">
                          {item.customization.customText && (
                            <div className="flex items-center gap-1 font-semibold text-slate-900">
                              <span className="text-amber-600 font-black">Monograma:</span>
                              <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                "{item.customization.customText}"
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            {item.customization.fontName && (
                              <span>Fonte: {item.customization.fontName}</span>
                            )}
                            {item.customization.textColorName && (
                              <span>• Fio: {item.customization.textColorName}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* PREÇO UNITÁRIO */}
                      <div className="mt-1 text-xs text-slate-500">
                        <span>Unitário: <strong>R$ {item.unitPrice.toFixed(2).replace('.', ',')}</strong></span>
                      </div>
                    </div>

                    {/* CONTROLES DE QUANTIDADE E SUBTOTAL DO ITEM */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-90 transition-transform"
                          aria-label="Diminuir quantidade"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isMaxStockReached}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-transform ${
                            isMaxStockReached
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-white text-slate-700 hover:bg-slate-200 active:scale-90'
                          }`}
                          aria-label="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">
                          R$ {itemTotal}
                        </span>
                      </div>
                    </div>

                    {isMaxStockReached && (
                      <span className="text-[10px] text-amber-600 font-semibold mt-1">
                        ⚠️ Limite máximo em estoque ({item.maxStock} un)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ DO CARRINHO (RESUMO & CHECKOUT) */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/90 p-5 backdrop-blur-xs">
            {/* CAMPO DE CUPOM DE DESCONTO */}
            <div className="mb-3">
              {couponDiscount > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>🏷️ Cupom {couponCode}:</span>
                    <span className="text-emerald-900">{couponDiscount}% OFF aplicado (-R$ {couponDiscountAmount.toFixed(2).replace('.', ',')})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Possui cupom? (ex: BAGS10)"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs uppercase placeholder:normal-case placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors"
                  >
                    Aplicar
                  </button>
                </form>
              )}
              {couponError && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">{couponSuccess}</p>
              )}
            </div>

            {/* RESUMO DOS VALORES */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'}):</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Desconto de Cupom:</span>
                  <span>- R$ {couponDiscountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Frete:</span>
                <span className={isFreeShipping ? 'font-bold text-emerald-600' : ''}>
                  {isFreeShipping ? 'GRÁTIS' : 'Calculado na finalização'}
                </span>
              </div>

              {/* TOTAL NO PIX (COM DESTAQUE) */}
              <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">Total no PIX</span>
                  <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    5% OFF
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600 tracking-tight">
                    R$ {totalPix.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Ou no Cartão:</span>
                <span>
                  R$ {totalCard.toFixed(2).replace('.', ',')} em até 6x de R${' '}
                  {(totalCard / 6).toFixed(2).replace('.', ',')} s/ juros
                </span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={openCheckout}
                className="w-full rounded-full bg-gradient-to-r from-black via-slate-900 to-black py-4 text-xs font-black uppercase tracking-wider text-amber-400 shadow-xl shadow-black/15 hover:from-slate-900 hover:to-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 border border-amber-500/30"
              >
                <span>Finalizar Compra de Todos os Itens</span>
                <span className="text-white">&rarr;</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={closeCart}
                  className="text-[11px] font-bold text-slate-500 hover:text-black transition-colors"
                >
                  &larr; Continuar Escolhendo Mais Bolsas
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Esvaziar Sacola
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;
