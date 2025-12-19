# Database Inventory Report

**Generated:** 2025-12-19  
**Codebase Version:** d006ffc (feat: add optional svg-based exercise media pack)  
**Purpose:** Identify all database objects (tables, functions, policies, triggers) actually used by the application

---

## Summary

This codebase uses a **minimal database schema** with only:
- **1 table**: `sessions`
- **1 function**: `update_updated_at_column()` (trigger function)
- **1 trigger**: `update_sessions_updated_at`
- **5 RLS policies** on `sessions` table
- **0 RPC functions**
- **0 storage buckets**
- **0 views**

---

## 1. Tables Used

### `sessions`

**Schema:** `public.sessions`  
**Purpose:** Stores training session state for gyms

**Columns:**
- `id` (UUID, PRIMARY KEY)
- `gym_slug` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL, CHECK constraint)
- `current_block_index` (INTEGER, NOT NULL, DEFAULT 0)
- `current_step_index` (INTEGER, NOT NULL, DEFAULT 0)
- `step_end_time` (TIMESTAMPTZ, nullable)
- `remaining_ms` (INTEGER, nullable)
- `state_version` (INTEGER, NOT NULL, DEFAULT 1)
- `template_snapshot` (JSONB, NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Indexes:**
- `idx_sessions_gym_slug` on `gym_slug`
- `idx_sessions_status` on `status`

**Usage in Code:**

| File | Line | Operation | Description |
|------|------|-----------|-------------|
| `lib/session-operations.ts` | 28 | INSERT | `startSession()` - Create new session |
| `lib/session-operations.ts` | 71 | SELECT | `pauseSession()` - Fetch current session |
| `lib/session-operations.ts` | 99 | UPDATE | `pauseSession()` - Update session to paused |
| `lib/session-operations.ts` | 139 | SELECT | `resumeSession()` - Fetch paused session |
| `lib/session-operations.ts` | 165 | UPDATE | `resumeSession()` - Update session to running |
| `lib/session-operations.ts` | 225 | SELECT | `nextStep()` - Fetch current session |
| `lib/session-operations.ts` | 261 | UPDATE | `nextStep()` - Update to next step |
| `lib/session-operations.ts` | 304 | UPDATE | `nextStep()` - End session if last step |
| `lib/session-operations.ts` | 328 | SELECT | `prevStep()` - Fetch current session |
| `lib/session-operations.ts` | 388 | UPDATE | `prevStep()` - Update to previous step |
| `lib/session-operations.ts` | 412 | SELECT | `nextBlock()` - Fetch current session |
| `lib/session-operations.ts` | 457 | UPDATE | `nextBlock()` - Update to next block |
| `lib/session-operations.ts` | 481 | SELECT | `stopSession()` - Fetch current session |
| `lib/session-operations.ts` | 526 | UPDATE | `stopSession()` - Update session to stopped |
| `lib/session-operations.ts` | 547 | SELECT | `checkAndAdvanceSession()` - Fetch session for auto-advance |
| `lib/session-operations.ts` | 558 | UPDATE | `checkAndAdvanceSession()` - End session if workout complete |
| `lib/auto-advance.ts` | 37 | SELECT | `checkAndAdvanceSession()` - Fetch session state |
| `lib/auto-advance.ts` | 116 | UPDATE | `checkAndAdvanceSession()` - End session if last block |
| `lib/realtime.ts` | 79 | SELECT | `getCurrentSession()` - Fetch active session for gym |

**Realtime Subscription:**
- `lib/realtime.ts` line 34-40: Subscribes to `postgres_changes` on `sessions` table with filter `gym_slug=eq.{gymSlug}`

**RLS Policies:**
- See section 3 below

---

## 2. Functions Used

### `update_updated_at_column()`

**Schema:** `public.update_updated_at_column`  
**Type:** Trigger function (PL/pgSQL)  
**Purpose:** Automatically updates `updated_at` timestamp on row update

**Definition Location:** `supabase/migrations/001_create_sessions_table.sql` lines 23-29

**Usage:**
- Called by trigger `update_sessions_updated_at` (see Triggers section)

**Parameters:** None (trigger function)  
**Returns:** `TRIGGER`

---

## 3. RLS Policies Used

All policies are on `sessions` table.

**Definition Location:** `supabase/migrations/002_enable_rls_and_policies.sql`

### Policy: "Authenticated users can read sessions"
- **Operation:** SELECT
- **Role:** `authenticated`
- **Condition:** `USING (true)` - allows all reads
- **File:** `supabase/migrations/002_enable_rls_and_policies.sql` lines 5-9

### Policy: "Authenticated users can insert sessions"
- **Operation:** INSERT
- **Role:** `authenticated`
- **Condition:** `WITH CHECK (true)` - allows all inserts
- **File:** `supabase/migrations/002_enable_rls_and_policies.sql` lines 11-15

### Policy: "Authenticated users can update sessions"
- **Operation:** UPDATE
- **Role:** `authenticated`
- **Condition:** `USING (true) WITH CHECK (true)` - allows all updates
- **File:** `supabase/migrations/002_enable_rls_and_policies.sql` lines 17-22

### Policy: "Authenticated users can delete sessions"
- **Operation:** DELETE
- **Role:** `authenticated`
- **Condition:** `USING (true)` - allows all deletes
- **File:** `supabase/migrations/002_enable_rls_and_policies.sql` lines 24-28

### Policy: "Anonymous users can read sessions"
- **Operation:** SELECT
- **Role:** `anon`
- **Condition:** `USING (true)` - allows all reads (for display screens)
- **File:** `supabase/migrations/002_enable_rls_and_policies.sql` lines 31-35

---

## 4. Triggers Used

### `update_sessions_updated_at`

**Table:** `sessions`  
**Timing:** BEFORE UPDATE  
**Function:** `update_updated_at_column()`  
**Purpose:** Automatically sets `updated_at = NOW()` on any row update

**Definition Location:** `supabase/migrations/001_create_sessions_table.sql` lines 32-35

**Usage:**
- Automatically triggered on every UPDATE to `sessions` table
- No explicit calls in application code (handled by database)

---

## 5. RPC Functions Used

**None found.**

No `.rpc()` calls found in the codebase.

---

## 6. Storage Buckets Used

**None found.**

No storage bucket references found in the codebase.

---

## 7. Views Used

**None found.**

No views referenced in the codebase.

---

## 8. Unknown/Indirect References

### Potential Dynamic Table Names
- **None found.** All table references use string literals (`'sessions'`).

### Potential Dynamic Function Names
- **None found.** No RPC calls found.

### Potential Dynamic Policy References
- **None found.** Policies are created via migrations, not referenced dynamically.

---

## 9. Migration Files

### `supabase/migrations/001_create_sessions_table.sql`
- Creates `sessions` table
- Creates indexes: `idx_sessions_gym_slug`, `idx_sessions_status`
- Creates function: `update_updated_at_column()`
- Creates trigger: `update_sessions_updated_at`

### `supabase/migrations/002_enable_rls_and_policies.sql`
- Enables RLS on `sessions` table
- Creates 5 RLS policies (see section 3)

---

## 10. Schema Objects NOT Used by Application

Based on this inventory, the following objects **should NOT exist** in production database (if they do, they are unused):

- Any tables other than `sessions`
- Any functions other than `update_updated_at_column()`
- Any triggers other than `update_sessions_updated_at`
- Any policies other than the 5 listed above
- Any views
- Any RPC functions
- Any storage buckets
- Any custom types/enums (except those used by `sessions` table)

---

## Notes

- This is a **minimal MVP** codebase with only session state management
- All templates are hardcoded in `lib/templates.ts` (not stored in database)
- No user management tables (Supabase Auth handles users)
- No gym management tables (gyms identified by `gym_slug` string only)
- No exercise database tables (exercises are hardcoded)

---

## Cleanup Strategy

### Approach: Archive-First, Reversible

The cleanup strategy follows a **conservative, archive-first approach**:

1. **No immediate deletion** - All unused objects are moved to `archive` schema
2. **Reversible** - Objects can be restored using REVERT section
3. **Safe operations** - Only schema moves and trigger disabling (no DROP)
4. **Protected objects** - `sessions` table and related objects are NEVER touched

### Protected Objects (Never Modified)

The following objects are **protected** and will NOT be archived or modified:

- ✅ `sessions` table (and all its columns, indexes)
- ✅ `update_updated_at_column()` function
- ✅ `update_sessions_updated_at` trigger
- ✅ All 5 RLS policies on `sessions` table:
  - "Authenticated users can read sessions"
  - "Authenticated users can insert sessions"
  - "Authenticated users can update sessions"
  - "Authenticated users can delete sessions"
  - "Anonymous users can read sessions"

### Objects That Will Be Archived

Any objects in `public` schema that are NOT in the protected list above will be archived:

- Tables (except `sessions`)
- Functions (except `update_updated_at_column`)
- Triggers (except `update_sessions_updated_at`) - **disabled**, not deleted
- Policies (except sessions policies) - **dropped** (can be recreated from migrations)
- Views (all)

### Cleanup Script Structure

The cleanup script (`scripts/supabase_cleanup.sql`) has three sections:

#### SECTION 0: Preview Queries (READ-ONLY)
- Shows what will be archived before any changes
- **Always run this first**

#### SECTION A: Safe Operations (CAN BE RUN)
- Creates `archive` schema
- Moves unused tables to `archive` schema
- Moves unused functions to `archive` schema
- Disables unused triggers (does not delete)
- Drops unused policies (cannot be moved, but can be recreated)
- Moves unused views to `archive` schema
- Includes verification queries

#### SECTION B: Destructive Operations (COMMENTED OUT)
- ⚠️ **DO NOT UNCOMMENT** unless you are certain archived objects are not needed
- Permanently drops archived tables, functions, views
- Can drop `archive` schema itself
- **Requires manual confirmation before uncommenting**

#### SECTION C: Revert Operations (COMMENTED OUT)
- Restores archived tables to `public` schema
- Restores archived functions to `public` schema
- Re-enables disabled triggers
- Restores archived views to `public` schema
- **Use this if you need to restore archived objects**

### Execution Plan

1. **Run audit script** (`scripts/supabase_db_audit.sql`)
   - Compare results with this inventory
   - Identify any objects not documented here

2. **Run preview queries** (Section 0 of cleanup script)
   - Review what will be archived
   - Verify no protected objects are listed

3. **Run safe operations** (Section A)
   - Archives unused objects
   - Test application thoroughly

4. **Verify application works**
   - All functionality should work as before
   - No errors related to missing database objects

5. **After confirmation** (optional, not recommended)
   - Uncomment Section B only if you are certain archived objects are not needed
   - Have a database backup before running

6. **If restoration needed**
   - Uncomment Section C to restore archived objects

### Revert Plan

If you need to restore archived objects:

1. Uncomment Section C in `scripts/supabase_cleanup.sql`
2. Run the REVERT section
3. All archived objects will be moved back to `public` schema
4. Disabled triggers will be re-enabled
5. Note: Dropped policies will need to be recreated from migrations

---

## Verification Commands

To verify this inventory against actual database:

```sql
-- List all tables in public schema
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- List all functions in public schema
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- List all triggers
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

See `scripts/supabase_db_audit.sql` for complete audit script.  
See `scripts/supabase_cleanup.sql` for cleanup script with archive-first approach.

