'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useProducts,
  updateProductStock,
  updateProductDiscount,
  updateProductImage,
  addStoreProduct,
  deleteStoreProduct,
  StoreProduct,
} from '@/lib/products-store';
import { OrderRecord } from '@/lib/cart-context';

export default function LojistaPortalPage() {
  const { products, isLoaded } = useProducts();

  // Navegação Principal do Lojista: Catálogo vs Faturamento & Comprovantes
  const [activeMainTab, setActiveMainTab] = useState<'catalogo' | 'faturamento'>('catalogo');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderRecord | null>(null);
  const [faturamentoFilter, setFaturamentoFilter] = useState<'all' | 'aprovado' | 'pendente'>('all');
  const [faturamentoSearch, setFaturamentoSearch] = useState('');

  // Estado de Autenticação do Lojista
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('lojista@bagshouse.com.br');
  const [loginPassword, setLoginPassword] = useState('lojista123');
  const [loginError, setLoginError] = useState('');

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtros do Painel
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low' | 'out' | 'discount'>('all');

  // Modal de Adicionar Bolsa
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newPrice, setNewPrice] = useState('320.00');
  const [newDiscount, setNewDiscount] = useState('15');
  const [newCategory, setNewCategory] = useState('Bolsas & Acessórios');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [newCustomizable, setNewCustomizable] = useState(true);

  // Modal Rápido de Desconto para uma Peça Específica
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<StoreProduct | null>(null);
  const [modalDiscountValue, setModalDiscountValue] = useState<number>(0);

  // Modal para Trocar Foto de Peça Existente
  const [selectedProductForPhoto, setSelectedProductForPhoto] = useState<StoreProduct | null>(null);
  const [photoEditMode, setPhotoEditMode] = useState<'file' | 'url'>('file');
  const [photoEditUrl, setPhotoEditUrl] = useState('');

  const loadOrders = () => {
    try {
      const stored = localStorage.getItem('bagshouse_orders_history_v1');
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        const initialApproved: OrderRecord = {
          id: 'ord-initial-1',
          orderNumber: 'PED-20261022-5682',
          createdAt: new Date().toISOString(),
          customerName: 'Comprador de Teste',
          customerEmail: 'comprador.sandbox@gmail.com',
          customerPhone: '(11) 98765-4321',
          shippingAddress: {
            cep: '01310-100',
            street: 'Avenida Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
          },
          paymentMethod: 'credit_card',
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productTitle: 'Bolsa Tiracolo Minimalista Couro Caramelo',
              productSlug: 'bolsa-tiracolo-couro',
              basePrice: 202.42,
              unitPrice: 202.42,
              quantity: 1,
              maxStock: 10,
              imageUrl: '/products/caramelo.jpg',
              isCustomized: true,
              customization: {
                customText: 'BAGS HOUSE',
                fontName: 'Serif Elegante',
                textColor: '#D97706',
              },
              addedAt: Date.now(),
            },
          ],
          subtotal: 202.42,
          discountAmount: 0,
          shippingCost: 0,
          totalAmount: 202.42,
          status: 'aprovado',
        };
        (initialApproved as any).paymentId = '185618265018';
        (initialApproved as any).paidAt = new Date().toISOString();
        localStorage.setItem('bagshouse_orders_history_v1', JSON.stringify([initialApproved]));
        setOrders([initialApproved]);
      }
    } catch (e) {
      console.error('Erro ao carregar pedidos:', e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('atelie_lojista_logged_in');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);

    loadOrders();
    window.addEventListener('bagshouse_order_created', loadOrders);
    window.addEventListener('bagshouse_order_updated', loadOrders);
    return () => {
      window.removeEventListener('bagshouse_order_created', loadOrders);
      window.removeEventListener('bagshouse_order_updated', loadOrders);
    };
  }, []);

  const exportFaturamentoCSV = () => {
    if (orders.length === 0) {
      showToast('Nenhum comprovante para exportar.');
      return;
    }
    const headers = 'Pedido,ID Mercado Pago,Data,Cliente,Email,Telefone,Total (R$),Status\\n';
    const rows = orders
      .map((o) => {
        const pId = (o as any).paymentId || 'Pendente';
        const date = new Date(o.createdAt).toLocaleString('pt-BR');
        return `"${o.orderNumber}","${pId}","${date}","${o.customerName}","${o.customerEmail}","${o.customerPhone || ''}","${o.totalAmount.toFixed(2)}","${o.status}"`;
      })
      .join('\\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `faturamento_bagshouse_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório de faturamento baixado com sucesso!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Por favor, preencha o e-mail e a senha.');
      return;
    }
    setIsAuthenticated(true);
    localStorage.setItem('atelie_lojista_logged_in', 'true');
    setLoginError('');
    showToast('Login realizado com sucesso! Bem-vindo ao Painel do Lojista.');
  };

  const handleQuickDemoLogin = () => {
    setLoginEmail('lojista@bagshouse.com.br');
    setLoginPassword('lojista123');
    setIsAuthenticated(true);
    localStorage.setItem('atelie_lojista_logged_in', 'true');
    setLoginError('');
    showToast('Acesso de Demonstração liberado!');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('atelie_lojista_logged_in');
  };

  // Upload de Imagem (Leitura do arquivo local/pendrive via FileReader)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setNewImageUrl(result);
        showToast(`Imagem "${file.name}" carregada com sucesso!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoEditUrl(result);
        showToast(`Nova imagem "${file.name}" carregada!`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Alteração de Estoque
  const handleStockChange = (productId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    updateProductStock(productId, nextStock);
    const prod = products.find((p) => p.id === productId);
    showToast(`Estoque de "${prod?.title || 'Produto'}" alterado para ${nextStock} unidades.`);
  };

  const handleDirectStockInput = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    const safeVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
    updateProductStock(productId, safeVal);
  };

  // Alteração de Desconto
  const handleDiscountChange = (productId: string, currentDiscount: number, delta: number) => {
    const nextDiscount = Math.max(0, Math.min(90, currentDiscount + delta));
    updateProductDiscount(productId, nextDiscount);
    const prod = products.find((p) => p.id === productId);
    if (nextDiscount === 0) {
      showToast(`Desconto removido de "${prod?.title || 'Produto'}". Preço original restabelecido.`);
    } else {
      showToast(`Desconto de ${nextDiscount}% aplicado em "${prod?.title || 'Produto'}"!`);
    }
  };

  const handleDirectDiscountInput = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    const safeVal = isNaN(parsed) ? 0 : Math.max(0, Math.min(90, parsed));
    updateProductDiscount(productId, safeVal);
  };

  const handleOpenDiscountModal = (prod: StoreProduct) => {
    setSelectedProductForDiscount(prod);
    setModalDiscountValue(prod.discount_percentage ?? 0);
  };

  const handleSaveModalDiscount = () => {
    if (!selectedProductForDiscount) return;
    updateProductDiscount(selectedProductForDiscount.id, modalDiscountValue);
    showToast(`Desconto de ${modalDiscountValue}% salvo para "${selectedProductForDiscount.title}"!`);
    setSelectedProductForDiscount(null);
  };

  // Alterar Foto de Produto Existente
  const handleOpenPhotoModal = (prod: StoreProduct) => {
    setSelectedProductForPhoto(prod);
    setPhotoEditUrl(prod.base_mockup_url);
    setPhotoEditMode('file');
  };

  const handleSavePhotoModal = () => {
    if (!selectedProductForPhoto || !photoEditUrl) return;
    updateProductImage(selectedProductForPhoto.id, photoEditUrl);
    showToast(`Foto de "${selectedProductForPhoto.title}" atualizada com sucesso!`);
    setSelectedProductForPhoto(null);
  };

  // Cadastrar Nova Bolsa
  const handleCreateBag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Informe o nome da bolsa.');
      return;
    }

    const priceNum = parseFloat(newPrice.replace(',', '.')) || 299.9;
    const stockNum = parseInt(newStock, 10) || 0;
    const discountNum = parseInt(newDiscount, 10) || 0;

    const finalImage =
      newImageUrl.trim() ||
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80';

    addStoreProduct({
      title: newTitle.trim(),
      base_price: priceNum,
      original_price: priceNum,
      discount_percentage: discountNum,
      stock_quantity: stockNum,
      categoryLabel: newCategory,
      description: newDescription.trim() || 'Bolsa exclusiva de confecção artesanal com acabamento reforçado.',
      base_mockup_url: finalImage,
      isCustomizable: newCustomizable,
      gender: 'Feminino',
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewStock('10');
    setNewPrice('320.00');
    setNewDiscount('15');
    setNewDescription('');
    setNewImageUrl('');
    showToast(`Bolsa "${newTitle}" cadastrada com sucesso e publicada na loja!`);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja remover "${title}" do catálogo da loja?`)) {
      deleteStoreProduct(id);
      showToast(`Produto "${title}" removido com sucesso.`);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        Carregando portal do lojista...
      </div>
    );
  }

  // ==========================================
  // TELA DE LOGIN DO LOJISTA
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black font-sans text-white flex flex-col justify-between p-6">
        {/* Barra superior discreta */}
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-amber-500/30 bg-black shadow-md flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Bags House" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              PORTAL DO LOJISTA • <span className="text-amber-400">BAGS HOUSE</span>
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>&larr; Voltar para a Loja do Comprador</span>
          </Link>
        </div>

        {/* Card Central de Login */}
        <div className="mx-auto w-full max-w-md my-auto">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl shadow-black/80">
            {/* Ícone & Cabeçalho */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black border border-amber-500/30 overflow-hidden shadow-xl">
                <img src="/logo.png" alt="Bags House" className="h-full w-full object-cover" />
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
                Bags House • Acesso Lojas
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Gerencie nécessaires, bolsas, fotos, estoque e descontos em tempo real.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {loginError && (
              <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
                {loginError}
              </div>
            )}

            {/* Formulário de Acesso */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  E-mail da Loja Credenciada
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="sua-loja@bagshouse.com.br"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Senha de Acesso
                  </label>
                  <span className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer">
                    Esqueceu?
                  </span>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <input
                  type="checkbox"
                  id="remember"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-white accent-white"
                />
                <label htmlFor="remember" className="cursor-pointer">
                  Manter conectado neste computador
                </label>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-white py-3.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-slate-200 active:scale-[0.98] shadow-lg shadow-white/10"
              >
                Entrar no Painel do Lojista
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                ou acesso rápido de teste
              </span>
            </div>

            {/* Botão de 1 Clique para Teste */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>Entrar como Loja de Demonstração</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Acesso exclusivo via URL restrita <code className="text-slate-400">/lojista</code>. Não visível para clientes comuns da loja.
          </p>
        </div>

        <div className="text-center text-xs text-slate-600 py-2">
          &copy; 2026 Bags House • Nécessaires Personalizadas & Bolsas Sob Medida
        </div>
      </div>
    );
  }

  // Métricas de Faturamento & Vendas
  const approvedOrders = orders.filter((o) => o.status === 'aprovado');
  const totalFaturado = approvedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const ticketMedio = approvedOrders.length > 0 ? totalFaturado / approvedOrders.length : 0;
  const totalPecasVendidas = approvedOrders.reduce(
    (acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  let filteredOrders = orders;
  if (faturamentoFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.status === faturamentoFilter);
  }
  if (faturamentoSearch.trim()) {
    const q = faturamentoSearch.toLowerCase();
    filteredOrders = filteredOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        ((o as any).paymentId && String((o as any).paymentId).toLowerCase().includes(q))
    );
  }

  // ==========================================
  // PAINEL DE GESTÃO DO LOJISTA (BOLSAS, ESTOQUE & DESCONTOS)
  // ==========================================
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const discountedItemsCount = products.filter((p) => (p.discount_percentage || 0) > 0).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;

  // Filtragem dos produtos
  let displayProducts = products;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayProducts = displayProducts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q)
    );
  }

  if (stockStatusFilter === 'in_stock') {
    displayProducts = displayProducts.filter((p) => p.stock_quantity > 5);
  } else if (stockStatusFilter === 'low') {
    displayProducts = displayProducts.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5);
  } else if (stockStatusFilter === 'discount') {
    displayProducts = displayProducts.filter((p) => (p.discount_percentage || 0) > 0);
  } else if (stockStatusFilter === 'out') {
    displayProducts = displayProducts.filter((p) => p.stock_quantity === 0);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      {/* TOAST DE NOTIFICAÇÃO FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <span className="text-base">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER DO PAINEL DO LOJISTA */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black border border-amber-500/30 overflow-hidden shadow-md shrink-0">
              <img src="/logo.png" alt="Bags House" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">
                  Bags House • Painel do Lojista
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sincronizado com a Loja
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gerencie estoque, modelos de bolsas, descontos e consulte comprovantes e faturamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              title="Abre a loja que o cliente vê em uma nova aba"
            >
              <span>👁️</span>
              <span className="hidden sm:inline">Ver Loja do Comprador</span>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
            >
              Sair
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS PRINCIPAIS: ESTOQUE vs FATURAMENTO & COMPROVANTES */}
        <div className="mx-auto flex max-w-7xl px-6 gap-2 border-t border-slate-800/60 pt-2 pb-0">
          <button
            onClick={() => setActiveMainTab('catalogo')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeMainTab === 'catalogo'
                ? 'border-white text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📦</span>
            <span>Catálogo & Estoque</span>
            <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('faturamento')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeMainTab === 'faturamento'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📊</span>
            <span>Vendas & Faturamento (Comprovantes)</span>
            <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-extrabold">
              {orders.length}
            </span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {activeMainTab === 'catalogo' ? (
          <>
            {/* CARDS DE RESUMO (KPIS DE ESTOQUE & DESCONTOS) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total de Modelos
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{totalItems}</span>
              <span className="text-xs text-slate-400 font-medium">peças cadastradas</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Estoque Total Pronta Entrega
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-300">{totalStockUnits}</span>
              <span className="text-xs text-emerald-500 font-semibold">unidades totais</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Peças com Desconto Ativo
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-300">{discountedItemsCount}</span>
              <span className="text-xs text-amber-500 font-semibold">em promoção</span>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Itens Esgotados
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-rose-300">{outOfStockCount}</span>
              <span className="text-xs text-rose-400 font-semibold">precisa repor</span>
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES: CADASTRAR BOLSA + BUSCA + FILTROS */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Botão de Adicionar Bolsa */}
            <button
              onClick={() => {
                setNewImageUrl('');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-slate-200 transition-all active:scale-95 shadow-md shadow-white/10"
            >
              <span className="text-base leading-none">+</span>
              <span>Cadastrar Nova Bolsa</span>
            </button>

            {/* Filtros rápidos */}
            <div className="flex rounded-xl bg-slate-800/80 p-1 text-xs font-semibold">
              <button
                onClick={() => setStockStatusFilter('all')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  stockStatusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setStockStatusFilter('discount')}
                className={`rounded-lg px-3 py-1.5 transition-all flex items-center gap-1 ${
                  stockStatusFilter === 'discount' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏷️ Com Desconto</span>
                <span className="rounded-full bg-black/30 px-1.5 text-[10px]">
                  {discountedItemsCount}
                </span>
              </button>
              <button
                onClick={() => setStockStatusFilter('in_stock')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  stockStatusFilter === 'in_stock' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Em Estoque
              </button>
              <button
                onClick={() => setStockStatusFilter('out')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  stockStatusFilter === 'out' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Esgotados ({outOfStockCount})
              </button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por nome da bolsa ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
          </div>
        </div>

        {/* LISTAGEM DE BOLSAS E PRODUTOS */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Bolsa / Foto</th>
                  <th className="py-4 px-4">Categoria</th>
                  <th className="py-4 px-4">Preço (Pix / Normal)</th>
                  <th className="py-4 px-5 text-center bg-slate-800/40 text-amber-400">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>🏷️</span>
                      <span>Desconto na Peça</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-center">Quantidade em Estoque</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayProducts.map((prod) => {
                  const hasStock = prod.stock_quantity > 0;
                  const isLow = prod.stock_quantity > 0 && prod.stock_quantity <= 5;
                  const currentDiscount = prod.discount_percentage ?? (prod.discountPercent ? parseInt(prod.discountPercent, 10) || 0 : 0);

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Foto e Título com Ação de Trocar Foto */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div
                            onClick={() => handleOpenPhotoModal(prod)}
                            className="relative group/thumb cursor-pointer h-14 w-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0"
                            title="Clique para trocar a foto desta bolsa"
                          >
                            <img
                              src={prod.base_mockup_url}
                              alt={prod.title}
                              className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-opacity">
                              <span>📸</span>
                              <span>Trocar</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {prod.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span>SKU: {prod.sku}</span>
                              {prod.isCustomizable && (
                                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                                  Personalizável
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {prod.categoryLabel}
                      </td>

                      {/* Preço */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">
                          R$ {prod.pixPrice} <span className="text-[10px] text-emerald-400 font-semibold">Pix</span>
                        </div>
                        {currentDiscount > 0 ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-400 line-through">
                              De: R$ {prod.originalPrice}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            R$ {prod.originalPrice}
                          </div>
                        )}
                      </td>

                      {/* CAMPO DE DESCONTO */}
                      <td className="py-4 px-5 text-center bg-slate-800/20">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(prod.id, currentDiscount, -5)}
                              disabled={currentDiscount <= 0}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 text-sm"
                              title="Diminuir 5% de desconto"
                            >
                              -
                            </button>

                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="90"
                                value={currentDiscount}
                                onChange={(e) => handleDirectDiscountInput(prod.id, e.target.value)}
                                className="w-16 rounded-lg border border-amber-500/40 bg-slate-950 px-1 py-1 text-center text-xs font-black text-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                                title="Digite a porcentagem de desconto (0 a 90%)"
                              />
                              <span className="absolute right-1.5 top-1 text-[10px] text-amber-400/60 font-bold pointer-events-none">
                                %
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDiscountChange(prod.id, currentDiscount, +5)}
                              disabled={currentDiscount >= 90}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 text-sm"
                              title="Aumentar 5% de desconto"
                            >
                              +
                            </button>
                          </div>

                          {/* Pílulas de atalho */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(prod.id, 0, -currentDiscount)}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
                                currentDiscount === 0
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              0%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(prod.id, 0, 10 - currentDiscount)}
                              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-amber-400/80 hover:bg-amber-500/20 hover:text-amber-300"
                            >
                              10%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(prod.id, 0, 20 - currentDiscount)}
                              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-amber-400/80 hover:bg-amber-500/20 hover:text-amber-300"
                            >
                              20%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(prod.id, 0, 30 - currentDiscount)}
                              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-amber-400/80 hover:bg-amber-500/20 hover:text-amber-300"
                            >
                              30%
                            </button>
                          </div>

                          {currentDiscount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                              <span>🏷️ -{currentDiscount}% OFF</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Preço cheio</span>
                          )}
                        </div>
                      </td>

                      {/* CONTROLE RÁPIDO DE QUANTIDADE EM ESTOQUE */}
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStockChange(prod.id, prod.stock_quantity, -1)}
                            disabled={prod.stock_quantity <= 0}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 text-base"
                            title="Diminuir 1 unidade"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={prod.stock_quantity}
                            onChange={(e) => handleDirectStockInput(prod.id, e.target.value)}
                            className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-sm font-black text-white focus:border-emerald-500 focus:outline-none"
                            title="Digite a quantidade exata"
                          />

                          <button
                            type="button"
                            onClick={() => handleStockChange(prod.id, prod.stock_quantity, +1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95 text-base"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Status Visual */}
                      <td className="py-4 px-4">
                        {hasStock ? (
                          isLow ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Restam {prod.stock_quantity} un
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Disponível ({prod.stock_quantity})
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-400 border border-rose-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Esgotado (0)
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPhotoModal(prod)}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                            title="Trocar foto desta bolsa"
                          >
                            📸 Foto
                          </button>
                          <button
                            onClick={() => handleOpenDiscountModal(prod)}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                            title="Ajustar desconto desta peça"
                          >
                            🏷️ Desconto
                          </button>
                          <Link
                            href={`/customize/${prod.slug}`}
                            target="_blank"
                            className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                            title="Ver página da bolsa"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDelete(prod.id, prod.title)}
                            className="rounded-lg border border-rose-500/20 px-2 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/20"
                            title="Excluir bolsa"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {displayProducts.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <span className="text-3xl">👜</span>
              <p className="mt-2 text-sm font-semibold text-white">Nenhum item encontrado.</p>
              <p className="text-xs">Tente limpar a busca ou cadastre uma nova bolsa no botão acima.</p>
            </div>
          )}
        </div>
      </>
    ) : (
      /* ABA DE FATURAMENTO & COMPROVANTES */
      <div className="space-y-8 animate-in fade-in duration-200">
        {/* CABEÇALHO DO MÓDULO FINANCEIRO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-sm">
                R$
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Gestão Financeira & Comprovantes de Vendas
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Histórico consolidado de pedidos faturados no Mercado Pago com visualização e emissão de comprovantes oficiais.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all shadow-sm"
              title="Recarregar pedidos"
            >
              <span>🔄</span>
              <span>Atualizar</span>
            </button>
            <button
              onClick={exportFaturamentoCSV}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <span>📥</span>
              <span>Exportar Relatório (CSV)</span>
            </button>
          </div>
        </div>

        {/* 4 CARDS DE RESUMO FINANCEIRO (KPIS) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Faturamento Total (Aprovado)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-300">
                R$ {totalFaturado.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs text-emerald-500 font-semibold">Mercado Pago</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Receita confirmada em conta</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comprovantes / Pedidos
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{orders.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">
                {approvedOrders.length} aprovado(s)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Emitidos na plataforma</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket Médio por Venda
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">
                R$ {ticketMedio.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs text-slate-400 font-medium">por cliente</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Valor médio por transação</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Bolsas & Peças Faturadas
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-300">{totalPecasVendidas}</span>
              <span className="text-xs text-amber-500 font-semibold">unidades</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Produtos personalizados vendidos</p>
          </div>
        </div>

        {/* BARRA DE BUSCA & FILTROS DE COMPROVANTES */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nº de pedido, nome do cliente, e-mail ou ID Mercado Pago..."
              value={faturamentoSearch}
              onChange={(e) => setFaturamentoSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            {faturamentoSearch && (
              <button
                onClick={() => setFaturamentoSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Status:</span>
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
              <button
                onClick={() => setFaturamentoFilter('all')}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  faturamentoFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({orders.length})
              </button>
              <button
                onClick={() => setFaturamentoFilter('aprovado')}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  faturamentoFilter === 'aprovado'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                ✓ Aprovados ({approvedOrders.length})
              </button>
              <button
                onClick={() => setFaturamentoFilter('pendente')}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  faturamentoFilter === 'pendente'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                ⏳ Pendentes ({orders.filter((o) => o.status === 'pendente').length})
              </button>
            </div>
          </div>
        </div>

        {/* TABELA DE COMPROVANTES / PEDIDOS */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Pedido / ID Mercado Pago</th>
                  <th className="px-5 py-3.5">Data & Hora</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Itens Comprados</th>
                  <th className="px-5 py-3.5">Forma</th>
                  <th className="px-5 py-3.5">Valor Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((ord) => {
                  const pId = (ord as any).paymentId;
                  const dateStr = new Date(ord.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isApproved = ord.status === 'aprovado';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-white">{ord.orderNumber}</div>
                        <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                          {pId ? `MP #${pId}` : <span className="text-slate-500">Aguardando confirmação</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {ord.customerEmail}
                        </div>
                        {ord.customerPhone && (
                          <div className="text-[10px] text-slate-500">{ord.customerPhone}</div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-200">
                              <span className="font-bold text-emerald-400">{item.quantity}x</span>
                              <span className="truncate max-w-[200px]">{item.productTitle}</span>
                              {item.isCustomized && (
                                <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[9px] font-black uppercase">
                                  By You
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                        {ord.paymentMethod === 'credit_card' ? 'Cartão Crédito' : 'Pix'}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-black text-white">
                          R$ {ord.totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-black text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-black text-amber-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setReceiptModalOrder(ord)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 hover:border-slate-500 transition-all shadow-sm active:scale-95"
                          title="Visualizar e emitir comprovante deste pedido"
                        >
                          <span>📄</span>
                          <span>Ver Comprovante</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <span className="text-3xl">🧾</span>
              <p className="mt-2 text-sm font-semibold text-white">Nenhum comprovante encontrado.</p>
              <p className="text-xs">
                {faturamentoSearch
                  ? 'Tente ajustar os termos da pesquisa.'
                  : 'Assim que compras forem aprovadas no Mercado Pago, os comprovantes aparecerão aqui.'}
              </p>
            </div>
          )}
        </div>
      </div>
    )}
  </main>

      {/* ========================================== */}
      {/* MODAL: AJUSTAR DESCONTO DA PEÇA */}
      {/* ========================================== */}
      {selectedProductForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedProductForDiscount(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 font-black text-xl border border-amber-500/30">
                🏷️
              </span>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">
                  Aplicar Desconto na Peça
                </h2>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {selectedProductForDiscount.title}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  Porcentagem de Desconto (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={modalDiscountValue}
                    onChange={(e) => setModalDiscountValue(Number(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="w-16 rounded-xl border border-amber-500/40 bg-slate-950 px-2 py-1.5 text-center text-sm font-black text-amber-300">
                    {modalDiscountValue}%
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[0, 5, 10, 15, 20, 25, 30, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setModalDiscountValue(pct)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        modalDiscountValue === pct
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pct === 0 ? 'Sem Desconto' : `${pct}% OFF`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Prévia do Preço para o Comprador:
                </span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-slate-400">Preço Original:</span>
                  <span className="font-bold text-slate-200">
                    R$ {(selectedProductForDiscount.original_price || parseFloat(selectedProductForDiscount.originalPrice.replace(',', '.')) || selectedProductForDiscount.base_price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-amber-400 font-semibold">Desconto ({modalDiscountValue}%):</span>
                  <span className="font-bold text-amber-400">
                    - R$ {(((selectedProductForDiscount.original_price || parseFloat(selectedProductForDiscount.originalPrice.replace(',', '.')) || selectedProductForDiscount.base_price) * modalDiscountValue) / 100).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-800 pt-1.5">
                  <span className="font-bold text-white">Preço com Desconto no Pix:</span>
                  <span className="text-sm font-black text-emerald-400">
                    R$ {((((selectedProductForDiscount.original_price || parseFloat(selectedProductForDiscount.originalPrice.replace(',', '.')) || selectedProductForDiscount.base_price) * (1 - modalDiscountValue / 100)) * 0.95)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForDiscount(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalDiscount}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 active:scale-95"
                >
                  Aplicar Desconto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: TROCAR FOTO DE PEÇA EXISTENTE */}
      {/* ========================================== */}
      {selectedProductForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedProductForPhoto(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black font-black text-xl">
                📸
              </span>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">
                  Trocar Imagem da Peça
                </h2>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {selectedProductForPhoto.title}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Abas */}
              <div className="flex rounded-xl bg-slate-800/80 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPhotoEditMode('file')}
                  className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${
                    photoEditMode === 'file'
                      ? 'bg-white text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📁</span>
                  <span>Upload de Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoEditMode('url')}
                  className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${
                    photoEditMode === 'url'
                      ? 'bg-white text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔗</span>
                  <span>URL / Caminho</span>
                </button>
              </div>

              {photoEditMode === 'file' ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-5 hover:border-emerald-400/60 transition-colors cursor-pointer group relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="text-2xl mb-1.5">🖼️</div>
                  <p className="text-xs font-bold text-white text-center">
                    Clique para selecionar foto do computador ou pendrive
                  </p>
                  <p className="text-[11px] text-slate-400 text-center mt-0.5">
                    JPG, PNG ou WEBP
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="https://exemplo.com/foto.jpg ou C:\fotos\bolsa.png"
                    value={photoEditUrl}
                    onChange={(e) => setPhotoEditUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-white focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Cole o link direto da imagem ou caminho de arquivo.
                  </p>
                </div>
              )}

              {/* Prévia da nova imagem */}
              {photoEditUrl && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-3">
                  <img
                    src={photoEditUrl}
                    alt="Prévia"
                    className="h-16 w-16 rounded-xl object-cover border border-slate-700 bg-slate-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-400 block">
                      ✓ Imagem Pronta
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                      {photoEditUrl.startsWith('data:') ? 'Arquivo carregado' : photoEditUrl}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForPhoto(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotoModal}
                  disabled={!photoEditUrl}
                  className="rounded-xl bg-white px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-slate-200 transition-all shadow-md active:scale-95 disabled:opacity-40"
                >
                  Salvar Imagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CADASTRAR NOVA BOLSA COM UPLOAD */}
      {/* ========================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Botão fechar */}
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black font-black text-xl">
                👜
              </span>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Cadastrar Nova Bolsa no Estoque
                </h2>
                <p className="text-xs text-slate-400">
                  Carregue a foto da bolsa, defina o preço, desconto e a quantidade em estoque.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateBag} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Nome do Modelo da Bolsa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bolsa Tiracolo Couro Legítimo Nobre"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Estoque *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 15"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-bold text-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400">Unidades</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Preço Base (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="320.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-white focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Valor cheio</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-amber-300 mb-1">
                    Desconto (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      placeholder="15"
                      value={newDiscount}
                      onChange={(e) => setNewDiscount(e.target.value)}
                      className="w-full rounded-xl border border-amber-500/40 bg-slate-800/90 px-3 py-2 text-sm text-amber-300 placeholder-slate-500 focus:border-amber-400 focus:outline-none font-black"
                    />
                    <span className="absolute right-2.5 top-2 text-xs text-amber-400/60 font-bold pointer-events-none">%</span>
                  </div>
                  <span className="text-[10px] text-amber-400/70">Promoção</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Categoria / Tipo
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none cursor-pointer"
                >
                  <option value="Bolsas & Acessórios">Bolsas & Acessórios (Geral)</option>
                  <option value="Bolsa Tote • Pronta Entrega">Bolsa Tote</option>
                  <option value="Bolsa Tiracolo • Couro">Bolsa Tiracolo</option>
                  <option value="Bolsa de Ombro & Baguette">Bolsa de Ombro / Baguette</option>
                  <option value="Mochilas & Viagem">Mochila Urbana / Viagem</option>
                  <option value="Bolsas de Festa & Noite">Bolsa Clutch / Festa</option>
                </select>
              </div>

              {/* ======================================================== */}
              {/* CAMPO DE COLOCAR IMAGEM (UPLOAD OU URL / CAMINHO) */}
              {/* ======================================================== */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase text-slate-300">
                    Foto da Bolsa (Upload ou Link / Caminho) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {imageInputMode === 'file' ? 'Arquivo Local' : 'URL da Web'}
                  </span>
                </div>

                {/* Abas de Modo */}
                <div className="flex rounded-xl bg-slate-800/80 p-1 text-xs font-semibold mb-3">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('file')}
                    className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${
                      imageInputMode === 'file'
                        ? 'bg-white text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📁</span>
                    <span>Upload do Arquivo (Computador / Pendrive)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${
                      imageInputMode === 'url'
                        ? 'bg-white text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🔗</span>
                    <span>Colar URL ou Caminho</span>
                  </button>
                </div>

                {/* Opção 1: Upload de Arquivo Local */}
                {imageInputMode === 'file' && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-5 hover:border-emerald-400/60 transition-colors cursor-pointer group relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all text-xl mb-2">
                      📸
                    </div>
                    <p className="text-xs font-bold text-white text-center">
                      Clique aqui para selecionar uma foto do seu computador ou pendrive
                    </p>
                    <p className="text-[11px] text-slate-400 text-center mt-0.5">
                      Suporta fotos em JPG, PNG, WEBP ou fotos tiradas com o celular
                    </p>
                  </div>
                )}

                {/* Opção 2: Inserir URL ou Caminho do Arquivo */}
                {imageInputMode === 'url' && (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://exemplo.com/minha-bolsa.jpg ou D:\fotos\bolsa.png"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-3.5 pr-16 py-2.5 text-xs text-white placeholder-slate-500 focus:border-white focus:outline-none"
                      />
                      {newImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('')}
                          className="absolute right-2 top-2 rounded-lg bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-600"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Cole o link direto da imagem na web ou o caminho do arquivo no seu disco/pendrive.
                    </p>
                  </div>
                )}

                {/* Prévia da Foto Carregada */}
                {newImageUrl ? (
                  <div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                    <img
                      src={newImageUrl}
                      alt="Prévia da bolsa"
                      className="h-16 w-16 rounded-xl object-cover border border-emerald-500/40 bg-slate-900 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <span>✓</span>
                        <span>Foto carregada com sucesso!</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5" title={newImageUrl}>
                        {newImageUrl.startsWith('data:') ? 'Arquivo de imagem pronto para publicação' : newImageUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className="rounded-lg border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500 italic">
                    Nenhuma foto selecionada ainda. Se deixar em branco, uma imagem modelo padrão será usada.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes dos materiais, dimensões, divisórias e acabamentos..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="custom"
                  checked={newCustomizable}
                  onChange={(e) => setNewCustomizable(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 accent-emerald-500"
                />
                <label htmlFor="custom" className="cursor-pointer">
                  Permitir personalização (By You - Monogramas / Nomes)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-slate-200 transition-all active:scale-95 shadow-md shadow-white/10"
                >
                  Salvar Bolsa e Publicar na Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: COMPROVANTE OFICIAL DE VENDA       */}
      {/* ========================================== */}
      {receiptModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* BARRA SUPERIOR DO MODAL */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm">
                  📄
                </span>
                <span className="text-sm font-black text-slate-900">
                  Comprovante do Pedido #{receiptModalOrder.orderNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 transition-all active:scale-95 shadow-md"
                >
                  <span>🖨️</span>
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalOrder(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CONTEÚDO DO COMPROVANTE IMPRESSO */}
            <div className="mt-6 space-y-6">
              {/* CABEÇALHO COM LOGOTIPO */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-black border border-amber-500/30 flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Bags House" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                      BAGS HOUSE • ATELIÊ & CONFECÇÃO
                    </h2>
                    <p className="text-xs text-slate-500">
                      Comprovante de Pagamento & Controle de Faturamento
                    </p>
                    <p className="text-[11px] text-slate-400">
                      CNPJ: 42.189.563/0001-90 • São Paulo - SP
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    {receiptModalOrder.status === 'aprovado' ? 'PAGAMENTO APROVADO' : 'PENDENTE'}
                  </div>
                  <p className="mt-1 text-[11px] font-mono text-slate-500">
                    {new Date(receiptModalOrder.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* DADOS DA OPERAÇÃO MERCADO PAGO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nº do Pedido
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {receiptModalOrder.orderNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ID Mercado Pago
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    #{(receiptModalOrder as any).paymentId || '185618265018'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Forma de Pagamento
                  </span>
                  <span className="font-semibold text-slate-800">
                    {receiptModalOrder.paymentMethod === 'credit_card'
                      ? 'Cartão de Crédito'
                      : 'Pix Instantâneo'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ambiente
                  </span>
                  <span className="font-semibold text-slate-700">
                    {(receiptModalOrder as any).paymentId ? 'Mercado Pago Pro' : 'Checkout Pro'}
                  </span>
                </div>
              </div>

              {/* DADOS DO CLIENTE & ENTREGA */}
              <div className="rounded-2xl border border-slate-200 p-4 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Dados do Comprador / Pagador
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">{receiptModalOrder.customerName}</span>
                    <p className="text-slate-500 mt-0.5">{receiptModalOrder.customerEmail}</p>
                    {receiptModalOrder.customerPhone && (
                      <p className="text-slate-500">{receiptModalOrder.customerPhone}</p>
                    )}
                  </div>
                  {receiptModalOrder.shippingAddress && (
                    <div className="text-slate-600 sm:border-l sm:border-slate-200 sm:pl-3">
                      <span className="font-semibold text-slate-800 block">Endereço de Entrega:</span>
                      <p>
                        {receiptModalOrder.shippingAddress.street}, {receiptModalOrder.shippingAddress.number}
                      </p>
                      <p>
                        {receiptModalOrder.shippingAddress.neighborhood} • {receiptModalOrder.shippingAddress.city} - {receiptModalOrder.shippingAddress.state}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        CEP: {receiptModalOrder.shippingAddress.cep}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ITENS COMPRADOS */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Itens da Venda
                </span>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Descrição</th>
                        <th className="px-3 py-2.5 text-center">Qtd</th>
                        <th className="px-3 py-2.5 text-right">Unitário</th>
                        <th className="px-3 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptModalOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-900 block">{it.productTitle}</span>
                            {it.isCustomized && it.customization && (
                              <div className="mt-0.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                                Personalização By You: <strong>"{it.customization.customText}"</strong> ({it.customization.fontName})
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-800">
                            {it.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                            R$ {it.unitPrice.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">
                            R$ {(it.unitPrice * it.quantity).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RESUMO FINANCEIRO */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">R$ {receiptModalOrder.subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {receiptModalOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-amber-600 font-semibold">
                      <span>Desconto Aplicado:</span>
                      <span className="font-mono">- R$ {receiptModalOrder.discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Frete:</span>
                    <span className="text-emerald-700 font-bold">Grátis</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                    <span>TOTAL FATURADO:</span>
                    <span className="text-base text-emerald-700 font-mono">
                      R$ {receiptModalOrder.totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ASSINATURA DIGITAL / RODAPÉ */}
              <div className="border-t border-dashed border-slate-300 pt-4 text-center text-[10px] text-slate-400">
                <p>
                  Transação processada com sucesso via <strong>Mercado Pago Gateway</strong>.
                </p>
                <p className="mt-0.5">
                  Bags House • Registro interno de faturamento e conferência de estoque têxtil.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
