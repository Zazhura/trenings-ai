import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware now only runs on /coach routes (via matcher config)
  // This ensures /, /display, /api, /_next, etc. never hit this middleware
  
  try {
    const { pathname } = request.nextUrl

    // Create a response object to modify cookies
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Get environment variables - fail-open if missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      // Missing env vars - fail-open to avoid 500 errors
      console.warn('Middleware: Missing Supabase environment variables')
      return NextResponse.next()
    }

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                request.cookies.set(name, value)
              )
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            } catch (error) {
              // Cookie setting failed - log but don't fail
              console.warn('Middleware: Cookie setting failed', error)
            }
          },
        },
      }
    )

    // Refresh session to update cookies and check authentication
    const { data: { user }, error } = await supabase.auth.getUser()

    // If user is not authenticated, redirect to login
    if (!user && !error) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If there's an auth error, fail-open (let the request continue)
    // The layout will handle authentication check
    if (error) {
      console.warn('Middleware: Auth check failed', error)
      return NextResponse.next()
    }

    return response
  } catch (error) {
    // Any unexpected error - fail-open to avoid 500
    console.error('Middleware: Unexpected error', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Only run middleware on /coach routes
     * This ensures /, /display, /api, /_next, /login, etc. never hit middleware
     */
    '/coach/:path*',
  ],
}
