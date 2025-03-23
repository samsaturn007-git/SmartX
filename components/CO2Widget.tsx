import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CO2Data {
  current: number;
  status: string;
  hourlyData: number[];
  times: string[];
}

interface CO2WidgetProps {
  data: CO2Data;
  city: string;
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

const getTips = (value: number) => {
  const tips = [];
  if (value >= 1000) {
    tips.push('Open windows for 5-10 minutes');
    tips.push('Use air purifiers if available');
    tips.push('Check ventilation systems');
    tips.push('Consider using indoor plants');
  } else {
    tips.push('Maintain current ventilation');
    tips.push('Monitor levels regularly');
    tips.push('Keep air filters clean');
    tips.push('Consider adding indoor plants');
  }
  return tips;
};

export default function CO2Widget({ data, city }: CO2WidgetProps) {
  const statusColor = getStatusColor(data.current);
  const statusText = getStatusText(data.current);
  const tips = getTips(data.current);

  // Get last 4 hours of data based on current time
  const currentHour = new Date().getHours();
  const recentData = data.hourlyData.slice(-4);
  const recentTimes = Array.from({ length: 4 }, (_, i) => {
    const hour = (currentHour - (3 - i) + 24) % 24;
    return `${hour}:00`;
  });

  return (
    <View className="flex-1 bg-gray-800/80 p-4 rounded-xl backdrop-blur-lg">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="molecule-co2" size={24} color={statusColor} />
            <Text className="text-gray-400 ml-2">CO₂ Levels</Text>
          </View>
          <Text className="text-gray-400/70 text-sm ml-8">{city}</Text>
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

      <View className="flex-row justify-between items-center mt-2 mb-3">
        {recentData.map((value, index) => (
          <View key={index} className="items-center">
            <Text className="text-gray-400 text-xs mb-1">{recentTimes[index]}</Text>
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

      <View className="bg-gray-700/50 p-3 rounded-lg">
        <Text className="text-gray-400 text-sm mb-2">Recommendations</Text>
        <View className="space-y-1">
          {tips.map((tip, index) => (
            <View key={index} className="flex-row items-center">
              <MaterialCommunityIcons 
                name="circle-small" 
                size={20} 
                color={statusColor} 
              />
              <Text className="text-gray-400 text-sm flex-1">
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}