# PRD

## Hva er denne filen?

Product Requirements Document. Dette dokumentet beskriver hva produktet eller prosjektet skal gjøre, hvilke krav som stilles, og hvilke mål som skal oppnås.

## Hvordan brukes den?

- Definerer produktets formål og scope
- Beskriver funksjonelle og ikke-funksjonelle krav
- Brukes som referansepunkt gjennom hele prosjektet
- Oppdateres når krav endres eller avklares

## Arbeidsflyt

PRD brukes som utgangspunkt når tasks planlegges og spesifiseres. Den gir kontekst og retning for alle beslutninger og implementeringer i prosjektet.

---

# Product Requirements Document - Trenings AI v1

## 1. Mål

### Primærmål
Gjennomføre gruppeøkt med tydelig flyt og timer på storskjerm, styrt av coach.

### Sekundærmål
- Robust synk: refresh/join midt i økta gir korrekt visning.
- Kjernearkitektur som senere kan utvides med øvelsesbibliotek og AI-moduler uten å endre "session engine".

## 2. Scope (v1)

### Inkludert
- Hardkodede templates (liste + definisjon)
- Starte en session fra template
- Session state engine:
  - running/paused/stopped/ended
  - aktiv blokk/step
  - end_time eller remaining (ved pause)
  - auto-advance ved timer=0
- Coach-dashboard med kontroller
- Display-side med sanntidsvisning og progresjon
- Robust håndtering av reconnect/refresh

### Ekskludert (non-goals)
- Template-builder/editor i UI
- Media (bilder/gif/video)
- AI-generering
- Spotify/musikk
- Medlemsdata, resultater, attendance, historikk-rapportering
- Flere samtidige sessions/rom

## 3. Brukerflyt

### Coach
1. Åpner coach-dashboard (innlogget)
2. Velger template fra liste
3. Starter session
4. Under økta:
   - Ser aktiv blokk/step og timer
   - Kan pause/resume
   - Kan overstyre auto-advance med Next/Prev step
   - Kan bytte blokk (Next/Prev block)
5. Stop → session avsluttes og display går til "ingen aktiv økt"

### Display
1. Åpner fast display-URL (ingen login)
2. Hvis aktiv session:
   - Viser aktiv blokk/step, stor timer, neste, progresjon
3. Hvis ingen aktiv session:
   - Viser "Ingen aktiv økt"
4. Ved refresh/join:
   - Leser state → beregner resttid → viser korrekt

## 4. Presis semantikk

### Start session
- Setter aktiv blokk = første blokk
- Setter aktiv step = første step i første blokk
- Status = running
- Setter step_end_time = now + step_duration

### Pause
- Kun mulig når status = running
- Beregn remaining_ms = step_end_time - now (gulv: 0)
- Status = paused
- Fjern/ignorer step_end_time (eller behold for audit, men ikke som sannhet)

### Resume
- Kun mulig når status = paused
- Status = running
- Sett step_end_time = now + remaining_ms

### Auto-advance
- Når status = running og remaining når 0:
  - Gå til neste step i samme blokk hvis finnes
  - Hvis blokk ferdig: gå til første step i neste blokk
  - Hvis siste step i siste blokk ferdig: status = ended, ingen aktiv step

### Next step (manuell override)
- Hvis running: hopp til neste step og start den umiddelbart med full varighet (ny step_end_time)
- Hvis paused: hopp til neste step, men forbli paused og sett remaining = full varighet for den nye stepen

### Prev step
- Alltid "restart full varighet" på forrige step
- Hvis running: start umiddelbart (ny step_end_time)
- Hvis paused: bli paused, remaining = full varighet

### Next/Prev block
- Gå til første step i målblokk (forutsigbarhet)
- Beholder running/paused-modus:
  - running → starter første step i målblokk umiddelbart (ny step_end_time)
  - paused → bytter "pekere" men forblir paused (remaining = full varighet for første step)

## 5. Dataflyt (høyt nivå)

1. Coach initierer "session" fra template
2. Backend lagrer:
   - "current session" for gym
   - session_state som eneste sanntidskilde
3. Display subscrib'er til endringer og henter state ved load
4. Display timer er lokal nedtelling basert på end_time, med resync for robusthet

## 6. Målbare suksesskriterier

- Oppstart: Coach kan starte en session fra template på < 30 sek (fra åpnet dashboard).
- Display load: Display viser korrekt aktiv session på < 10 sek etter åpning.
- Realtime-respons: Manuell Next/Prev reflekteres på display innen < 1 sek i 90% av tilfeller.
- Pause/resume-presisjon: Etter pause/resume er timer korrekt innen ±1 sek.
- Refresh mid-step: Refresh av display midt i step gir korrekt resttid innen ±1 sek (etter maks 2 sek).
- Auto-advance: I minst 5 fulle økter går systemet automatisk gjennom alle steps uten å henge eller hoppe feil.
- Fullføringshåndtering: Ved siste step → display viser tydelig "Økt ferdig"/"Ingen aktiv økt" og coach kan starte ny.

