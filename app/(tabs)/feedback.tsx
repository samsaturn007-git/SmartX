import React from 'react';
import { View, Text } from 'react-native';
import Header from '@/components/header';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function () {
  const {friends} = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className='absolute top-10 left-0 right-0 z-10'>
        <Header title="Friends" color="white" search/>
      </View>
      <SafeAreaView className='flex-1 items-center justify-center'>
        <View className="p-4 w-full">
          <View className="bg-gray-100 rounded-lg p-6">
            <View className="items-center justify-center">
              <Text className="text-lg font-bold mb-2">Friends Feed</Text>
              <View className="mb-4">
                <View className="h-40 w-full bg-gray-200 rounded-lg" />
              </View>
              <View className="w-full">
                <View className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                <View className="h-4 w-1/2 bg-gray-200 rounded" />
              </View>
              <Text className="mt-4 text-gray-600">
                {friends?.length ? `Connected with ${friends.length} friends` : 'No friends connected yet'}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
