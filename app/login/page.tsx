'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cardContainerClasses, formSpacingClasses } from '@/lib/ui/layout'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Autofocus on email input
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Redirect to coach dashboard or redirect param
      const redirectTo = searchParams.get('redirect') || '/coach'
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError('En uventet feil oppstod')
      setIsLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className={cardContainerClasses}>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Logg inn</CardTitle>
              <CardDescription>
                Skriv inn dine påloggingsdetaljer for å fortsette til treningsdashbordet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className={formSpacingClasses}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    E-post
                  </label>
                  <Input
                    id="email"
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="din@epost.no"
                    autoComplete="email"
                    aria-describedby={error ? 'error-message' : undefined}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Passord
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-describedby={error ? 'error-message' : undefined}
                    className="w-full"
                  />
                </div>

                {error && (
                  <div
                    id="error-message"
                    role="alert"
                    aria-live="polite"
                    className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Logger inn...</span>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    'Logg inn'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className={cardContainerClasses}>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Logg inn</CardTitle>
                <CardDescription>Laster...</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </AppShell>
    }>
      <LoginForm />
    </Suspense>
  )
}

