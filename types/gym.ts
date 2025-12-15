/**
 * Gym types for multi-tenant support
 */

export interface Gym {
  id: string
  slug: string // URL-friendly identifier (e.g., 'crossfit-larvik')
  name: string // Display name
  created_at: Date
  updated_at: Date
}

