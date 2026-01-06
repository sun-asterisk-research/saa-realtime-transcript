-- ============================================================================
-- MANUAL CLEANUP: Remove seeded auth.users that conflict with OAuth
-- ============================================================================
-- Run this in Supabase SQL Editor with elevated privileges
-- ============================================================================

-- Step 1: Delete related data first (to avoid foreign key constraints)

-- Delete meet session participants
DELETE FROM public.meet_session_participants
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE instance_id = '00000000-0000-0000-0000-000000000000'
);

-- Delete context sets
DELETE FROM public.context_sets
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE instance_id = '00000000-0000-0000-0000-000000000000'
);

-- Delete sessions
DELETE FROM public.sessions
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE instance_id = '00000000-0000-0000-0000-000000000000'
);

-- Delete profiles
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users
  WHERE instance_id = '00000000-0000-0000-0000-000000000000'
);

-- Step 2: Now delete the auth.users
-- This must be done in auth schema with proper privileges
DELETE FROM auth.users
WHERE instance_id = '00000000-0000-0000-0000-000000000000';

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_seeded_users
FROM auth.users
WHERE instance_id = '00000000-0000-0000-0000-000000000000';

-- Should return 0
