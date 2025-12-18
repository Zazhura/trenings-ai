'use client'

// Redirect to new builder with templateId query param
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  useEffect(() => {
    // Redirect to new builder with templateId
    router.replace(`/coach/templates/new?edit=${templateId}`)
  }, [templateId, router])

  return null
}

