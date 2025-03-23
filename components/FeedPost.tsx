import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

interface PostVote {
  post_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
}

interface FeedPostProps {
  id: string;
  type: 'video' | 'image';
  url: string;
  caption: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  onVoteChange: () => void;
  issue_type: 'environmental_hazard' | 'accident';
  location: string;
  latitude: number;
  longitude: number;
}

export function FeedPost({
  id,
  type,
  url,
  caption,
  upvotes,
  downvotes,
  userVote,
  onVoteChange,
  issue_type,
  location,
  latitude,
  longitude
}: FeedPostProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      if (userVote === voteType) {
        // Remove vote if clicking the same button
        const { error } = await supabase
          .from('PostVote')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // If user has an existing vote, delete it first
        if (userVote) {
          const { error: deleteError } = await supabase
            .from('PostVote')
            .delete()
            .eq('post_id', id)
            .eq('user_id', user.id);

          if (deleteError) throw deleteError;
        }

        // Add a small delay to ensure delete completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Then insert the new vote
        const { error: insertError } = await supabase
          .from('PostVote')
          .insert({
            post_id: id,
            user_id: user.id,
            vote_type: voteType
          } as PostVote);

        if (insertError) throw insertError;
      }
      onVoteChange();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleEmergencyPress = () => {
    if (issue_type === 'accident') {
      router.push({
        pathname: '/',
        params: { selectedPostId: id }
      });
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleEmergencyPress}
      disabled={issue_type !== 'accident'}
      className="bg-gray-800 rounded-xl p-4 mb-4"
    >
      {type === 'image' ? (
        <Image
          source={{ uri: url }}
          className="w-full h-48 rounded-lg mb-4"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-48 rounded-lg mb-4 bg-black justify-center items-center">
          <Ionicons name="videocam" size={48} color="white" />
          <Text className="text-white mt-2">Video Content</Text>
        </View>
      )}

      <View className="flex-row items-center mb-2">
        <View
          className={`px-3 py-1 rounded-full ${
            issue_type === 'environmental_hazard' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <Text className="text-white text-sm">
            {issue_type === 'environmental_hazard'
              ? 'Environmental Hazard'
              : 'Accident'}
          </Text>
        </View>
      </View>

      <Text className="text-gray-300 mb-2">{caption}</Text>
      
      <View className="flex-row items-center mb-2">
        <Ionicons name="location" size={16} color="#60A5FA" />
        <Text className="text-gray-400 ml-1">{location}</Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => handleVote('up')}
            className="flex-row items-center mr-4"
          >
            <Ionicons
              name={userVote === 'up' ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={24}
              color={userVote === 'up' ? '#60A5FA' : '#9CA3AF'}
            />
            <Text className="text-gray-400 ml-1">{upvotes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleVote('down')}
            className="flex-row items-center"
          >
            <Ionicons
              name={userVote === 'down' ? 'arrow-down-circle' : 'arrow-down-circle-outline'}
              size={24}
              color={userVote === 'down' ? '#EF4444' : '#9CA3AF'}
            />
            <Text className="text-gray-400 ml-1">{downvotes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}