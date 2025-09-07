import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { Footer } from '@/components/layout/Footer';
import { Upload, BarChart2, Users, Music, DollarSign, ShieldCheck, ArrowRight } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-start text-left p-6 bg-secondary/50 rounded-lg border border-border/50">
    <div className="inline-block p-3 bg-primary/10 text-primary rounded-lg mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export const FeaturesPage: React.FC = () => {
  return (
    <div className="bg-background text-foreground">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Built for Independent Artists</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-8">
            SoundWave provides a powerful, all-in-one suite of tools to help you manage your music, connect with fans, and grow your career.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Upload size={24} />} 
              title="Effortless Uploads" 
              description="Upload your high-fidelity audio files and cover art in seconds. Our system handles the rest, ensuring your music sounds its best everywhere." 
            />
            <FeatureCard 
              icon={<BarChart2 size={24} />} 
              title="Advanced Analytics" 
              description="Get deep insights into your audience. Track streams, see where your listeners are from, and understand what's resonating." 
            />
            <FeatureCard 
              icon={<DollarSign size={24} />} 
              title="Transparent Monetization" 
              description="Earn revenue for every stream. We provide clear, easy-to-understand earnings reports and timely payouts." 
            />
            <FeatureCard 
              icon={<Users size={24} />} 
              title="Collaborator Splits" 
              description="Easily add producers, writers, and featured artists to your tracks and set up automatic revenue splits. No more spreadsheets." 
            />
            <FeatureCard 
              icon={<Music size={24} />} 
              title="Global Distribution" 
              description="Reach a global audience on the SoundWave platform. Your music is available to millions of listeners from day one." 
            />
            <FeatureCard 
              icon={<ShieldCheck size={24} />} 
              title="Own Your Rights" 
              description="You always retain 100% ownership of your music and your rights. We're your partner, not your owner." 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Start Your Journey Today</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">Join a community of artists who are taking control of their careers.</p>
            <Button asChild size="lg" variant="secondary" className="group">
              <Link to="/auth">
                Sign Up For Free <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
