/*
# [Initial Schema Setup for SoundWave]
This migration script sets up the complete initial database schema for the SoundWave music streaming platform. It includes tables for user profiles, tracks, contributors, playlists, streaming data, and social features. It also configures Row Level Security (RLS) for data protection and creates necessary storage buckets for media files.

## Query Description:
This is a foundational, structural migration. It does not modify or delete any existing data, as it's intended for a fresh database setup. It creates all the necessary relations and security rules for the application to function correctly.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true (by dropping the created objects)

## Structure Details:
- Tables Created: profiles, tracks, contributors, playlists, playlist_tracks, streams, follows
- Functions Created: handle_new_user
- Triggers Created: on_auth_user_created on auth.users
- Storage Buckets Created: avatars, cover_art, audio_files

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: Creates SELECT, INSERT, UPDATE, DELETE policies for all tables to enforce data access rules based on user authentication and roles.
- Auth Requirements: Policies are heavily reliant on `auth.uid()` to identify the current user.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed by default. Additional indexes may be needed later based on query patterns.
- Triggers: A trigger is added to `auth.users` which fires once on user creation.
- Estimated Impact: Low impact on a new database.
*/

-- 1. PROFILES TABLE
-- Stores public user data and links to auth.users.
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('listener', 'artist', 'admin')),
    bio TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores public user data, linked to auth.users.';

-- 2. TRACKS TABLE
-- Stores all music track metadata.
CREATE TABLE public.tracks (
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    duration INT, -- in seconds
    cover_art_url TEXT,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.tracks IS 'Core table for all music tracks and their metadata.';

-- 3. CONTRIBUTORS TABLE
-- Manages contributors and revenue splits for each track.
CREATE TABLE public.contributors (
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('singer', 'producer', 'writer', 'mixer', 'featured')),
    split_percentage NUMERIC(5, 2) NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(track_id, profile_id)
);
COMMENT ON TABLE public.contributors IS 'Manages contributors and their revenue splits for each track.';

-- 4. PLAYLISTS TABLE
-- Stores user-created playlists.
CREATE TABLE public.playlists (
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_art_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.playlists IS 'Stores user-created playlists.';

-- 5. PLAYLIST_TRACKS TABLE
-- Junction table for the many-to-many relationship between playlists and tracks.
CREATE TABLE public.playlist_tracks (
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (playlist_id, track_id)
);
COMMENT ON TABLE public.playlist_tracks IS 'Junction table for playlists and tracks.';

-- 6. STREAMS TABLE
-- Logs each time a track is played for analytics.
CREATE TABLE public.streams (
    id BIGSERIAL PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be null for anonymous streams
    streamed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.streams IS 'Logs each track play for analytics and royalty calculations.';

-- 7. FOLLOWS TABLE
-- Manages follower relationships between users.
CREATE TABLE public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);
COMMENT ON TABLE public.follows IS 'Manages follower relationships between users.';

-- 8. SETUP NEW USER TRIGGER
-- This function automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$;

-- Create the trigger that fires the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. SETUP STORAGE
-- Create buckets for avatars, cover art, and audio files.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880, '{"image/jpeg","image/png","image/webp"}'),
    ('cover_art', 'cover_art', true, 10485760, '{"image/jpeg","image/png","image/webp"}'),
    ('audio_files', 'audio_files', false, 104857600, '{"audio/mpeg","audio/wav","audio/x-flac"}')
ON CONFLICT (id) DO NOTHING;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- TRACKS RLS
CREATE POLICY "Tracks are viewable by everyone." ON public.tracks
    FOR SELECT USING (true);
CREATE POLICY "Artists can insert their own tracks." ON public.tracks
    FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can update their own tracks." ON public.tracks
    FOR UPDATE USING (auth.uid() = artist_id) WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can delete their own tracks." ON public.tracks
    FOR DELETE USING (auth.uid() = artist_id);

-- CONTRIBUTORS RLS
CREATE POLICY "Contributors are viewable by everyone." ON public.contributors
    FOR SELECT USING (true);
CREATE POLICY "Track artists can manage contributors." ON public.contributors
    FOR ALL USING (
        (SELECT artist_id FROM public.tracks WHERE id = track_id) = auth.uid()
    );

-- PLAYLISTS RLS
CREATE POLICY "Public playlists are viewable by everyone." ON public.playlists
    FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own private playlists." ON public.playlists
    FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create playlists." ON public.playlists
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own playlists." ON public.playlists
    FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own playlists." ON public.playlists
    FOR DELETE USING (auth.uid() = creator_id);

-- PLAYLIST_TRACKS RLS
CREATE POLICY "Users can view tracks in their own or public playlists." ON public.playlist_tracks
    FOR SELECT USING (
        (SELECT is_public FROM public.playlists WHERE id = playlist_id) = true OR
        (SELECT creator_id FROM public.playlists WHERE id = playlist_id) = auth.uid()
    );
CREATE POLICY "Users can manage tracks in their own playlists." ON public.playlist_tracks
    FOR ALL USING (
        (SELECT creator_id FROM public.playlists WHERE id = playlist_id) = auth.uid()
    );

-- STREAMS RLS
CREATE POLICY "Users can insert their own stream records." ON public.streams
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Track artists can view stream data for their tracks." ON public.streams
    FOR SELECT USING (
        (SELECT artist_id FROM public.tracks WHERE id = track_id) = auth.uid()
    );

-- FOLLOWS RLS
CREATE POLICY "Follow relationships are public." ON public.follows
    FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follow relationships." ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- STORAGE RLS POLICIES
-- Avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update their own avatar." ON storage.objects
    FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- Cover Art
CREATE POLICY "Cover art is publicly accessible." ON storage.objects
    FOR SELECT USING (bucket_id = 'cover_art');
CREATE POLICY "Artists can upload cover art." ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'cover_art' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'artist'
    );
CREATE POLICY "Artists can update their own cover art." ON storage.objects
    FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'cover_art');

-- Audio Files
CREATE POLICY "Audio files are private and restricted." ON storage.objects
    FOR SELECT USING (false); -- No public select access
CREATE POLICY "Artists can upload audio files." ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio_files' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'artist'
    );
CREATE POLICY "Artists can update their audio files." ON storage.objects
    FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'audio_files');
