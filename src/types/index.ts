export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'listener' | 'artist' | 'admin';
  isVerified: boolean;
  createdAt: string;
  followersCount: number;
  followingCount: number;
}

export interface Artist extends User {
  bio?: string;
  website?: string;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
  monthlyListeners: number;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artist: Artist;
  genre: string;
  duration: number; // in seconds
  coverArt: string;
  audioUrl: string;
  plays: number;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  contributors: Contributor[];
  revenueData: RevenueData;
}

export interface Contributor {
  id: string;
  name: string;
  role: 'singer' | 'producer' | 'writer' | 'mixer' | 'featured';
  splitPercentage: number;
  userId?: string;
}

export interface RevenueData {
  totalEarnings: number;
  monthlyEarnings: number;
  playsThisMonth: number;
  revenuePerPlay: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverArt: string;
  createdBy: string;
  createdByUser: User;
  tracks: Track[];
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: string;
  name: string;
  icon: string;
  trackCount: number;
}
