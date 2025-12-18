import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

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

  // Check if user is admin (platform_admin role OR in ADMIN_EMAILS allowlist)
  const admin = await isAdmin()
  if (!admin) {
    redirect('/coach')
  }

  return <>{children}</>
}

