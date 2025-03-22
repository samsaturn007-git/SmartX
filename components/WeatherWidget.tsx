import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WeatherData {
  temp: number;
  high: number;
  low: number;
  humidity: number;
  condition: string;
  chanceOfRain: number;
}

interface WeatherWidgetProps {
  data: WeatherData;
}

const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'sunny':
      return 'weather-sunny';
    case 'cloudy':
      return 'weather-cloudy';
    case 'rainy':
      return 'weather-rainy';
    case 'snowy':
      return 'weather-snowy';
    default:
      return 'weather-partly-cloudy';
  }
};

const getHumidityStatus = (humidity: number) => {
  if (humidity < 30) return { text: 'Low', color: '#EF4444' };
  if (humidity < 60) return { text: 'Optimal', color: '#22C55E' };
  return { text: 'High', color: '#3B82F6' };
};

export default function WeatherWidget({ data }: WeatherWidgetProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: showDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDetails]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const humidityStatus = getHumidityStatus(data.humidity);

  return (
    <View className="w-full bg-gray-800/80 p-5 rounded-xl mb-4 backdrop-blur-lg">
      <TouchableOpacity 
        onPress={() => setShowDetails(!showDetails)}
        className="flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <MaterialCommunityIcons 
            name={getWeatherIcon(data.condition)} 
            size={32} 
            color="#FFD700"
          />
          <View className="ml-3">
            <Text className="text-white text-2xl font-bold">{data.temp}°C</Text>
            <Text className="text-gray-400">Feels comfortable</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={24} 
            color="#9CA3AF"
          />
        </Animated.View>
      </TouchableOpacity>

      {showDetails && (
        <View className="mt-4">
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <MaterialCommunityIcons 
                name="thermometer-low" 
                size={24} 
                color="#3B82F6"
              />
              <Text className="text-gray-400 mt-1">Low</Text>
              <Text className="text-white font-bold">{data.low}°C</Text>
            </View>
            <View className="items-center">
              <MaterialCommunityIcons 
                name="thermometer-high" 
                size={24} 
                color="#EF4444"
              />
              <Text className="text-gray-400 mt-1">High</Text>
              <Text className="text-white font-bold">{data.high}°C</Text>
            </View>
            <View className="items-center">
              <MaterialCommunityIcons 
                name="water-percent" 
                size={24} 
                color={humidityStatus.color}
              />
              <Text className="text-gray-400 mt-1">Humidity</Text>
              <Text className="text-white font-bold">{data.humidity}%</Text>
            </View>
          </View>

          <View className="bg-gray-700/50 p-3 rounded-lg">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400">Humidity Status</Text>
              <Text style={{ color: humidityStatus.color }}>{humidityStatus.text}</Text>
            </View>
            <View className="h-2 bg-gray-600 rounded-full overflow-hidden">
              <View 
                style={{ 
                  width: `${data.humidity}%`,
                  backgroundColor: humidityStatus.color
                }}
                className="h-full"
              />
            </View>
          </View>

          {data.chanceOfRain > 0 && (
            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MaterialCommunityIcons 
                  name="weather-rainy" 
                  size={20} 
                  color="#60A5FA"
                />
                <Text className="text-gray-400 ml-2">Chance of Rain</Text>
              </View>
              <Text className="text-white font-bold">{data.chanceOfRain}%</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}