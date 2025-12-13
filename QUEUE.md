# QUEUE

## Hva er denne filen?

Oppgaveliste som viser hvilke tasks som skal utføres, i hvilken rekkefølge, og deres status.

## Hvordan brukes den?

- Lister alle planlagte tasks
- Viser rekkefølge og prioritering
- Sporer status på hver task
- Fungerer som arbeidsliste for utførelse

## Arbeidsflyt

QUEUE oppdateres når nye tasks legges til eller når status endres. Den brukes som primær referanse for hva som skal gjøres neste i prosjektet.

---

# Task Queue v1

## Status: PENDING

---

## 1. Infrastruktur og setup

### TASK-001: Initialize Next.js project with TypeScript
- **Description**: Create Next.js project with TypeScript configuration
- **Risk_level**: low
- **Dependencies**: None
- **Acceptance**: Next.js project created with TypeScript, tsconfig.json configured

### TASK-002: Install and configure Tailwind CSS
- **Description**: Install Tailwind CSS and configure postcss.config.js and tailwind.config.ts
- **Risk_level**: low
- **Dependencies**: TASK-001
- **Acceptance**: Tailwind CSS installed, configuration files created, styles working

### TASK-003: Install and configure shadcn/ui
- **Description**: Initialize shadcn/ui, install required dependencies, create components.json
- **Risk_level**: low
- **Dependencies**: TASK-002
- **Acceptance**: shadcn/ui initialized, components.json created, can import UI components

### TASK-004: Install Supabase client library
- **Description**: Install @supabase/supabase-js and create Supabase client configuration
- **Risk_level**: low
- **Dependencies**: TASK-001
- **Acceptance**: Supabase client library installed, client initialization file created

### TASK-005: Create Supabase client utility
- **Description**: Create lib/supabase.ts with client initialization using environment variables
- **Risk_level**: low
- **Dependencies**: TASK-004
- **Acceptance**: Supabase client utility created, reads from env variables

### TASK-006: Setup environment variables structure
- **Description**: Create .env.local.example with Supabase URL and anon key placeholders
- **Risk_level**: low
- **Dependencies**: TASK-005
- **Acceptance**: .env.local.example created with required Supabase variables

### TASK-007: Create basic app layout structure
- **Description**: Create app/layout.tsx with root HTML structure and global styles
- **Risk_level**: low
- **Dependencies**: TASK-002
- **Acceptance**: Root layout created, global styles applied

### TASK-008: Create home page redirect
- **Description**: Create app/page.tsx that redirects to /coach
- **Risk_level**: low
- **Dependencies**: TASK-007
- **Acceptance**: Home page redirects to /coach route

---

## 2. Backend state engine (core)

### TASK-009: Create database schema migration file
- **Description**: Create SQL migration file for sessions table with columns: id, gym_slug, status, current_block_index, current_step_index, step_end_time, remaining_ms, state_version, template_snapshot (JSONB), created_at, updated_at
- **Risk_level**: medium
- **Dependencies**: TASK-005
- **Acceptance**: SQL migration file created with complete schema definition

### TASK-010: Create TypeScript types for session state
- **Description**: Create types/session.ts with SessionStatus enum, SessionState interface, TemplateSnapshot interface matching PRD semantics
- **Risk_level**: low
- **Dependencies**: TASK-001
- **Acceptance**: TypeScript types created matching PRD state model

### TASK-011: Create session state operations - start
- **Description**: Create lib/session-operations.ts with startSession function that sets first block/step, status=running, step_end_time=now+duration
- **Risk_level**: medium
- **Dependencies**: TASK-009, TASK-010
- **Acceptance**: startSession function implemented according to PRD semantics

### TASK-012: Create session state operations - pause
- **Description**: Add pauseSession function that calculates remaining_ms, sets status=paused, removes step_end_time
- **Risk_level**: medium
- **Dependencies**: TASK-011
- **Acceptance**: pauseSession function implemented according to PRD semantics

