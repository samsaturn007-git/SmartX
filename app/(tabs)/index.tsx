import React from 'react';   
import { View } from 'react-native';  
import Header from '@/components/header';

export default function () {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className='absolute top-10 left-0 right-0 z-10'>
        <Header title="For You" color="white" search/>
      </View>
      <View className="p-4">
        <View className="bg-gray-100 rounded-lg p-6">
          <View className="items-center justify-center">
            <View className="mb-4">
              <View className="h-40 w-full bg-gray-200 rounded-lg" />
            </View>
            <View className="w-full">
              <View className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
              <View className="h-4 w-1/2 bg-gray-200 rounded" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
