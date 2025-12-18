'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

interface DebugData {
  supabase_hostname: string
  counts: {
    total: number
    demo: number
    custom: number
  }
  by_gym: Array<{
    gym_id: string
    gym_name: string
    gym_slug: string
    total: number
    demo: number
    custom: number
  }>
  latest: Array<{
    id: string
    name: string
    gym_id: string
    gym_name: string
    gym_slug: string
    is_demo: boolean
    created_at: string
    created_by: string | null
    created_by_email: string | null
  }>
}

export default function DebugTemplatesPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDebugData()
  }, [])

  const loadDebugData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/debug/templates')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch debug data')
      }
      const debugData = await response.json()
      setData(debugData)
    } catch (err) {
      console.error('Error loading debug data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Template Debug Info</h1>
        <p className={pageDescriptionClasses}>
          Diagnostic information about templates in the database
        </p>
      </div>

      <div className={spacing.lg}>
        {loading && (
          <Card>
            <CardContent className="py-8 text-center">Loading...</CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-8">
              <div className="text-red-600">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Supabase Info */}
            <Card>
              <CardHeader>
                <CardTitle>Supabase Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <span className="font-medium">Hostname:</span> {data.supabase_hostname}
                </p>
              </CardContent>
            </Card>

            {/* Counts */}
            <Card>
              <CardHeader>
                <CardTitle>Template Counts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{data.counts.total}</div>
                    <div className="text-sm text-gray-600">Total Templates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{data.counts.demo}</div>
                    <div className="text-sm text-gray-600">Demo Templates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{data.counts.custom}</div>
                    <div className="text-sm text-gray-600">Custom Templates</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* By Gym */}
            <Card>
              <CardHeader>
                <CardTitle>Templates by Gym (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.by_gym.length === 0 ? (
                  <p className="text-sm text-gray-500">No templates found</p>
                ) : (
                  <div className="space-y-2">
                    {data.by_gym.map((gym) => (
                      <div
                        key={gym.gym_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{gym.gym_name}</div>
                          <div className="text-xs text-gray-500">
                            {gym.gym_slug} ({gym.gym_id})
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="font-medium">{gym.total}</span> total
                          </div>
                          <div className="text-blue-600">
                            <span className="font-medium">{gym.demo}</span> demo
                          </div>
                          <div className="text-green-600">
                            <span className="font-medium">{gym.custom}</span> custom
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latest Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Latest 20 Templates</CardTitle>
                <CardDescription>Most recently created templates</CardDescription>
              </CardHeader>
              <CardContent>
                {data.latest.length === 0 ? (
                  <p className="text-sm text-gray-500">No templates found</p>
                ) : (
                  <div className="space-y-2">
                    {data.latest.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{template.name}</span>
                            {template.is_demo && (
                              <Badge variant="secondary">Demo</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Gym: {template.gym_name} ({template.gym_slug})
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {template.id}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created: {new Date(template.created_at).toLocaleString()}
                            {template.created_by_email && (
                              <> by {template.created_by_email}</>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <button
                onClick={loadDebugData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

