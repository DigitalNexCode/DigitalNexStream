import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Music, Plus, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { uploadTrack } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jsmediatags from "jsmediatags/dist/jsmediatags.min.js";

const contributorSchema = z.object({
  profile_id: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  split_percentage: z.number().min(0).max(100),
});

const uploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  genre: z.string().min(1, 'Genre is required'),
  description: z.string().optional(),
  audioFile: z.instanceof(File, { message: 'Audio file is required' }),
  coverArtFile: z.instanceof(File, { message: 'Cover art is required' }),
  contributors: z.array(contributorSchema).min(1, 'At least one contributor is required'),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const GENRES = ["Electronic", "Rock", "Pop", "Hip Hop", "Jazz", "Classical", "Folk", "R&B", "Ambient"];

export const UploadPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<{ audio: number, cover: number } | null>(null);
  const [duration, setDuration] = useState(0);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      genre: '',
      description: '',
      contributors: [{ profile_id: profile?.id, role: 'artist', split_percentage: 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contributors',
  });

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('audioFile', file);
      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          setDuration(tag.tags.TLEN ? parseInt(tag.tags.TLEN.data as string) / 1000 : 0);
        },
        onError: () => {
          const audio = new Audio(URL.createObjectURL(file));
          audio.onloadedmetadata = () => setDuration(audio.duration);
        }
      });
    }
  };

  const onSubmit = async (values: UploadFormValues) => {
    if (!profile) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }
    setUploadProgress({ audio: 0, cover: 0 });

    try {
      const trackData = {
        title: values.title,
        genre: values.genre,
        description: values.description,
        owner_id: profile.id,
        duration: Math.round(duration),
      };
      
      await uploadTrack(
        trackData,
        values.contributors,
        values.audioFile,
        values.coverArtFile,
        (progress) => setUploadProgress(progress)
      );

      toast.success('Track uploaded successfully!', {
        description: `"${values.title}" is now live.`,
        action: {
          label: 'View Dashboard',
          onClick: () => navigate('/dashboard'),
        },
      });
      form.reset();
      setUploadProgress(null);

    } catch (error) {
      toast.error('Upload Failed', { description: 'There was a problem uploading your track.' });
      setUploadProgress(null);
    }
  };

  const totalProgress = uploadProgress ? (uploadProgress.audio + uploadProgress.cover) / 2 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Upload Your Music</h1>
        <p className="text-muted-foreground">Share your tracks with the world and start earning.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Music className="mr-2 h-5 w-5" /> Audio & Cover Art</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="audioFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio File *</FormLabel>
                    <FormControl>
                      <Input type="file" accept="audio/*" onChange={handleAudioFileChange} />
                    </FormControl>
                    <FormMessage />
                    {field.value && <p className="text-sm text-muted-foreground">Selected: {field.value.name}</p>}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverArtFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Art *</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} />
                    </FormControl>
                    <FormMessage />
                    {field.value && <p className="text-sm text-muted-foreground">Selected: {field.value.name}</p>}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Track Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Track Title *</FormLabel>
                  <FormControl><Input placeholder="My Awesome Song" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="genre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Tell us about your track..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">Contributors & Revenue Split
                <Button type="button" size="sm" onClick={() => append({ role: 'featured', split_percentage: 0 })}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </CardTitle>
              <CardDescription>Default split is equal among all contributors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-2 p-3 border rounded-lg">
                  <FormField control={form.control} name={`contributors.${index}.profile_id`} render={({ field }) => (
                    <FormItem className="flex-1"><FormLabel>Name (User ID)</FormLabel><FormControl><Input placeholder="Contributor's User ID (optional)" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name={`contributors.${index}.role`} render={({ field }) => (
                    <FormItem className="flex-1"><FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="artist">Artist</SelectItem><SelectItem value="producer">Producer</SelectItem><SelectItem value="writer">Writer</SelectItem><SelectItem value="featured">Featured</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {uploadProgress !== null && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{totalProgress < 100 ? 'Uploading...' : 'Upload Complete!'}</span>
                    <span>{Math.round(totalProgress)}%</span>
                  </div>
                  <Progress value={totalProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" disabled={uploadProgress !== null}>Save as Draft</Button>
            <Button type="submit" disabled={uploadProgress !== null && totalProgress < 100}>
              {uploadProgress !== null && totalProgress < 100 ? 'Uploading...' : 'Upload Track'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
