import React from 'react';
import { Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAudio } from '@/context/AudioContext';
import { TrackWithArtistAndLikes } from '@/lib/api';

interface TrackCardProps {
  track: TrackWithArtistAndLikes;
  playlist: TrackWithArtistAndLikes[];
  variant?: 'grid' | 'list';
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, playlist, variant = 'grid' }) => {
  const { currentTrack, isPlaying, playTrack, playPause } = useAudio();
  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      playPause();
    } else {
      playTrack(track, playlist);
    }
  };

  const handleCardClick = () => {
    if (!isCurrentTrack) {
      playTrack(track, playlist);
    }
  };

  if (variant === 'list') {
    return (
      <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 group cursor-pointer" onClick={handleCardClick}>
        <div className="relative">
          <img src={track.cover_art_url} alt={track.title} className="w-12 h-12 rounded object-cover" />
          <Button size="sm" variant="ghost" className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 text-white hover:bg-black/60" onClick={handlePlayPause}>
            {isCurrentTrack && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex-1 min-w-0 ml-3">
          <h3 className="font-medium truncate">{track.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{track.profiles?.display_name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
          <Button variant="ghost" size="sm"><Heart className="w-4 h-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem>Add to Queue</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card className="group hover:bg-muted/50 transition-colors" onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="relative mb-4">
          <img src={track.cover_art_url} alt={track.title} className="w-full aspect-square object-cover rounded-lg" />
          <Button size="sm" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" onClick={handlePlayPause}>
            {isCurrentTrack && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        <h3 className="font-medium truncate mb-1">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate mb-2">{track.profiles?.display_name}</p>
        <p className="text-xs text-muted-foreground">{(track.streams[0]?.count || 0).toLocaleString()} plays</p>
      </CardContent>
    </Card>
  );
};
