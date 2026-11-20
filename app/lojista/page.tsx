'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { OrderRecord, KanbanOrderStage } from '@/lib/cart-context';

const KANBAN_COLUMNS: {
  id: KanbanOrderStage;
  title: string;
  subtitle: string;
  icon: string;
  badgeClass: string;
  borderClass: string;
  headerBgClass: string;
}[] = [
    {
      id: 'pedido',
      title: 'Pedido',
      subtitle: 'Novos pedidos recebidos',
      icon: '📥',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      borderClass: 'border-amber-500/30',
      headerBgClass: 'bg-amber-950/30',
    },
    {
      id: 'em_producao',
      title: 'Em Produção',
      subtitle: 'Corte, costura e personalização',
      icon: '🧵',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      borderClass: 'border-sky-500/30',
      headerBgClass: 'bg-sky-950/30',
    },
    {
      id: 'finalizado',
      title: 'Finalizado',
      subtitle: 'Pronto e conferido p/ envio',
      icon: '✨',
      badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      borderClass: 'border-violet-500/30',
      headerBgClass: 'bg-violet-950/30',
    },
    {
      id: 'enviado',
      title: 'Enviado',
      subtitle: 'Despachado para o cliente',
      icon: '🚚',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      borderClass: 'border-emerald-500/30',
      headerBgClass: 'bg-emerald-950/30',
    },
  ];

