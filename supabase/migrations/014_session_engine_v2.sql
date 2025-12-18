-- Migration 014: Session Engine v2 - Support block_mode and step_kind
-- Adds view_mode, block_end_time, and makes current_step_index nullable

-- Add new columns
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS view_mode TEXT DEFAULT 'follow_steps',
  ADD COLUMN IF NOT EXISTS block_end_time TIMESTAMPTZ;

-- Make current_step_index nullable (for block modes that don't use steps)
ALTER TABLE sessions
  ALTER COLUMN current_step_index DROP NOT NULL;

-- Update existing sessions to have view_mode based on template snapshot
-- This is a best-effort migration - existing sessions will default to follow_steps
UPDATE sessions
SET view_mode = COALESCE(
  (template_snapshot->'blocks'->0->>'block_mode'),
  'follow_steps'
)
WHERE view_mode IS NULL OR view_mode = 'follow_steps';

-- Add check constraint for view_mode
ALTER TABLE sessions
  ADD CONSTRAINT check_view_mode 
  CHECK (view_mode IN ('follow_steps', 'amrap', 'emom', 'for_time', 'strength_sets'));

