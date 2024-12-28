'use client'

import { ConnectButton } from '@/lib/web3'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ThemeToggleSimple } from '@/components/ui/theme-toggle'
import { useTranslation } from '@/lib/i18n'

interface HeaderProps {
  className?: string
  onMobileMenuToggle?: () => void
}

export function Header({ className, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navLinks = [
    { href: '/', label: t('nav.markets') },
    { href: '/my-bets', label: t('nav.myBets') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
  ]

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      <div className="h-16 flex items-center justify-between px-4">
        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo - matches sidebar width (w-64 = 256px) */}
        <Link href="/" className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity w-64 shrink-0">
          <Image src="/logo.png" alt="Jokjipge" width={40} height={40} className="rounded-lg" />
          <span className="text-2xl font-bold text-primary">{t('common.appName')}</span>
        </Link>

        {/* Mobile Logo */}
        <Link href="/" className="md:hidden flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Jokjipge" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-primary">{t('common.appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === link.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggleSimple />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
