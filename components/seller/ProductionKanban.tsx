'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types/database';

interface ProductionKanbanProps {
  initialOrders: Order[];
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

const COLUMNS: { id: OrderStatus; label: string; badgeColor: string }[] = [
  { id: 'pending', label: '1. Pendente', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'artwork_analysis', label: '2. Análise de Arte', badgeColor: 'bg-purple-100 text-purple-800' },
  { id: 'in_production', label: '3. Em Produção / Costura', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'ready_for_shipping', label: '4. Pronto p/ Envio', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'shipped', label: '5. Enviado', badgeColor: 'bg-slate-100 text-slate-800' },
];

export function ProductionKanban({ initialOrders, onUpdateStatus }: ProductionKanbanProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdating(true);
    // Atualização otimista
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      if (onUpdateStatus) {
        await onUpdateStatus(orderId, nextStatus);
      }
    } catch (err) {
      console.error('Falha ao atualizar status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6 bg-slate-100 min-h-screen">
      {/* Header do Backoffice */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pipeline de Produção Têxtil Sob Medida
          </h1>
          <p className="text-sm text-slate-500">
            Gestão de pedidos customizados, conferência de arquivos de alta resolução e controle de corte.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total em Aberto:
          </span>
          <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-sm font-bold text-white">
            {orders.filter((o) => o.status !== 'shipped' && o.status !== 'cancelled').length}
          </span>
        </div>
      </div>

      {/* Grid Kanban */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5 flex-1 items-start">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);

          return (
            <div
              key={col.id}
              className="flex max-h-[85vh] flex-col rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm"
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between border-b border-slate-200/60 p-3.5">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.badgeColor}`}>
                  {col.label}
                </span>
                <span className="text-xs font-bold text-slate-400">{colOrders.length}</span>
              </div>

              {/* Lista de Pedidos */}
              <div className="flex flex-col gap-3 overflow-y-auto p-3">
                {colOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Nenhum pedido</div>
                ) : (
                  colOrders.map((order) => {
                    const firstItem = order.items?.[0];
                    const custom = firstItem?.customization;

                    return (
                      <div
                        key={order.id}
                        className="group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-slate-900">{order.order_number}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-medium text-slate-700 truncate">
                          {order.customer_name}
                        </p>

                        {/* Miniatura do Preview gerado no Canvas */}
                        {custom?.canvas_snapshot_url && (
                          <div className="mt-2.5 h-28 w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                            <img
                              src={custom.canvas_snapshot_url}
                              alt="Mockup do Pedido"
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}

                        {/* Metadados Técnicos de Produção */}
                        <div className="mt-2.5 space-y-1 rounded-md bg-slate-50 p-2 text-[11px] text-slate-600">
                          <div className="flex justify-between">
                            <span>Tecido:</span>
                            <strong className="text-slate-800 truncate max-w-[110px]">
                              {custom?.fabric?.name || 'Padrão'}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Consumo:</span>
                            <span className="font-semibold text-indigo-600">
                              {custom?.consumed_meters || 0}m
                            </span>
                          </div>
                          {custom?.custom_text && (
                            <div className="flex justify-between truncate">
                              <span>Texto:</span>
                              <span className="font-semibold italic text-slate-800">
                                "{custom.custom_text}"
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Ações: Download do Arquivo e Transição de Status */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                          {custom?.artwork_file_url ? (
                            <a
                              href={custom.artwork_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Arte HD
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">Sem anexo</span>
                          )}

                          {/* Seletor Rápido de Status */}
                          <select
                            disabled={isUpdating}
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="pending">Pendente</option>
                            <option value="artwork_analysis">Análise</option>
                            <option value="in_production">Produção</option>
                            <option value="ready_for_shipping">Pronto</option>
                            <option value="shipped">Enviado</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default ProductionKanban;
