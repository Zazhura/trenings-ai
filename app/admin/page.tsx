import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '@/app/coach/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function AdminPage() {
  return (
    <AppShell header={<Navigation />}>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Admin</h1>
        <p className={pageDescriptionClasses}>
          Administrer globalt øvelsesbibliotek og gym-aktivering.
        </p>
      </div>

      <div className={spacing.lg}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Øvelsesbibliotek</CardTitle>
              <CardDescription>
                Administrer globalt øvelsesbibliotek. Se, rediger og opprett øvelser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/exercises">
                <Button>Gå til øvelser</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gyms</CardTitle>
              <CardDescription>
                Administrer gyms og aktiver/deaktiver øvelser per gym.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/gyms">
                <Button>Gå til gyms</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

