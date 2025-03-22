import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../utils/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

interface FeedPostProps {
  id: string;
  type: 'video' | 'image';
  url: string;
  caption: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  onVoteChange: () => void;
  issue_type: 'environmental_hazard' | 'accident';
  location: string;
}

export const FeedPost = ({ 
  id, 
  type, 
  url, 
  caption, 
  upvotes, 
  downvotes, 
  userVote,
  onVoteChange,
  issue_type,
  location
}: FeedPostProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || isLoading) return;
    setIsLoading(true);

    try {
      if (userVote === voteType) {
        await supabase
          .from('PostVote')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('PostVote')
          .upsert({
            post_id: id,
            user_id: user.id,
            vote_type: voteType
          });
      }
      onVoteChange();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="bg-white rounded-xl mb-4 overflow-hidden">
      {type === 'video' ? (
        <Video
          source={{ uri: url }}
          className="w-full h-64"
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
      ) : (
        <Image
          source={{ uri: url }}
          className="w-full h-64"
          resizeMode="cover"
        />
      )}

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <View className={`px-3 py-1 rounded-full ${
            issue_type === 'environmental_hazard' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`${
              issue_type === 'environmental_hazard' ? 'text-green-700' : 'text-red-700'
            } text-sm font-medium`}>
              {issue_type === 'environmental_hazard' ? 'Environmental Hazard' : 'Accident'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-1">{location}</Text>
        </View>

        <Text className="text-gray-800 text-base mb-2">{caption}</Text>
        
        <View className="flex-row justify-between items-center">
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              onPress={() => handleVote('up')}
              className="flex-row items-center space-x-1"
              disabled={isLoading}
            >
              <FontAwesome 
                name={userVote === 'up' ? 'thumbs-up' : 'thumbs-o-up'} 
                size={20} 
                color={userVote === 'up' ? '#3B82F6' : '#6B7280'} 
              />
              <Text className="text-gray-600">{upvotes}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleVote('down')}
              className="flex-row items-center space-x-1"
              disabled={isLoading}
            >
              <FontAwesome 
                name={userVote === 'down' ? 'thumbs-down' : 'thumbs-o-down'} 
                size={20} 
                color={userVote === 'down' ? '#EF4444' : '#6B7280'} 
              />
              <Text className="text-gray-600">{downvotes}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};