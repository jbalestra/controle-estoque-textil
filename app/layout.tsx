import type { Metadata } from 'next';
import './globals.css';
import { NikeHeader } from '@/components/nike/NikeHeader';

export const metadata: Metadata = {
  title: 'Ateliê Têxtil | Produtos Sob Medida & Customizáveis (By You)',
  description: 'E-commerce têxtil com personalização em tempo real e controle de estoque de matéria-prima.',
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
        <NikeHeader />
        {children}
      </body>
    </html>
  );
}
