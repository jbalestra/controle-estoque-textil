'use client';

import React, { useState } from 'react';
import { Fabric } from '@/types/database';

interface FabricInventoryManagerProps {
  initialFabrics: Fabric[];
  onUpdateStock?: (fabricId: string, addedMeters: number) => Promise<void>;
  onToggleActive?: (fabricId: string, isActive: boolean) => Promise<void>;
}

export function FabricInventoryManager({
  initialFabrics,
  onUpdateStock,
  onToggleActive,
}: FabricInventoryManagerProps) {
  const [fabrics, setFabrics] = useState<Fabric[]>(initialFabrics);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [replenishAmount, setReplenishAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleToggle = async (fabric: Fabric) => {
    const updatedStatus = !fabric.is_active;
    setFabrics((prev) =>
      prev.map((f) => (f.id === fabric.id ? { ...f, is_active: updatedStatus } : f))
    );

    if (onToggleActive) {
      await onToggleActive(fabric.id, updatedStatus);
    }
  };

  const handleAddStock = async () => {
    if (!selectedFabric || !replenishAmount || Number(replenishAmount) <= 0) return;

    setIsSubmitting(true);
    const added = Number(replenishAmount);

    setFabrics((prev) =>
      prev.map((f) =>
        f.id === selectedFabric.id
          ? { ...f, available_meters: Number(f.available_meters) + added }
          : f
      )
    );

    if (onUpdateStock) {
      await onUpdateStock(selectedFabric.id, added);
    }

    setIsSubmitting(false);
    setSelectedFabric(null);
    setReplenishAmount('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Estoque de Matéria-Prima & Tecidos
          </h2>
          <p className="text-xs text-slate-500">
            Controle volumétrico de metragem linear. Tecidos com metragem zerada são desabilitados automaticamente na vitrine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Alerta de Estoque Crítico (&le; 5m)
          </div>
        </div>
      </div>

      {/* Tabela de Tecidos */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Amostra & Código</th>
              <th className="px-4 py-3">Nome & Composição</th>
              <th className="px-4 py-3 text-right">Preço Mult.</th>
              <th className="px-4 py-3 text-right">Disponível (m)</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {fabrics.map((fabric) => {
              const isLowStock = Number(fabric.available_meters) <= Number(fabric.min_stock_alert);
              const isZeroStock = Number(fabric.available_meters) <= 0;

              return (
                <tr key={fabric.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
                        {fabric.sample_thumbnail_url ? (
                          <img
                            src={fabric.sample_thumbnail_url}
                            alt={fabric.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-200" />
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">{fabric.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{fabric.name}</div>
                    <div className="text-[11px] text-slate-400">{fabric.composition}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {fabric.price_multiplier}x
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold ${
                        isZeroStock
                          ? 'bg-red-100 text-red-700'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {fabric.available_meters} m
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(fabric)}
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        fabric.is_active && !isZeroStock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {fabric.is_active && !isZeroStock ? 'Ativo na Loja' : 'Pausado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedFabric(fabric)}
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      + Entrada de Rolo
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Entrada de Estoque / Reposição de Matéria-Prima */}
      {selectedFabric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Registrar Entrada de Tecido: {selectedFabric.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Estoque atual: <strong>{selectedFabric.available_meters}m</strong>
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700">
                Metragem do novo rolo / lote (metros)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Ex: 50.00"
                value={replenishAmount}
                onChange={(e) => setReplenishAmount(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFabric(null);
                  setReplenishAmount('');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !replenishAmount}
                onClick={handleAddStock}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Entrada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default FabricInventoryManager;
