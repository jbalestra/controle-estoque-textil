'use client';

import React, { useState } from 'react';
import { useCart, OrderRecord } from '@/lib/cart-context';

export function CheckoutModal() {
  const {
    items,
    isCheckoutOpen,
    closeCheckout,
    subtotal,
    couponDiscountAmount,
    pixDiscountAmount,
    totalPix,
    totalCard,
    totalItems,
    completeOrder,
  } = useCart();

  // Estados do formulário
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Endereço
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState('1');

  // Estado de finalização / sucesso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isCheckoutOpen) return null;

  // Busca rápida de CEP no ViaCEP
  const handleCepChange = async (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 8);
    setCep(raw);

    if (raw.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || 'SP');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      setCustomerPhone(
        numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
      );
    } else {
      setCustomerPhone(
        numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
      );
    }
  };

  const finalAmount = paymentMethod === 'pix' ? totalPix : totalCard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setFormError('Por favor, preencha todos os dados pessoais obrigatórios.');
      return;
    }

    if (!street.trim() || !number.trim() || !city.trim()) {
      setFormError('Por favor, preencha o endereço completo de entrega.');
      return;
    }

    if (items.length === 0) {
      setFormError('Sua sacola está vazia.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = completeOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
        },
        paymentMethod,
      });

      setCompletedOrder(order);
    } catch (err) {
      console.error(err);
      setFormError('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gerar chave Pix simulada Copia e Cola
  const pixKeySimulated = completedOrder
    ? `00020126580014br.gov.bcb.pix0136financeiro@bagshouse.com.br520400005303986540${completedOrder.totalAmount.toFixed(
        2
      )}5802BR5910BAGS HOUSE6009SAO PAULO62070503***6304${completedOrder.orderNumber.slice(-4)}`
    : '';

  const handleCopyPix = () => {
    if (pixKeySimulated) {
      navigator.clipboard.writeText(pixKeySimulated);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  // Mensagem para o WhatsApp da Bags House
  const getWhatsAppLink = (order: OrderRecord) => {
    const itemsList = order.items
      .map(
        (it) =>
          `• ${it.quantity}x ${it.productTitle}${
            it.isCustomized && it.customization?.customText
              ? ` (Personalizado: "${it.customization.customText}")`
              : ''
          } - R$ ${(it.unitPrice * it.quantity).toFixed(2).replace('.', ',')}`
      )
      .join('\n');

    const msg = `👜 *NOVO PEDIDO BAGS HOUSE - ${order.orderNumber}*
    
*Cliente:* ${order.customerName}
*WhatsApp:* ${order.customerPhone}
*E-mail:* ${order.customerEmail}

*Itens Solicitados (${order.items.reduce((acc, i) => acc + i.quantity, 0)} un):*
${itemsList}

*Forma de Pagamento:* ${order.paymentMethod === 'pix' ? 'PIX (5% OFF)' : 'Cartão de Crédito'}
*Total Final:* R$ ${order.totalAmount.toFixed(2).replace('.', ',')}

*Endereço de Entrega:*
${order.shippingAddress.street}, Nº ${order.shippingAddress.number}${
      order.shippingAddress.complement ? ` - ${order.shippingAddress.complement}` : ''
    }
${order.shippingAddress.neighborhood} - ${order.shippingAddress.city}/${order.shippingAddress.state}
CEP: ${order.shippingAddress.cep}

Gostaria de confirmar a produção e envio do meu pedido! ✨`;

    return `https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div
        className="relative w-full max-w-3xl my-8 rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* TELA DE SUCESSO DO PEDIDO */}
        {/* ======================================================== */}
        {completedOrder ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 text-3xl font-black mb-4 shadow-sm animate-bounce">
              ✓
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 uppercase tracking-widest">
              Pedido Gerado com Sucesso!
            </span>

            <h2 className="mt-3 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Obrigado, {completedOrder.customerName.split(' ')[0]}!
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Número do Pedido: <strong className="text-slate-900 font-mono text-sm">{completedOrder.orderNumber}</strong>
            </p>

            {/* RESUMO DOS ITENS COMPRADOS */}
            <div className="my-6 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left max-h-56 overflow-y-auto">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 mb-2">
                Itens incluídos no pedido ({completedOrder.items.length}):
              </h4>
              <div className="divide-y divide-slate-200/80">
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={it.customization?.previewSnapshotUrl || it.imageUrl}
                        alt={it.productTitle}
                        className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900">{it.quantity}x {it.productTitle}</span>
                        {it.isCustomized && it.customization?.customText && (
                          <span className="block text-[10px] text-amber-700 font-semibold">
                            Monograma: "{it.customization.customText}"
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      R$ {(it.unitPrice * it.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 pt-2.5 mt-2 flex justify-between items-baseline text-xs">
                <span className="font-bold text-slate-700">Total Pago ({completedOrder.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}):</span>
                <span className="text-base font-black text-emerald-600">
                  R$ {completedOrder.totalAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* SE PAGAMENTO FOR PIX, MOSTRA QR CODE E CHAVE */}
            {completedOrder.paymentMethod === 'pix' && (
              <div className="mb-6 rounded-2xl bg-amber-50/60 p-4 border border-amber-200/80 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 uppercase">
                    Pagamento Instantâneo via PIX (5% OFF Aplicado)
                  </span>
                  <span className="rounded bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                    Aprovação Imediata
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Copie o código abaixo e pague no app do seu banco para que a confecção das suas peças inicie imediatamente.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixKeySimulated}
                    className="flex-1 rounded-xl border border-amber-300 bg-white p-2.5 font-mono text-[11px] text-slate-700 truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 active:scale-95 transition-all shadow-sm shrink-0"
                  >
                    {pixCopied ? 'Copiado! ✓' : 'Copiar Chave'}
                  </button>
                </div>
              </div>
            )}

            {/* BOTÕES DE FINALIZAÇÃO */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={getWhatsAppLink(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <span>📲 Enviar Pedido no WhatsApp da Loja</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setCompletedOrder(null);
                  closeCheckout();
                }}
                className="rounded-full border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Voltar à Loja
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* FORMULÁRIO DE CHECKOUT CONSOLIDADO */
          /* ======================================================== */
          <div>
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-amber-400 font-black shadow-md">
                  🛍️
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Finalizar Compra ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compra simplificada de todos os seus itens selecionados em uma única etapa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCheckout}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-300 transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* CORPO DO FORMULÁRIO COM DUAS COLUNAS */}
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COLUNA ESQUERDA: DADOS + ENDEREÇO + PAGAMENTO (7 COLUNAS) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* 1. SEUS DADOS */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-[10px]">1</span>
                      <span>Seus Dados de Contato</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ex: Maria Carolina da Silva"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">WhatsApp / Celular *</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">E-mail para Acompanhamento *</label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="seuemail@exemplo.com"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. ENDEREÇO DE ENTREGA */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-[10px]">2</span>
                      <span>Endereço de Entrega</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          CEP {isSearchingCep && <span className="text-amber-600 font-normal">(buscando...)</span>}
                        </label>
                        <input
                          type="text"
                          required
                          value={cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={8}
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Rua / Logradouro *</label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Rua das Flores"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Número *</label>
                        <input
                          type="text"
                          required
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="123"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Complemento</label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Apto 42"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Bairro *</label>
                        <input
                          type="text"
                          required
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          placeholder="Jardins"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Cidade *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="São Paulo"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Estado (UF)</label>
                        <input
                          type="text"
                          value={state}
                          maxLength={2}
                          onChange={(e) => setState(e.target.value.toUpperCase())}
                          placeholder="SP"
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none font-bold uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. FORMA DE PAGAMENTO */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-[10px]">3</span>
                      <span>Forma de Pagamento</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`rounded-2xl p-3 border text-left transition-all relative ${
                          paymentMethod === 'pix'
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <span className="absolute top-2 right-2 rounded bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2">
                          5% OFF
                        </span>
                        <div className="font-black text-xs text-slate-900 flex items-center gap-1">
                          <span>⚡ PIX Imediato</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Aprovação instantânea
                        </span>
                        <span className="text-xs font-black text-emerald-700 block mt-1">
                          R$ {totalPix.toFixed(2).replace('.', ',')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`rounded-2xl p-3 border text-left transition-all ${
                          paymentMethod === 'credit_card'
                            ? 'border-black bg-slate-50 shadow-sm ring-1 ring-black'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-black text-xs text-slate-900">
                          💳 Cartão de Crédito
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Até 6x sem juros
                        </span>
                        <span className="text-xs font-black text-slate-900 block mt-1">
                          R$ {totalCard.toFixed(2).replace('.', ',')}
                        </span>
                      </button>
                    </div>

                    {paymentMethod === 'credit_card' && (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 border border-slate-200 space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Número do Cartão</label>
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Validade</label>
                            <input
                              type="text"
                              placeholder="MM/AA"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">CVV</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Parcelamento</label>
                          <select
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white font-bold"
                          >
                            <option value="1">1x de R$ {totalCard.toFixed(2).replace('.', ',')} (à vista)</option>
                            <option value="2">2x de R$ {(totalCard / 2).toFixed(2).replace('.', ',')} sem juros</option>
                            <option value="3">3x de R$ {(totalCard / 3).toFixed(2).replace('.', ',')} sem juros</option>
                            <option value="4">4x de R$ {(totalCard / 4).toFixed(2).replace('.', ',')} sem juros</option>
                            <option value="5">5x de R$ {(totalCard / 5).toFixed(2).replace('.', ',')} sem juros</option>
                            <option value="6">6x de R$ {(totalCard / 6).toFixed(2).replace('.', ',')} sem juros</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: RESUMO DA SACOLA CONSOLIDADA (5 COLUNAS) */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between">
                      <span>Itens Selecionados</span>
                      <span className="text-amber-600 font-bold">{totalItems} un</span>
                    </h4>

                    {/* MINI LISTA DE PRODUTOS */}
                    <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-200/60">
                      {items.map((item) => (
                        <div key={item.id} className="pt-2 first:pt-0 flex items-center gap-2.5">
                          <img
                            src={item.customization?.previewSnapshotUrl || item.imageUrl}
                            alt={item.productTitle}
                            className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {item.quantity}x {item.productTitle}
                            </span>
                            {item.isCustomized && item.customization?.customText && (
                              <span className="text-[10px] text-amber-700 font-semibold block truncate">
                                Monograma: "{item.customization.customText}"
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Unitário: R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-900 shrink-0">
                            R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* TOTAIS */}
                    <div className="mt-4 border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                      {couponDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Desconto Cupom:</span>
                          <span>- R$ {couponDiscountAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                      {paymentMethod === 'pix' && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Desconto PIX (5%):</span>
                          <span>- R$ {pixDiscountAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500">
                        <span>Frete:</span>
                        <span className="font-bold text-emerald-600">GRÁTIS</span>
                      </div>

                      <div className="border-t border-slate-300 pt-2 flex items-baseline justify-between">
                        <span className="font-bold text-slate-900 text-sm">Valor Total:</span>
                        <span className="text-xl font-black text-slate-900">
                          R$ {finalAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTÃO CONFIRMAR */}
                  <div className="mt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 py-4 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Processando Pedido...</span>
                      ) : (
                        <>
                          <span>Confirmar Compra ({totalItems} {totalItems === 1 ? 'Peça' : 'Peças'})</span>
                          <span>&rarr;</span>
                        </>
                      )}
                    </button>

                    <p className="mt-2 text-center text-[10px] text-slate-400">
                      🔒 Compra 100% segura • Garantia Bags House • Confecção sob medida
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
