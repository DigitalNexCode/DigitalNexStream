/*
          # [Fix Profiles Table Syntax]
          This migration corrects a syntax error in the profiles table definition where `NOT-NULL` was used instead of the correct `NOT NULL`. It ensures the initial schema can be created successfully.

          ## Query Description: "This operation corrects the initial database schema definition. It has no impact on existing data as it's intended for the initial setup. This change is safe and necessary for the application to proceed."
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Corrects `NOT-NULL` to `NOT NULL` in the `public.profiles` table.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None for this fix]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('listener', 'artist', 'admin');
CREATE TYPE public.contributor_role AS ENUM ('singer', 'producer', 'writer', 'mixer', 'featured');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create Profiles Table
-- Stores public-facing user data, linked to Supabase's auth.users table.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'listener',
    bio TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for users.';

-- Create Tracks Table
-- Stores all information about uploaded music tracks.
CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    genre TEXT NOT NULL,
    duration_seconds INT NOT NULL,
    cover_art_url TEXT,
    audio_url TEXT NOT NULL,
    play_count BIGINT NOT NULL DEFAULT 0,
    like_count BIGINT NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT false,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.tracks IS 'Contains all uploaded music tracks and their metadata.';

-- Create Contributors Table
-- Manages revenue splits for each track among multiple contributors.
CREATE TABLE public.contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role contributor_role NOT NULL,
    revenue_split_percentage DECIMAL(5, 2) NOT NULL CHECK (revenue_split_percentage >= 0 AND revenue_split_percentage <= 100),
    UNIQUE(track_id, profile_id)
);
COMMENT ON TABLE public.contributors IS 'Defines the revenue split for each contributor on a track.';

-- Create Playlists Table
-- Stores user-created playlists.
CREATE TABLE public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cover_art_url TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.playlists IS 'User-created playlists.';

-- Create Playlist Tracks Junction Table
-- Links tracks to playlists in a many-to-many relationship.
CREATE TABLE public.playlist_tracks (
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (playlist_id, track_id)
);
COMMENT ON TABLE public.playlist_tracks IS 'Junction table for playlists and tracks.';

-- Create Streams Table
-- Records each time a track is streamed for analytics.
CREATE TABLE public.streams (
    id BIGSERIAL PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be null for anonymous streams
    streamed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.streams IS 'Logs individual song plays for analytics.';

-- Create Payouts Table
-- Tracks revenue payouts to artists.
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status payout_status NOT NULL DEFAULT 'pending',
    payout_provider TEXT NOT NULL DEFAULT 'yoco',
    transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payouts IS 'Records payout history for artists.';

-- Function to create a public profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'username',
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'avatar_url',
        'listener'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Tracks
CREATE POLICY "Public tracks are viewable by everyone." ON public.tracks
    FOR SELECT USING (is_public = true);

CREATE POLICY "Artists can view their own tracks." ON public.tracks
    FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Artists can insert their own tracks." ON public.tracks
    FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their own tracks." ON public.tracks
    FOR UPDATE USING (auth.uid() = artist_id);

-- RLS Policies for Playlists
CREATE POLICY "Public playlists are viewable by everyone." ON public.playlists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own playlists." ON public.playlists
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create playlists." ON public.playlists
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own playlists." ON public.playlists
    FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for Payouts
CREATE POLICY "Artists can view their own payouts." ON public.payouts
    FOR SELECT USING (auth.uid() = artist_id);
