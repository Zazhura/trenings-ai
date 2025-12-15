import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth/roles'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    redirect('/coach')
  }

  return <>{children}</>
}

