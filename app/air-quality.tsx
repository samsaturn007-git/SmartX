import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { fetchEnvironmentalData, type EnvironmentalData } from '../utils/environmentalData';

export default function AirQuality() {
  const router = useRouter();
  const { city } = useLocalSearchParams<{ city: string }>();
  const [environmentalData, setEnvironmentalData] = React.useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchEnvironmentalData(city);
        setEnvironmentalData(data);
      } catch (error) {
        console.error('Error fetching environmental data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city]);

  if (loading || !environmentalData) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  const data = {
    current: environmentalData.current.aqi.value,
    average: Math.round(
      environmentalData.timeRangeAverages.daily.reduce((sum, item) => sum + item.averageAqi, 0) /
      environmentalData.timeRangeAverages.daily.length
    ),
    suggestedTrip: {
      time: environmentalData.hourly
        .reduce((best, hour) => (hour.aqi.value < best.aqi.value ? hour : best))
        .hour,
      duration: "30 mins"
    },
    hourlyData: {
      labels: environmentalData.hourly.map(h => h.hour),
      data: environmentalData.hourly.map(h => h.aqi.value)
    },
    lowestValue: {
      value: Math.min(...environmentalData.hourly.map(h => h.aqi.value)),
      time: environmentalData.hourly
        .reduce((best, hour) => (hour.aqi.value < best.aqi.value ? hour : best))
        .hour
    },
    pollutants: environmentalData.current.aqi.pollutants
  };

  return (
    <View className="flex-1 bg-gray-900 px-4 pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-gray-400 text-base capitalize">{city}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Chart */}
        <View className="bg-gray-800 rounded-xl p-4 mb-6">
          <Text className="text-white text-lg mb-4">24-Hour Air Quality Trend</Text>
          <LineChart
            data={{
              labels: data.hourlyData.labels,
              datasets: [{
                data: data.hourlyData.data
              }]
            }}
            width={320}
            height={220}
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
                r: "6",
                strokeWidth: "2",
                stroke: "#3B82F6",
                fill: "#1F2937"
              },
              propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: "rgba(156, 163, 175, 0.1)"
              },
              propsForLabels: {
                fontSize: 12
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
        <View className="bg-gray-800 rounded-xl p-4 mb-6">
          <Text className="text-white text-lg mb-4">Current Quality</Text>

          {/* Lowest Value */}
          <View className="py-3 border-b border-gray-700">
            <Text className="text-white text-2xl font-bold">{data.lowestValue.value}</Text>
            <Text className="text-gray-400">Lowest value today</Text>
            <Text className="text-gray-500 text-sm">{data.lowestValue.time}</Text>
          </View>

          {/* Average Level */}
          <View className="py-3 border-b border-gray-700">
            <Text className="text-white text-2xl font-bold">{data.average}</Text>
            <Text className="text-gray-400">Average level</Text>
            <Text className="text-gray-500 text-sm">Daily average</Text>
          </View>

          {/* Suggested Trip */}
          <View className="py-3">
            <Text className="text-white text-2xl font-bold">{data.suggestedTrip.time}</Text>
            <Text className="text-gray-400">Best Air Quality Time</Text>
            <Text className="text-gray-500 text-sm">Recommended for outdoor activities</Text>
          </View>
        </View>

        {/* Pollutants Section */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-white text-lg mb-4">Pollutants</Text>
          
          {data.pollutants.pm25 && (
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-400">PM2.5</Text>
              <Text className="text-white">{data.pollutants.pm25} µg/m³</Text>
            </View>
          )}
          {data.pollutants.no2 && (
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-400">NO₂</Text>
              <Text className="text-white">{data.pollutants.no2} ppb</Text>
            </View>
          )}
          {data.pollutants.so2 && (
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-400">SO₂</Text>
              <Text className="text-white">{data.pollutants.so2} ppb</Text>
            </View>
          )}
          {data.pollutants.o3 && (
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-400">O₃</Text>
              <Text className="text-white">{data.pollutants.o3} ppb</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}