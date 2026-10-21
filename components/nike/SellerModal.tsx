'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SellerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SellerModal({ isOpen, onClose }: SellerModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'dashboard'>('dashboard');
  const [email, setEmail] = useState('lojista@bagshouse.com.br');
  const [password, setPassword] = useState('••••••••');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar estilo Nike */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black border border-amber-500/30 overflow-hidden shadow-md shrink-0">
            <img src="/logo.png" alt="Bags House" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950">
              Bags House • Painel do Lojista
            </h2>
            <p className="text-xs text-slate-500">
              Gestão de nécessaires, bolsas, fotos, estoque e produção
            </p>
          </div>
        </div>

        {/* Abas Superiores */}
        <div className="mt-6 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2.5 text-xs font-bold transition-colors ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-black text-black'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Acesso Rápido aos Módulos
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`ml-6 pb-2.5 text-xs font-bold transition-colors ${
              activeTab === 'login'
                ? 'border-b-2 border-black text-black'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Credenciais de Acesso
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'dashboard' ? (
          <div className="mt-6 space-y-3.5">
            <p className="text-xs text-slate-600 font-medium">
              Selecione a área do backoffice que você deseja gerenciar:
            </p>

            {/* Módulo 1: Estoque de Insumos */}
            <Link
              href="/seller/inventory"
              onClick={onClose}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition-all hover:border-black hover:bg-slate-50 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 text-xl font-bold">
                  🧵
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-black">
                    Controle de Estoque de Tecidos
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Metragem linear disponível, alerta de estoque crítico e entrada de rolos.
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-black transition-all">
                &rarr;
              </span>
            </Link>

            {/* Módulo 2: Kanban de Produção */}
            <Link
              href="/seller/kanban"
              onClick={onClose}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition-all hover:border-black hover:bg-slate-50 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 text-xl font-bold">
                  📋
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-black">
                    Pipeline Kanban de Produção
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Acompanhamento de costura sob medida e download da arte do cliente em HD.
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-black transition-all">
                &rarr;
              </span>
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Corporativo do Lojista
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-black focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-black py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Autenticar e Entrar no Painel
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-3 text-center">
          <span className="text-[10px] text-slate-400">
            Acesso restrito para confecção, corte e gestores têxteis credenciados.
          </span>
        </div>
      </div>
    </div>
  );
}
export default SellerModal;
