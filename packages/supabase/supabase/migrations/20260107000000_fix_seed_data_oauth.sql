-- ============================================================================
-- FIX SEED DATA FOR OAUTH COMPATIBILITY
-- Migration: 20260107000000_fix_seed_data_oauth.sql
-- ============================================================================
-- Description: Remove seeded auth.users that conflict with OAuth flow
-- Reason: Direct INSERT into auth.users missing confirmation_token causes errors
-- Solution: Delete seeded users, let OAuth create them properly
-- ============================================================================

-- IMPORTANT: This will CASCADE delete related profiles and other data
-- But that's OK because we want OAuth to create clean user records

-- First, temporarily disable the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Delete all seeded auth.users records
-- These were created by the seed migration with incomplete auth fields
DELETE FROM auth.users WHERE instance_id = '00000000-0000-0000-0000-000000000000';

-- Also delete orphaned profiles (those without valid auth.users)
-- When users login via OAuth, handle_new_user() trigger will create new profiles
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Restore the foreign key constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
