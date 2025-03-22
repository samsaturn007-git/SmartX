import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import AQIWidget from '../../components/AQIWidget';
import WeatherWidget from '../../components/WeatherWidget';
import CO2Widget from '../../components/CO2Widget';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth() as { user: User | null };
  const [refreshing, setRefreshing] = React.useState(false);
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Sample data
  const data = {
    weather: {
      temp: 17,
      high: 19,
      low: 15,
      humidity: 65,
      condition: 'sunny',
      chanceOfRain: 14
    },
    co2: {
      current: 850,
      status: 'Moderate',
      hourlyData: [750, 800, 850, 900, 875, 825],
      times: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"]
    },
    airQuality: {
      current: 23,
      status: 'Good',
      hourlyData: [18, 21, 23, 22, 24, 25],
      times: ["08:40", "09:40", "10:40", "11:40", "12:40", "13:40"]
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View className="flex-1 bg-gray-900/95">
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View className="pt-14 pb-8">
          <Text className="text-gray-400/80 text-sm mb-2 font-medium">{formattedDate}</Text>
          <Text className="text-white text-4xl font-bold tracking-tight">
            Hey {user?.username || 'User'}!
          </Text>
          <Text className="text-gray-400/90 mt-3 text-lg">
            Here's your environmental dashboard
          </Text>
        </View>

        {/* Main Content */}
        <View className="space-y-6">
          {/* Weather Widget - Full Width */}
          <WeatherWidget data={data.weather} />

          {/* AQI Widget */}
          <AQIWidget data={data.airQuality} />
          
          {/* CO2 Widget */}
          <CO2Widget data={data.co2} />

          {/* Tips Section */}
          <View className="bg-gray-800/80 p-5 rounded-xl backdrop-blur-lg">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-semibold text-lg">Tips</Text>
              <TouchableOpacity>
                <Text className="text-blue-500">See All</Text>
              </TouchableOpacity>
            </View>
            <View className="space-y-3">
              {data.co2.current > 1000 ? (
                <Tip
                  icon="window-maximize"
                  title="Open Windows"
                  description="CO₂ levels are high. Consider ventilating the room."
                  color="#EF4444"
                />
              ) : null}
              {data.weather.humidity > 60 ? (
                <Tip
                  icon="water-percent"
                  title="High Humidity"
                  description="Consider using a dehumidifier for comfort."
                  color="#3B82F6"
                />
              ) : null}
              <Tip
                icon="lightbulb"
                title="Energy Saving"
                description="Current temperature is optimal for energy efficiency."
                color="#22C55E"
              />
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>

    </View>
  );
}

function Tip({ icon, title, description, color }: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center bg-gray-700/50 p-3 rounded-lg">
      <View style={{ backgroundColor: color + '20' }} className="p-2 rounded-lg mr-3">
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}

function NavButton({ iconName, label, active = false }: {
  iconName: string;
  label: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity className="items-center">
      <Feather 
        name={iconName as any} 
        size={24} 
        color={active ? "#3B82F6" : "#9CA3AF"} 
      />
      <Text className={`text-xs mt-1 ${active ? "text-blue-500" : "text-gray-400"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
