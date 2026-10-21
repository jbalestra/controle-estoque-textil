'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function FeedbackContent() {
  const searchParams = useSearchParams();

  const rawStatus = (
    searchParams.get('status') ||
    searchParams.get('collection_status') ||
    'pending'
  ).toLowerCase();

  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const orderNumber = searchParams.get('orderNumber') || searchParams.get('external_reference');
  const isDemo = searchParams.get('demo') === 'true';

  const isSuccess = rawStatus === 'success' || rawStatus === 'approved';
  const isPending = rawStatus === 'pending' || rawStatus === 'in_process';
  const isFailure = rawStatus === 'failure' || rawStatus === 'rejected';

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Topo / Logo */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-block text-xl font-black uppercase tracking-tighter text-black hover:opacity-80 transition-opacity"
          >
            ATELIÊ TÊXTIL <span className="text-xs font-bold text-slate-400">BY YOU</span>
          </Link>
          {isDemo && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-900 border border-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Ambiente de Demonstração Sandbox
            </div>
          )}
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 text-center animate-in fade-in-50 zoom-in-95 duration-200">
          {/* ÍCONE DE STATUS */}
          {isSuccess && (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-3xl font-black ring-8 ring-emerald-50/60 mb-5">
              ✓
            </div>
          )}

          {isPending && (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-3xl font-black ring-8 ring-amber-50/60 mb-5 animate-pulse">
              ⏳
            </div>
          )}

          {isFailure && (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 text-3xl font-black ring-8 ring-rose-50/60 mb-5">
              ✕
            </div>
          )}

          {/* TÍTULO */}
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isSuccess && 'Pagamento Aprovado com Sucesso!'}
            {isPending && 'Pagamento em Análise ou Aguardando Pix'}
            {isFailure && 'O Pagamento Não Foi Concluído'}
          </h1>

          {/* DESCRIÇÃO */}
          <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {isSuccess &&
              'Seu pedido sob medida foi recebido e entrou na fila de corte e personalização artesanal. Você receberá atualizações de cada etapa.'}
            {isPending &&
              'Estamos aguardando a confirmação do seu pagamento pelo Mercado Pago. Se optou por Pix, certifique-se de escanear o código no aplicativo do seu banco.'}
            {isFailure &&
              'A transação não pôde ser aprovada pela operadora ou foi cancelada. Não se preocupe: nenhum valor indevido foi cobrado.'}
          </p>

          {/* RECIBO / DETALHES DO PEDIDO */}
          <div className="my-6 rounded-2xl bg-slate-50 p-4 text-xs text-left space-y-2 border border-slate-200/80">
            {orderNumber && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Número do Pedido:</span>
                <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">ID Mercado Pago:</span>
                <span className="font-mono text-slate-700">{paymentId}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Gateway Seguro:</span>
              <span className="font-bold text-sky-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Mercado Pago Checkout Pro
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="text-slate-500 font-medium">Status da Transação:</span>
              <span
                className={`font-black uppercase tracking-wider text-[11px] ${
                  isSuccess
                    ? 'text-emerald-600'
                    : isPending
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                ● {rawStatus}
              </span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link
              href="/"
              className="flex-1 rounded-full bg-black py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-95 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Voltar ao Catálogo</span>
              <span>&rarr;</span>
            </Link>

            {isFailure && (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 rounded-full border border-slate-300 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <span>🔒 Criptografia SSL de 256 bits</span>
          <span>•</span>
          <span>Processamento Seguro Mercado Pago</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans text-xs text-slate-500">
          Carregando informações do pedido...
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
