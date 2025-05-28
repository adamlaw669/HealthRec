'use client'

import * as React from 'react'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Health Rec Engine</span>
          </a>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </a>
            <a
              href="/metrics"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Metrics
            </a>
            <a
              href="/settings"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Settings
            </a>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other controls here */}
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
} 