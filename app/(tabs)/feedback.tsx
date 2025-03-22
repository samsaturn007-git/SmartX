import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Platform } from 'react-native';
import Header from '@/components/header';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';
import { supabase, getPosts, createPost, getPostVotes } from '@/utils/supabase';
import { FeedPost } from '@/components/FeedPost';
import { LiveStream } from '@/components/LiveStream';

interface Post {
  id: string;
  type: 'video' | 'image';
  url: string;
  caption: string;
  issue_type: 'environmental_hazard' | 'accident';
  latitude: number;
  longitude: number;
  location: string;
  is_live?: boolean;
  stream_url?: string;
  PostVote?: { vote_type: 'up' | 'down', user_id: string }[];
}

type IssueType = 'environmental_hazard' | 'accident';

export default function () {
  const { user } = useAuth();
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('image');
  const [caption, setCaption] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('environmental_hazard');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to post issues.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationString = [
        address.street,
        address.city,
        address.region,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: locationString,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get location. Please try again.');
    }
  };

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need media library permissions to upload content.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setMedia(result.assets[0].uri);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error picking media:', error);
      alert('Error accessing media library.');
    }
  };

  const takeMedia = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to capture media.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setMedia(result.assets[0].uri);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error taking media:', error);
      alert('Error accessing camera.');
    }
  };

  const uploadMedia = async () => {
    if (!media || !user || !location) {
      if (!location) {
        alert('Please add location before posting.');
      }
      return;
    }

    setUploading(true);
    try {
      const fileExt = media.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // For web platform
      if (Platform.OS === 'web') {
        const response = await fetch(media);
        if (!response.ok) {
          throw new Error('Failed to fetch media file');
        }
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('accidents')
          .upload(filePath, blob, {
            contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;
      } else {
        // For mobile platforms
        const base64 = await FileSystem.readAsStringAsync(media, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);

        const { error: uploadError } = await supabase.storage
          .from('accidents')
          .upload(filePath, arrayBuffer, {
            contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;
      }

      const { data } = supabase.storage
        .from('accidents')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      await createPost(
        user.id,
        mediaType,
        data.publicUrl,
        caption,
        issueType,
        location.latitude,
        location.longitude,
        location.address
      );
      
      alert('Content uploaded successfully!');
      setMedia(null);
      setCaption('');
      setLocation(null);
      loadPosts();
    } catch (error) {
      console.error('Error uploading content:', error);
      if (error instanceof Error) {
        alert(`Upload failed: ${error.message}`);
      } else {
        alert('Error uploading content.');
      }
    } finally {
      setUploading(false);
    }
  };

  const getVoteCounts = (post: Post) => {
    const votes = post.PostVote || [];
    const upvotes = votes.filter(v => v.vote_type === 'up').length;
    const downvotes = votes.filter(v => v.vote_type === 'down').length;
    const userVote = user ? votes.find(v => v.user_id === user.id)?.vote_type : null;
    return { upvotes, downvotes, userVote };
  };

  // Separate live streams from regular posts
  const liveStreams = posts.filter(post => post.is_live);
  const regularPosts = posts.filter(post => !post.is_live);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className='absolute top-10 left-0 right-0 z-10'>
        <Header title="Community Feed" color="white" search={false}/>
      </View>
      
      <SafeAreaView className='flex-1 px-4 pt-20'>
        {/* Live Streams Section */}
        {liveStreams.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-bold mb-4">Live Now</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {liveStreams.map(stream => (
                <View key={stream.id} className="mr-4 w-64">
                  <LiveStream
                    postId={stream.id}
                    userId={user?.id || ''}
                    isStreamer={false}
                  />
                  <View className="mt-2">
                    <Text className="text-sm text-gray-500">{stream.location}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upload Section */}
        <View className="bg-gray-50 rounded-xl p-6 mb-4">
          <Text className="text-lg font-bold mb-2">Report an Issue</Text>
          <Text className="text-gray-600 mb-4">
            Take a photo/video or upload from your gallery to report accidents or environmental issues
          </Text>

          <View className="flex-row justify-around mb-4">
            <TouchableOpacity 
              onPress={takeMedia}
              className="items-center bg-black rounded-full p-4"
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text className="text-white mt-1">Capture</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={pickMedia}
              className="items-center bg-gray-800 rounded-full p-4"
            >
              <Ionicons name="images" size={24} color="white" />
              <Text className="text-white mt-1">Upload</Text>
            </TouchableOpacity>
          </View>

          {media && (
            <View className="items-center">
              {mediaType === 'image' ? (
                <Image 
                  source={{ uri: media }} 
                  className="w-full h-48 rounded-lg mb-4"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-48 rounded-lg mb-4 bg-black justify-center items-center">
                  <Ionicons name="videocam" size={48} color="white" />
                  <Text className="text-white mt-2">Video Selected</Text>
                </View>
              )}

              <View className="w-full mb-4">
                <Text className="text-gray-700 mb-2">Issue Type:</Text>
                <View className="flex-row justify-around">
                  <TouchableOpacity 
                    onPress={() => setIssueType('environmental_hazard')}
                    className={`px-4 py-2 rounded-full ${
                      issueType === 'environmental_hazard' 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <Text className={`${
                      issueType === 'environmental_hazard' 
                        ? 'text-white' 
                        : 'text-gray-700'
                    }`}>
                      Environmental Hazard
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setIssueType('accident')}
                    className={`px-4 py-2 rounded-full ${
                      issueType === 'accident' 
                        ? 'bg-red-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <Text className={`${
                      issueType === 'accident' 
                        ? 'text-white' 
                        : 'text-gray-700'
                    }`}>
                      Accident
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="w-full mb-4">
                <Text className="text-gray-700 mb-2">Location:</Text>
                <TouchableOpacity 
                  onPress={getCurrentLocation}
                  className="flex-row items-center bg-white rounded-lg p-3 border border-gray-200"
                >
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={location ? '#3B82F6' : '#6B7280'} 
                  />
                  <Text className="ml-2 flex-1 text-gray-600">
                    {location ? location.address : 'Add location (required)'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                className="w-full bg-white rounded-lg p-3 mb-4"
                placeholder="Add a caption..."
                value={caption}
                onChangeText={setCaption}
                multiline
              />

              <TouchableOpacity 
                onPress={uploadMedia}
                disabled={uploading || !caption || !location}
                className={`bg-blue-500 px-6 py-3 rounded-full ${
                  (uploading || !caption || !location) ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-white font-semibold">
                  {uploading ? 'Uploading...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Regular Posts Section */}
        <View className="mb-4">
          <Text className="text-lg font-bold mb-4">Community Reports</Text>
          {regularPosts.length > 0 ? (
            regularPosts.map(post => {
              const { upvotes, downvotes, userVote } = getVoteCounts(post);
              return (
                <FeedPost
                  key={post.id}
                  id={post.id}
                  type={post.type}
                  url={post.url}
                  caption={post.caption}
                  upvotes={upvotes}
                  downvotes={downvotes}
                  userVote={userVote}
                  onVoteChange={loadPosts}
                  issue_type={post.issue_type}
                  location={post.location}
                />
              );
            })
          ) : (
            <View className="items-center justify-center py-8 bg-gray-50 rounded-xl">
              <Ionicons name="document-text-outline" size={48} color="gray" />
              <Text className="text-gray-500 mt-2">No reports yet</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
