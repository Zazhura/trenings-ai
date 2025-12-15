# Implementation Status - Global Exercise Library + Gym Templates

## Overview

This document tracks the implementation status of the SaaS extension for Global Exercise Library, Gym Templates, and Display Exercise Panel.

## ✅ Completed

### Database Infrastructure
- ✅ **Migration 003**: `exercises` table created with all required fields
- ✅ **Migration 004**: `gyms` table created for multi-tenant support
- ✅ **Migration 005**: `user_roles` table created for role-based access control
- ✅ **Migration 006**: `templates` table created for gym-scoped templates
- ✅ **Migration 007**: Exercise usage function created
- ✅ **Migration 008**: Comprehensive RLS policies for multi-tenant access

### TypeScript Types
- ✅ `types/exercise.ts` - Exercise types and interfaces
- ✅ `types/gym.ts` - Gym types
- ✅ `types/user-role.ts` - User role types
- ✅ `types/template.ts` - Updated to include `exercise_id` in Step
- ✅ `types/session.ts` - Updated to include `exercise_id` in StepSnapshot

### Database Operations
- ✅ `lib/exercises/db-operations.ts` - Full CRUD for exercises with auto-match
- ✅ `lib/templates/db-operations.ts` - Full CRUD for templates
- ✅ `lib/gyms/db-operations.ts` - Gym operations
- ✅ `lib/user-roles/db-operations.ts` - User role operations
- ✅ `lib/auth/roles.ts` - Role checking utilities
- ✅ `lib/templates/auto-match.ts` - Auto-match exercise suggestions

### Display Components
- ✅ `app/display/[gymSlug]/components/ExercisePanel.tsx` - New robust exercise panel with fallbacks
- ✅ `app/display/[gymSlug]/components/ExercisePanelPrefetcher.tsx` - Prefetching for next step
- ✅ `app/display/[gymSlug]/components/DisplayContent.tsx` - Updated to use ExercisePanel

## 🚧 Pending Implementation

### Storage Setup (Manual Configuration Required)
- ⏳ **Supabase Storage Bucket**: Create `exercise-media` bucket
  - Public access for display (read-only)
  - Upload policy: Platform Admin only
  - File type restrictions: WebP (motion), MP4 (video), JPG/PNG (poster)
  - Size restrictions: Max 10MB per file

### Platform Admin UI
- ⏳ **Exercise Library Management** (`app/admin/exercises/page.tsx`)
  - List all exercises (active/archived filter)
  - Create new exercise
  - Edit exercise (name, aliases, category, equipment, media)
  - Upload motion/video assets
  - Archive/restore exercises
  - View usage statistics

- ⏳ **Gym Management** (`app/admin/gyms/page.tsx`)
  - List all gyms
  - Create new gym (slug, name)
  - View gym details

### Gym Template Manager UI
- ⏳ **Template List** (`app/coach/templates/page.tsx`)
  - List templates for user's gym
  - Filter demo vs custom templates
  - Duplicate demo templates
  - Create new template
  - Edit template
  - Delete template

- ⏳ **Template Editor** (`app/coach/templates/[id]/page.tsx`)
  - Edit template name/description
  - Add/remove blocks
  - Add/remove steps
  - Auto-match exercise suggestions when editing step title
  - Manual exercise selection/override
  - Confidence indicator for auto-matches
  - Save template

### Coach Invitation UI
- ⏳ **Coach Management** (`app/coach/settings/coaches/page.tsx`)
  - List coaches for gym (Gym Admin only)
  - Invite coach by email
  - Remove coach from gym

### Migration & Updates
- ⏳ **Template Migration Script** (`scripts/migrate-templates-to-db.ts`)
  - Script created but needs testing
  - Run once to migrate hardcoded templates to database

- ⏳ **Coach Dashboard Updates** (`app/coach/page.tsx`)
  - Update to load templates from database instead of hardcoded
  - Filter templates by gym
  - Handle demo templates (read-only, duplicate option)

## 📋 Implementation Notes

### Key Design Decisions

1. **Multi-tenant Isolation**: RLS policies ensure gym data is isolated. Each gym can only access their own templates.

2. **Role Hierarchy**:
   - Platform Admin: Full access to everything
   - Gym Admin: Manage own gym + invite coaches
   - Coach: Manage templates for own gym

3. **Exercise Library**: Global, read-only for gyms. Only Platform Admin can create/edit.

4. **Auto-match**: Simple string matching based on name/aliases. Confidence score (0-1) helps users decide.

5. **Fallback Policy**: ExercisePanel never shows blank. Always displays meaningful message:
   - "Ingen øvelse koblet" - No exercise_id
   - "Media mangler for denne øvelsen" - Exercise exists but no media
   - "Media utilgjengelig" - Media failed to load

### Next Steps

1. **Set up Supabase Storage** (manual):
   ```sql
   -- Create bucket
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('exercise-media', 'exercise-media', true);
   
   -- Create upload policy (Platform Admin only)
   CREATE POLICY "Platform admin can upload exercise media"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'exercise-media' AND
     EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_id = auth.uid()
       AND role = 'platform_admin'
     )
   );
   ```

2. **Create Platform Admin User**:
   ```sql
   -- After creating user in Supabase Auth, assign role:
   INSERT INTO user_roles (user_id, role) 
   VALUES ('<user-id>', 'platform_admin');
   ```

3. **Create First Gym**:
   ```sql
   INSERT INTO gyms (slug, name) 
   VALUES ('crossfit-larvik', 'CrossFit Larvik');
   ```

4. **Assign Gym Admin Role**:
   ```sql
   INSERT INTO user_roles (user_id, gym_id, role)
   VALUES ('<user-id>', '<gym-id>', 'gym_admin');
   ```

5. **Run Template Migration**:
   ```bash
   npx tsx scripts/migrate-templates-to-db.ts <gym-id>
   ```

## Testing Checklist

- [ ] Database migrations run successfully
- [ ] RLS policies work correctly (test with different roles)
- [ ] ExercisePanel displays correctly with/without exercise_id
- [ ] ExercisePanel fallbacks work (no exercise, no media, media error)
- [ ] Prefetching works for next step
- [ ] Auto-match suggestions appear when editing steps
- [ ] Template CRUD operations work
- [ ] Coach invitation flow works
- [ ] Display shows exercise media correctly

## Known Limitations

1. **Exercise Usage View**: The current implementation computes usage in application code. A more efficient database view could be added later.

2. **Auto-match Algorithm**: Simple string matching. Could be enhanced with fuzzy matching or ML-based suggestions.

3. **Storage Upload**: Manual Supabase configuration required. No UI for upload yet.

4. **Coach Invitation**: Requires user to exist in Supabase Auth first. No automatic user creation.

5. **Demo Templates**: Marked as read-only but RLS allows edit. UI should enforce read-only.

