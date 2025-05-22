import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { QrCode } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'WellPass AutoCheck',
  description: 'Automatize o check-in do Gympass na sua academia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <header className="bg-primary text-primary-foreground shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <QrCode size={28} />
              WellPass AutoCheck
            </Link>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          {children}
        </main>
        <footer className="bg-muted text-muted-foreground py-4 text-center text-sm">
          <div className="container mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} WellPass AutoCheck. Todos os direitos reservados.</p>
            <p className="mt-1">Uma solução elegante para sua academia.</p>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
