import {ClerkProvider} from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import LayoutWrapper from '@/components/layout-wrapper';
import GlobalParticles from '@/components/global-particles';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Gohyred – One Search. Every Opportunity.',
  description: 'AI-powered job aggregation platform that finds your perfect role by parsing your resume and searching unified job openings.',
  keywords: ['jobs', 'AI job search', 'job aggregator', 'career', 'employment', 'remote jobs'],
  icons: {
    icon: '/favicon.ico',
    apple: '/gohyred-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Google favicon API is lazy-loaded so only dns-prefetch needed. */}
        <link rel="dns-prefetch" href="https://www.google.com" />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased overflow-x-hidden`}>
        {/* Global Dark Mode Background */}
        <div className="fixed inset-0 z-[-50] pointer-events-none hidden dark:block" style={{
          backgroundColor: '#000000'
        }} />
        <GlobalParticles />

        <ClerkProvider>
          <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          >
          <TooltipProvider delayDuration={0}>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          </TooltipProvider>
          </ThemeProvider>
          <Toaster position="bottom-right" richColors className="max-lg:mb-20" />
        </ClerkProvider>
      </body>
    </html>
  );
}