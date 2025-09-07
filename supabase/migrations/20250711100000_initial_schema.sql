/*
# [Initial Schema Setup]
This migration script sets up the complete initial database schema for the SoundWave music streaming platform. It includes tables for user profiles, tracks, contributors, revenue splits, playlists, and streaming analytics. It also establishes relationships between these tables and sets up Row Level Security (RLS) to protect user data.

## Query Description: [This script is foundational and will create all necessary tables and security policies for the application to function. It is designed to be run on a new, empty public schema. It does not delete any data but creates the entire structure. No backup is needed if running on a fresh project, but it is always recommended.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables Created: `profiles`, `tracks`, `track_contributors`, `playlists`, `playlist_tracks`, `streams`, `follows`, `payouts`
- Functions Created: `handle_new_user`
- Triggers Created: `on_auth_user_created`
- Row Level Security (RLS) enabled and policies created for all tables.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Requires Supabase Auth to be enabled. Policies are based on `auth.uid()`.]

## Performance Impact:
- Indexes: [Primary keys and foreign keys are indexed by default.]
- Triggers: [A trigger is added to `auth.users` to create user profiles.]
- Estimated Impact: [Low on a new project. The trigger on user creation is lightweight.]
*/

-- ------------------------------------------------------------
-- 1. PROFILES TABLE
-- Stores public user information, linked to auth.users.
-- ------------------------------------------------------------
/*
# [Create profiles Table]
This table holds public-facing user data. It's linked one-to-one with the private `auth.users` table.

## Query Description: [Creates the `profiles` table. This is a core table and essential for user management. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT-NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

COMMENT ON TABLE public.profiles IS 'Public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase `auth.users` table.';

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public
.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- 2. HANDLE NEW USER TRIGGER
-- Automatically creates a profile entry when a new user signs up.
-- ------------------------------------------------------------
/*
# [Create handle_new_user Function and Trigger]
This function and trigger automate profile creation. When a new user is created in `auth.users`, a corresponding row is inserted into `public.profiles`.

## Query Description: [Creates a function and a trigger. This is a safe, non-destructive operation that ensures data consistency between `auth` and `public` schemas.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to execute the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------
-- 3. TRACKS TABLE
-- Stores all uploaded music tracks.
-- ------------------------------------------------------------
/*
# [Create tracks Table]
This table stores metadata for every song uploaded to the platform.

## Query Description: [Creates the `tracks` table. This is a central table for the application. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE TYPE public.track_status AS ENUM ('pending', 'processing', 'published', 'rejected', 'archived');

CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    duration_seconds INT,
    cover_art_url TEXT,
    audio_url TEXT,
    status public.track_status NOT NULL DEFAULT 'pending',
    release_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tracks IS 'Stores metadata for all music tracks.';

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Policies for tracks
CREATE POLICY "Published tracks are viewable by everyone." ON public.tracks FOR SELECT USING (status = 'published');
CREATE POLICY "Users can view their own non-published tracks." ON public.tracks FOR SELECT USING (auth.uid() = uploader_id);
CREATE POLICY "Users can upload tracks." ON public.tracks FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update their own tracks." ON public.tracks FOR UPDATE USING (auth.uid() = uploader_id) WITH CHECK (auth.uid() = uploader_id);

-- ------------------------------------------------------------
-- 4. TRACK CONTRIBUTORS TABLE
-- Manages revenue splits and roles for each track.
-- ------------------------------------------------------------
/*
# [Create track_contributors Table]
This table links contributors (users) to tracks and defines their role and revenue share.

## Query Description: [Creates the `track_contributors` join table. This is critical for revenue splitting. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false_]
- Reversible: [true]
*/
CREATE TYPE public.contributor_role AS ENUM ('singer', 'producer', 'writer', 'mixer', 'featured', 'artist');

