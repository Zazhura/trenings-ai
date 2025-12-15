Oppdatert discovery-baseline (låst for v1)



Basert på svarene dine er v1 nå tydelig avgrenset og kan spesifiseres presist:



Templates i v1: Et lite sett forhåndsdefinerte (hardkodet). Ingen template-builder.



Current session-regel: Maks én aktiv session per gym/sal.



Prev step: Gå til forrige step og start den på nytt (full varighet).



Pause/Resume: Pause fryser remaining time. Resume fortsetter nøyaktig der vi slapp.



Auto-advance: Systemet går automatisk til neste step når timer = 0. Coach kan overstyre med Next/Prev.



Display: Åpen fast URL (ingen login). Lang/ikke-indeksert URL er ok i v1.



Nedenfor er PRD/Decisions/Dependencies osv. revidert slik at Build PRO kan bygge uten å måtte gjette.



1) Idéen – presist i egne ord



Hva produktet er (v1):

En webbasert "session player" for CrossFit Larvik der coach starter og styrer en økt fra et dashboard, mens en display-side på storskjerm viser den aktive økta i sanntid med tydelig step-timer, hva som er nå/neste, og total progresjon.



Hva produktet ikke er (v1):



Ikke en øktbygger (templates er forhåndsdefinert/hardkodet).



Ikke medievisning av øvelser (gif/video/bilder).



Ikke AI-generering av økter.



Ikke musikk/Spotify-styring.



Ikke medlemssystem, booking, scoring/resultater, attendance, logging per utøver.



Ikke multi-rom eller flere samtidige sessions.



Kjerneverdi i v1:

Coach kan gjennomføre en hel økt med lav friksjon, og deltakerne får en "proff" storskjermvisning som følger flyten og timeren riktig – også ved refresh/ny klient.



2) Konkret MVP (v1) – 2–3 uker (realistisk)

MVP-innhold (låst)



A. Predefinerte økter (templates)



3–8 hardkodede templates (anbefaling: minst 4 som dekker typiske timer)



Hver template består av:



Blokker (warmup/strength/metcon/cooldown + navn)



Steps per blokk: tittel + varighet (sekunder)



For å holde MVP enkel: "hvile" håndteres som egne steps (f.eks. "Rest 00:30"), så alle steps er like i motoren.



B. Coach-dashboard



Template-velger → "Start session"



Live-kontroller:



Start (starter session og timer)



Pause (fryser remaining)



Resume (fortsetter med samme remaining)



Stop (avslutter session)



Next/Prev step (Prev = full varighet restart)



Next/Prev blokk (se presis semantikk under)



C. Display-side (storskjerm)



Viser alltid "current session" i sanntid:



Aktiv blokk



Aktiv step (tekst)



Stor nedtelling (mm:ss)



"Neste" (step + varighet; hvis siste step i blokk → vis første step i neste blokk + "Neste blokk")



Total progresjon (progress bar + "Step X/Y")



D. Realtime og robust tid



Backend lagrer minimal state (status, end_time/remaining, aktiv blokk/step, versjon)



Display regner ned lokalt basert på end_time + jevnlig resync



Ny klient midt i økta viser korrekt resttid



Bevisste non-goals i MVP



Ingen template-redigering i UI



Ingen media/AI/musikk



Ingen persondata/utøverdata



Ingen multi-session/multi-rom



3) Proposed PRD (DRAFT)

3.1 Mål



Primærmål



Gjennomføre gruppeøkt med tydelig flyt og timer på storskjerm, styrt av coach.



Sekundærmål



Robust synk: refresh/join midt i økta gir korrekt visning.



Kjernearkitektur som senere kan utvides med øvelsesbibliotek og AI-moduler uten å endre "session engine".



3.2 Scope (v1)



Inkludert



Hardkodede templates (liste + definisjon)



Starte en session fra template



Session state engine:



running/paused/stopped/ended



aktiv blokk/step



end_time eller remaining (ved pause)



auto-advance ved timer=0



Coach-dashboard med kontroller



Display-side med sanntidsvisning og progresjon



