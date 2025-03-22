import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Choose one storage implementation:
// Option 1: SecureStore (recommended for sensitive data)
export const ExpoStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  }
};

// Create authenticated client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Post and vote related functions
export const getPosts = async () => {
  const { data: posts, error } = await supabase
    .from('Post')
    .select(`
      *,
      PostVote (*),
      LiveViewer (
        user_id
      )
    `)
    .order('is_live', { ascending: false }) // Live streams first
    .order('created_at', { ascending: false }); // Then most recent posts

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  // Process posts to include viewer count
  return posts?.map(post => ({
    ...post,
    post_votes: post.PostVote || [],
    viewer_count: post.LiveViewer?.length || 0
  })) || [];
};

export const createPost = async (
  userId: string,
  type: 'video' | 'image',
  url: string,
  caption: string,
  issueType: 'environmental_hazard' | 'accident',
  latitude: number,
  longitude: number,
  location: string
) => {
  const { data, error } = await supabase
    .from('Post')
    .insert({
      user_id: userId,
      type,
      url,
      caption,
      issue_type: issueType,
      latitude,
      longitude,
      location,
      is_live: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }
  return data;
};

export const createLiveStream = async (
  userId: string,
  streamUrl: string,
  location: string,
  latitude: number,
  longitude: number
) => {
  const { data, error } = await supabase
    .from('Post')
    .insert({
      user_id: userId,
      type: 'video',
      url: streamUrl,
      caption: 'Live Stream',
      issue_type: 'environmental_hazard',
      latitude,
      longitude,
      location,
      is_live: true,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating live stream:', error);
    throw error;
  }
  return data;
};

export const endLiveStream = async (postId: string) => {
  const { error } = await supabase
    .from('Post')
    .update({
      is_live: false,
      stream_url: null
    })
    .eq('id', postId);

  if (error) {
    console.error('Error ending live stream:', error);
    throw error;
  }
};

export const getPostVotes = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('PostVote')
    .select('vote_type')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching post votes:', error);
    throw error;
  }
  return data?.vote_type || null;
};
