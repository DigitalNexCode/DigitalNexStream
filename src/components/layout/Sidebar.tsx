import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Library, Plus, Heart, TrendingUp, Music, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Tables } from '@/types/supabase';

export const Sidebar: React.FC = () => {
  const { profile } = useAuth();
  const [playlists, setPlaylists] = useState<Tables<'playlists'>[]>([]);

  useEffect(() => {
    if (profile) {
      const fetchPlaylists = async () => {
        const { data } = await supabase
          .from('playlists')
          .select('*')
          .eq('owner_id', profile.id)
          .limit(8);
        if (data) setPlaylists(data);
      };
      fetchPlaylists();
    }
  }, [profile]);

  return (
    <div className="w-64 bg-background border-r border-border h-full hidden md:block">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start" size="sm">
              <Link to="/discover"><Home className="mr-3 h-4 w-4" /> Discover</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Search className="mr-3 h-4 w-4" /> Search
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Library className="mr-3 h-4 w-4" /> Your Library
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Plus className="mr-3 h-4 w-4" /> Create Playlist
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Heart className="mr-3 h-4 w-4" /> Liked Songs
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <TrendingUp className="mr-3 h-4 w-4" /> Trending
            </Button>
          </div>

          <Separator />

          {profile?.role === 'artist' && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-2">Artist Tools</h3>
                <Button asChild variant="ghost" className="w-full justify-start" size="sm">
                  <Link to="/dashboard"><LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start" size="sm">
                  <Link to="/upload"><Music className="mr-3 h-4 w-4" /> Upload Music</Link>
                </Button>
              </div>
              <Separator />
            </>
          )}

          {playlists.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Your Playlists</h3>
              {playlists.map((playlist) => (
                <Button key={playlist.id} variant="ghost" className="w-full justify-start truncate text-left h-8" size="sm">
                  <span className="truncate">{playlist.title}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