Robust håndtering av reconnect/refresh



Eksplisitt ekskludert (non-goals)



Template-builder/editor i UI



Media (bilder/gif/video)



AI-generering



Spotify/musikk



Medlemsdata, resultater, attendance, historikk-rapportering



Flere samtidige sessions/rom



3.3 Brukerflyt

Coach



Åpner coach-dashboard (innlogget)



Velger template fra liste



Starter session



Under økta:



Ser aktiv blokk/step og timer



Kan pause/resume



Kan overstyre auto-advance med Next/Prev step



Kan bytte blokk (Next/Prev block)



Stop → session avsluttes og display går til "ingen aktiv økt"



Display



Åpner fast display-URL (ingen login)



Hvis aktiv session:



Viser aktiv blokk/step, stor timer, neste, progresjon



Hvis ingen aktiv session:



Viser "Ingen aktiv økt"



Ved refresh/join:



Leser state → beregner resttid → viser korrekt



3.4 Presis semantikk (må bygges "som spesifisert")



Start session



Setter aktiv blokk = første blokk



Setter aktiv step = første step i første blokk



Status = running



Setter step_end_time = now + step_duration



Pause



Kun mulig når status = running



Beregn remaining_ms = step_end_time - now (gulv: 0)



Status = paused



Fjern/ignorer step_end_time (eller behold for audit, men ikke som sannhet)



Resume



Kun mulig når status = paused



Status = running



Sett step_end_time = now + remaining_ms



Auto-advance



Når status = running og remaining når 0:



Gå til neste step i samme blokk hvis finnes



Hvis blokk ferdig: gå til første step i neste blokk



Hvis siste step i siste blokk ferdig: status = ended, ingen aktiv step



Next step (manuell override)



Hvis running: hopp til neste step og start den umiddelbart med full varighet (ny step_end_time)



Hvis paused: hopp til neste step, men forbli paused og sett remaining = full varighet for den nye stepen



Prev step



Alltid "restart full varighet" på forrige step



Hvis running: start umiddelbart (ny step_end_time)



Hvis paused: bli paused, remaining = full varighet



Next/Prev block



Gå til første step i målblokk (forutsigbarhet)



Beholder running/paused-modus:



running → starter første step i målblokk umiddelbart (ny step_end_time)



paused → bytter "pekere" men forblir paused (remaining = full varighet for første step)



3.5 Dataflyt (høyt nivå)



Coach initierer "session" fra template



Backend lagrer:



"current session" for gym



session_state som eneste sanntidskilde



Display subscrib'er til endringer og henter state ved load



Display timer er lokal nedtelling basert på end_time, med resync for robusthet



3.6 Suksesskriterier (PRD-nivå)



En coach kan gjennomføre full økt med auto-advance uten at display faller ut av synk.



Refresh/join midt i økta viser korrekt resttid.



Kontroller oppleves responsiv i praksis.



4) Decisions (DRAFT)

4.1 Arkitektur og stack (foreslått)



Frontend



Next.js + TypeScript



Tailwind + shadcn/ui



To "flater":



/coach (autentisert)



/display/<gymSlug> (åpen)



Backend



Supabase:



Postgres (sessions + state)



Auth (coach)



Realtime (state broadcast)



4.2 Templates i v1 (låst beslutning)



Templates er hardkodet og deployes sammen med appen.



Anbefalt robusthet: Når coach starter en session, lagres et "snapshot" av template-strukturen i session-record (JSON).

Dette gjør session uavhengig av fremtidige template-endringer i kode og forenkler display (display leser alltid fra session snapshot).



4.3 State-modell (låst prinsipp)



Backend lagrer kun runtime-state, og klienter regner ned lokalt basert på step_end_time (UTC) eller remaining_ms ved pause.



Anbefalt tillegg for robusthet:



state_version (integer) økes ved hver state-endring.



Oppdateringer bør være "idempotente" og helst "optimistisk låst" (unngå dobbelt auto-advance hvis flere klienter prøver samtidig).



4.4 Auto-advance – foreslått ansvar (v1)



Valg for MVP (enkelt og sikkert med RLS):



