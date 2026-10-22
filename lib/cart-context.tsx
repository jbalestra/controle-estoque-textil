'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { updateProductStock } from '@/lib/products-store';

export interface CartCustomization {
  customText?: string;
  fontName?: string;
  textColor?: string;
  textColorName?: string;
  fabricName?: string;
  artworkPreviewUrl?: string;
  previewSnapshotUrl?: string; // Canvas data URL / snapshot
}

export interface CartItem {
  id: string; // Hash or unique ID
  productId: string;
  productTitle: string;
  productSlug: string;
  categoryLabel?: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  imageUrl: string;
  isCustomized: boolean;
  customization?: CartCustomization;
  addedAt: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  paymentMethod: 'pix' | 'credit_card';
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  status: 'pendente' | 'aprovado' | 'em_producao';
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  couponCode: string;
  couponDiscount: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>, openCartDrawer?: boolean) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  completeOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: {
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    paymentMethod: 'pix' | 'credit_card';
  }) => OrderRecord;
  totalItems: number;
  subtotal: number;
  pixDiscountAmount: number;
  couponDiscountAmount: number;
  totalPix: number;
  totalCard: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  amountToFreeShipping: number;
}

const CART_STORAGE_KEY = 'bagshouse_cart_items_v2';
const ORDERS_STORAGE_KEY = 'bagshouse_orders_history_v1';
const FREE_SHIPPING_THRESHOLD = 399.0;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // Porcentagem (ex: 10 para 10%)

  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error('Erro ao ler carrinho do localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Salvar alterações no localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erro ao salvar carrinho no localStorage:', e);
    }
  }, [items, isLoaded]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  // Adicionar item ao carrinho
  const addItem = (itemData: Omit<CartItem, 'id' | 'addedAt'>, openCartDrawer: boolean = true) => {
    setItems((prevItems) => {
      // Se não for customizado, tenta agrupar com produto idêntico
      if (!itemData.isCustomized) {
        const existingIndex = prevItems.findIndex(
          (i) => !i.isCustomized && i.productId === itemData.productId
        );

        if (existingIndex > -1) {
          const current = prevItems[existingIndex];
          const newQty = Math.min(
            current.maxStock > 0 ? current.maxStock : 999,
            current.quantity + itemData.quantity
          );
          const copy = [...prevItems];
          copy[existingIndex] = { ...current, quantity: newQty };
          return copy;
        }
      } else {
        // Se for customizado com o MESMO texto, fonte e cor, agrupa
        const existingIndex = prevItems.findIndex(
          (i) =>
            i.isCustomized &&
            i.productId === itemData.productId &&
            i.customization?.customText === itemData.customization?.customText &&
            i.customization?.fontName === itemData.customization?.fontName &&
            i.customization?.textColor === itemData.customization?.textColor
        );

        if (existingIndex > -1) {
          const current = prevItems[existingIndex];
          const newQty = Math.min(
            current.maxStock > 0 ? current.maxStock : 999,
            current.quantity + itemData.quantity
          );
          const copy = [...prevItems];
          copy[existingIndex] = { ...current, quantity: newQty };
          return copy;
        }
      }

      // Novo item único
      const newItem: CartItem = {
        ...itemData,
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        addedAt: Date.now(),
      };

      return [newItem, ...prevItems];
    });

    // Abre a sacola automaticamente apenas se solicitado (por padrão true)
    if (openCartDrawer) {
      setIsCartOpen(true);
    }
  };

  // Remover item
  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Atualizar quantidade
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const max = item.maxStock > 0 ? item.maxStock : 999;
        const validQuantity = Math.min(max, Math.max(1, newQuantity));
        return { ...item, quantity: validQuantity };
      })
    );
  };

  // Limpar carrinho
  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponDiscount(0);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Cupom de desconto
  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BAGS10' || clean === 'PRIMEIRACOMPRA') {
      setCouponCode(clean);
      setCouponDiscount(10); // 10% OFF
      return true;
    }
    if (clean === 'VIP15') {
      setCouponCode(clean);
      setCouponDiscount(15); // 15% OFF
      return true;
    }
    if (clean === 'FRETEGRATIS') {
      setCouponCode(clean);
      setCouponDiscount(5);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
  };

  // Cálculos financeiros do carrinho
  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [items]
  );

  const couponDiscountAmount = useMemo(() => {
    if (couponDiscount <= 0) return 0;
    return (subtotal * couponDiscount) / 100;
  }, [subtotal, couponDiscount]);

  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscountAmount);

  // 5% de desconto extra no PIX (estilo e-commerce de alto padrão)
  const pixDiscountAmount = useMemo(
    () => subtotalAfterCoupon * 0.05,
    [subtotalAfterCoupon]
  );

  const totalPix = useMemo(
    () => Math.max(0, subtotalAfterCoupon - pixDiscountAmount),
    [subtotalAfterCoupon, pixDiscountAmount]
  );

  const totalCard = subtotalAfterCoupon;

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // Finalização do pedido com baixa de estoque automática
  const completeOrder = (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: {
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    paymentMethod: 'pix' | 'credit_card';
  }): OrderRecord => {
    const finalAmount = orderData.paymentMethod === 'pix' ? totalPix : totalCard;
    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BH-${dateCode}-${randomHex}`;

    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: now.toISOString(),
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      items: [...items],
      subtotal,
      discountAmount:
        couponDiscountAmount + (orderData.paymentMethod === 'pix' ? pixDiscountAmount : 0),
      shippingCost: 0, // Frete grátis ou promocional
      totalAmount: Number(finalAmount.toFixed(2)),
      status: 'pendente',
    };

    // 1. Salvar no histórico de pedidos do localStorage
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      const ordersList: OrderRecord[] = storedOrders ? JSON.parse(storedOrders) : [];
      ordersList.unshift(newOrder);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersList));
      window.dispatchEvent(new Event('bagshouse_order_created'));
    } catch (e) {
      console.error('Erro ao salvar pedido no histórico:', e);
    }

    // 2. Dar baixa no estoque real dos produtos comprados!
    try {
      items.forEach((item) => {
        if (item.maxStock !== undefined) {
          const remainingStock = Math.max(0, item.maxStock - item.quantity);
          updateProductStock(item.productId, remainingStock);
        }
      });
    } catch (e) {
      console.error('Erro ao atualizar estoque:', e);
    }

    // 3. Limpar sacola
    clearCart();

    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        isCheckoutOpen,
        couponCode,
        couponDiscount,
        openCart,
        closeCart,
        toggleCart,
        openCheckout,
        closeCheckout,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        completeOrder,
        totalItems,
        subtotal,
        pixDiscountAmount,
        couponDiscountAmount,
        totalPix,
        totalCard,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        isFreeShipping,
        amountToFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
