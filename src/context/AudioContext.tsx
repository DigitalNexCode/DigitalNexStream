import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { TrackWithArtistAndLikes, incrementStreamCount, toggleLike } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface AudioContextType {
  currentTrack: TrackWithArtistAndLikes | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: TrackWithArtistAndLikes[];
  currentIndex: number;
  playTrack: (track: TrackWithArtistAndLikes, playlist?: TrackWithArtistAndLikes[]) => void;
  playPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleCurrentTrackLike: () => void;
}

export const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrackState] = useState<TrackWithArtistAndLikes | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<TrackWithArtistAndLikes[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();

  const playTrack = useCallback((track: TrackWithArtistAndLikes, playlist?: TrackWithArtistAndLikes[]) => {
    if (playlist) {
      const trackIndex = playlist.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setQueue(playlist);
        setCurrentIndex(trackIndex);
      } else {
        setQueue([track]);
        setCurrentIndex(0);
      }
    } else {
      setQueue([track]);
      setCurrentIndex(0);
    }
    
    setCurrentTrackState(track);
    if (audioRef.current) {
      audioRef.current.src = track.audio_url;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true));
      incrementStreamCount(track.id, user?.id ?? null);
    }
  }, [user]);

  const playPause = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[nextIndex], queue);
  }, [queue, currentIndex, playTrack]);

  const previousTrack = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    playTrack(queue[prevIndex], queue);
  }, [queue, currentIndex, playTrack]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);
  
  const toggleCurrentTrackLike = useCallback(async () => {
    if (!currentTrack || !user) return;
    
    const isLiked = await toggleLike(currentTrack.id, user.id);
    
    setCurrentTrackState(prev => {
        if (!prev) return null;
        const newLikesCount = isLiked 
            ? (prev.likes?.[0]?.count ?? 0) + 1
            : (prev.likes?.[0]?.count ?? 1) - 1;

        return {
            ...prev,
            user_liked: [{ count: isLiked ? 1 : 0 }],
            likes: [{ count: newLikesCount }],
        };
    });
  }, [currentTrack, user]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextTrack]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        currentIndex,
        playTrack,
        playPause,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        toggleCurrentTrackLike,
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata" />
    </AudioContext.Provider>
  );
};
