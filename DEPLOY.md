# Vercel Preview Deploy Guide

## Status
- ✅ Git repo initialisert
- ✅ Commit: "init: Trenings AI base" (3128faa)
- ✅ Build verifisert lokalt (`npm run build` ✅)
- ✅ `.gitignore` konfigurert for Next.js
- ⏳ GitHub repo må opprettes manuelt
- ⏳ Vercel-integrasjon må settes opp manuelt

## Nødvendige Environment Variables

Appen krever følgende environment variables i Vercel:

1. **NEXT_PUBLIC_SUPABASE_URL** - Din Supabase project URL
   - Format: `https://[project-id].supabase.co`
   - Finnes i: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Din Supabase anon/public key
   - Format: Lang alfanumerisk streng
   - Finnes i: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

## Steg-for-steg instruksjoner

### 1. Opprett GitHub Repository

**Via GitHub Web UI:**
1. Gå til https://github.com/new
2. Repository name: `trenings-ai`
3. Visibility: **Private** (eller Public hvis eksplisitt ønsket)
4. Ikke initialiser med README, .gitignore eller license
5. Klikk "Create repository"

**Etter opprettelse, kopier repo-URL:**
- Format: `https://github.com/[username]/trenings-ai.git`
- Eller SSH: `git@github.com:[username]/trenings-ai.git`

### 2. Legg til Remote og Push

Når du har repo-URL, kjør disse kommandoene lokalt:

```bash
# Legg til remote
git remote add origin https://github.com/[username]/trenings-ai.git

# Push master branch
git push -u origin master
```

### 3. Koble til Vercel

**Via Vercel Web UI:**
1. Gå til https://vercel.com/new
2. Logg inn med GitHub-konto
3. Velg "Import Git Repository"
4. Velg `trenings-ai` repoet
5. Konfigurer prosjektet:
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
   - **Root Directory:** `./` (default)

### 4. Konfigurer Environment Variables

I Vercel-prosjektet, gå til Settings → Environment Variables:

**For Preview environment, legg til:**
- `NEXT_PUBLIC_SUPABASE_URL` - Din Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Din Supabase anon/public key

**Viktig:** 
- Bruk Preview environment (ikke Production)
- Disse verdiene finnes i Supabase Dashboard → Settings → API

### 5. Trigger Deploy

Etter konfigurering:
- Vercel vil automatisk deploye når du pusher til master
- Eller klikk "Deploy" i Vercel Dashboard

### 6. Verifiser Deploy

Etter deploy:
- Sjekk Vercel Dashboard for deploy-status
- Kopier Preview URL (format: `https://trenings-ai-[hash].vercel.app`)
- Test at appen fungerer

## Miljøvariabler som trengs

Sjekk `.env.local.example` for hvilke variabler som trengs. Disse må settes i Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

**Build feiler:**
- Sjekk at alle environment variables er satt
- Sjekk build logs i Vercel Dashboard

**App fungerer ikke:**
- Verifiser at Supabase URL og key er korrekte
- Sjekk browser console for feil
- Sjekk Vercel function logs

## Neste steg etter deploy

1. Test alle routes:
   - `/` - Home
   - `/coach` - Coach dashboard
   - `/display/[gymSlug]` - Display view
   - `/login` - Login page

2. Verifiser Supabase-kobling fungerer

3. Test session-funksjonalitet

