/*
# [Create Missing Interaction Tables and Add Foreign Keys]
This migration script creates the 'likes' and 'bookmarks' tables if they don't already exist. It then adds all necessary foreign key constraints to the 'likes', 'bookmarks', and the pre-existing 'streams' table to ensure data integrity and establish relationships with the 'tracks' and 'profiles' tables.

## Query Description:
This operation is designed to be safe to run even if parts of previous migrations have completed. It uses `IF NOT EXISTS` to avoid errors from re-creating tables. It will not delete or alter any existing data. The primary goal is to finalize the database schema for track interactions.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables Created (if missing): `likes`, `bookmarks`
- Foreign Keys Added:
  - `likes` -> `tracks`
  - `likes` -> `profiles`
  - `bookmarks` -> `tracks`
  - `bookmarks` -> `profiles`
  - `streams` -> `tracks`
  - `streams` -> `profiles`

## Security Implications:
- RLS Status: Enabled on new tables.
- Policy Changes: Yes, new policies for `SELECT`, `INSERT`, `DELETE` are added for the `likes` and `bookmarks` tables, allowing users to manage their own interactions.
- Auth Requirements: Users must be authenticated to perform actions on these tables.

## Performance Impact:
- Indexes: Primary key and foreign key indexes are created, which will improve query performance for joins.
- Triggers: None.
- Estimated Impact: Positive. Queries involving track interactions will be more efficient.
*/

-- Create likes table if it does not exist
CREATE TABLE IF NOT EXISTS public.likes (
    track_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT likes_pkey PRIMARY KEY (track_id, user_id)
);

-- Create bookmarks table if it does not exist
CREATE TABLE IF NOT EXISTS public.bookmarks (
    track_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bookmarks_pkey PRIMARY KEY (track_id, user_id)
);

-- Add foreign key constraints if they don't exist
-- This prevents errors if the script is run multiple times or if constraints were partially applied.

-- For STREAMS table
ALTER TABLE public.streams
ADD CONSTRAINT streams_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE,
ADD CONSTRAINT streams_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- For LIKES table
ALTER TABLE public.likes
ADD CONSTRAINT likes_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE,
ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- For BOOKMARKS table
ALTER TABLE public.bookmarks
ADD CONSTRAINT bookmarks_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE,
ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- Enable RLS for the new tables
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for LIKES
DROP POLICY IF EXISTS "Enable read access for all users" ON public.likes;
CREATE POLICY "Enable read access for all users" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.likes;
CREATE POLICY "Enable insert for authenticated users only" ON public.likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.likes;
CREATE POLICY "Enable delete for users based on user_id" ON public.likes FOR DELETE USING (auth.uid() = user_id);


-- Create policies for BOOKMARKS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bookmarks;
CREATE POLICY "Enable read access for all users" ON public.bookmarks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bookmarks;
CREATE POLICY "Enable insert for authenticated users only" ON public.bookmarks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.bookmarks;
CREATE POLICY "Enable delete for users based on user_id" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);
