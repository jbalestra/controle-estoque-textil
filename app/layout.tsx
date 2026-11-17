import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NikeHeader } from '@/components/nike/NikeHeader';
import { CartProvider } from '@/lib/cart-context';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CheckoutModal } from '@/components/cart/CheckoutModal';

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'Bags House | Nécessaires Personalizadas & Bolsas Sob Medida',
  description: 'Bags House - Nécessaires e bolsas personalizadas em tempo real com controle de estoque e acabamento premium.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600&family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Inter:wght@500;700&family=Montserrat:wght@500;700&family=Oswald:wght@500;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-white text-black selection:bg-black selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-black focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-amber-400 focus:shadow-lg"
        >
          Pular para o conteúdo principal
        </a>
        <CartProvider>
          <NikeHeader />
          {children}
          <CartDrawer />
          <CheckoutModal />
        </CartProvider>
      </body>
    </html>
  );
}
