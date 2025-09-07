import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';

export const MusicPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleCurrentTrackLike,
  } = useAudio();
  const { user } = useAuth();
  
  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLiked = currentTrack.user_liked?.[0]?.count > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-t border-border p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <img
              src={currentTrack.cover_art_url}
              alt={currentTrack.title}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <h3 className="font-medium truncate">{currentTrack.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.profiles?.display_name}
              </p>
            </div>
            {user && (
              <Button variant="ghost" size="sm" onClick={toggleCurrentTrackLike}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm"><Shuffle className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={previousTrack}><SkipBack className="w-5 h-5" /></Button>
              <Button size="sm" onClick={playPause} className="w-10 h-10 rounded-full">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={nextTrack}><SkipForward className="w-5 h-5" /></Button>
              <Button variant="ghost" size="sm"><Repeat className="w-4 h-4" /></Button>
            </div>

            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-muted-foreground min-w-[3rem] text-right">{formatTime(currentTime)}</span>
              <Slider value={[currentTime]} max={duration} step={1} className="flex-1" onValueChange={(value) => seek(value[0])} />
              <span className="text-xs text-muted-foreground min-w-[3rem]">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-1 justify-end">
            <Volume2 className="w-4 h-4" />
            <Slider value={[volume]} max={1} step={0.01} className="w-24" onValueChange={(value) => setVolume(value[0])} />
          </div>
        </div>
      </div>
    </div>
  );
};
