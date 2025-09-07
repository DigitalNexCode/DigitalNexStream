import React from 'react';
import { Loader2 } from 'lucide-react';

export const FullScreenLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};
