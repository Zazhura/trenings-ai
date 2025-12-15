'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isPlatformAdminClient, isAnyGymAdminClient } from '@/lib/auth/roles-client'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  requiresGymAdmin?: boolean
  requiresPlatformAdmin?: boolean
}

const navLinks: NavLink[] = [
  { href: '/coach', label: 'Dashboard' },
  { href: '/coach/templates', label: 'Templates' },
  { href: '/coach/settings/coaches', label: 'Coacher', requiresGymAdmin: true },
  { href: '/admin/exercises', label: 'Øvelser', requiresPlatformAdmin: true },
  { href: '/admin/gyms', label: 'Gyms', requiresPlatformAdmin: true },
]

export function Navigation() {
  const pathname = usePathname()
  const [isGymAdmin, setIsGymAdmin] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRoles = async () => {
      setLoading(true)
      try {
        const [gymAdmin, platformAdmin] = await Promise.all([
          isAnyGymAdminClient(),
          isPlatformAdminClient(),
        ])
        setIsGymAdmin(gymAdmin)
        setIsPlatformAdmin(platformAdmin)
      } catch (error) {
        console.error('Error checking roles:', error)
      } finally {
        setLoading(false)
      }
    }

    checkRoles()
  }, [])

  const isActive = (href: string): boolean => {
    if (href === '/coach') {
      return pathname === '/coach'
    }
    return pathname.startsWith(href)
  }

  const visibleLinks = navLinks.filter(link => {
    if (link.requiresPlatformAdmin && !isPlatformAdmin) {
      return false
    }
    if (link.requiresGymAdmin && !isGymAdmin && !isPlatformAdmin) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <nav className="flex items-center gap-1">
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
      </nav>
    )
  }

  return (
    <nav className="flex items-center gap-1">
      {visibleLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive(link.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

