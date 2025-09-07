/*
# Add owner_id Column and Foreign Key to Tracks

This migration ensures the `tracks` table has an `owner_id` column and establishes a foreign key relationship to the `profiles` table. It also sets up appropriate Row Level Security (RLS) policies for tracks.

## Query Description:
This operation alters the `tracks` table to link each track to a user profile. It is a structural change that is critical for the application's functionality. It also enables and configures RLS to ensure users can only modify their own tracks. This is a safe operation as it uses `IF NOT EXISTS` to avoid errors on columns that might already exist.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Adds `owner_id` column to `public.tracks`.
- Adds `tracks_owner_id_fkey` foreign key constraint to `public.tracks`.
- Enables RLS on `public.tracks`.
- Creates policies for SELECT, INSERT, UPDATE, DELETE on `public.tracks`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Policies are based on `auth.uid()`, restricting write access to the record owner.

## Performance Impact:
- Indexes: A foreign key index will be automatically created on `owner_id`.
- Triggers: None
- Estimated Impact: Low. Improves query performance for joins between tracks and profiles.
*/

-- Step 1: Add the owner_id column to the tracks table if it doesn't already exist.
-- This column is essential for linking a track to its creator.
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS owner_id uuid NOT NULL;

-- Step 2: Add the foreign key constraint to link tracks to profiles.
-- This enforces data integrity and is required for the application's data queries.
-- We drop it first to ensure the script is re-runnable without errors.
ALTER TABLE public.tracks
DROP CONSTRAINT IF EXISTS tracks_owner_id_fkey;

ALTER TABLE public.tracks
ADD CONSTRAINT tracks_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Step 3: Enable Row Level Security on the tracks table to protect data.
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to ensure a clean slate before creating new ones.
DROP POLICY IF EXISTS "Allow public read access" ON public.tracks;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.tracks;
DROP POLICY IF EXISTS "Allow owner to update" ON public.tracks;
DROP POLICY IF EXISTS "Allow owner to delete" ON public.tracks;

-- Step 5: Create RLS policies for the tracks table.
-- Allow anyone to read tracks.
CREATE POLICY "Allow public read access"
ON public.tracks
FOR SELECT
USING (true);

-- Allow authenticated users to insert tracks for themselves.
CREATE POLICY "Allow individual insert access"
ON public.tracks
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Allow track owners to update their own tracks.
CREATE POLICY "Allow owner to update"
ON public.tracks
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Allow track owners to delete their own tracks.
CREATE POLICY "Allow owner to delete"
ON public.tracks
FOR DELETE
USING (auth.uid() = owner_id);