CREATE TABLE public.track_contributors (
    id BIGSERIAL PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.contributor_role NOT NULL,
    revenue_split_percentage NUMERIC(5, 2) NOT NULL CHECK (revenue_split_percentage >= 0 AND revenue_split_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(track_id, contributor_id)
);

COMMENT ON TABLE public.track_contributors IS 'Links users to tracks as contributors and defines their revenue split.';

-- Enable RLS
ALTER TABLE public.track_contributors ENABLE ROW LEVEL SECURITY;

-- Policies for track_contributors
CREATE POLICY "Contributors can view their own contribution records." ON public.track_contributors FOR SELECT USING (
  auth.uid() = contributor_id OR
  auth.uid() = (SELECT uploader_id FROM public.tracks WHERE id = track_id)
);
CREATE POLICY "Track uploaders can manage contributors." ON public.track_contributors FOR ALL USING (
  auth.uid() = (SELECT uploader_id FROM public.tracks WHERE id = track_id)
) WITH CHECK (
  auth.uid() = (SELECT uploader_id FROM public.tracks WHERE id = track_id)
);

-- ------------------------------------------------------------
-- 5. PLAYLISTS & PLAYLIST_TRACKS TABLES
-- Manages user-created playlists.
-- ------------------------------------------------------------
/*
# [Create playlists and playlist_tracks Tables]
These tables manage user-created playlists and the songs within them.

## Query Description: [Creates two tables for playlist functionality. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE TABLE public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_art_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.playlist_tracks (
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Policies for playlists
CREATE POLICY "Public playlists are viewable by everyone." ON public.playlists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own playlists." ON public.playlists FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create playlists." ON public.playlists FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own playlists." ON public.playlists FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own playlists." ON public.playlists FOR DELETE USING (auth.uid() = creator_id);

-- Policies for playlist_tracks
CREATE POLICY "Users can view tracks in their own or public playlists." ON public.playlist_tracks FOR SELECT USING (
    auth.uid() = (SELECT creator_id FROM public.playlists WHERE id = playlist_id) OR
    (SELECT is_public FROM public.playlists WHERE id = playlist_id) = true
);
CREATE POLICY "Users can manage tracks in their own playlists." ON public.playlist_tracks FOR ALL USING (
  auth.uid() = (SELECT creator_id FROM public.playlists WHERE id = playlist_id)
);

-- ------------------------------------------------------------
-- 6. STREAMS TABLE
-- Logs every track play for analytics.
-- ------------------------------------------------------------
/*
# [Create streams Table]
This table logs every song play event, which is crucial for analytics and royalty calculations.

## Query Description: [Creates the `streams` table. This is an append-only table and can grow very large. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Data"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE TABLE public.streams (
    id BIGSERIAL PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    listener_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null for anonymous
    streamed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.streams IS 'Logs each time a track is streamed.';

-- Enable RLS
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Policies for streams
CREATE POLICY "Users can insert their own stream events." ON public.streams FOR INSERT WITH CHECK (auth.uid() = listener_id);
-- Note: Direct SELECT on this table is generally disabled for performance. Data should be accessed via aggregated views or functions.
CREATE POLICY "Nobody can view raw stream data." ON public.streams FOR SELECT USING (false);


-- ------------------------------------------------------------
-- 7. FOLLOWS TABLE
-- Manages user-artist follow relationships.
-- ------------------------------------------------------------
/*
# [Create follows Table]
This table creates a many-to-many relationship between users for following artists.

## Query Description: [Creates the `follows` join table. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE TABLE public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows
CREATE POLICY "Follow relationships are public." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follow list." ON public.follows FOR ALL USING (auth.uid() = follower_id);


-- ------------------------------------------------------------
-- 8. PAYOUTS TABLE
-- Tracks revenue payouts to artists and contributors.
-- ------------------------------------------------------------
/*
# [Create payouts Table]
This table logs all financial payouts to artists and contributors.

## Query Description: [Creates the `payouts` table. This is a sensitive table for financial records. It does not affect existing data.]

## Metadata:
- Schema-Category: ["Data"]
- Impact-Level: ["High"]
- Requires-Backup: [true]
- Reversible: [true]
*/
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');

CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    status public.payout_status NOT NULL DEFAULT 'pending',
    payout_period_start DATE NOT NULL,
    payout_period_end DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.payouts IS 'Stores records of financial payouts to contributors.';

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Policies for payouts
CREATE POLICY "Users can view their own payouts." ON public.payouts FOR SELECT USING (auth.uid() = recipient_id);
-- Note: Inserting and updating payouts should be handled by a trusted server-side process (e.g., a Supabase Edge Function with the service_role key).
-- We deny client-side inserts/updates for security.
CREATE POLICY "Payouts cannot be created from the client." ON public.payouts FOR INSERT WITH CHECK (false);
CREATE POLICY "Payouts cannot be updated from the client." ON public.payouts FOR UPDATE USING (false);
</sql>
