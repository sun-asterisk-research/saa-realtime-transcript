-- ============================================================================
-- CLEANUP NON-OAUTH USERS
-- Migration: 20260107100000_cleanup_non_oauth_users.sql
-- ============================================================================
-- Description: Remove seeded users that don't have OAuth providers
-- Reason: Seeded users only have "email" provider, real users have "google"
-- This fixes OAuth login errors caused by incomplete auth.users records
-- ============================================================================

-- Delete users that only have "email" provider (seeded users)
-- Real OAuth users will have providers like "google", "github", etc.

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete related data first to avoid foreign key errors

  -- 1. Delete meet session participants for non-OAuth users
  DELETE FROM public.meet_session_participants
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE
      -- Users with ONLY email provider (no OAuth)
      raw_app_meta_data->>'provider' = 'email'
      AND (
        raw_app_meta_data->'providers' = '["email"]'::jsonb
        OR raw_app_meta_data->'providers' IS NULL
      )
  );

  -- 2. Delete context sets for non-OAuth users
  DELETE FROM public.context_sets
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE
      raw_app_meta_data->>'provider' = 'email'
      AND (
        raw_app_meta_data->'providers' = '["email"]'::jsonb
        OR raw_app_meta_data->'providers' IS NULL
      )
  );

  -- 3. Delete profiles for non-OAuth users
  DELETE FROM public.profiles
  WHERE id IN (
    SELECT id FROM auth.users
    WHERE
      raw_app_meta_data->>'provider' = 'email'
      AND (
        raw_app_meta_data->'providers' = '["email"]'::jsonb
        OR raw_app_meta_data->'providers' IS NULL
      )
  );

  -- 4. Finally, delete the auth.users records
  WITH deleted AS (
    DELETE FROM auth.users
    WHERE
      -- Only delete users with ONLY email provider (no OAuth)
      raw_app_meta_data->>'provider' = 'email'
      AND (
        raw_app_meta_data->'providers' = '["email"]'::jsonb
        OR raw_app_meta_data->'providers' IS NULL
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Log the result
  RAISE NOTICE 'Deleted % non-OAuth users (email-only providers)', deleted_count;

  -- Show remaining users count
  RAISE NOTICE 'Remaining OAuth users: %', (SELECT COUNT(*) FROM auth.users);
END $$;
