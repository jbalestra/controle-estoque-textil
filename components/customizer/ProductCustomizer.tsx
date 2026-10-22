'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product, Fabric, TransformMatrix } from '@/types/database';
import { OrderItemInput } from '@/lib/validations/order';
import { useCart } from '@/lib/cart-context';

interface ProductCustomizerProps {
  product: Product;
  fabrics?: Fabric[];
  onAddToCart?: (customizedItem: OrderItemInput, previewDataUrl: string) => void;
}

export interface FontOption {
  id: string;
  name: string;
  category: 'luxo' | 'cursiva' | 'moderna' | 'bold';
  categoryLabel: string;
  sample: string;
  family: string;
  description: string;
}

// PRINCIPAIS FONTES UTILIZADAS EM PERSONALIZAÇÃO DE BOLSAS DE LUXO / ESPORTIVAS
export const POPULAR_FONTS: FontOption[] = [
  // 1. Luxo & Serifadas Tradicionais (Estilo Louis Vuitton, Chanel, Monogramas de Alta Costura)
  {
    id: 'Playfair Display',
    name: 'Playfair Display',
    category: 'luxo',
    categoryLabel: 'Serifada Luxo',
    sample: 'Bags House',
    family: '"Playfair Display", serif',
    description: 'Elegante, clássica e tradicional para monogramas',
  },
  {
    id: 'Cinzel',
    name: 'Cinzel Roman',
    category: 'luxo',
    categoryLabel: 'Monograma Real',
    sample: 'EXCLUSIVE',
    family: '"Cinzel", serif',
    description: 'Inspirada em inscrições romanas e joalherias',
  },
  {
    id: 'Cormorant Garamond',
    name: 'Cormorant Garamond',
    category: 'luxo',
    categoryLabel: 'Alta Costura',
    sample: 'Maison Royale',
    family: '"Cormorant Garamond", serif',
    description: 'Linhas finas e acabamento nobre de alfaiataria',
  },

  // 2. Cursivas & Caligrafia Elegante (Estilo Atelier, Nomes Próprios)
  {
    id: 'Great Vibes',
    name: 'Great Vibes',
    category: 'cursiva',
    categoryLabel: 'Cursiva Nobre',
    sample: 'Personalizado',
    family: '"Great Vibes", cursive',
    description: 'Curvas fluidas tradicionais e elegantes',
  },
  {
    id: 'Dancing Script',
    name: 'Dancing Script',
    category: 'cursiva',
    categoryLabel: 'Caligrafia Autêntica',
    sample: 'Meu Estilo',
    family: '"Dancing Script", cursive',
    description: 'Caligrafia viva, expressiva e moderna',
  },
  {
    id: 'Caveat',
    name: 'Caveat Casual',
    category: 'cursiva',
    categoryLabel: 'Manuscrita',
    sample: 'Feito com Amor',
    family: '"Caveat", cursive',
    description: 'Estilo manuscrito despojado e contemporâneo',
  },

  // 3. Modernas & Minimalistas (Estilo Celine, Prada, Nike By You)
  {
    id: 'Montserrat',
    name: 'Montserrat',
    category: 'moderna',
    categoryLabel: 'Geométrica Clean',
    sample: 'URBAN LINE',
    family: '"Montserrat", sans-serif',
    description: 'Minimalista, moderna e perfeitamente legível',
  },
  {
    id: 'Inter',
    name: 'Inter Minimal',
    category: 'moderna',
    categoryLabel: 'Contemporânea',
    sample: 'Minimal Design',
    family: '"Inter", sans-serif',
    description: 'Design escandinavo limpo e atemporal',
  },

  // 4. Bold & Esportiva (Estilo Bolsas de Academia, Mochilas e Streetwear)
  {
    id: 'Oswald',
    name: 'Oswald Bold',
    category: 'bold',
    categoryLabel: 'Industrial Bold',
    sample: 'POWER 2026',
    family: '"Oswald", sans-serif',
    description: 'Letras fortes e condensadas para bolsas esportivas',
  },
  {
    id: 'Bebas Neue',
    name: 'Bebas Neue',
    category: 'bold',
    categoryLabel: 'Esportiva Alta',
    sample: 'STREET EDITION',
    family: '"Bebas Neue", sans-serif',
    description: 'Impactante em maiúsculas para bolsas de viagem e treino',
  },
];

