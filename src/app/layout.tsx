import {ClerkProvider} from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import LayoutWrapper from '@/components/layout-wrapper';
import GlobalParticles from '@/components/global-particles';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'JobFusion – One Search. Every Opportunity.',
  description: 'AI-powered job aggregation platform that finds your perfect role by parsing your resume and searching unified job openings.',
  keywords: ['jobs', 'AI job search', 'job aggregator', 'career', 'employment', 'remote jobs'],
  icons: {
    icon: '/logo-circle.png',
    apple: '/logo-circle.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        </ClerkProvider>
      </body>
    </html>
  );
}