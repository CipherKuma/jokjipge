'use client'

import { useAccount, ConnectButton } from '@/lib/web3'
import { GasPriceDisplay } from '@/components/web3/transactions/gas-display'
import { Button } from '@/components/ui/button'
import { Fuel, Settings, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useConfiguration } from '@/components/config/configuration-provider'
import Link from 'next/link'

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const { isConnected } = useAccount()
  const { config, isConfigured, showConfigDialog, missingVars } = useConfiguration()

  return (
    <nav className={cn('main-navbar border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={config.appIcon || "/logo.png"} alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-semibold">{config.appName}</h1>
          </Link>
          {/* Configuration Status Indicator */}
          {!isConfigured && !config.isDefaults && (
            <Badge variant="destructive" className="text-xs">
              Setup Required
            </Badge>
          )}
          {config.isDefaults && (
            <Badge variant="outline" className="text-xs">
              Using Defaults
            </Badge>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Configuration Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={!isConfigured && !config.isDefaults ? "destructive" : "outline"}
                size="sm"
                className="gap-2 text-sm h-9"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                {missingVars.length > 0 && !config.isDefaults && (
                  <Badge variant="secondary" className="text-xs px-1">
                    {missingVars.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">App Configuration</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={isConfigured ? "default" : "destructive"}>
                        {isConfigured ? "Configured" : "Incomplete"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <Badge variant="outline">
                        {config.isDefaults ? "Defaults" : "Custom"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Networks:</span>
                      <span>{config.supportedChainNames?.length || 0} chains</span>
                    </div>
                  </div>
                </div>

                {missingVars.length > 0 && !config.isDefaults && (
                  <div>
                    <h4 className="text-sm font-medium text-destructive mb-2">Missing Configuration:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {missingVars.slice(0, 3).map(varName => (
                        <li key={varName} className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          <code>{varName}</code>
                        </li>
                      ))}
                      {missingVars.length > 3 && (
                        <li className="text-muted-foreground">
                          ...and {missingVars.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <Button onClick={showConfigDialog} className="w-full" size="sm">
                  <Settings className="h-3 w-3 mr-2" />
                  Open Configuration
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {isConnected && (
            <>
              {/* Gas Price Display */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-sm h-9">
                    <Fuel className="h-4 w-4" />
                    <span className="text-muted-foreground">Gas</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <GasPriceDisplay showUSD={true} />
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Wallet Connection - Uses abstraction layer */}
          <ConnectButton />
          <ThemeToggle />

        </div>
      </div>
    </nav>
  )
}
