# DECISIONS

## Hva er denne filen?

Arkiv for alle viktige beslutninger tatt underveis i prosjektet. Dokumenterer valg, alternativer og begrunnelser.

## Hvordan brukes den?

- Registrerer beslutninger når de tas
- Dokumenterer alternativer som ble vurdert
- Forklarer begrunnelsen bak valgene
- Fungerer som referanse for fremtidige beslutninger

## Arbeidsflyt

Når en viktig beslutning tas, dokumenteres den her med dato, kontekst og begrunnelse. Dette gir sporbarhet og hjelper ved fremtidige lignende valg.

---

# Tekniske beslutninger - Trenings AI v1

## 4.1 Arkitektur og stack

### Frontend
**LÅST**: Next.js + TypeScript, Tailwind + shadcn/ui

To "flater":
- `/coach` (autentisert)
- `/display/<gymSlug>` (åpen)

### Backend
**LÅST**: Supabase:
- Postgres (sessions + state)
- Auth (coach)
- Realtime (state broadcast)

## 4.2 Templates i v1

**LÅST**: Templates er hardkodet og deployes sammen med appen.

**ANTAKELSE**: Når coach starter en session, lagres et "snapshot" av template-strukturen i session-record (JSON). Dette gjør session uavhengig av fremtidige template-endringer i kode og forenkler display (display leser alltid fra session snapshot).

## 4.3 State-modell

**LÅST PRINSIPP**: Backend lagrer kun runtime-state, og klienter regner ned lokalt basert på step_end_time (UTC) eller remaining_ms ved pause.

**ANTAKELSE**: 
- state_version (integer) økes ved hver state-endring.
- Oppdateringer bør være "idempotente" og helst "optimistisk låst" (unngå dobbelt auto-advance hvis flere klienter prøver samtidig).

## 4.4 Auto-advance – ansvar (v1)

**LÅST**: Auto-advance trigges av coach-dashboard (autentisert klient) basert på step_end_time.

**ANTAKELSE**: 
- Backend er "source of truth" og oppdateres ved step-end.
- Hvis coach-enheten går i dvale eller mister nett, kan auto-advance stoppe.
- Mitigasjon i MVP: coach kan bruke Next manuelt; i praksis bør coach-enheten holdes aktiv.

## 4.5 Sikkerhet

**LÅST**: 
- Display er åpen og krever ikke login.
- Ingen persondata i v1, så risikoen ved "view access" er lav.
- Skriv/endre state er kun for autentisert coach.

**ANTAKELSE**: "Lang URL" er nok i MVP (security-by-obscurity; ok her gitt lav sensitivitet).

## 4.6 Session-regel

**LÅST**: Maks én aktiv session per gym/sal.

## 4.7 Auto-advance guardrail (v1)

**LÅST**: Hvis `step_end_time` er passert og ingen ny state-endring har skjedd:
- Display skal vise tydelig: "Venter på neste steg"
- Systemet skal IKKE forsøke å gjette neste state
- Coach kan alltid trykke **Next** manuelt

Dette er bevisst valgt for robusthet uten server-tick i v1.

