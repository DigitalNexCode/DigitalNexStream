/*
          # [Fix Auth Profile Creation]
          This migration removes the old trigger-based profile creation system and replaces it with a robust Row Level Security (RLS) policy setup. This change is necessary to resolve the "Database error saving new user" error by allowing users to securely insert their own profile information after signing up. The frontend will be updated to handle this new flow.

          ## Query Description: [This operation reconfigures security policies on the `profiles` table. It drops the old `on_auth_user_created` trigger and its associated function. It then enables RLS and creates policies that allow users to view all profiles, insert their own profile, and update their own profile. This is a standard and secure pattern for managing user profiles with Supabase Auth.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables affected: `public.profiles`
          - Triggers removed: `on_auth_user_created` on `auth.users`
          - Functions removed: `public.handle_new_user`
          - Policies added: SELECT, INSERT, and UPDATE policies on `public.profiles`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Users must be authenticated to insert or update their own profile, matching their `auth.uid()`.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [Removed]
          - Estimated Impact: [Low. Removing the trigger may slightly improve insert performance on the `auth.users` table. RLS checks have a negligible performance impact for this use case.]
          */

-- Step 1: Remove the old trigger-based system to avoid conflicts.
-- This is crucial as we are moving the logic to the client, backed by RLS.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Step 2: Enable Row Level Security on the profiles table if not already enabled.
-- This is a critical security measure to protect user data.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing RLS policies on the profiles table to ensure a clean slate.
-- This prevents conflicts with old or misconfigured policies.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Step 4: Create the new RLS policies for the profiles table.
-- Policy 1: Allow public read access to all profiles.
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- Policy 2: Allow users to insert their own profile.
-- The `WITH CHECK` clause is a security constraint that ensures a user can only create a profile where the `id` matches their own authenticated `auth.uid()`.
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile.
-- The `USING` clause ensures a user can only run an UPDATE on their own profile row.
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
