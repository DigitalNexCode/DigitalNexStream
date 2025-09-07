import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Music, Upload, BarChart2, Users } from 'lucide-react';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { Footer } from '@/components/layout/Footer';
import { TrackCard } from '@/components/track/TrackCard';
import { getPublicTracks, TrackWithArtistAndLikes } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import CountUp from 'react-countup';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="text-center p-6 bg-secondary/50 rounded-lg">
    <div className="inline-block p-4 bg-primary/10 text-primary rounded-full mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const TestimonialCard = ({ avatar, name, handle, text }: { avatar: string, name: string, handle: string, text: string }) => (
  <Card className="bg-secondary/50 border-none">
    <CardContent className="p-6">
      <div className="flex items-center mb-4">
        <Avatar>
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{handle}</p>
        </div>
      </div>
      <p className="text-muted-foreground">{text}</p>
    </CardContent>
  </Card>
);

export const LandingPage: React.FC = () => {
  const [tracks, setTracks] = useState<TrackWithArtistAndLikes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const data = await getPublicTracks(6);
        setTracks(data);
      } catch (error) {
        console.error("Failed to fetch public tracks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  return (
    <div className="bg-background text-foreground">
      <LandingHeader />

      {/* Hero Section */}
      <section 
        className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 opacity-80"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 p-4">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight">Where Music Finds Its Voice</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/80 mb-8">
            The ultimate platform for independent artists to upload, distribute, and monetize their music.
          </p>
          <Button asChild size="lg" className="group">
            <Link to="/auth">
              Start Listening <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-secondary/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary"><CountUp end={10000} duration={3} enableScrollSpy />+</h3>
              <p className="text-muted-foreground">Artists Joined</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary"><CountUp end={500000} duration={3} enableScrollSpy separator="," />+</h3>
              <p className="text-muted-foreground">Tracks Uploaded</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary"><CountUp end={10} duration={3} enableScrollSpy />M+</h3>
              <p className="text-muted-foreground">Monthly Streams</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary">$<CountUp end={2} duration={3} enableScrollSpy />M+</h3>
              <p className="text-muted-foreground">Paid to Artists</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Everything an Artist Needs</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">From flawless uploads to transparent analytics, we've got you covered.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<Upload />} title="Effortless Uploads" description="Upload your tracks in high-fidelity with simple metadata tagging." />
            <FeatureCard icon={<Music />} title="Seamless Streaming" description="Deliver your music to listeners worldwide with our robust player." />
            <FeatureCard icon={<BarChart2 />} title="Powerful Analytics" description="Track your streams, earnings, and audience growth in real-time." />
            <FeatureCard icon={<Users />} title="Connect & Collaborate" description="Manage contributors and revenue splits with ease and transparency." />
          </div>
        </div>
      </section>

      {/* Media Showcase */}
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Fresh on the Wave</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-full aspect-square" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {tracks.map(track => <TrackCard key={track.id} track={track} playlist={tracks} />)}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Loved by Artists & Listeners</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard avatar="https://i.pravatar.cc/150?u=a042581f4e29026704d" name="Elena Rivera" handle="@elena_music" text="SoundWave gave me the tools to finally get my music out there. The analytics are a game-changer!" />
            <TestimonialCard avatar="https://i.pravatar.cc/150?u=a042581f4e29026704e" name="Marcus Chen" handle="@dj_marcus" text="As a producer, managing splits was always a headache. SoundWave makes it transparent and automatic." />
            <TestimonialCard avatar="https://i.pravatar.cc/150?u=a042581f4e29026704f" name="Sophie Dubois" handle="@sophie_sings" text="I've discovered so many amazing indie artists here that I wouldn't have found anywhere else. Love it!" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Make Waves?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">Join thousands of independent artists and share your sound with a global audience.</p>
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
