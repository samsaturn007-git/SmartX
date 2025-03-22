import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CO2Data {
  current: number;
  status: string;
  hourlyData: number[];
  times: string[];
}

interface CO2WidgetProps {
  data: CO2Data;
}

const getStatusColor = (value: number) => {
  if (value < 800) return '#22C55E'; // Good - Green
  if (value < 1000) return '#EAB308'; // Moderate - Yellow
  if (value < 1500) return '#F97316'; // Poor - Orange
  return '#EF4444'; // Dangerous - Red
};

const getStatusText = (value: number) => {
  if (value < 800) return 'Good';
  if (value < 1000) return 'Moderate';
  if (value < 1500) return 'Poor';
  return 'Dangerous';
};

export default function CO2Widget({ data }: CO2WidgetProps) {
  const statusColor = getStatusColor(data.current);
  const statusText = getStatusText(data.current);

  return (
    <View className="flex-1 bg-gray-800/80 p-4 rounded-xl backdrop-blur-lg">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="molecule-co2" size={24} color={statusColor} />
          <Text className="text-gray-400 ml-2">CO₂ Levels</Text>
        </View>
        <View className="bg-gray-700 px-3 py-1 rounded-full">
          <Text style={{ color: statusColor }} className="font-bold">
            {data.current} ppm
          </Text>
        </View>
      </View>

      <View className="bg-gray-700/50 p-3 rounded-lg mb-3">
        <Text className="text-gray-400 text-sm mb-1">Current Status</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-lg font-semibold">{statusText}</Text>
          <View style={{ backgroundColor: statusColor + '20' }} className="px-3 py-1 rounded-full">
            <Text style={{ color: statusColor }} className="font-medium">
              {data.current > 1000 ? 'Ventilation needed' : 'Normal range'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2">
        {data.hourlyData.slice(0, 4).map((value, index) => (
          <View key={index} className="items-center">
            <Text className="text-gray-400 text-xs mb-1">{data.times[index]}</Text>
            <View 
              style={{ 
                height: 60,
                backgroundColor: getStatusColor(value) + '20'
              }} 
              className="w-12 rounded-lg justify-end mb-1"
            >
              <View 
                style={{ 
                  height: `${(value / 2000) * 100}%`,
                  backgroundColor: getStatusColor(value)
                }} 
                className="rounded-lg"
              />
            </View>
            <Text className="text-gray-400 text-xs">{value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity className="mt-4 bg-gray-700/50 p-2 rounded-lg">
        <Text className="text-center text-gray-400">View Details</Text>
      </TouchableOpacity>
    </View>
  );
}