### TASK-013: Create session state operations - resume
- **Description**: Add resumeSession function that sets status=running, step_end_time=now+remaining_ms
- **Risk_level**: medium
- **Dependencies**: TASK-012
- **Acceptance**: resumeSession function implemented according to PRD semantics

### TASK-014: Create session state operations - next step
- **Description**: Add nextStep function that advances to next step with full duration if running, or sets remaining to full duration if paused
- **Risk_level**: medium
- **Dependencies**: TASK-013
- **Acceptance**: nextStep function implemented according to PRD semantics

### TASK-015: Create session state operations - prev step
- **Description**: Add prevStep function that goes to previous step and restarts with full duration
- **Risk_level**: medium
- **Dependencies**: TASK-014
- **Acceptance**: prevStep function implemented according to PRD semantics

### TASK-016: Create session state operations - next block
- **Description**: Add nextBlock function that goes to first step of next block, preserves running/paused state
- **Risk_level**: medium
- **Dependencies**: TASK-015
- **Acceptance**: nextBlock function implemented according to PRD semantics

### TASK-017: Create session state operations - prev block
- **Description**: Add prevBlock function that goes to first step of previous block, preserves running/paused state
- **Risk_level**: medium
- **Dependencies**: TASK-016
- **Acceptance**: prevBlock function implemented according to PRD semantics

### TASK-018: Create session state operations - stop
- **Description**: Add stopSession function that sets status=stopped
- **Risk_level**: low
- **Dependencies**: TASK-017
- **Acceptance**: stopSession function implemented

### TASK-019: Implement auto-advance logic
- **Description**: Create lib/auto-advance.ts with function that checks step_end_time, advances to next step/block or sets ended status, increments state_version
- **Risk_level**: medium
- **Dependencies**: TASK-018
- **Acceptance**: Auto-advance logic implemented according to PRD semantics

### TASK-020: Create Realtime subscription utility
- **Description**: Create lib/realtime.ts with function to subscribe to session state changes for a gym_slug
- **Risk_level**: medium
- **Dependencies**: TASK-005, TASK-010
- **Acceptance**: Realtime subscription utility created, can listen to state changes

### TASK-021: Create RLS policies for sessions table
- **Description**: Create SQL file with RLS policies: authenticated users can read/write, anonymous can read only
- **Risk_level**: medium
- **Dependencies**: TASK-009
- **Acceptance**: RLS policies created and documented

---

## 3. Templates (v1)

### TASK-022: Define template TypeScript interface
- **Description**: Create types/template.ts with Block, Step, Template interfaces
- **Risk_level**: low
- **Dependencies**: TASK-010
- **Acceptance**: Template types defined matching PRD structure

### TASK-023: Create hardcoded template data
- **Description**: Create lib/templates.ts with 4-8 hardcoded templates, each with blocks and steps
- **Risk_level**: low
- **Dependencies**: TASK-022
- **Acceptance**: Hardcoded templates created, all steps have duration > 0

### TASK-024: Create template snapshot function
- **Description**: Create function that serializes template to JSON for storage in session
- **Risk_level**: low
- **Dependencies**: TASK-023
- **Acceptance**: Template snapshot function creates JSON matching template structure

---

## 4. Coach-dashboard (controller)

### TASK-025: Create protected route middleware
- **Description**: Create middleware or layout for /coach route that requires authentication
- **Risk_level**: medium
- **Dependencies**: TASK-005
- **Acceptance**: /coach route requires authentication, redirects if not logged in

### TASK-026: Create coach dashboard page
- **Description**: Create app/coach/page.tsx with basic layout
- **Risk_level**: low
- **Dependencies**: TASK-025
- **Acceptance**: Coach dashboard page created

### TASK-027: Create template selector component
- **Description**: Create component that displays list of templates and allows selection
- **Risk_level**: low
- **Dependencies**: TASK-023, TASK-026
- **Acceptance**: Template selector displays templates, can select one

