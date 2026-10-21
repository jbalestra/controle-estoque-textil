'use client';

import React, { useState } from 'react';
import { Product } from '@/types/database';
import { createCheckoutPreferenceAction } from '@/actions/create-checkout-preference';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  customText?: string;
  fontId?: string;
  textColor?: string;
  unitPrice: string | number;
  canvasSnapshotUrl?: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  product,
  customText,
  fontId,
  textColor,
  unitPrice,
  canvasSnapshotUrl,
}: CheckoutModalProps) {
  // Dados do Comprador com valores iniciais amigáveis para testes no Sandbox
  const [formData, setFormData] = useState({
    name: 'Cliente Teste Mercado Pago',
    email: 'comprador_teste@mercadopago.com.br',
    phone: '(11) 98765-4321',
    postalCode: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Apto 42',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Montar payload estrito para validação no servidor
      const payload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          recipient_name: formData.name,
          street: formData.street,
          number: formData.number,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state.toUpperCase(),
          postal_code: formData.postalCode,
          country: 'Brasil',
        },
        items: [
          {
            product_id: product.id,
            quantity: 1,
            custom_text: customText || null,
            font_id: fontId || null,
            text_color: textColor || null,
            snapshot_url: canvasSnapshotUrl || null,
          },
        ],
      };

      const result = await createCheckoutPreferenceAction(payload);

      if (result.success && result.initPoint) {
        // Redirecionamento seguro para o Mercado Pago (Sandbox ou Produção)
        window.location.href = result.initPoint;
      } else {
        setErrorMessage(result.error || 'Falha ao gerar preferência no Mercado Pago.');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado na conexão com o servidor.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 text-left shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 mb-1 border border-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              Mercado Pago Checkout Pro • Modo Sandbox
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Finalizar Pedido Sob Medida
            </h2>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* RESUMO DO PRODUTO */}
        <div className="my-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-center gap-3">
          <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0">
            <img
              src={canvasSnapshotUrl || product.base_mockup_url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-slate-900 truncate">{product.title}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Personalização: <strong className="text-indigo-600">"{customText || 'Padrão'}"</strong>
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-400 text-[10px]">Frete Especial: Grátis</span>
              <span className="font-black text-emerald-600 text-sm">R$ {unitPrice}</span>
            </div>
          </div>
        </div>

        {/* ALERTA DE ERRO */}
        {errorMessage && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <strong>Atenção:</strong> {errorMessage}
          </div>
        )}

        {/* FORMULÁRIO DE DADOS DE ENTREGA E PAGAMENTO */}
        <form onSubmit={handleCheckout} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              name="name"
              required
              disabled={isLoading}
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
              placeholder="Nome de quem vai receber"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail para Recibo</label>
              <input
                type="email"
                name="email"
                required
                disabled={isLoading}
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
              <input
                type="tel"
                name="phone"
                required
                disabled={isLoading}
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* ENDEREÇO */}
          <div className="border-t border-slate-100 pt-3">
            <h5 className="font-bold text-slate-900 mb-2">Endereço de Entrega</h5>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="col-span-1">
                <input
                  type="text"
                  name="postalCode"
                  required
                  disabled={isLoading}
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                  placeholder="CEP"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  name="street"
                  required
                  disabled={isLoading}
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                  placeholder="Rua / Avenida"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <input
                  type="text"
                  name="number"
                  required
                  disabled={isLoading}
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                  placeholder="Nº"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  name="neighborhood"
                  required
                  disabled={isLoading}
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                  placeholder="Bairro"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  name="city"
                  required
                  disabled={isLoading}
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100"
                  placeholder="Cidade"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  name="state"
                  maxLength={2}
                  required
                  disabled={isLoading}
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-black focus:outline-none disabled:bg-slate-100 text-center uppercase"
                  placeholder="UF"
                />
              </div>
            </div>
          </div>

          {/* INFORMAÇÃO DE SEGURANÇA ANTIFRAUDE */}
          <div className="rounded-xl bg-slate-100 p-3 text-[11px] text-slate-600 flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span>
              Ao clicar no botão abaixo, você será direcionado ao ambiente seguro do{' '}
              <strong>Mercado Pago</strong> com proteção ao comprador e suporte a Pix, Cartão e Boleto.
            </span>
          </div>

          {/* BOTÃO DE AÇÃO */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-sky-600 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-sky-500 active:scale-95 shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Gerando Pagamento Seguro...</span>
              </>
            ) : (
              <>
                <span>Pagar com Mercado Pago (R$ {unitPrice})</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
export default CheckoutModal;
