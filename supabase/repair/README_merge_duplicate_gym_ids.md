# Merge Duplicate Gym IDs Repair Script

## Oversikt

Dette skriptet reparerer problemer med dupliserte gym IDs ved å merge alle referanser fra duplicate gym inn i canonical gym.

## Problem

- **Canonical gym**: `slug='crossfit-larvik'`, `id=84ed63f3-c702-4767-929a-3c0af60bf667`
- **Duplicate gym**: `slug='Crossfit_Larvik'`, `id=7c4312de-7707-4e6c-a145-9b04fddcb5cb`

**Problemet nå:**
- `user_roles` peker på duplicate gym_id (`7c43...`)
- `templates` (TeamWood 1, Tester) peker på duplicate gym_id (`7c43...`)
- Display resolver finner canonical gym_id (`84ed...`) men finner ingen running/paused sessions fordi de peker på duplicate

## Løsning

Skriptet:
1. Flytter alle referanser fra duplicate gym_id til canonical gym_id
2. Oppdaterer `templates`, `user_roles`, `sessions` tabeller
3. Oppdaterer sessions med `gym_slug='Crossfit_Larvik'` også
4. Etter merge: coach start/session/display skal treffe canonical gym_id
5. Valgfritt: Sletter duplicate gym (se STEP 6)

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

1. **Åpne filen** `supabase/repair/repair_merge_duplicate_gym_ids.sql`

2. **Kopier hele innholdet** inn i SQL Editor

3. **Les gjennom output** før du committer:
   - Skriptet kjører i en `BEGIN...COMMIT` transaksjon
   - Du kan se alle endringer før de blir permanent
   - Hvis noe ser feil ut, kan du kjøre `ROLLBACK;` før `COMMIT;`

4. **Kjør skriptet**
   - Klikk "Run" i SQL Editor
   - Skriptet vil vise detaljert output via `RAISE NOTICE`:
     - Dry-run før endringer (STEP 0)
     - Oppdateringer per tabell (STEP 1-4)
     - Verifisering etter endringer (STEP 5)

5. **Verifiser resultatet**
   - Sjekk at alle referanser er flyttet (STEP 5 viser 0 rows for duplicate)
   - Test at display/coach endpoints fungerer (se Verifikasjon nedenfor)

### Eksempel på kjøring

```sql
-- Skriptet starter automatisk med BEGIN;
-- ... (skriptet kjører) ...
-- Til slutt: COMMIT;
```

Hvis du vil avbryte før commit, fjern `COMMIT;` linjen og kjør `ROLLBACK;` i stedet.

## Hva blir endret

### Templates tabell

- Alle templates med `gym_id = duplicate_id` → `gym_id = canonical_id`

### User roles tabell

- Alle user_roles med `gym_id = duplicate_id` → `gym_id = canonical_id`

### Sessions tabell

- Alle sessions med `gym_id = duplicate_id` → `gym_id = canonical_id`, `gym_slug = 'crossfit-larvik'`
- Alle sessions med `gym_slug = 'Crossfit_Larvik'` → `gym_slug = 'crossfit-larvik'`, `gym_id = canonical_id`

### Sletting av duplicate gym (valgfritt - STEP 6)

Skriptet inkluderer et valgfritt steg for å slette duplicate gym.

**Dette er kommentert ut som standard.** Uncomment STEP 6 KUN hvis:
1. Du har verifisert at alle referanser er flyttet (STEP 5 viser 0 rows)
2. Du har testet at display/coach endpoints fungerer
3. Du har tatt backup

## Verifikasjon

### 1. Database verifikasjon

Etter kjøring, kjør denne query for å verifisere:

```sql
SELECT 
  'templates' as table_name,
  COUNT(*) FILTER (WHERE gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb') as duplicate_count,
  COUNT(*) FILTER (WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667') as canonical_count
FROM templates
UNION ALL
SELECT 
  'user_roles' as table_name,
  COUNT(*) FILTER (WHERE gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb') as duplicate_count,
  COUNT(*) FILTER (WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667') as canonical_count
FROM user_roles
UNION ALL
SELECT 
  'sessions' as table_name,
  COUNT(*) FILTER (WHERE gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb') as duplicate_count,
  COUNT(*) FILTER (WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667') as canonical_count
FROM sessions;
```

