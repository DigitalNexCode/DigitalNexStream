import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export const LandingHeader: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SW</span>
          </div>
          <span className="font-bold text-xl text-white">SoundWave</span>
        </Link>
        <nav className="flex items-center space-x-2">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link to="/features">Features</Link>
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">Artists</Button>
          <div className="text-white [&>button]:text-white [&>button]:hover:bg-white/10 [&>button:focus-visible]:ring-white">
            <ThemeToggle />
          </div>
          <Button asChild variant="secondary">
            <Link to="/auth">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};
