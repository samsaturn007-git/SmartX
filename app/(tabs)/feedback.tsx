import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Platform } from 'react-native';
import Header from '@/components/header';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';
import { supabase, getPosts, createPost, getPostVotes, Post } from '@/utils/supabase';
import { FeedPost } from '@/components/FeedPost';
import { useLocalSearchParams } from 'expo-router';
import { User } from '@supabase/supabase-js';
import { useMcpTool } from '@/hooks/useMcpTool';
import { LinearGradient } from 'expo-linear-gradient';

type IssueType = 'environmental_hazard' | 'accident';
type SortOption = 'upvotes' | 'downvotes' | 'newest';
type VoteType = 'up' | 'down' | null;

interface LocationState {
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number | undefined;
}

interface VoteCounts {
  upvotes: number;
  downvotes: number;
  userVote: VoteType;
}

export default function FeedbackScreen() {
  const { selectedPostId } = useLocalSearchParams<{ selectedPostId: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<{ [key: string]: View | null }>({});
  
  const { user } = useAuth();
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('image');
  const [caption, setCaption] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('environmental_hazard');
  const [location, setLocation] = useState<LocationState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('upvotes');

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (selectedPostId && posts.length > 0) {
      const selectedPost = postRefs.current[selectedPostId];
      if (selectedPost && scrollViewRef.current) {
        setTimeout(() => {
          selectedPost.measure((x, y, width, height, pageX, pageY) => {
            scrollViewRef.current?.scrollTo({
              y: pageY - 100,
              animated: true
            });
          });
        }, 500);
      }
    }
  }, [selectedPostId, posts]);

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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });

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
        accuracy: location.coords.accuracy || undefined
      });

      if (location.coords.accuracy) {
        alert(`Location accuracy: ${Math.round(location.coords.accuracy)} meters`);
      }
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
        exif: true
      });

      if (!result.canceled) {
        setMedia(result.assets[0].uri);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
        
        const asset = result.assets[0];
        if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: asset.exif.GPSLatitude,
            longitude: asset.exif.GPSLongitude,
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
            latitude: asset.exif.GPSLatitude,
            longitude: asset.exif.GPSLongitude,
            address: locationString
          });
        } else {
          getCurrentLocation();
        }
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
        exif: true
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

  const getVoteCounts = (post: Post): VoteCounts => {
    const votes = post.PostVote || [];
    const upvotes = votes.filter(v => v.vote_type === 'up').length;
    const downvotes = votes.filter(v => v.vote_type === 'down').length;
    const userVote = user ? (votes.find(v => v.user_id === user.id)?.vote_type as VoteType) || null : null;
    return { upvotes, downvotes, userVote };
  };

  const sortPosts = (postsToSort: Post[]): Post[] => {
    return [...postsToSort].sort((a, b) => {
      const aVotes = getVoteCounts(a);
      const bVotes = getVoteCounts(b);

      switch (sortBy) {
        case 'upvotes':
          return bVotes.upvotes - aVotes.upvotes;
        case 'downvotes':
          return bVotes.downvotes - aVotes.downvotes;
        case 'newest':
          return parseInt(b.id) - parseInt(a.id);
        default:
          return 0;
      }
    });
  };

  const renderLocationInfo = () => {
    if (!location) {
      return <Text className="text-gray-400">Add location (required)</Text>;
    }
    
    return (
      <View>
        <Text className="text-gray-300">{location.address}</Text>
        <Text className="text-xs text-gray-400">
          {`Lat: ${location.latitude.toFixed(6)}, Long: ${location.longitude.toFixed(6)}`}
          {location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-900">
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.2)', 'rgba(0, 0, 0, 0)']}
        style={{ position: 'absolute', width: '100%', height: 400 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className='absolute top-12 left-0 right-0 z-10 px-4'>
          <Header title="Community Feed" color="white" search={false} showCitySelector={false}/>
        </View>
        
        <SafeAreaView className='flex-1 px-5 pt-16'>
          {/* Upload Section */}
          <View className="bg-gray-800/90 rounded-xl p-6 mb-6 shadow-xl shadow-blue-500/20">
            <View className="flex-row items-center mb-4">
              <Ionicons name="alert-circle" size={24} color="#60A5FA" />
              <View className="ml-3">
                <Text className="text-white text-lg font-bold">Report an Issue</Text>
                <Text className="text-gray-400 text-sm">
                  Share environmental hazards or accidents
                </Text>
              </View>
            </View>

            <View className="flex-row justify-around mb-4">
              <TouchableOpacity 
                onPress={takeMedia}
                className="items-center bg-blue-600 rounded-2xl p-4 w-36 shadow-lg shadow-blue-500/30"
              >
                <Ionicons name="camera" size={24} color="white" />
                <Text className="text-white mt-2 font-medium">Capture</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={pickMedia}
                className="items-center bg-blue-700 rounded-2xl p-4 w-36 shadow-lg shadow-blue-500/30"
              >
                <Ionicons name="images" size={24} color="white" />
                <Text className="text-white mt-2 font-medium">Upload</Text>
              </TouchableOpacity>
            </View>

            {media && (
              <View className="items-center">
                {mediaType === 'image' ? (
                  <View className="w-full rounded-xl overflow-hidden shadow-xl shadow-black/50 mb-4">
                    <Image 
                      source={{ uri: media }} 
                      className="w-full h-48"
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View className="w-full h-48 rounded-xl mb-4 bg-black justify-center items-center shadow-xl shadow-black/50">
                    <Ionicons name="videocam" size={48} color="white" />
                    <Text className="text-white mt-2">Video Selected</Text>
                  </View>
                )}

                <View className="w-full mb-4">
                  <Text className="text-blue-400 mb-2 font-medium">Issue Type</Text>
                  <View className="flex-row justify-around">
                    <TouchableOpacity 
                      onPress={() => setIssueType('environmental_hazard')}
                      className={`px-4 py-3 rounded-xl shadow-lg ${
                        issueType === 'environmental_hazard' 
                          ? 'bg-green-600 shadow-green-500/30' 
                          : 'bg-gray-700 shadow-black/20'
                      }`}
                    >
                      <Text className="text-white font-medium">
                        Environmental Hazard
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => setIssueType('accident')}
                      className={`px-4 py-3 rounded-xl shadow-lg ${
                        issueType === 'accident' 
                          ? 'bg-red-600 shadow-red-500/30' 
                          : 'bg-gray-700 shadow-black/20'
                      }`}
                    >
                      <Text className="text-white font-medium">
                        Accident
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="w-full mb-4">
                  <Text className="text-blue-400 mb-2 font-medium">Location</Text>
                  <TouchableOpacity 
                    onPress={getCurrentLocation}
                    className="flex-row items-center bg-gray-700/80 rounded-xl p-4 border border-gray-600/50 shadow-lg shadow-black/20"
                  >
                    <Ionicons 
                      name="location" 
                      size={20} 
                      color={location ? '#60A5FA' : '#9CA3AF'} 
                    />
                    <View className="ml-3 flex-1">
                      {renderLocationInfo()}
                    </View>
                  </TouchableOpacity>
                </View>

                <TextInput
                  className="w-full bg-gray-700/80 rounded-xl p-4 mb-4 text-white shadow-lg shadow-black/20"
                  placeholder="Add a caption..."
                  placeholderTextColor="#9CA3AF"
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                />

                <TouchableOpacity 
                  onPress={uploadMedia}
                  disabled={uploading || !caption || !location}
                  className={`bg-blue-600 px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 ${
                    (uploading || !caption || !location) ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-white font-semibold text-lg">
                    {uploading ? 'Uploading...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Community Reports Section */}
          <View className="mb-4">
            <View className="flex-row items-center mb-6">
              <Ionicons name="people" size={24} color="#60A5FA" />
              <Text className="text-white text-xl font-bold ml-3">Community Reports</Text>
            </View>
            {posts.length > 0 ? (
              <View className="space-y-4">
                {sortPosts(posts).map(post => {
                  const { upvotes, downvotes, userVote } = getVoteCounts(post);
                  return (
                    <View
                      key={post.id}
                      ref={ref => postRefs.current[post.id] = ref}
                      className={`shadow-xl shadow-blue-500/20 ${
                        post.id === selectedPostId ? 'border-2 border-blue-500 rounded-xl' : ''
                      }`}
                    >
                      <FeedPost
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
                        latitude={post.latitude}
                        longitude={post.longitude}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="items-center justify-center py-12 bg-gray-800/90 rounded-xl shadow-xl shadow-blue-500/20">
                <Ionicons name="document-text-outline" size={48} color="#60A5FA" />
                <Text className="text-gray-300 mt-4 text-lg">No reports yet</Text>
                <Text className="text-gray-400 mt-1">Be the first to report an issue</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
