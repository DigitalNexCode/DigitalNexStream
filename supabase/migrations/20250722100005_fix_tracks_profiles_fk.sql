/*
# [Fix Missing Foreign Key: tracks.owner_id]
This migration adds the missing foreign key constraint between the `tracks` table and the `profiles` table. This is critical for resolving API query failures when fetching tracks with their owner's profile information.

## Query Description:
This operation establishes a formal relationship between `tracks` and `profiles`. It ensures that every track has a valid owner and enables cascading deletes, so that if a profile is deleted, all their tracks are also deleted. This operation is structural and does not modify existing data, but it enforces integrity going forward.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: true (by dropping the constraint)

## Structure Details:
- Table Modified: `public.tracks`
- Constraint Added: `tracks_owner_id_fkey`
- Relationship: `public.tracks(owner_id)` -> `public.profiles(id)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: This change supports RLS policies that rely on `auth.uid() = owner_id`.

## Performance Impact:
- Indexes: A foreign key constraint typically creates an index on the foreign key column (`owner_id`), which can improve join performance.
- Triggers: None
- Estimated Impact: Positive impact on query performance for joins between tracks and profiles.
*/

DO $$
BEGIN
  -- Check if the constraint already exists before attempting to add it.
  -- This makes the script safe to re-run.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tracks_owner_id_fkey' AND conrelid = 'public.tracks'::regclass
  ) THEN
    -- Add the foreign key constraint from tracks.owner_id to profiles.id
    ALTER TABLE public.tracks
    ADD CONSTRAINT tracks_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END;
$$;
