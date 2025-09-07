/*
# [Schema Fix] Add Foreign Key Constraints
This migration establishes the necessary foreign key relationships between the `tracks`, `likes`, `streams`, and `profiles` tables. This is critical for Supabase's PostgREST API to understand how to join these tables, which will resolve the `PGRST200` errors.

## Query Description:
This operation alters the table structure by adding constraints. It does not modify or delete any existing data. It ensures that `likes` and `streams` records are correctly linked to a `track` and a `profile`. It also adds `ON DELETE CASCADE`, which means that if a track or profile is deleted, all associated likes and stream records will be automatically removed, maintaining data integrity.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Adds `likes_track_id_fkey` to `likes` table, referencing `tracks(id)`.
- Adds `streams_track_id_fkey` to `streams` table, referencing `tracks(id)`.
- Adds `likes_user_id_fkey` to `likes` table, referencing `profiles(id)`.
- Adds `streams_user_id_fkey` to `streams` table, referencing `profiles(id)`.

## Security Implications:
- RLS Status: Unchanged.
- Policy Changes: No.
- Auth Requirements: None for this migration.

## Performance Impact:
- Indexes: Foreign keys automatically create indexes on the referencing columns (`track_id`, `user_id`), which will improve the performance of joins and lookups.
- Triggers: None.
- Estimated Impact: Positive. Queries involving joins on these tables will be faster.
*/
-- Drop existing constraints if they exist to ensure the script is re-runnable
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_track_id_fkey;
ALTER TABLE public.streams DROP CONSTRAINT IF EXISTS streams_track_id_fkey;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.streams DROP CONSTRAINT IF EXISTS streams_user_id_fkey;

-- Add foreign key from likes to tracks
ALTER TABLE public.likes
ADD CONSTRAINT likes_track_id_fkey
FOREIGN KEY (track_id)
REFERENCES public.tracks(id)
ON DELETE CASCADE;

-- Add foreign key from streams to tracks
ALTER TABLE public.streams
ADD CONSTRAINT streams_track_id_fkey
FOREIGN KEY (track_id)
REFERENCES public.tracks(id)
ON DELETE CASCADE;

-- Add foreign key from likes to profiles
ALTER TABLE public.likes
ADD CONSTRAINT likes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key from streams to profiles
ALTER TABLE public.streams
ADD CONSTRAINT streams_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
