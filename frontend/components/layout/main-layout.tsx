'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { getSubgraphEndpoint, hasSubgraph } from '@/constants/subgraphs'

const CHAIN_ID = 4613 // VeryChain Mainnet

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  showSidebar?: boolean
}

export function MainLayout({ children, className, showSidebar = true }: MainLayoutProps) {
  const subgraphUrl = useMemo(() => {
    if (hasSubgraph(CHAIN_ID, 'predictionmarket')) {
      return getSubgraphEndpoint(CHAIN_ID, 'predictionmarket')
    }
    return undefined
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {showSidebar && (
          <Sidebar
            className="sticky top-16 h-[calc(100vh-4rem)] shrink-0"
            subgraphUrl={subgraphUrl}
          />
        )}
        <main className={cn(
          'flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden',
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}
