import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Twitter, Instagram, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SW</span>
            </div>
            <span className="font-bold text-xl">SoundWave</span>
          </Link>
          <p className="text-sm text-muted-foreground">The best place for independent artists to shine.</p>
          <div className="flex space-x-4">
            <Button variant="ghost" size="icon"><Twitter className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Instagram className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Facebook className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Platform</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="#" className="hover:text-primary">Features</Link></li>
            <li><Link to="#" className="hover:text-primary">For Artists</Link></li>
            <li><Link to="#" className="hover:text-primary">For Listeners</Link></li>
            <li><Link to="/auth" className="hover:text-primary">Sign Up</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="#" className="hover:text-primary">About Us</Link></li>
            <li><Link to="#" className="hover:text-primary">Careers</Link></li>
            <li><Link to="#" className="hover:text-primary">Press</Link></li>
            <li><Link to="#" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Newsletter</h3>
          <p className="text-sm text-muted-foreground mb-2">Get the latest updates and news.</p>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="email" placeholder="Email" />
            <Button type="submit">Subscribe</Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-border/20 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SoundWave. All Rights Reserved.
      </div>
    </footer>
  );
};