### TASK-028: Create Start Session button
- **Description**: Add Start button that calls startSession with selected template
- **Risk_level**: medium
- **Dependencies**: TASK-027, TASK-011, TASK-024
- **Acceptance**: Start button creates session with template snapshot

### TASK-029: Create session status display
- **Description**: Create component showing current block, step, timer, status
- **Risk_level**: low
- **Dependencies**: TASK-026, TASK-020
- **Acceptance**: Session status displays current state from Realtime

### TASK-030: Create Pause button
- **Description**: Add Pause button that calls pauseSession, only enabled when status=running
- **Risk_level**: low
- **Dependencies**: TASK-029, TASK-012
- **Acceptance**: Pause button works according to PRD semantics

### TASK-031: Create Resume button
- **Description**: Add Resume button that calls resumeSession, only enabled when status=paused
- **Risk_level**: low
- **Dependencies**: TASK-030, TASK-013
- **Acceptance**: Resume button works according to PRD semantics

### TASK-032: Create Stop button
- **Description**: Add Stop button that calls stopSession
- **Risk_level**: low
- **Dependencies**: TASK-031, TASK-018
- **Acceptance**: Stop button ends session

### TASK-033: Create Next Step button
- **Description**: Add Next Step button that calls nextStep
- **Risk_level**: low
- **Dependencies**: TASK-032, TASK-014
- **Acceptance**: Next Step button works according to PRD semantics

### TASK-034: Create Prev Step button
- **Description**: Add Prev Step button that calls prevStep
- **Risk_level**: low
- **Dependencies**: TASK-033, TASK-015
- **Acceptance**: Prev Step button works according to PRD semantics

### TASK-035: Create Next Block button
- **Description**: Add Next Block button that calls nextBlock
- **Risk_level**: low
- **Dependencies**: TASK-034, TASK-016
- **Acceptance**: Next Block button works according to PRD semantics

### TASK-036: Create Prev Block button
- **Description**: Add Prev Block button that calls prevBlock
- **Risk_level**: low
- **Dependencies**: TASK-035, TASK-017
- **Acceptance**: Prev Block button works according to PRD semantics

### TASK-037: Implement auto-advance polling
- **Description**: Create useEffect in coach dashboard that polls auto-advance logic when session is running
- **Risk_level**: medium
- **Dependencies**: TASK-036, TASK-019
- **Acceptance**: Auto-advance triggers automatically when step_end_time reached

---

## 5. Display-side (read-only)

### TASK-038: Create display route structure
- **Description**: Create app/display/[gymSlug]/page.tsx with dynamic route
- **Risk_level**: low
- **Dependencies**: TASK-007
- **Acceptance**: Display route created, accessible without authentication

### TASK-039: Create display page layout
- **Description**: Create full-screen layout optimized for large display with large timer
- **Risk_level**: low
- **Dependencies**: TASK-038
- **Acceptance**: Display layout created, full-screen, readable from distance

### TASK-040: Implement Realtime subscription in display
- **Description**: Subscribe to session state changes for gymSlug, fetch initial state on load
- **Risk_level**: medium
- **Dependencies**: TASK-039, TASK-020
- **Acceptance**: Display subscribes to state changes, shows current state

### TASK-041: Create local countdown timer
- **Description**: Create timer component that calculates remaining time from step_end_time, updates every second
- **Risk_level**: medium
- **Dependencies**: TASK-040
- **Acceptance**: Timer displays countdown, handles timezone offsets

### TASK-042: Display current block name
- **Description**: Show current block name from template snapshot
- **Risk_level**: low
- **Dependencies**: TASK-041
- **Acceptance**: Current block name displayed

### TASK-043: Display current step title
- **Description**: Show current step title from template snapshot
- **Risk_level**: low
- **Dependencies**: TASK-042
- **Acceptance**: Current step title displayed

