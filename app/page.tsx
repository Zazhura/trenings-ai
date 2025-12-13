import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // Check if user is authenticated
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Authenticated - redirect to coach
    redirect('/coach')
  } else {
    // Not authenticated - redirect to login
    redirect('/login')
  }
}

