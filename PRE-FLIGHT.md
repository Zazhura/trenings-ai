# PRE-FLIGHT

## Hva er denne filen?

Forberedelsesdokument som samler all nødvendig informasjon før utførelse av tasks begynner. Sikrer at alt er på plass før start.

## Hvordan brukes den?

- Dokumenterer forutsetninger og forberedelser
- Lister opp nødvendige ressurser og tilgang
- Beskriver miljø og konfigurasjon som trengs
- Verifiserer at alt er klart før utførelse starter

## Arbeidsflyt

PRE-FLIGHT gjennomgås før første task utføres. Den sikrer at alle forutsetninger er på plass og at systemet er klart for utførelse.

---

# Forutsetninger og forberedelser

## Må være klart før byggestart

### Supabase-prosjekt
- Supabase-prosjekt opprettet
- Auth aktivert (coach-innlogging)
- Realtime aktivert
- Avklart "gym identifier" (f.eks. crossfit-larvik) brukt i display-URL og data

### Testoppsett
- Display-enhet (helst PC/minipc koblet via HDMI for stabilitet)
- Nettverkstilgang (Wi‑Fi) for realistisk test
- En eller flere coach-brukere (kontoer) i Auth

## Kan mockes i MVP

- Musikk (Spotify)
- Media/øvelsesdemo
- AI-generering
- Historikk/rapporter/analytics
- Flere gyms/rom

## Konsekvens hvis mangler

- Uten realistisk display-test i salen øker risiko for at "imponerende" faktor feiler (lesbarhet, stabilitet, kiosk).
- Uten Supabase Auth/RLS tidlig kan man ende med feil tilgangsmodell (display må lese uten å kunne skrive).