### TASK-044: Display large countdown timer
- **Description**: Show countdown timer in large, readable format (mm:ss)
- **Risk_level**: low
- **Dependencies**: TASK-041
- **Acceptance**: Large timer displayed prominently

### TASK-045: Display next step preview
- **Description**: Show next step title and duration, or first step of next block if last step in block
- **Risk_level**: low
- **Dependencies**: TASK-043
- **Acceptance**: Next step preview displayed correctly

### TASK-046: Display progress indicator
- **Description**: Show progress bar and "Step X/Y" based on current position in template
- **Risk_level**: low
- **Dependencies**: TASK-045
- **Acceptance**: Progress indicator shows correct position

### TASK-047: Handle "no active session" state
- **Description**: Display "Ingen aktiv økt" message when no active session exists
- **Risk_level**: low
- **Dependencies**: TASK-040
- **Acceptance**: Empty state displayed when no session

### TASK-048: Handle "session ended" state
- **Description**: Display "Økt ferdig" message when session status is ended
- **Risk_level**: low
- **Dependencies**: TASK-047
- **Acceptance**: Ended state displayed correctly

### TASK-049: Display "waiting for next step" state
- **Description**: Show "Venter på neste steg" when step_end_time passed but no state update received
- **Risk_level**: low
- **Dependencies**: TASK-044
- **Acceptance**: Waiting state displayed according to guardrail

---

## 6. Robusthet og edge cases

### TASK-050: Handle refresh mid-step
- **Description**: Ensure display calculates correct remaining time when page loads mid-step
- **Risk_level**: medium
- **Dependencies**: TASK-041
- **Acceptance**: Refresh mid-step shows correct remaining time within ±1 sec

### TASK-051: Implement time sync/resync
- **Description**: Add periodic resync of server time to handle clock drift
- **Risk_level**: medium
- **Dependencies**: TASK-050
- **Acceptance**: Timer resyncs periodically to handle clock offset

### TASK-052: Handle Realtime reconnection
- **Description**: Implement reconnection logic and fetch latest state on reconnect
- **Risk_level**: medium
- **Dependencies**: TASK-040
- **Acceptance**: Reconnection fetches latest state, no stale data

### TASK-053: Implement idempotent state updates
- **Description**: Use state_version to prevent duplicate updates, optimistic locking
- **Risk_level**: medium
- **Dependencies**: TASK-011
- **Acceptance**: State updates are idempotent, no duplicate auto-advance

### TASK-054: Handle edge case - last step in last block
- **Description**: Ensure ended status is set correctly when last step completes
- **Risk_level**: low
- **Dependencies**: TASK-019
- **Acceptance**: Last step sets ended status correctly

### TASK-055: Handle edge case - pause at exactly 0
- **Description**: Ensure remaining_ms is never negative (floor to 0)
- **Risk_level**: low
- **Dependencies**: TASK-012
- **Acceptance**: Remaining time never negative

### TASK-056: Add error boundaries
- **Description**: Add React error boundaries for display and coach dashboard
- **Risk_level**: low
- **Dependencies**: TASK-026, TASK-038
- **Acceptance**: Error boundaries catch and display errors gracefully

### TASK-057: Add loading states
- **Description**: Add loading indicators for initial state fetch and Realtime connection
- **Risk_level**: low
- **Dependencies**: TASK-040
- **Acceptance**: Loading states shown during initialization

---

## 7. Final validation

### TASK-058: Run lint check
- **Description**: Run linting and fix any errors
- **Risk_level**: low
- **Dependencies**: All previous tasks
- **Acceptance**: No lint errors

### TASK-059: Run type check
- **Description**: Run TypeScript type checking and fix any errors
- **Risk_level**: low
- **Dependencies**: TASK-058
- **Acceptance**: No type errors

### TASK-060: Build check
- **Description**: Run production build and verify success
- **Risk_level**: low
- **Dependencies**: TASK-059
- **Acceptance**: Production build succeeds

