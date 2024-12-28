import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { MainLayout } from '@/components/layout/main-layout'
import { Web3Provider } from '@/providers/web3-provider'
import { ConfigurationProvider } from '@/components/config/configuration-provider'
import { TranslationProvider } from '@/lib/i18n'
import { FilterProvider } from '@/lib/contexts/filter-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '족집게 - Prediction Markets',
  description: 'Decentralized prediction markets on VeryChain',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider>
            <ConfigurationProvider>
              <Web3Provider>
                <FilterProvider>
                  <MainLayout>
                    {children}
                  </MainLayout>
                </FilterProvider>
                <Toaster />
              </Web3Provider>
            </ConfigurationProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
