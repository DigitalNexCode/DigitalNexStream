import { supabase } from './supabaseClient';
import { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

export type TrackWithArtistAndLikes = Tables<'tracks'> & {
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'avatar_url'> | null;
  likes: { count: number }[];
  streams: { count: number }[];
  user_liked: { count: number }[];
};

// FETCH
export const getTracks = async (userId?: string): Promise<TrackWithArtistAndLikes[]> => {
  let query = supabase
    .from('tracks')
    .select(`
      *,
      profiles:profiles!tracks_owner_id_fkey (id, display_name, avatar_url),
      likes:likes!likes_track_id_fkey(count),
      streams:streams!streams_track_id_fkey(count),
      user_liked:likes!likes_track_id_fkey(count)
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_liked.user_id', userId);
  }
    
  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') { // Ignore error when user_liked join is empty
    console.error('Error fetching tracks:', error);
    throw error;
  }
  return data as unknown as TrackWithArtistAndLikes[];
};

export const getPublicTracks = async (limit = 6): Promise<TrackWithArtistAndLikes[]> => {
    const { data, error } = await supabase
        .from('tracks')
        .select(`
            *,
            profiles:profiles!tracks_owner_id_fkey (id, display_name, avatar_url),
            likes:likes!likes_track_id_fkey(count),
            streams:streams!streams_track_id_fkey(count)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching public tracks:', error);
        throw error;
    }

    if (!data) return [];

    // Manually add the user_liked property to satisfy the type, since there's no user.
    const tracksWithLikes = data.map(track => ({
        ...track,
        user_liked: [],
    }));

    return tracksWithLikes as unknown as TrackWithArtistAndLikes[];
};


export const getArtistTracks = async (artistId: string, userId?: string): Promise<TrackWithArtistAndLikes[]> => {
    const selectStatement = `
        *,
        profiles:profiles!tracks_owner_id_fkey (id, display_name, avatar_url),
        likes:likes!likes_track_id_fkey(count),
        streams:streams!streams_track_id_fkey(count)
        ${userId ? ', user_liked:likes!likes_track_id_fkey(count)' : ''}
    `;

    let query = supabase
      .from('tracks')
      .select(selectStatement)
      .eq('owner_id', artistId)
      .order('created_at', { ascending: false });
    
    if (userId) {
        query = query.eq('user_liked.user_id', userId);
    }
  
    const { data, error } = await query;
  
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching artist tracks:', error);
      throw error;
    }

    if (!data) return [];

    if (!userId) {
        return data.map(track => ({ ...track, user_liked: [] })) as unknown as TrackWithArtistAndLikes[];
    }
    
    return data as unknown as TrackWithArtistAndLikes[];
};

export const getArtistProfile = async (artistId: string): Promise<Tables<'profiles'> | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', artistId)
        .single();

    if (error) {
        console.error('Error fetching artist profile:', error);
        // Don't throw for not found, just return null
        if (error.code === 'PGRST116') {
            return null;
        }
        throw error;
    }
    return data;
};


// UPLOAD
const uploadFile = async (bucket: 'audio_files' | 'cover_art' | 'avatars', file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
};

export const uploadTrack = async (
    trackData: Omit<TablesInsert<'tracks'>, 'audio_url' | 'cover_art_url'>,
    contributors: Omit<TablesInsert<'contributors'>, 'track_id'>[],
    audioFile: File,
    coverArtFile: File,
    onProgress: (progress: { audio: number, cover: number }) => void
) => {
    
    // Note: Supabase JS v2 doesn't support upload progress tracking out of the box.
    // This is a placeholder for the UI.
    onProgress({ audio: 50, cover: 0 });
    const audio_url = await uploadFile('audio_files', audioFile);
    onProgress({ audio: 100, cover: 50 });
    const cover_art_url = await uploadFile('cover_art', coverArtFile);
    onProgress({ audio: 100, cover: 100 });

    const { data: newTrack, error: trackError } = await supabase
        .from('tracks')
        .insert({ ...trackData, audio_url, cover_art_url })
        .select()
        .single();
    
    if (trackError) {
        console.error('Error inserting track:', trackError);
        throw trackError;
    }

    const contributorData = contributors.map(c => ({ ...c, track_id: newTrack.id }));
    const { error: contributorError } = await supabase.from('contributors').insert(contributorData);

    if (contributorError) {
        console.error('Error inserting contributors:', contributorError);
        await supabase.from('tracks').delete().eq('id', newTrack.id);
        throw contributorError;
    }

    return newTrack;
};


// DELETE
export const deleteTrack = async (trackId: string, audioUrl: string, coverArtUrl: string) => {
    const audioFileName = audioUrl.split('/').pop();
    const coverArtFileName = coverArtUrl.split('/').pop();

    if (!audioFileName || !coverArtFileName) {
        throw new Error("Could not extract file names from URLs");
    }

    const { error: audioError } = await supabase.storage.from('audio_files').remove([audioFileName]);
    if (audioError) console.error('Error deleting audio file:', audioError);

    const { error: coverError } = await supabase.storage.from('cover_art').remove([coverArtFileName]);
    if (coverError) console.error('Error deleting cover art:', coverError);
    
    const { error: dbError } = await supabase.from('tracks').delete().eq('id', trackId);
    if (dbError) {
        console.error('Error deleting track from database:', dbError);
        throw dbError;
    }
};


// INTERACTIONS
export const incrementStreamCount = async (trackId: string, userId: string | null) => {
    const { error } = await supabase.from('streams').insert({ track_id: trackId, user_id: userId });
    if (error) {
        console.error('Error incrementing stream count:', error);
    }
};

export const toggleLike = async (trackId: string, userId: string): Promise<boolean> => {
    const { data, error: fetchError } = await supabase
        .from('likes')
        .select('*')
        .eq('track_id', trackId)
        .eq('user_id', userId)
        .maybeSingle();

    if (fetchError) {
        console.error('Error checking like status:', fetchError);
        throw fetchError;
    }

    if (data) {
        const { error: deleteError } = await supabase.from('likes').delete().match({ track_id: trackId, user_id: userId });
        if (deleteError) throw deleteError;
        return false;
    } else {
        const { error: insertError } = await supabase.from('likes').insert({ track_id: trackId, user_id: userId });
        if (insertError) throw insertError;
        return true;
    }
};

// PROFILE
export const updateUserProfile = async (userId: string, displayName: string, avatarFile?: File) => {
    let avatar_url: string | undefined = undefined;

    if (avatarFile) {
        avatar_url = await uploadFile('avatars', avatarFile);
    }

    const updates: TablesUpdate<'profiles'> = {
        display_name: displayName,
        ...(avatar_url && { avatar_url }),
    };

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};
