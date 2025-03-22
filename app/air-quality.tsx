import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

export default function AirQuality() {
  const router = useRouter();

  // Sample data - replace with actual API data
  const data = {
    current: 43,
    average: 63,
    suggestedTrip: {
      time: "10:13",
      duration: "32 mins"
    },
    hourlyData: {
      labels: ["8:00", "9:00", "9:41", "10:00", "11:00"],
      data: [45, 55, 43, 50, 48]
    },
    lowestValue: {
      value: 43,
      time: "8:30 AM"
    }
  };

  return (
    <View className="flex-1 bg-gray-900 px-4 pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">Air quality</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="person-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Chart */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <LineChart
            data={{
              labels: data.hourlyData.labels,
              datasets: [{
                data: data.hourlyData.data
              }]
            }}
            width={320}
            height={180}
            chartConfig={{
              backgroundColor: "#1F2937",
              backgroundGradientFrom: "#1F2937",
              backgroundGradientTo: "#1F2937",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#3B82F6"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>

        {/* Current Quality Section */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg">Current Quality</Text>
            <TouchableOpacity>
              <Text className="text-blue-500">See All</Text>
            </TouchableOpacity>
          </View>

          {/* Forecast */}
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-700">
            <View>
              <Text className="text-white text-2xl font-bold">{data.lowestValue.value}</Text>
              <Text className="text-gray-400">Lowest value today</Text>
              <Text className="text-gray-500 text-sm">{data.lowestValue.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>

          {/* Average Level */}
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-700">
            <View>
              <Text className="text-white text-2xl font-bold">{data.average}</Text>
              <Text className="text-gray-400">Average level</Text>
              <Text className="text-gray-500 text-sm">Weekly average</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>

          {/* Suggested Trip */}
          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <View>
              <Text className="text-white text-2xl font-bold">{data.suggestedTrip.time}</Text>
              <Text className="text-gray-400">Suggested Trip</Text>
              <Text className="text-gray-500 text-sm">Time km: {data.suggestedTrip.duration}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Pollutants Section */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-lg">Pollutants</Text>
            <TouchableOpacity>
              <Text className="text-blue-500">See all</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}