**Forventet resultat:**
- `duplicate_count` skal være 0 for alle tabeller
- `canonical_count` skal være > 0 for alle tabeller som hadde data

### 2. API verifikasjon

Test at display endpoint fungerer:

```bash
# Test display endpoint
GET /api/display/crossfit-larvik/current-session

# Forventet: Skal returnere session hvis det finnes running/paused session
# Før repair: Returnerte null (sessions pekte på duplicate gym_id)
# Etter repair: Skal returnere session hvis coach har startet en
```

**Test scenario:**
1. Coach starter en ny session via `/api/coach/sessions/start`
2. Display side henter session via `/api/display/crossfit-larvik/current-session`
3. Skal nå finne sessionen fordi den peker på canonical gym_id

### 3. Sessions status verifikasjon

Sjekk at running/paused sessions er tilgjengelige:

```sql
SELECT 
  status,
  COUNT(*) as count
FROM sessions
WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667'
  AND status IN ('running', 'paused')
GROUP BY status;
```

**Forventet:** Skal vise running/paused sessions som ble flyttet fra duplicate gym_id.

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

-- Rollback templates
UPDATE templates
SET gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb'
WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667'
  AND -- må ha en måte å identifisere hvilke som ble endret
  -- Anbefaler å bruke backup i stedet

-- Rollback user_roles
UPDATE user_roles
SET gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb'
WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667'
  AND -- må ha en måte å identifisere hvilke som ble endret
  -- Anbefaler å bruke backup i stedet

-- Rollback sessions
UPDATE sessions
SET 
  gym_id = '7c4312de-7707-4e6c-a145-9b04fddcb5cb',
  gym_slug = 'Crossfit_Larvik'
WHERE gym_id = '84ed63f3-c702-4767-929a-3c0af60bf667'
  AND -- må ha en måte å identifisere hvilke som ble endret
  -- Anbefaler å bruke backup i stedet

COMMIT;
```

**Anbefaling:** Bruk database backup for tilbakerulling hvis mulig.

## Feilsikring

### Feil: "Canonical gym not found"

- Sjekk at gym med id `84ed63f3-c702-4767-929a-3c0af60bf667` faktisk eksisterer
- Verifiser at ID er eksakt (case-sensitive)

### Feil: "Duplicate gym not found"

- Sjekk at gym med id `7c4312de-7707-4e6c-a145-9b04fddcb5cb` faktisk eksisterer
- Kanskje den allerede er slettet? Verifiser i gyms tabellen

### Noen referanser gjenstår etter repair

- Sjekk om det er andre tabeller som refererer gyms.id som ikke er inkludert i skriptet
- Kjør verifiseringsqueryen og undersøk manuelt
- Sjekk om det er constraints eller RLS policies som blokkerer updates

### Display endpoint finner fortsatt ingen sessions

- Verifiser at sessions faktisk har `gym_id = canonical_id` etter repair
- Sjekk at sessions har `status IN ('running', 'paused')`
- Sjekk at display resolver bruker riktig gym_id (kan være app-kode issue)

## Sikkerhet

- ✅ Skriptet bruker transaksjoner (kan rollback)
- ✅ Validerer at både canonical og duplicate gym eksisterer
- ✅ Viser dry-run før og etter endringer
- ✅ Ikke-destruktiv som standard (sletter ikke data)
- ✅ Viser detaljert output før commit
- ⚠️  STEP 6 er valgfri og destruktiv - uncomment kun hvis nødvendig

## Kontakt

Hvis du opplever problemer, sjekk:
1. Supabase logs for detaljerte feilmeldinger
2. Database constraints (kan være at noen constraints blokkerer endringer)
3. RLS policies (kan være at policies blokkerer updates)
4. App-kode som kan cache gym_id referanser

