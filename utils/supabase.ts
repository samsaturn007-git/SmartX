import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Supabase client with AsyncStorage for mobile persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export interface Post {
  id: string;
  type: 'video' | 'image';
  url: string;
  caption: string;
  issue_type: 'environmental_hazard' | 'accident';
  latitude: number;
  longitude: number;
  location: string;
  PostVote?: { vote_type: 'up' | 'down', user_id: string }[];
}

export const getPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('Post')
    .select('*, PostVote(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return data as Post[];
};

export const createPost = async (
  userId: string,
  type: 'video' | 'image',
  url: string,
  caption: string,
  issue_type: 'environmental_hazard' | 'accident',
  latitude: number,
  longitude: number,
  location: string
) => {
  const { error } = await supabase.from('Post').insert({
    user_id: userId,
    type,
    url,
    caption,
    issue_type,
    latitude,
    longitude,
    location
  });

  if (error) throw error;
};

export const getPostVotes = async (postId: string) => {
  const { data, error } = await supabase
    .from('PostVote')
    .select('*')
    .eq('post_id', postId);

  if (error) throw error;
  return data;
};
