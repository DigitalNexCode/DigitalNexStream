import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getArtistProfile, getArtistTracks, TrackWithArtistAndLikes } from '@/lib/api';
import { Tables } from '@/types/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TrackCard } from '@/components/track/TrackCard';
import { User, Users, Play } from 'lucide-react';
import { toast } from 'sonner';

const ArtistPageSkeleton = () => (
  <div className="space-y-8">
    <div className="flex flex-col md:flex-row items-center gap-8">
      <Skeleton className="h-36 w-36 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  </div>
);

export const ArtistPage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Tables<'profiles'> | null>(null);
  const [tracks, setTracks] = useState<TrackWithArtistAndLikes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileData, tracksData] = await Promise.all([
          getArtistProfile(artistId),
          getArtistTracks(artistId, user?.id),
        ]);
        
        if (!profileData) {
          toast.error("Artist not found.");
          // Maybe redirect here
        }

        setArtist(profileData);
        setTracks(tracksData);
      } catch (error) {
        toast.error("Failed to load artist page.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [artistId, user]);

  if (loading) {
    return <ArtistPageSkeleton />;
  }

  if (!artist) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Artist Not Found</h2>
        <p className="text-muted-foreground">The artist you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link to="/discover">Back to Discover</Link>
        </Button>
      </div>
    );
  }
  
  const totalPlays = tracks.reduce((sum, track) => sum + (track.streams[0]?.count || 0), 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row items-center gap-8">
        <Avatar className="h-36 w-36 border-4 border-primary/20">
          <AvatarImage src={artist.avatar_url || undefined} />
          <AvatarFallback className="text-4xl">
            <User />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-5xl font-bold">{artist.display_name}</h1>
          <div className="flex items-center justify-center md:justify-start space-x-4 text-muted-foreground">
            <span><Users className="inline-block mr-2 h-4 w-4" /> 1.2k Followers</span>
            <span><Play className="inline-block mr-2 h-4 w-4" /> {totalPlays.toLocaleString()} plays</span>
          </div>
          <Button>Follow</Button>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-4">Top Tracks</h2>
        <div className="space-y-2">
          {tracks.length > 0 ? (
            tracks.map((track) => (
              <TrackCard key={track.id} track={track} variant="list" playlist={tracks} />
            ))
          ) : (
            <p className="text-muted-foreground">This artist hasn't uploaded any tracks yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};
