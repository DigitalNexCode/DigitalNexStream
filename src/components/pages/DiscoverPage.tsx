import React, { useState, useEffect } from 'react';
import { TrackCard } from '@/components/track/TrackCard';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Heart } from 'lucide-react';
import { getTracks, TrackWithArtistAndLikes } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

const TrackGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="w-full aspect-square" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export const DiscoverPage: React.FC = () => {
  const [tracks, setTracks] = useState<TrackWithArtistAndLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const data = await getTracks(user?.id);
        setTracks(data);
      } catch (error) {
        console.error("Failed to fetch tracks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [user]);

  const trendingTracks = tracks.slice(0, 6);
  const recentTracks = tracks.slice(6, 12);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">Discover Amazing Music</h1>
          <p className="text-lg opacity-90 mb-6">
            Stream unlimited music from independent artists around the world
          </p>
          <Button size="lg" variant="secondary">
            Start Listening
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <TrendingUp className="mr-3 h-6 w-6" />
            Trending Now
          </h2>
          <Button variant="outline">View All</Button>
        </div>
        {loading ? <TrackGridSkeleton /> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trendingTracks.map((track) => (
              <TrackCard key={track.id} track={track} playlist={tracks} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Clock className="mr-3 h-6 w-6" />
            Recently Added
          </h2>
          <Button variant="outline">View All</Button>
        </div>
        <div className="space-y-2">
          {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : (
            recentTracks.map((track) => (
              <TrackCard key={track.id} track={track} variant="list" playlist={tracks} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
