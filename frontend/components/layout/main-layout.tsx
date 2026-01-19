'use client'

import { cn } from '@/lib/utils'
import { Header } from './header'
import { Sidebar } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  showSidebar?: boolean
}

export function MainLayout({ children, className, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {showSidebar && (
          <Sidebar
            className="sticky top-16 h-[calc(100vh-4rem)] shrink-0"
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
