# Gym Slug Duplication Repair Script

## Oversikt

Dette skriptet reparerer problemer med dupliserte gym slugs og manglende `gym_id` referanser i `sessions` tabellen.

## Problem

- **Dupliserte gyms**: `crossfit-larvik` (canonical) og `Crossfit_Larvik` (duplikat)
- **Sessions med problemer**:
  - `gym_slug='default-gym'` → 51 sessions med `gym_id=NULL`
  - `gym_slug='Crossfit_Larvik'` → 19 sessions med `gym_id` satt til duplikat-gym

## Løsning

Skriptet:
1. Velger `crossfit-larvik` som canonical gym
2. Oppdaterer alle affected sessions til å referere canonical gym
3. Setter `gym_id` for alle sessions som mangler den
4. Valgfritt: Oppdaterer andre tabeller som refererer gyms (se STEP 2)
5. Valgfritt: Sletter duplikat-gym (se STEP 3)

## Hvordan kjøre

### Forberedelse

1. **Ta backup av databasen først!**
   ```sql
   -- I Supabase Dashboard: Settings → Database → Backups
   -- Eller bruk pg_dump hvis du har tilgang
   ```

2. **Åpne Supabase SQL Editor**
   - Gå til Supabase Dashboard
   - Velg "SQL Editor" i venstre meny

### Kjøring

1. **Åpne filen** `supabase/repair/repair_gym_slug_and_sessions.sql`

2. **Kopier hele innholdet** inn i SQL Editor

3. **Les gjennom output** før du committer:
   - Skriptet kjører i en `BEGIN...COMMIT` transaksjon
   - Du kan se alle endringer før de blir permanent
   - Hvis noe ser feil ut, kan du kjøre `ROLLBACK;` før `COMMIT;`

4. **Kjør skriptet**
   - Klikk "Run" i SQL Editor
   - Skriptet vil vise detaljert output via `RAISE NOTICE`

5. **Verifiser resultatet**
   - Sjekk at alle sessions nå har `gym_id` satt
   - Sjekk at ingen sessions har `gym_slug='default-gym'` eller `'Crossfit_Larvik'`

### Eksempel på kjøring

```sql
-- Skriptet starter automatisk med BEGIN;
-- ... (skriptet kjører) ...
-- Til slutt: COMMIT;
```

Hvis du vil avbryte før commit, fjern `COMMIT;` linjen og kjør `ROLLBACK;` i stedet.

## Hva blir endret

### Sessions tabell

- Alle sessions med `gym_slug='default-gym'` → `gym_slug='crossfit-larvik'`, `gym_id` satt til canonical gym
- Alle sessions med `gym_slug='Crossfit_Larvik'` → `gym_slug='crossfit-larvik'`, `gym_id` satt til canonical gym

### Andre tabeller (valgfritt - STEP 2)

Skriptet inkluderer valgfrie steg for å oppdatere andre tabeller som refererer gyms:
- `user_roles.gym_id`
- `exercises.created_by_gym_id`
- `gym_exercises.gym_id`
- `templates.gym_id`

**Disse er kommentert ut som standard.** Uncomment STEP 2 hvis du også vil migrere data fra duplikat-gym til canonical gym i disse tabellene.

### Sletting av duplikat-gym (valgfritt - STEP 3)

Skriptet inkluderer et valgfritt steg for å slette duplikat-gym (`Crossfit_Larvik`).

**Dette er kommentert ut som standard.** Uncomment STEP 3 KUN hvis:
1. Du har kjørt STEP 2 (eller verifisert at ingen andre tabeller refererer duplikat-gym)
2. Du har tatt backup
3. Du har verifisert at alle sessions er riktig oppdatert

## Verifisering

Etter kjøring, kjør denne query for å verifisere:

```sql
SELECT 
  gym_slug,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE gym_id IS NULL) as null_gym_id_count,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) as set_gym_id_count
FROM sessions
WHERE gym_slug IN ('crossfit-larvik', 'Crossfit_Larvik', 'default-gym')
GROUP BY gym_slug
ORDER BY gym_slug;
```

**Forventet resultat:**
- `null_gym_id_count` skal være 0 for alle gym_slug
- Ingen sessions skal ha `gym_slug='default-gym'` eller `'Crossfit_Larvik'`
- Alle sessions skal ha `gym_slug='crossfit-larvik'` med `gym_id` satt

## Rollback / Tilbakerulling

### Hvis du har kjørt skriptet i en transaksjon

Hvis du ikke har committet ennå, kan du rulle tilbake:

```sql
ROLLBACK;
```

### Hvis du allerede har committet

Hvis du allerede har committet, må du manuelt rulle tilbake endringene:

```sql
BEGIN;

-- Finn canonical og duplicate gym IDs
DO $$
DECLARE
  canonical_gym_id UUID;
  duplicate_gym_id UUID;
BEGIN
  SELECT id INTO canonical_gym_id FROM gyms WHERE slug = 'crossfit-larvik';
  SELECT id INTO duplicate_gym_id FROM gyms WHERE slug = 'Crossfit_Larvik';
  
  -- Rollback sessions (må gjøres manuelt basert på hva som ble endret)
  -- Dette krever at du vet hva som var original state
  -- Anbefaler å bruke backup i stedet
END $$;

COMMIT;
```

**Anbefaling:** Bruk database backup for tilbakerulling hvis mulig.

## Feilsikring

### Feil: "Canonical gym not found"

- Sjekk at gym med slug `crossfit-larvik` faktisk eksisterer
- Verifiser at slug er eksakt (case-sensitive)

### Feil: "Multiple gyms found with canonical slug"

- Dette skal ikke skje (UNIQUE constraint på slug)
- Hvis det skjer, må du først fikse duplikatene manuelt

### Sessions har fortsatt NULL gym_id etter kjøring

- Sjekk om det er sessions med andre gym_slug verdier som ikke er dekket av skriptet
- Kjør verifiseringsqueryen og undersøk manuelt

## Sikkerhet

- ✅ Skriptet bruker transaksjoner (kan rollback)
- ✅ Validerer at canonical gym eksisterer og er unik
- ✅ Ikke-destruktiv som standard (sletter ikke data)
- ✅ Viser detaljert output før commit
- ⚠️  STEP 2 og STEP 3 er valgfrie og destruktive - uncomment kun hvis nødvendig

## Kontakt

Hvis du opplever problemer, sjekk:
1. Supabase logs for detaljerte feilmeldinger
2. Database constraints (kan være at noen constraints blokkerer endringer)
3. RLS policies (kan være at policies blokkerer updates)