export const THREAD_COLORS = [
  { name: 'Dourado Metálico', hex: '#D4AF37', border: '#B89726' },
  { name: 'Prata Nobre', hex: '#D1D5DB', border: '#9CA3AF' },
  { name: 'Branco Pérola', hex: '#FFFFFF', border: '#E2E8F0' },
  { name: 'Preto Ônix', hex: '#18181B', border: '#27272A' },
  { name: 'Rose Gold', hex: '#B76E79', border: '#9E5B65' },
  { name: 'Azul Marinho', hex: '#1E3A8A', border: '#1E40AF' },
  { name: 'Vermelho Rubi', hex: '#991B1B', border: '#7F1D1D' },
];

export function ProductCustomizer({ product, onAddToCart }: ProductCustomizerProps) {
  const { addItem, openCart, closeCart, openCheckout, totalItems } = useCart();
  const [customQuantity, setCustomQuantity] = useState<number>(1);

  // Estados de customização de texto
  const [customText, setCustomText] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>(POPULAR_FONTS[0].id);
  const [fontCategoryFilter, setFontCategoryFilter] = useState<'all' | 'luxo' | 'cursiva' | 'moderna' | 'bold'>('all');
  const [textColor, setTextColor] = useState<string>(THREAD_COLORS[0].hex);
  const [fontSize, setFontSize] = useState<number>(34);

  // Posição interativa da personalização na bolsa (coordenadas X, Y no Canvas 600x600)
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 300, y: 340 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHoveringBox, setIsHoveringBox] = useState(false);

  // Referência dos limites da área de personalização para hit-test de clique/arraste
  const textBoundsRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 200,
    y: 300,
    width: 200,
    height: 70,
  });

  // Upload de arte / logo
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Feedback de Sucesso
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Referência do Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preço dinâmico com cálculo de desconto (definido pelo lojista)
  const discountPercent = product.discount_percent || 0;
  const basePriceNum = Number(product.base_price) || 0;
  const finalPriceNum = discountPercent > 0
    ? basePriceNum * (1 - discountPercent / 100)
    : basePriceNum;
  const unitPrice = finalPriceNum.toFixed(2);
  const originalPriceFormatted = basePriceNum.toFixed(2);

  // Carregar Google Fonts no documento caso ainda não estejam
  useEffect(() => {
    const linkId = 'google-custom-fonts-bundle';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600&family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Inter:wght@500;700&family=Montserrat:wght@500;700&family=Oswald:wght@500;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Garante que o arraste seja finalizado caso o usuário solte fora do canvas
  useEffect(() => {
    const handleGlobalRelease = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, []);

  // Conversão de coordenadas da tela para o sistema interno 600x600 do Canvas
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = 600 / rect.width;
    const scaleY = 600 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Processamento do Dropzone de Arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido. Envie arquivos PNG, JPG, WEBP ou SVG.');
      return;
    }

    setArtworkFile(file);
    const objectUrl = URL.createObjectURL(file);
    setArtworkPreviewUrl(objectUrl);
  };

  // Renderização limpa e nítida no Canvas HTML5 com área dinâmica proporcional
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // 1. Fundo limpo e suave de estúdio
    ctx.clearRect(0, 0, width, height);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
        img.src = src;
      });
    };

    try {
      // 2. Desenhar a Imagem da Bolsa/Produto no Centro
      if (product.base_mockup_url) {
        try {
          const baseImg = await loadImage(product.base_mockup_url);
          const padding = 55;
          const maxW = width - padding * 2;
          const maxH = height - padding * 2;
          const scale = Math.min(maxW / baseImg.width, maxH / baseImg.height);
          const drawW = baseImg.width * scale;
          const drawH = baseImg.height * scale;
          const drawX = (width - drawW) / 2;
          const drawY = (height - drawH) / 2;

          ctx.save();
          ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 10;
          ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        } catch {
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.strokeRect(100, 100, 400, 400);
          ctx.restore();
        }
      }

      // =========================================================================
      // 3. CÁLCULO DINÂMICO DO TAMANHO DA ÁREA COMPATÍVEL COM O TEXTO DIGITADO
      //    (se for só um nome curto, a área é menor e compacta; se for frase, expande)
      // =========================================================================
      const activeFontObj = POPULAR_FONTS.find((f) => f.id === selectedFont) || POPULAR_FONTS[0];
      const fontName = activeFontObj.id;

      // Medição exata da largura em pixels com a fonte escolhida
      ctx.font = `${fontSize}px "${fontName}", serif`;
      const textToMeasure = customText.trim() ? customText : 'Digite seu texto...';
      const textMetrics = ctx.measureText(textToMeasure);
      const measuredTextWidth = Math.ceil(textMetrics.width);
      const measuredTextHeight = Math.ceil(fontSize * 1.05);

      // Logotipo / Arte opcional
      let artDisplayW = 0;
      let artDisplayH = 0;
      let artVerticalSpacing = 0;
      if (artworkPreviewUrl) {
        artDisplayW = Math.min(130, Math.max(70, measuredTextWidth * 0.75));
        artDisplayH = 50;
        artVerticalSpacing = 10;
      }

      // Padding dinâmico: compacto para nomes ("João") e espaçoso para frases longas
      const isShortName = customText.trim().length > 0 && customText.trim().length <= 6;
      const padX = isShortName ? 14 : 20;
      const padY = 12;

      // Largura e Altura que abraçam estritamente o conteúdo
      const maxInnerWidth = Math.max(measuredTextWidth, artDisplayW);
      const boxWidth = Math.max(maxInnerWidth + padX * 2, isShortName ? 70 : 110);
      const boxHeight = measuredTextHeight + (artworkPreviewUrl ? artDisplayH + artVerticalSpacing : 0) + padY * 2;

      // Coordenadas da caixa centradas na posição escolhida/arrastada
      const boxX = Math.round(textPosition.x - boxWidth / 2);
      const boxY = Math.round(textPosition.y - boxHeight / 2);

      // Armazena bounds na ref para cálculo imediato de clique / arraste
      textBoundsRef.current = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };

      // =========================================================================
      // 4. DESENHO DA ÁREA DE PERSONALIZAÇÃO DINÂMICA
      // =========================================================================
      ctx.save();
      // Glow suave durante o arraste
      ctx.shadowColor = isDragging ? 'rgba(79, 70, 229, 0.45)' : 'rgba(79, 70, 229, 0.2)';
      ctx.shadowBlur = isDragging ? 12 : 5;
      ctx.strokeStyle = isDragging ? '#4338ca' : 'rgba(79, 70, 229, 0.85)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = isDragging ? 2.5 : 1.6;

      // Retângulo dinâmico reduzido/ajustado ao texto
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Fundo sutil para destacar a área editável
      ctx.fillStyle = isDragging ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.04)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Puxadores nos 4 cantos estilo Canva / Illustrator
      const handleSize = 6;
      const drawCornerHandle = (hx: number, hy: number) => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 1.5;
        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        ctx.restore();
      };
      drawCornerHandle(boxX, boxY);
      drawCornerHandle(boxX + boxWidth, boxY);
      drawCornerHandle(boxX, boxY + boxHeight);
      drawCornerHandle(boxX + boxWidth, boxY + boxHeight);

      // Etiqueta superior adaptativa à largura da caixa
      const badgeText = isDragging ? '✥ POSICIONANDO' : '✥ ÁREA DE PERSONALIZAÇÃO';
      ctx.font = 'bold 9px sans-serif';
      const badgeW = Math.min(boxWidth, Math.max(ctx.measureText(badgeText).width + 12, 100));
      const badgeH = 17;

      ctx.fillStyle = isDragging ? '#3730a3' : 'rgba(79, 70, 229, 0.95)';
      ctx.fillRect(boxX, boxY - badgeH, badgeW, badgeH);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, boxX + 4, boxY - badgeH / 2);
      ctx.restore();

      // =========================================================================
      // 5. LOGOTIPO / ARTE DO CLIENTE (SE ANEXADO)
      // =========================================================================
      let textCenterY = textPosition.y;

      if (artworkPreviewUrl) {
        try {
          const artImg = await loadImage(artworkPreviewUrl);
          ctx.save();
          const drawW = Math.min(boxWidth - padX * 2, 110);
          const drawH = (artImg.height / artImg.width) * drawW;
          const drawX = textPosition.x - drawW / 2;
          const drawY = boxY + padY;

          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 4;
          ctx.drawImage(artImg, drawX, drawY, drawW, drawH);
          ctx.restore();

          textCenterY = drawY + drawH + artVerticalSpacing + measuredTextHeight / 2;
        } catch (err) {
          console.error('Erro ao desenhar arte:', err);
        }
      }

      // =========================================================================
      // 6. RENDERIZAÇÃO DO TEXTO COM EFEITO REALISTA
      // =========================================================================
      if (customText.trim()) {
        ctx.save();
        ctx.font = `${fontSize}px "${fontName}", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Sombra de profundidade e contraste
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowOffsetX = 1.5;
        ctx.shadowOffsetY = 1.5;
        ctx.shadowBlur = 3;
        ctx.fillStyle = textColor;
        ctx.fillText(customText, textPosition.x, textCenterY);

        // Realce de acabamento acetinado
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillText(customText, textPosition.x - 0.5, textCenterY - 0.5);
        ctx.restore();
      } else {
        // Texto de orientação
        ctx.save();
        ctx.font = `italic 15px "${fontName}", serif`;
        ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Digite seu texto...', textPosition.x, textCenterY);
        ctx.restore();
      }
    } catch (err) {
      console.error('Erro na renderização do canvas:', err);
    }
  }, [product, artworkPreviewUrl, customText, selectedFont, textColor, fontSize, textPosition, isDragging]);

  useEffect(() => {
    // Aguarda carregar fontes
    document.fonts?.ready?.then(() => {
      renderCanvas();
    });
    renderCanvas();
  }, [renderCanvas]);

  // =========================================================================
  // EVENTOS DE INTERAÇÃO COM O MOUSE / TOUCH PARA ARRASTAR O TEXTO
  // =========================================================================
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const bounds = textBoundsRef.current;
    const hitMargin = 20;

    if (
      coords.x >= bounds.x - hitMargin &&
      coords.x <= bounds.x + bounds.width + hitMargin &&
      coords.y >= bounds.y - 25 &&
      coords.y <= bounds.y + bounds.height + hitMargin
    ) {
      setIsDragging(true);
      setDragOffset({
        x: coords.x - textPosition.x,
        y: coords.y - textPosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const bounds = textBoundsRef.current;
    const hitMargin = 20;

    const isOver =
      coords.x >= bounds.x - hitMargin &&
      coords.x <= bounds.x + bounds.width + hitMargin &&
      coords.y >= bounds.y - 25 &&
      coords.y <= bounds.y + bounds.height + hitMargin;

    setIsHoveringBox(isOver);

    if (!isDragging) return;

    // Mantém a escrita dentro da área visível da bolsa (margens de segurança)
    const newX = Math.round(Math.min(510, Math.max(90, coords.x - dragOffset.x)));
    const newY = Math.round(Math.min(520, Math.max(120, coords.y - dragOffset.y)));
    setTextPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const bounds = textBoundsRef.current;
    const hitMargin = 25;

    if (
      coords.x >= bounds.x - hitMargin &&
      coords.x <= bounds.x + bounds.width + hitMargin &&
      coords.y >= bounds.y - 30 &&
      coords.y <= bounds.y + bounds.height + hitMargin
    ) {
      setIsDragging(true);
      setDragOffset({
        x: coords.x - textPosition.x,
        y: coords.y - textPosition.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getCanvasCoords(e);
    const newX = Math.round(Math.min(510, Math.max(90, coords.x - dragOffset.x)));
    const newY = Math.round(Math.min(520, Math.max(120, coords.y - dragOffset.y)));
    setTextPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleFinalize = () => {
    handleAddToCart();
  };

  const handleAddToCart = () => {
    // Garante que a sacola lateral esteja fechada para exibir apenas o feedback de sucesso
    closeCart();

    const snapshot = canvasRef.current?.toDataURL('image/png') || product.base_mockup_url;
    const numericUnitPrice = parseFloat(String(unitPrice).replace(',', '.')) || product.base_price;

    addItem(
      {
        productId: product.id,
        productTitle: product.title,
        productSlug: product.slug,
        categoryLabel: 'Nécessaires & Bolsas Personalizadas',
        basePrice: product.base_price,
        unitPrice: numericUnitPrice,
        quantity: customQuantity,
        maxStock: product.stock_quantity,
        imageUrl: product.base_mockup_url,
        isCustomized: true,
        customization: {
          customText: customText.trim() || undefined,
          fontName: selectedFont,
          textColor: textColor,
          textColorName: THREAD_COLORS.find((c) => c.hex === textColor)?.name || textColor,
          artworkPreviewUrl: artworkPreviewUrl || undefined,
          previewSnapshotUrl: snapshot,
        },
      },
      false // false = não abre a gaveta da sacola lateral automaticamente
    );

    if (onAddToCart) {
      onAddToCart(
        {
          product_id: product.id,
          quantity: customQuantity,
          custom_text: customText.trim() || undefined,
          font_id: selectedFont,
          text_color: textColor,
          snapshot_url: snapshot,
        },
        snapshot
      );
    }

    setIsSuccessModalOpen(true);
  };

  const handleDirectMercadoPagoCheckout = () => {
    handleAddToCart();
    setIsSuccessModalOpen(false);
    openCheckout();
  };

  // Filtragem de fontes por categoria
  const filteredFonts =
    fontCategoryFilter === 'all'
      ? POPULAR_FONTS
      : POPULAR_FONTS.filter((f) => f.category === fontCategoryFilter);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ======================================================== */}
        {/* COLUNA ESQUERDA: CANVAS INTERATIVO COM ARRASTE E SOLTE (STICKY) */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="lg:sticky lg:top-[144px] z-20 flex flex-col items-center w-full max-w-[430px] xl:max-w-[470px] mx-auto">
            <div className="relative w-full aspect-square max-h-[calc(100vh-210px)] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-inner group select-none">
            <canvas
              ref={canvasRef}
              className={`h-full w-full object-contain block transition-colors ${
                isDragging ? 'cursor-grabbing' : isHoveringBox ? 'cursor-grab' : 'cursor-default'
              }`}
              width={600}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {/* Dica Flutuante de Arrastar e Posicionar */}
            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 rounded-full bg-black/85 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg pointer-events-none">
              <span className={`h-2 w-2 rounded-full ${isDragging ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span>
                {isDragging ? '✥ Solte para fixar nesta posição' : '✥ Clique e arraste o texto para posicionar na bolsa'}
              </span>
            </div>

            {/* Indicador da Fonte Atual */}
            <div className="absolute top-3.5 right-3.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-slate-800 shadow-sm border border-slate-200 pointer-events-none">
              Fonte: <strong className="text-indigo-600">{selectedFont}</strong>
            </div>

            {/* Coordenadas em tempo real ao arrastar */}
            {isDragging && (
              <div className="absolute top-3.5 left-3.5 rounded-full bg-indigo-600 text-white px-3 py-1 text-[10px] font-extrabold shadow-md pointer-events-none">
                Posição: X {textPosition.x} | Y {textPosition.y}
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            💡 <strong>Dica:</strong> Você pode clicar diretamente no texto ou na área tracejada da bolsa para arrastar e soltar onde preferir (no centro, nos bolsos ou abas).
          </p>
        </div>
      </div>

        {/* ======================================================== */}
        {/* COLUNA DIREITA: CONTROLES DE PERSONALIZAÇÃO */}
        {/* ======================================================== */}
        <div className="flex flex-col space-y-6 lg:col-span-6 xl:col-span-6">
          {/* Cabeçalho do Produto */}
          <div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Personalizável • By You Edition
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
              {product.title}
            </h1>

            {/* Preço com Suporte a Desconto do Lojista */}
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900">R$ {unitPrice}</span>
              {discountPercent > 0 && (
                <>
                  <span className="text-sm font-semibold text-slate-400 line-through">
                    R$ {originalPriceFormatted}
                  </span>
                  <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Disponibilidade de Estoque */}
            <div className="mt-2.5">
              {product.stock_quantity > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Estoque da Loja: <strong>{product.stock_quantity} unidades disponíveis</strong></span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Produto sob encomenda (Confecção artesanal)</span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* ======================================================== */}
          {/* 1. DIGITAR O TEXTO PERSONALIZADO */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                1. Digite o Texto da Personalização *
              </label>
              <span className="text-[11px] font-bold text-indigo-600">
                {customText.length}/35 caracteres
              </span>
            </div>

            <input
              type="text"
              placeholder="Ex: Seu Nome, Iniciais ou Monograma..."
              value={customText}
              maxLength={35}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-sm transition-all"
            />
            <p className="mt-1.5 text-[11px] text-indigo-700/80">
              O texto aparece imediatamente aplicado na bolsa ao lado com a fonte selecionada.
            </p>
          </div>

          {/* ======================================================== */}
          {/* 2. SELETOR DAS PRINCIPAIS FONTES UTILIZADAS (SOLICITAÇÃO DO USUÁRIO) */}
          {/* ======================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900">
                2. Escolha a Fonte Tipográfica
              </label>
              <span className="text-xs text-indigo-600 font-bold">
                {POPULAR_FONTS.length} fontes disponíveis
              </span>
            </div>

            {/* Abas de Categoria de Fonte */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold mb-3">
              <button
                type="button"
                onClick={() => setFontCategoryFilter('all')}
                className={`flex-1 rounded-lg py-1.5 transition-all text-center ${
                  fontCategoryFilter === 'all'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFontCategoryFilter('luxo')}
                className={`flex-1 rounded-lg py-1.5 transition-all text-center ${
                  fontCategoryFilter === 'luxo'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Luxo
              </button>
              <button
                type="button"
                onClick={() => setFontCategoryFilter('cursiva')}
                className={`flex-1 rounded-lg py-1.5 transition-all text-center ${
                  fontCategoryFilter === 'cursiva'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cursiva
              </button>
              <button
                type="button"
                onClick={() => setFontCategoryFilter('moderna')}
                className={`flex-1 rounded-lg py-1.5 transition-all text-center ${
                  fontCategoryFilter === 'moderna'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Moderna
              </button>
              <button
                type="button"
                onClick={() => setFontCategoryFilter('bold')}
                className={`flex-1 rounded-lg py-1.5 transition-all text-center ${
                  fontCategoryFilter === 'bold'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Esportiva
              </button>
            </div>

            {/* Grade Visual com Prévias de Cada Fonte */}
            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredFonts.map((font) => {
                const isSelected = selectedFont === font.id;
                const displayText = customText.trim() ? customText : font.sample;

                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setSelectedFont(font.id)}
                    className={`relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-slate-700">
                        {font.name}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500">
                        {font.categoryLabel}
                      </span>
                    </div>

                    {/* Exibição da Amostra Renderizada com a Fonte Real */}
                    <div
                      className="my-2.5 text-base text-slate-900 truncate w-full"
                      style={{ fontFamily: font.family }}
                    >
                      {displayText}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 w-full pt-1 border-t border-slate-100">
                      <span className="truncate">{font.description}</span>
                      {isSelected && (
                        <span className="text-indigo-600 font-extrabold text-xs ml-1">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. CORES DA PERSONALIZAÇÃO */}
          {/* ======================================================== */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2">
              3. Cor da Personalização
            </label>
            <div className="flex flex-wrap gap-2.5">
              {THREAD_COLORS.map((color) => {
                const isSelected = textColor === color.hex;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setTextColor(color.hex)}
                    className={`group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 shadow-sm text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border shadow-inner"
                      style={{ backgroundColor: color.hex, borderColor: color.border }}
                    />
                    <span className="text-[11px]">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. AJUSTES DE TAMANHO E POSIÇÃO DA PERSONALIZAÇÃO */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-1">
            {/* Tamanho da Fonte */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  4. Tamanho da Personalização
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  {fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'P', sub: '24px', size: 24 },
                  { label: 'M', sub: '34px', size: 34 },
                  { label: 'G', sub: '44px', size: 44 },
                  { label: 'GG', sub: '54px', size: 54 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setFontSize(item.size)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                      fontSize === item.size
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="block text-[9px] opacity-70 font-normal">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Posições Rápidas na Bolsa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Posição na Bolsa
                </label>
                <span className="text-[11px] font-bold text-indigo-600">
                  Ou arraste no visor
                </span>
              </div>

              {/* Botões de atalhos rápidos de locais na bolsa */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Centro', pos: { x: 300, y: 340 } },
                  { label: 'Bolso Esquerdo', pos: { x: 215, y: 350 } },
                  { label: 'Bolso Direito', pos: { x: 385, y: 350 } },
                  { label: 'Superior', pos: { x: 300, y: 245 } },
                  { label: 'Inferior', pos: { x: 300, y: 430 } },
                  { label: 'Lateral', pos: { x: 185, y: 380 } },
                ].map((preset) => {
                  const isCurrent =
                    Math.abs(textPosition.x - preset.pos.x) < 18 &&
                    Math.abs(textPosition.y - preset.pos.y) < 18;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTextPosition(preset.pos)}
                      className={`rounded-xl py-2 px-2 text-xs transition-all border ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs ring-1 ring-indigo-600/30'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Controles de Ajuste Fino (Nudge com setas direcionais) */}
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600">
                  Ajuste Fino:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="Mover para esquerda"
                    onClick={() => setTextPosition((p) => ({ ...p, x: Math.max(90, p.x - 14) }))}
                    className="h-8 w-8 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                  >
                    ◄
                  </button>
                  <button
                    type="button"
                    title="Mover para cima"
                    onClick={() => setTextPosition((p) => ({ ...p, y: Math.max(120, p.y - 14) }))}
                    className="h-8 w-8 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    title="Mover para baixo"
                    onClick={() => setTextPosition((p) => ({ ...p, y: Math.min(520, p.y + 14) }))}
                    className="h-8 w-8 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    title="Mover para direita"
                    onClick={() => setTextPosition((p) => ({ ...p, x: Math.min(510, p.x + 14) }))}
                    className="h-8 w-8 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                  >
                    ►
                  </button>
                  <button
                    type="button"
                    title="Centralizar texto"
                    onClick={() => setTextPosition({ x: 300, y: 340 })}
                    className="ml-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-300 active:scale-95 transition-transform"
                  >
                    ↺ Resetar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. UPLOAD OPCIONAL DE LOGOTIPO / ARTE */}
          {/* ======================================================== */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-1">
              5. Anexar Logotipo ou Brasão (Opcional)
            </label>
            <div className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-3.5 transition-colors hover:border-indigo-500 bg-slate-50/50">
              <div className="text-center">
                <div className="flex text-xs text-slate-600 justify-center items-center gap-1">
                  <label className="relative cursor-pointer rounded-md font-bold text-indigo-600 hover:text-indigo-500">
                    <span>Clique para enviar arte/logo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">PNG com fundo transparente ou JPG</p>
              </div>
            </div>

            {artworkFile && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                <span className="truncate font-medium">Arquivo: {artworkFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setArtworkFile(null);
                    setArtworkPreviewUrl(null);
                  }}
                  className="font-bold text-rose-600 hover:underline ml-2"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SELETOR DE QUANTIDADE & BOTÃO ADICIONAR À SACOLA */}
          {/* ======================================================== */}
          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Quantidade desta peça:
                </span>
                <span className="text-[11px] text-slate-500">
                  {product.stock_quantity > 0
                    ? `${product.stock_quantity} un disponíveis em estoque`
                    : 'Produto esgotado'}
                </span>
              </div>

              <div className="flex items-center rounded-full border border-slate-300 bg-white p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCustomQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-90 transition-transform"
                  aria-label="Diminuir quantidade"
                >
                  -
                </button>
                <span className="w-9 text-center text-xs font-black text-slate-900">
                  {customQuantity}
                </span>
                <button
                  type="button"
                  disabled={product.stock_quantity > 0 && customQuantity >= product.stock_quantity}
                  onClick={() =>
                    setCustomQuantity((q) =>
                      Math.min(product.stock_quantity > 0 ? product.stock_quantity : 99, q + 1)
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-90 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>

            {customQuantity > 1 && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex justify-between text-xs">
                <span className="text-slate-500">Subtotal ({customQuantity} un):</span>
                <span className="font-extrabold text-slate-900">
                  R$ {(parseFloat(unitPrice.replace(',', '.')) * customQuantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 mt-3">
            <button
              type="button"
              onClick={handleFinalize}
              disabled={product.stock_quantity <= 0}
              className="w-full rounded-full bg-gradient-to-r from-black via-slate-900 to-black py-4 text-xs font-black uppercase tracking-widest text-amber-400 shadow-xl shadow-black/15 hover:from-slate-900 hover:to-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 border border-amber-500/30 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <span>
                {product.stock_quantity > 0
                  ? `Adicionar à Sacola (${customQuantity} un • R$ ${(
                      parseFloat(unitPrice.replace(',', '.')) * customQuantity
                    )
                      .toFixed(2)
                      .replace('.', ',')})`
                  : 'Produto Sem Estoque no Momento'}
              </span>
              <span>&rarr;</span>
            </button>

            {product.stock_quantity > 0 && (
              <button
                type="button"
                onClick={handleDirectMercadoPagoCheckout}
                className="w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>⚡ Comprar Agora com Mercado Pago</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE SUCESSO AO ADICIONAR À SACOLA */}
      {/* ======================================================== */}
      {isSuccessModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSuccessModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Botão Fechar X */}
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              aria-label="Fechar"
            >
              ✕
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 text-2xl font-black mb-4 shadow-xs">
              ✓
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Peça Adicionada à Sacola!
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              Sua bolsa personalizada ({customQuantity} un) foi incluída na sua sacola de compras.
            </p>

            <div className="my-5 rounded-2xl bg-slate-50 p-4 text-xs text-left space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Produto:</span>
                <span className="font-bold text-slate-900">{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantidade:</span>
                <span className="font-bold text-amber-700">{customQuantity} un</span>
              </div>
              {customText.trim() && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Monograma:</span>
                  <span className="font-bold text-slate-900">"{customText}"</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Fonte:</span>
                <span className="font-bold text-slate-900">{selectedFont}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cor do Fio:</span>
                <span className="font-bold text-slate-900">
                  {THREAD_COLORS.find((c) => c.hex === textColor)?.name || textColor}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-bold text-slate-900">Subtotal Adicionado:</span>
                <span className="font-black text-emerald-600 text-sm">
                  R$ {(parseFloat(unitPrice.replace(',', '.')) * customQuantity)
                    .toFixed(2)
                    .replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  openCart();
                }}
                className="w-full rounded-full bg-black py-3.5 text-xs font-black uppercase tracking-wider text-amber-400 hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Ver Sacola & Finalizar ({totalItems} itens)</span>
                <span>&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  openCheckout();
                }}
                className="w-full rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-sky-600/25 hover:from-sky-500 hover:to-sky-400 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>💳 Pagar Agora com Mercado Pago</span>
              </button>

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setCustomText('');
                    setCustomQuantity(1);
                  }}
                  className="flex-1 rounded-full border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  + Personalizar Outra
                </button>
                <a
                  href="/"
                  className="flex-1 rounded-full border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  Explorar Catálogo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProductCustomizer;