Auto-advance trigges av coach-dashboard (autentisert klient) basert på step_end_time.



Backend er "source of truth" og oppdateres ved step-end.



Konsekvens/risiko:



Hvis coach-enheten går i dvale eller mister nett, kan auto-advance stoppe.

Mitigasjon i MVP: coach kan bruke Next manuelt; i praksis bør coach-enheten holdes aktiv.



Hvis dere ønsker mer robust auto-advance uten å stole på coach-klienten, er neste steg (v1.1) typisk en serverdrevet "tick/cron"-mekanisme. Det holdes utenfor 2–3 ukers MVP.



4.5 Sikkerhet (låst beslutning)



Display er åpen og krever ikke login.



Ingen persondata i v1, så risikoen ved "view access" er lav.



Skriv/endre state er kun for autentisert coach.



Antakelse: "Lang URL" er nok i MVP.

(Det er security-by-obscurity; ok her gitt lav sensitivitet.)



5) Dependencies & Access (Discovery)

Må være klart før byggestart



Supabase-prosjekt opprettet (ingen nøkler deles her):



Auth aktivert (coach-innlogging)



Realtime aktivert



Avklart "gym identifier" (f.eks. crossfit-larvik) brukt i display-URL og data



Testoppsett i boks:



Display-enhet (helst PC/minipc koblet via HDMI for stabilitet)



Nettverkstilgang (Wi‑Fi) for realistisk test



En eller flere coach-brukere (kontoer) i Auth



Kan mockes i MVP



Musikk (Spotify)



Media/øvelsesdemo



AI-generering



Historikk/rapporter/analytics



Flere gyms/rom



Konsekvens hvis mangler



Uten realistisk display-test i salen øker risiko for at "imponerende" faktor feiler (lesbarhet, stabilitet, kiosk).



Uten Supabase Auth/RLS tidlig kan man ende med feil tilgangsmodell (display må lese uten å kunne skrive).



6) Hovedrisikoer (oppdatert)



Auto-advance avhengig av coach-klient – Høy

Hvis coach-enhet sover/reloader/ mister nett ved step-end kan auto-advance stoppe.



Casting/display-stabilitet (Chromecast/iPad casting) – Høy

Casting kan droppe ved nettbytte/hvilemodus. HDMI-PC er tryggere.



Tidssynk og drift – Middels

Klientklokker kan avvike → anbefalt offset/resync.



Realtime/reconnect edge cases – Middels

Tapte events kan gi feil state uten "fetch latest state" fallback.



Scope creep – Lav–middels

Fristelsen til å "bare legge til template-editor" kan sprenge 2–3 uker.



7) Eksplisitte antakelser (oppdatert)



Alle steps er tidsbaserte (har varighet > 0).

Hvis feil: dere trenger "untimed steps"/manuell progresjon som egen type.



Én sal/gym, én aktiv session.

Hvis feil: krever multi-session routing og mer kompleks display.



Ingen persondata i v1.

Hvis feil: GDPR/tilganger må designes annerledes.



Coach-enhet holdes aktiv under økta.

Hvis feil: auto-advance må serverdrives.



Display er "read-only" og kan være offentlig.

Hvis feil: må ha token/kode eller enkel tilgangskontroll.



8) Målbare MVP-suksesskriterier (låst)



Oppstart: Coach kan starte en session fra template på < 30 sek (fra åpnet dashboard).



Display load: Display viser korrekt aktiv session på < 10 sek etter åpning.



Realtime-respons: Manuell Next/Prev reflekteres på display innen < 1 sek i 90% av tilfeller.



Pause/resume-presisjon: Etter pause/resume er timer korrekt innen ±1 sek.



Refresh mid-step: Refresh av display midt i step gir korrekt resttid innen ±1 sek (etter maks 2 sek).



Auto-advance: I minst 5 fulle økter går systemet automatisk gjennom alle steps uten å henge eller hoppe feil.



Fullføringshåndtering: Ved siste step → display viser tydelig "Økt ferdig"/"Ingen aktiv økt" og coach kan starte ny.




