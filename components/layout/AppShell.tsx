import { ReactNode } from 'react'
import { containerClasses } from '@/lib/ui/layout'

interface AppShellProps {
  children: ReactNode
  header?: ReactNode
  className?: string
}

/**
 * AppShell - Consistent layout wrapper for pages
 * Provides centered container, top spacing, and consistent background
 */
export function AppShell({ children, header, className = '' }: AppShellProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {header && (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className={containerClasses}>
            <div className="flex h-16 items-center">{header}</div>
          </div>
        </header>
      )}
      <main className={`${containerClasses} py-8 sm:py-12 lg:py-16`}>
        {children}
      </main>
    </div>
  )
}

