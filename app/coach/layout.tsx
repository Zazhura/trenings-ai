import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication using @supabase/ssr
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}

