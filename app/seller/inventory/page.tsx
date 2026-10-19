import React from 'react';
import { FabricInventoryManager } from '@/components/seller/FabricInventoryManager';
import { Fabric } from '@/types/database';

const mockFabrics: Fabric[] = [
  {
    id: 'f1',
    code: 'TEC-ALG-PIMA',
    name: 'Algodão Pima Peruano 80 Fios',
    composition: '100% Algodão Pima',
    texture_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
    sample_thumbnail_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150',
    available_meters: 43.3,
    reserved_meters: 2.2,
    min_stock_alert: 5.0,
    cost_per_meter: 32.0,
    price_multiplier: 1.15,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f2',
    code: 'TEC-LIN-PURO',
    name: 'Linho Puro Rústico Champagne',
    composition: '100% Linho Europeu',
    texture_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=300',
    sample_thumbnail_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=150',
    available_meters: 18.0,
    reserved_meters: 2.2,
    min_stock_alert: 5.0,
    cost_per_meter: 58.0,
    price_multiplier: 1.35,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f3',
    code: 'TEC-SEDA-SATIN',
    name: 'Seda Mulberry Acetinada',
    composition: '100% Seda Natural',
    texture_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    sample_thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    available_meters: 3.5, // Menor que o min_stock_alert (5m) -> Aciona alerta crítico
    reserved_meters: 0.0,
    min_stock_alert: 5.0,
    cost_per_meter: 110.0,
    price_multiplier: 1.8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function InventoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <FabricInventoryManager initialFabrics={mockFabrics} />
    </main>
  );
}