export default function LojistaPortalPage() {
  const { products, isLoaded } = useProducts();

  // Navegação Principal do Lojista: Catálogo vs Faturamento vs Kanban de Pedidos
  const [activeMainTab, setActiveMainTab] = useState<'catalogo' | 'faturamento' | 'kanban'>('catalogo');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderRecord | null>(null);
  const [inspectedCustomOrder, setInspectedCustomOrder] = useState<{
    order: OrderRecord;
    itemIndex: number;
  } | null>(null);
  const [inspectorShowGuides, setInspectorShowGuides] = useState<boolean>(true);
  const [inspectorZoom, setInspectorZoom] = useState<boolean>(false);
  const [inspectorLogoBg, setInspectorLogoBg] = useState<'checker' | 'dark' | 'white'>('white');
  const [inspectorLogoError, setInspectorLogoError] = useState<boolean>(false);
  const inspectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [faturamentoFilter, setFaturamentoFilter] = useState<'all' | 'aprovado' | 'pendente'>('all');
  const [faturamentoSearch, setFaturamentoSearch] = useState('');
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanOrderStage | null>(null);

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
          kanbanStatus: 'pedido',
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

  const getOrderKanbanStage = (ord: OrderRecord): KanbanOrderStage => {
    if (
      ord.kanbanStatus === 'pedido' ||
      ord.kanbanStatus === 'em_producao' ||
      ord.kanbanStatus === 'finalizado' ||
      ord.kanbanStatus === 'enviado'
    ) {
      return ord.kanbanStatus;
    }
    return 'pedido';
  };

  // Traduz coordenadas (X, Y) do Canvas 600x600 para o nome legível do local na bolsa
  const describeBagPosition = (pos?: { x: number; y: number }, fallback = { x: 300, y: 365 }) => {
    const p = pos && typeof pos.x === 'number' && typeof pos.y === 'number' ? pos : fallback;
    let region = 'Centro';
    if (p.x < 245 && p.y > 395) region = 'Canto Inferior Esquerdo';
    else if (p.x > 355 && p.y > 395) region = 'Canto Inferior Direito';
    else if (p.x < 245 && p.y < 275) region = 'Canto Superior Esquerdo';
    else if (p.x > 355 && p.y < 275) region = 'Canto Superior Direito';
    else if (p.x < 245) region = 'Lado Esquerdo';
    else if (p.x > 355) region = 'Lado Direito';
    else if (p.y < 275) region = 'Parte Superior';
    else if (p.y > 400) region = 'Parte Inferior';
    return `${region} (X: ${p.x}, Y: ${p.y})`;
  };

  // Permite anexar ou atualizar a logo de um item de pedido existente direto na Ficha Técnica
  // Permite anexar ou restaurar a logo (convertida e otimizada para PNG Base64 permanente)
  const handleAttachOrderLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inspectedCustomOrder) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const rawDataUrl = ev.target?.result as string;
      if (!rawDataUrl) return;

      const { order, itemIndex } = inspectedCustomOrder;
      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o.id !== order.id) return o;
          const newItems = o.items.map((it, idx) => {
            if (idx !== itemIndex) return it;
            return {
              ...it,
              isCustomized: true,
              customization: {
                ...it.customization,
                artworkPreviewUrl: dataUrl,
                artworkName: file.name,
                artworkSize: it.customization?.artworkSize || 110,
                artworkPosition: it.customization?.artworkPosition || { x: 300, y: 245 },
                artworkBlendMultiply: it.customization?.artworkBlendMultiply ?? true,
              },
            };
            const saveLogoDataUrl = (finalDataUrl: string) => {
              const { order, itemIndex } = inspectedCustomOrder;
              setInspectorLogoError(false);
              setOrders((prev) => {
                const updated = prev.map((o) => {
                  if (o.id !== order.id) return o;
                  const newItems = o.items.map((it, idx) => {
                    if (idx !== itemIndex) return it;
                    return {
                      ...it,
                      isCustomized: true,
                      customization: {
                        ...it.customization,
                        artworkPreviewUrl: finalDataUrl,
                        artworkName: file.name,
                        artworkSize: it.customization?.artworkSize || 110,
                        artworkPosition: it.customization?.artworkPosition || { x: 300, y: 245 },
                        artworkBlendMultiply: it.customization?.artworkBlendMultiply ?? true,
                      },
                    };
                  });
                  const updatedOrder = { ...o, items: newItems };
                  setInspectedCustomOrder({ order: updatedOrder, itemIndex });
                  return updatedOrder;
                });
                const updatedOrder = { ...o, items: newItems };
                setInspectedCustomOrder({ order: updatedOrder, itemIndex });
                return updatedOrder;
                try {
                  localStorage.setItem('bagshouse_orders_history_v1', JSON.stringify(updated));
                  window.dispatchEvent(new Event('bagshouse_order_updated'));
                } catch (err) {
                  console.error('Erro ao salvar logo no pedido:', err);
                }
                return updated;
              });
              showToast('Logo vinculada ao pedido para visualização e download!');
            };

            const img = new Image();
            img.onload = () => {
              try {
                localStorage.setItem('bagshouse_orders_history_v1', JSON.stringify(updated));
                window.dispatchEvent(new Event('bagshouse_order_updated'));
              } catch (err) {
                console.error('Erro ao salvar logo no pedido:', err);
              }
              return updated;
            });
          showToast('Logo anexada ao pedido com sucesso!');
          const maxDim = 500;
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const off = document.createElement('canvas');
          off.width = w;
          off.height = h;
          const octx = off.getContext('2d');
          if (octx) {
            octx.clearRect(0, 0, w, h);
            octx.drawImage(img, 0, 0, w, h);
            saveLogoDataUrl(off.toDataURL('image/png'));
            return;
          }
        } catch { }
        saveLogoDataUrl(rawDataUrl);
      };
      img.onerror = () => saveLogoDataUrl(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Renderiza em tempo real a bolsa personalizada no modal de Ficha Técnica (600x600)
  // Download seguro via Blob em memória (evita erro "Check internet connection" no Chrome)
  const handleDownloadDataUrl = async (dataUrl: string, fileName: string) => {
    try {
      if (!dataUrl || dataUrl.startsWith('blob:')) {
        showToast('A imagem deste pedido antigo expirou. Selecione o arquivo abaixo para restaurá-la.');
        return;
      }

      if (dataUrl.startsWith('data:')) {
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        showToast(`Download de "${fileName}" concluído!`);
        return;
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      showToast(`Download de "${fileName}" concluído!`);
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
      showToast('Não foi possível baixar a imagem.');
    }
  };

  // Baixar imagem completa do gabarito da bolsa personalizada (600x600)
  const handleDownloadCanvasMockup = (orderNumber: string) => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `gabarito-bolsa-${orderNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        showToast('Gabarito visual da bolsa baixado com sucesso!');
      }, 'image/png');
    } catch {
      showToast('Use o botão de imprimir ou visualizar para salvar o gabarito.');
    }
  };

  // Renderiza em tempo real a bolsa personalizada no modal de Visualização do Produtor (600x600)
  useEffect(() => {
    if (!inspectedCustomOrder) return;
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const item = inspectedCustomOrder.order.items[inspectedCustomOrder.itemIndex];
    if (!item) return;
    const cust = item.customization || {};

    const width = 600;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        if (!src.startsWith('data:') && !src.startsWith('blob:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => {
          if (img.crossOrigin) {
            const fb = new Image();
            fb.onload = () => resolve(fb);
            fb.onerror = () => reject(new Error('Falha ao carregar imagem'));
            fb.src = src;
            return;
          }
          reject(new Error('Falha ao carregar imagem'));
        };
        img.src = src;
      });

    (async () => {
      // 1. Imagem base da bolsa
      const baseSrc = item.imageUrl || '/logo.png';
      try {
        const baseImg = await loadImg(baseSrc);
        const padding = 55;
        const maxW = width - padding * 2;
        const maxH = height - padding * 2;
        const scale = Math.min(maxW / baseImg.width, maxH / baseImg.height);
        const drawW = baseImg.width * scale;
        const drawH = baseImg.height * scale;
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      } catch { }

      // 2. Desenhar Logo / Arte na posição e tamanho salvos
      // 2. Desenhar Logo / Arte na posição e tamanho salvos (ou demarcador técnico se a logo for de um pedido antigo expirado)
      const artUrl = cust.artworkPreviewUrl;
      const artSize = cust.artworkSize || 110;
      const artPos = cust.artworkPosition || { x: 300, y: 245 };
      const blendMultiply = cust.artworkBlendMultiply ?? true;
      const hasLogoMetadata = Boolean(artUrl || cust.artworkName || cust.artworkSize);

      if (artUrl) {
        let logoDrawn = false;
        if (artUrl && !artUrl.startsWith('blob:')) {
          try {
            const artImg = await loadImg(artUrl);
            const aspect = artImg.width > 0 && artImg.height > 0 ? artImg.height / artImg.width : 1;
            const drawW = artSize;
            const drawH = Math.round(artSize * aspect);
            const drawX = Math.round(artPos.x - drawW / 2);
            const drawY = Math.round(artPos.y - drawH / 2);

            if (inspectorShowGuides) {
              ctx.save();
              ctx.strokeStyle = '#d97706';
              ctx.setLineDash([5, 5]);
              ctx.lineWidth = 2;
              ctx.strokeRect(drawX - 8, drawY - 8, drawW + 16, drawH + 16);
              ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
              ctx.fillRect(drawX - 8, drawY - 8, drawW + 16, drawH + 16);

              const label = `LOGO: ${artSize}px (X:${artPos.x}, Y:${artPos.y})`;
              ctx.font = 'bold 10px sans-serif';
              const bw = Math.max(ctx.measureText(label).width + 14, 120);
              const bh = 18;
              const bx = Math.round(artPos.x - bw / 2);
              ctx.setLineDash([]);
              ctx.fillStyle = '#d97706';
              ctx.fillRect(bx, drawY - 8 - bh - 2, bw, bh);
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, bx + bw / 2, drawY - 8 - bh / 2 - 2);
              ctx.restore();
            }

            ctx.save();
            if (blendMultiply) {
              ctx.globalCompositeOperation = 'multiply';
            } else {
              ctx.shadowColor = 'rgba(0,0,0,0.22)';
              ctx.shadowBlur = 5;
            }
            ctx.drawImage(artImg, drawX, drawY, drawW, drawH);
            ctx.restore();
            logoDrawn = true;
          } catch { }
        }

        // Se o pedido tinha logo demarcada mas o link blob antigo expirou, desenha o gabarito de posição e tamanho da Logo na bolsa!
        if (!logoDrawn && hasLogoMetadata && inspectorShowGuides) {
          const drawW = artSize;
          const drawH = Math.round(artSize * 0.85);
          const drawX = Math.round(artPos.x - drawW / 2);
          const drawY = Math.round(artPos.y - drawH / 2);
          ctx.save();
          ctx.strokeStyle = '#d97706';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, drawY, drawW, drawH);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
          ctx.fillRect(drawX, drawY, drawW, drawH);

          const label = `LOCAL DA LOGO: ${artSize}px (X:${artPos.x}, Y:${artPos.y})`;
          ctx.font = 'bold 10px sans-serif';
          const bw = Math.max(ctx.measureText(label).width + 14, 130);
          const bh = 18;
          const bx = Math.round(artPos.x - bw / 2);
          ctx.setLineDash([]);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(bx, drawY - bh - 2, bw, bh);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, bx + bw / 2, drawY - bh / 2 - 2);

          ctx.fillStyle = '#b45309';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('🖼️ ÁREA DA LOGO', artPos.x, artPos.y - 6);
          ctx.font = '10px sans-serif';
          ctx.fillText(`(${artSize}px)`, artPos.x, artPos.y + 10);
          ctx.restore();
        }

        // 3. Desenhar Texto Personalizado na posição e tamanho salvos
        const txt = cust.customText?.trim();
        const fontName = cust.fontName || 'Playfair Display';
        const fSize = cust.fontSize || 34;
        const tColor = cust.textColor || '#D4AF37';
        const txtPos = cust.textPosition || { x: 300, y: 365 };

        if (txt) {
          ctx.save();
          ctx.font = `${fSize}px "${fontName}", serif`;
          const metrics = ctx.measureText(txt);
          const tw = Math.ceil(metrics.width);
          const th = Math.ceil(fSize * 1.15);
          const boxW = Math.max(tw + 28, 90);
          const boxH = th + 20;
          const boxX = Math.round(txtPos.x - boxW / 2);
          const boxY = Math.round(txtPos.y - boxH / 2);

          if (inspectorShowGuides) {
            ctx.save();
            ctx.strokeStyle = '#4f46e5';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
            ctx.fillRect(boxX, boxY, boxW, boxH);

            const label = `TEXTO: ${fSize}px (X:${txtPos.x}, Y:${txtPos.y})`;
            ctx.font = 'bold 10px sans-serif';
            const bw = Math.max(ctx.measureText(label).width + 14, 120);
            const bh = 18;
            const bx = Math.round(txtPos.x - bw / 2);
            ctx.setLineDash([]);
            ctx.fillStyle = '#4f46e5';
            ctx.fillRect(bx, boxY - bh - 2, bw, bh);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, bx + bw / 2, boxY - bh / 2 - 2);
            ctx.restore();
          }

          ctx.font = `${fSize}px "${fontName}", serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
          ctx.shadowOffsetX = 1.5;
          ctx.shadowOffsetY = 1.8;
          ctx.shadowBlur = 3;
          ctx.fillStyle = tColor;
          ctx.fillText(txt, txtPos.x, txtPos.y);

          ctx.shadowColor = 'transparent';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
          ctx.fillText(txt, txtPos.x - 0.5, txtPos.y - 0.6);
          ctx.restore();
        }
      })();
  }, [inspectedCustomOrder, inspectorShowGuides]);

  const handleUpdateKanbanStage = (orderId: string, newStage: KanbanOrderStage) => {
    const stageLabels: Record<KanbanOrderStage, string> = {
      pedido: 'Pedido',
      em_producao: 'Em Produção',
      finalizado: 'Finalizado',
      enviado: 'Enviado',
    };

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId ? { ...o, kanbanStatus: newStage } : o
      );
      try {
        localStorage.setItem('bagshouse_orders_history_v1', JSON.stringify(updated));
        window.dispatchEvent(new Event('bagshouse_order_updated'));
      } catch (e) {
        console.error('Erro ao salvar status do Kanban:', e);
      }
      return updated;
    });

    const targetOrder = orders.find((o) => o.id === orderId);
    showToast(
      `Pedido ${targetOrder?.orderNumber || ''} movido para "${stageLabels[newStage]}"!`
    );
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

        {/* NAVEGAÇÃO DE ABAS PRINCIPAIS: ESTOQUE vs FATURAMENTO vs KANBAN DE PEDIDOS */}
        <div className="mx-auto flex max-w-7xl flex-wrap px-6 gap-2 border-t border-slate-800/60 pt-2 pb-0">
          <button
            onClick={() => setActiveMainTab('catalogo')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${activeMainTab === 'catalogo'
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
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${activeMainTab === 'faturamento'
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

          <button
            onClick={() => setActiveMainTab('kanban')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${activeMainTab === 'kanban'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <span>📋</span>
            <span>Pedidos Realizados (Kanban)</span>
            <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-extrabold">
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
                    className={`rounded-lg px-3 py-1.5 transition-all ${stockStatusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    onClick={() => setStockStatusFilter('discount')}
                    className={`rounded-lg px-3 py-1.5 transition-all flex items-center gap-1 ${stockStatusFilter === 'discount' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <span>🏷️ Com Desconto</span>
                    <span className="rounded-full bg-black/30 px-1.5 text-[10px]">
                      {discountedItemsCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setStockStatusFilter('in_stock')}
                    className={`rounded-lg px-3 py-1.5 transition-all ${stockStatusFilter === 'in_stock' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Em Estoque
                  </button>
                  <button
                    onClick={() => setStockStatusFilter('out')}
                    className={`rounded-lg px-3 py-1.5 transition-all ${stockStatusFilter === 'out' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
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
                                    className="w-16 rounded-lg border border-amber-500/40 bg-slate-950 px-1 py-1 text-center text-xs font-black text-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-colors ${currentDiscount === 0
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
                                className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-sm font-black text-white focus:border-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
        ) : activeMainTab === 'faturamento' ? (
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
                    className={`rounded-lg px-3 py-1 font-bold transition-all ${faturamentoFilter === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Todos ({orders.length})
                  </button>
                  <button
                    onClick={() => setFaturamentoFilter('aprovado')}
                    className={`rounded-lg px-3 py-1 font-bold transition-all ${faturamentoFilter === 'aprovado'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                  >
                    ✓ Aprovados ({approvedOrders.length})
                  </button>
                  <button
                    onClick={() => setFaturamentoFilter('pendente')}
                    className={`rounded-lg px-3 py-1 font-bold transition-all ${faturamentoFilter === 'pendente'
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
        ) : (
          /* ABA DE PEDIDOS EM FORMATO KANBAN (PEDIDO, EM PRODUÇÃO, FINALIZADO, ENVIADO) */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* CABEÇALHO DO KANBAN */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-black text-base border border-amber-500/30">
                    📋
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Quadro Kanban de Pedidos & Produção
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhe e mova os pedidos realizados entre as etapas: <strong>Pedido</strong>, <strong>Em Produção</strong>, <strong>Finalizado</strong> e <strong>Enviado</strong>. Arraste os cartões ou use os botões de avanço rápido.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Busca no Kanban */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar pedido, cliente ou bolsa..."
                    value={kanbanSearch}
                    onChange={(e) => setKanbanSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-8 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
                  {kanbanSearch && (
                    <button
                      onClick={() => setKanbanSearch('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={loadOrders}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all shadow-sm"
                  title="Sincronizar pedidos"
                >
                  <span>🔄</span>
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* RESUMO RÁPIDO DAS 4 PARTIÇÕES */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {KANBAN_COLUMNS.map((col) => {
                const count = orders.filter((o) => getOrderKanbanStage(o) === col.id).length;
                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border ${col.borderClass} bg-slate-900/60 p-4 flex items-center justify-between shadow-sm`}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {col.title}
                      </span>
                      <span className="text-2xl font-black text-white mt-0.5 block">{count}</span>
                    </div>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${col.badgeClass}`}>
                      {col.icon}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* GRID KANBAN COM AS 4 PARTIÇÕES: PEDIDO | EM PRODUÇÃO | FINALIZADO | ENVIADO */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 items-start">
              {KANBAN_COLUMNS.map((col, colIndex) => {
                const colOrders = orders.filter((ord) => {
                  const stageMatches = getOrderKanbanStage(ord) === col.id;
                  if (!stageMatches) return false;
                  if (!kanbanSearch.trim()) return true;
                  const q = kanbanSearch.toLowerCase();
                  const matchOrder = ord.orderNumber.toLowerCase().includes(q);
                  const matchCustomer =
                    ord.customerName.toLowerCase().includes(q) ||
                    ord.customerEmail.toLowerCase().includes(q);
                  const matchProduct = ord.items.some(
                    (it) =>
                      it.productTitle.toLowerCase().includes(q) ||
                      (it.customization?.customText &&
                        it.customization.customText.toLowerCase().includes(q))
                  );
                  return matchOrder || matchCustomer || matchProduct;
                });

                const prevStage = colIndex > 0 ? KANBAN_COLUMNS[colIndex - 1].id : null;
                const nextStage =
                  colIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIndex + 1].id : null;
                const isDragOver = dragOverColumn === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverColumn !== col.id) setDragOverColumn(col.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverColumn === col.id) setDragOverColumn(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverColumn(null);
                      const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
                      if (orderId) {
                        handleUpdateKanbanStage(orderId, col.id);
                      }
                      setDraggedOrderId(null);
                    }}
                    className={`flex flex-col rounded-2xl border transition-all min-h-[540px] max-h-[82vh] ${isDragOver
                        ? 'border-amber-400 bg-slate-800/80 ring-2 ring-amber-400/30'
                        : 'border-slate-800 bg-slate-900/50'
                      } shadow-xl overflow-hidden`}
                  >
                    {/* CABEÇALHO DA COLUNA KANBAN */}
                    <div className={`border-b border-slate-800 p-4 ${col.headerBgClass}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{col.icon}</span>
                          <h3 className="text-sm font-black uppercase tracking-wider text-white">
                            {col.title}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-black ${col.badgeClass}`}
                        >
                          {colOrders.length}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{col.subtitle}</p>
                    </div>

                    {/* LISTA DE CARTÕES DA COLUNA */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {colOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-slate-800/80 p-4 text-center text-slate-500">
                          <span className="text-2xl opacity-50 mb-1">{col.icon}</span>
                          <span className="text-xs font-semibold text-slate-400">
                            Nenhum pedido em &ldquo;{col.title}&rdquo;
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Arraste um pedido para cá ou altere o status no cartão.
                          </span>
                        </div>
                      ) : (
                        colOrders.map((ord) => {
                          const isPaid = ord.status === 'aprovado';
                          const dateStr = new Date(ord.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <div
                              key={ord.id}
                              draggable
                              onDragStart={(e) => {
                                setDraggedOrderId(ord.id);
                                e.dataTransfer.setData('text/plain', ord.id);
                              }}
                              onDragEnd={() => {
                                setDraggedOrderId(null);
                                setDragOverColumn(null);
                              }}
                              className={`group rounded-2xl border border-slate-700/80 bg-slate-900 p-3.5 shadow-md transition-all hover:border-slate-500 cursor-grab active:cursor-grabbing ${draggedOrderId === ord.id ? 'opacity-50 scale-95' : ''
                                }`}
                            >
                              {/* TOPO DO CARTÃO: NÚMERO DO PEDIDO + DATA + STATUS PAGAMENTO */}
                              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                                <div>
                                  <span className="font-mono text-xs font-black text-white block">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    🕒 {dateStr}
                                  </span>
                                </div>

                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Pago
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Aguardando
                                  </span>
                                )}
                              </div>

                              {/* DADOS DO CLIENTE E ENTREGA */}
                              <div className="mt-2.5 text-xs">
                                <div className="font-bold text-slate-100 truncate">
                                  👤 {ord.customerName}
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                                  <span>{ord.customerPhone || ord.customerEmail}</span>
                                  {ord.shippingAddress?.city && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      📍 {ord.shippingAddress.city}/{ord.shippingAddress.state}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* LISTA DE PRODUTOS DO PEDIDO */}
                              <div className="mt-3 space-y-2">
                                {ord.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col gap-2 rounded-xl bg-slate-950/80 border border-slate-800/90 p-2.5"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInspectedCustomOrder({ order: ord, itemIndex: idx })
                                        }
                                        className="relative group/thumb h-12 w-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0 focus:outline-none"
                                        title="Clique para abrir a bolsa personalizada em tamanho grande"
                                      >
                                        <img
                                          src={
                                            item.customization?.previewSnapshotUrl ||
                                            item.imageUrl ||
                                            '/logo.png'
                                          }
                                          alt={item.productTitle}
                                          className="h-full w-full object-cover"
                                        />
                                        <span className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-[10px] font-bold text-amber-300 transition-opacity">
                                          🔍
                                        </span>
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                                          <span className="text-amber-400 mr-1">{item.quantity}x</span>
                                          {item.productTitle}
                                        </div>

                                        {item.isCustomized && item.customization && (
                                          <div className="mt-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-[10px] text-amber-300 space-y-0.5">
                                            {item.customization.customText && (
                                              <div className="font-bold truncate">
                                                ✍️ &ldquo;{item.customization.customText}&rdquo;{' '}
                                                <span className="text-amber-400/80 font-normal">
                                                  ({item.customization.fontSize || 34}px)
                                                </span>
                                              </div>
                                            )}
                                            {item.customization.fontName && (
                                              <div className="text-[9px] text-slate-300 truncate">
                                                Fonte: {item.customization.fontName}
                                              </div>
                                            )}
                                            {item.customization.artworkPreviewUrl ? (
                                              <div className="text-[9px] text-emerald-300 font-bold truncate">
                                                🖼️ Logo: {item.customization.artworkSize || 110}px •{' '}
                                                {describeBagPosition(
                                                  item.customization.artworkPosition,
                                                  { x: 300, y: 245 }
                                                )}
                                              </div>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Botão direto para abrir a Bolsa Personalizada com posições e tamanhos */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInspectedCustomOrder({ order: ord, itemIndex: idx })
                                      }
                                      className="w-full rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 py-1.5 px-2.5 text-[10px] font-extrabold text-indigo-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <span>🔍 Abrir Bolsa Personalizada (Posições e Tamanhos)</span>
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* VALOR TOTAL E BOTÃO DO COMPROVANTE */}
                              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Total do Pedido</span>
                                  <span className="font-mono text-sm font-black text-emerald-400">
                                    R$ {ord.totalAmount.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setReceiptModalOrder(ord)}
                                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                                  title="Ver detalhes completos e comprovante"
                                >
                                  📄 Detalhes
                                </button>
                              </div>

                              {/* CONTROLES DE TRANSIÇÃO DE ETAPA DO KANBAN */}
                              <div className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                                <button
                                  type="button"
                                  disabled={!prevStage}
                                  onClick={() => prevStage && handleUpdateKanbanStage(ord.id, prevStage)}
                                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                  title="Voltar etapa anterior"
                                >
                                  &larr;
                                </button>

                                <select
                                  value={getOrderKanbanStage(ord)}
                                  onChange={(e) =>
                                    handleUpdateKanbanStage(ord.id, e.target.value as KanbanOrderStage)
                                  }
                                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-bold text-white focus:border-amber-400 focus:outline-none cursor-pointer text-center"
                                >
                                  <option value="pedido">📥 Pedido</option>
                                  <option value="em_producao">🧵 Em Produção</option>
                                  <option value="finalizado">✨ Finalizado</option>
                                  <option value="enviado">🚚 Enviado</option>
                                </select>

                                <button
                                  type="button"
                                  disabled={!nextStage}
                                  onClick={() => nextStage && handleUpdateKanbanStage(ord.id, nextStage)}
                                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-black text-amber-300 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                  title="Avançar para próxima etapa"
                                >
                                  Avançar &rarr;
                                </button>
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${modalDiscountValue === pct
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
                  className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${photoEditMode === 'file'
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
                  className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${photoEditMode === 'url'
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
                    className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${imageInputMode === 'file'
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
                    className={`flex-1 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 ${imageInputMode === 'url'
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

      {/* ===================================================================== */}
      {/* MODAL: FICHA TÉCNICA E VISUALIZADOR DA BOLSA PERSONALIZADA (600x600) */}
      {/* MODAL EXCLUSIVO DO PRODUTOR: VISUALIZAÇÃO SOMENTE LEITURA (SEM EDIÇÃO) */}
      {/* ===================================================================== */}
      {inspectedCustomOrder && (() => {
        const { order, itemIndex } = inspectedCustomOrder;
        const item = order.items[itemIndex] || order.items[0];
        if (!item) return null;
        const cust = item.customization || {};
        const txtPosLabel = describeBagPosition(cust.textPosition, { x: 300, y: 365 });
        const artPosLabel = describeBagPosition(cust.artworkPosition, { x: 300, y: 245 });
        const isExpiredOrInvalidLogo =
          !cust.artworkPreviewUrl ||
          cust.artworkPreviewUrl.startsWith('blob:') ||
          inspectorLogoError;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto overscroll-contain">
                  <div className="relative w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100 my-6">
                    {/* Cabeçalho Exclusivo de Produção (Somente Leitura) */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                          🧵 Ficha Técnica de Produção • Pedido #{order.orderNumber}
                        </span>
                        <h2 className="mt-1 text-lg sm:text-xl font-black text-white">
                          {item.productTitle} ({item.quantity} un)
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                              🧵 Gabarito Oficial do Produtor • Pedido #{order.orderNumber}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                              🔒 Somente Visualização (Bloqueado contra Alterações)
                            </span>
                          </div>
                          <h2 className="mt-1.5 text-lg sm:text-2xl font-black text-white">
                            {item.productTitle} — {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                          </h2>
                          <p className="text-xs text-slate-400">
                            Cliente: <strong className="text-slate-200">{order.customerName}</strong> • Posicionamento e tamanhos exatos escolhidos pelo comprador
                            Cliente: <strong className="text-slate-200">{order.customerName}</strong> • Visualização fiel de como a peça deve ficar na produção
                          </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectedCustomOrder(null)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadCanvasMockup(order.orderNumber)}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 transition-colors flex items-center gap-1.5 shadow-md"
                          title="Baixar a imagem completa da bolsa com o gabarito de produção"
                        >
                          <span>⬇️ Baixar Imagem da Bolsa Pronta</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedCustomOrder(null);
                            setInspectorZoom(false);
                            setInspectorLogoError(false);
                          }}
                          className="rounded-xl bg-slate-800 p-2.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                          aria-label="Fechar visualizador"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Corpo: Canvas da Bolsa Personalizada (Esquerda) + Medidas e Posições (Direita) */}
                    {/* Corpo: Campo de Visualização da Bolsa (Esquerda) + Campo de Visualização da Logo e Medidas (Direita) */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Visor 600x600 da Bolsa Já Personalizada */}
                      {/* COLUNA ESQUERDA: CAMPO DE VISUALIZAÇÃO DA BOLSA PRONTA (600x600) */}
                      <div className="lg:col-span-6 flex flex-col items-center">
                        <div className="relative w-full aspect-square max-w-[420px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl">
                          {/* Seletor de Modo do Visor: Como Deve Ficar vs Gabarito com Medidas */}
                          <div className="w-full max-w-[440px] mb-3 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setInspectorShowGuides(false)}
                              className={`rounded-lg py-2 px-2.5 text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${!inspectorShowGuides
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              <span>👜 Como Deve Ficar (Limpo)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectorShowGuides(true)}
                              className={`rounded-lg py-2 px-2.5 text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${inspectorShowGuides
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              <span>📐 Gabarito (Posições/Medidas)</span>
                            </button>
                          </div>

                          {/* Tela de Visualização Somente Leitura */}
                          <div className="relative w-full aspect-square max-w-[440px] rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl">
                            <canvas
                              ref={inspectorCanvasRef}
                              width={600}
                              height={600}
                              className="h-full w-full object-contain block"
                              className={`h-full w-full object-contain block transition-transform duration-300 ${inspectorZoom ? 'scale-125' : 'scale-100'
                                }`}
                            />

                            {/* Botão de Zoom / Lupa para o Produtor */}
                            <button
                              type="button"
                              onClick={() => setInspectorShowGuides((g) => !g)}
                              className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-md border transition-colors ${inspectorShowGuides
                                  ? 'bg-indigo-600 text-white border-indigo-400'
                                  : 'bg-white/90 text-slate-900 border-slate-300'
                                }`}
                              onClick={() => setInspectorZoom((z) => !z)}
                              className="absolute bottom-3 right-3 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 px-3 py-1.5 text-[11px] font-bold shadow-lg transition-colors"
                            >
                              {inspectorShowGuides
                                ? '📐 Ocultar Caixas de Medida'
                                : '📐 Mostrar Caixas de Posição e Tamanho'}
                              {inspectorZoom ? '🔍 Reduzir Zoom (1x)' : '🔍 Ampliar Detalhes (1.25x)'}
                            </button>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-400 text-center">
                            As caixas tracejadas indicam o local exato e o tamanho em pixels do Texto (azul) e da Logo (dourado).

                            <p className="mt-2.5 text-[11px] text-slate-400 text-center max-w-md">
                              🔒 <strong>Visualização protegida:</strong> Nenhuma alteração pode ser feita nesta tela para garantir fidelidade total ao pedido original do cliente.
                            </p>
                        </div>

                        {/* Especificações Detalhadas de Posição e Tamanho */}
                        {/* COLUNA DIREITA: CAMPO ESPECÍFICO DE VISUALIZAÇÃO DA LOGO + MEDIDAS DO TEXTO */}
                        <div className="lg:col-span-6 space-y-4">
                          {/* 1. DADOS E POSIÇÃO DO TEXTO */}
                          {/* 1. CAMPO ESPECÍFICO DE VISUALIZAÇÃO AMPLIADA DA LOGO / ARTE */}
                          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/15 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                <span>🖼️ Campo de Visualização da Logo / Arte</span>
                              </span>
                              <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-black text-amber-200 border border-amber-500/30">
                                Tamanho: {cust.artworkSize || 110}px
                              </span>
                            </div>

                            {/* Posição Exata da Logo na Bolsa */}
                            <div className="grid grid-cols-2 gap-2.5 text-xs">
                              <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Local da Logo na Bolsa:</span>
                                <span className="font-bold text-emerald-300">{artPosLabel}</span>
                              </div>
                              <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Medida / Largura da Logo:</span>
                                <span className="font-mono font-black text-amber-300 text-sm">
                                  {cust.artworkSize || 110}px
                                </span>
                              </div>
                            </div>

                            {!isExpiredOrInvalidLogo ? (
                              <div className="space-y-2.5">
                                {/* Visor Dedicado da Logo Isolada para o Produtor */}
                                <div className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-700 p-4 min-h-[160px]"
                                  style={{
                                    backgroundColor:
                                      inspectorLogoBg === 'white'
                                        ? '#ffffff'
                                        : inspectorLogoBg === 'dark'
                                          ? '#0f172a'
                                          : '#e2e8f0',
                                  }}
                                >
                                  {/* Alternador de contraste de fundo para enxergar logos brancas ou escuras */}
                                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-slate-900/85 p-1 text-[10px] font-bold text-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => setInspectorLogoBg('white')}
                                      className={`px-2 py-0.5 rounded ${inspectorLogoBg === 'white' ? 'bg-amber-500 text-slate-950' : ''
                                        }`}
                                    >
                                      Fundo Claro
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setInspectorLogoBg('dark')}
                                      className={`px-2 py-0.5 rounded ${inspectorLogoBg === 'dark' ? 'bg-amber-500 text-slate-950' : ''
                                        }`}
                                    >
                                      Fundo Escuro
                                    </button>
                                  </div>

                                  <img
                                    src={cust.artworkPreviewUrl}
                                    alt="Visualização ampliada da Logo do cliente"
                                    onError={() => setInspectorLogoError(true)}
                                    className="max-h-36 max-w-full object-contain rounded-lg"
                                  />
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-slate-400 truncate">
                                    Arquivo: <strong className="text-slate-200">{cust.artworkName || 'logo-cliente.png'}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownloadDataUrl(
                                        cust.artworkPreviewUrl!,
                                        cust.artworkName || `logo-${order.orderNumber}.png`
                                      )
                                    }
                                    className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 text-xs shrink-0 transition-colors shadow-md"
                                  >
                                    ⬇️ Baixar Logo Original
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl bg-slate-900/95 p-3.5 border border-amber-500/30 text-xs text-slate-300 space-y-2.5">
                                <div className="flex items-start gap-2 text-amber-300 font-semibold">
                                  <span>ℹ️</span>
                                  <span>
                                    A posição (<strong>{artPosLabel}</strong>) e o tamanho (<strong>{cust.artworkSize || 110}px</strong>) da logo já estão demarcados no gabarito ao lado!
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  Como este pedido (#{order.orderNumber}) foi criado antes da gravação permanente em Base64, o link temporário da imagem expirou ao fechar a aba anterior. Selecione o arquivo da imagem uma única vez abaixo para fixá-lo no visualizador:
                                </p>
                                <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition-colors shadow-md">
                                  <span>📂 Carregar Arquivo da Logo para Visualização</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={handleAttachOrderLogo}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* 2. ESPECIFICAÇÕES DE POSIÇÃO E TAMANHO DO TEXTO / MONOGRAMA */}
                          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                                🔤 Especificações do Texto / Monograma
                              </span>
                              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-black text-indigo-200 border border-indigo-500/30">
                                <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-black text-indigo-200 border border-indigo-500/30">
                                  Tamanho: {cust.fontSize || 34}px
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs">
                              <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Texto Escrito:</span>
                                <span className="text-[10px] text-slate-400 block">Texto a Bordar / Gravar:</span>
                                <span className="font-black text-white text-sm">
                                  {cust.customText ? `"${cust.customText}"` : 'Sem texto'}
                                </span>
                              </div>
                              <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Fonte Tipográfica:</span>
                                <span className="text-[10px] text-slate-400 block">Fonte Escolhida:</span>
                                <span className="font-bold text-amber-300">
                                  {cust.fontName || 'Playfair Display'}
                                </span>
                              </div>
                              <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Cor do Fio / Gravação:</span>
                                <span className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="inline-block h-3.5 w-3.5 rounded-full border border-white/40"
                                    style={{ backgroundColor: cust.textColor || '#D4AF37' }}
                                  />
                                  {cust.textColorName || cust.textColor || 'Dourado Metálico'}
                                </span>
                              </div>
                              <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Tamanho da Fonte:</span>
                                <span className="font-mono font-black text-indigo-300 text-sm">
                                  {cust.fontSize || 34}px
                                </span>
                              </div>
                            </div>

                            <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800 text-xs">
                              <span className="text-[10px] text-slate-400 block">Local Posicionado na Bolsa:</span>
                              <span className="text-[10px] text-slate-400 block">Local do Texto na Bolsa:</span>
                              <span className="font-bold text-emerald-300">{txtPosLabel}</span>
                            </div>
                          </div>

                          {/* 2. DADOS E POSIÇÃO DA LOGO / IMAGEM */}
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                                🖼️ Especificações da Logo / Imagem
                              </span>
                              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-black text-amber-200 border border-amber-500/30">
                                Tamanho: {cust.artworkSize || 110}px
                              </span>
                            </div>

                            {cust.artworkPreviewUrl ? (
                              <>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                                  <img
                                    src={cust.artworkPreviewUrl}
                                    alt="Logo enviada pelo cliente"
                                    className="h-14 w-14 rounded-lg object-contain bg-white p-1 border border-slate-700 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 text-xs">
                                    <span className="font-bold text-white block truncate">
                                      {cust.artworkName || 'logo-cliente.png'}
                                    </span>
                                    <span className="text-[11px] text-amber-300 block">
                                      Largura aplicada: <strong>{cust.artworkSize || 110}px</strong>
                                    </span>
                                    <span className="text-[11px] text-emerald-300 block">
                                      Posição: <strong>{artPosLabel}</strong>
                                    </span>
                                  </div>
                                  <a
                                    href={cust.artworkPreviewUrl}
                                    download={cust.artworkName || `logo-${order.orderNumber}.png`}
                                    className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-2 text-[11px] shrink-0 transition-colors"
                                  >
                                    ⬇️ Baixar Logo
                                  </a>
                                </div>
                              </>
                            ) : (
                              <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800 text-xs text-slate-300 space-y-2">
                                <p className="text-[11px] text-slate-400">
                                  Este pedido foi salvo antes da gravação automática da logo ou não teve arquivo anexado. Você pode vincular a imagem da logo abaixo para visualizá-la na bolsa:
                                </p>
                                <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-300 transition-colors">
                                  <span>📂 Anexar / Carregar Logo neste Pedido</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={handleAttachOrderLogo}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* 3. AÇÕES RÁPIDAS: ABRIR NO CUSTOMIZADOR INTERATIVO */}
                          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                            <Link
                              href={`/customize/${item.productSlug || 'bolsa-tiracolo-couro'}?orderId=${encodeURIComponent(
                                order.id
                              )}&itemIdx=${itemIndex}`}
                              target="_blank"
                              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 px-4 text-xs font-black uppercase tracking-wider text-white text-center transition-colors shadow-lg shadow-indigo-600/25"
                            >
                              🎨 Abrir Bolsa no Customizador Interativo &rarr;
                            </Link>
                            {/* Botão Fechar (Sem opção de editar no customizador da loja) */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setInspectedCustomOrder(null)}
                                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 px-5 text-xs font-bold text-slate-200 transition-colors"
                                onClick={() => {
                                  setInspectedCustomOrder(null);
                                  setInspectorZoom(false);
                                  setInspectorLogoError(false);
                                }}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 px-5 text-xs font-black uppercase tracking-wider text-white transition-colors"
                              >
                                Fechar
                                Fechar Gabarito de Visualização
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
      })()}

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
