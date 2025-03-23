import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import AQIWidget from '../../components/AQIWidget';
import WeatherWidget from '../../components/WeatherWidget';
import CO2Widget from '../../components/CO2Widget';
import { Picker } from '@react-native-picker/picker';
import { fetchEnvironmentalData, type EnvironmentalData } from '../../utils/environmentalData';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth() as { user: User | null };
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedCity, setSelectedCity] = React.useState('thane');
  const [environmentalData, setEnvironmentalData] = React.useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      router.replace('/(auth)');
    }
  }, [user]);

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const cities = [
    { label: 'Thane', value: 'thane' },
    { label: 'Borivali', value: 'borivali' },
    { label: 'Pune', value: 'pune' },
    { label: 'Nashik', value: 'nashik' },
    { label: 'Kharghar', value: 'kharghar' },
    { label: 'Panvel', value: 'panvel' }
  ];

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEnvironmentalData(selectedCity);
      setEnvironmentalData(data);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  if (!environmentalData) {
    return (
      <View className="flex-1 bg-gray-900/95 items-center justify-center">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  const weatherData = {
    temp: Math.round(environmentalData.current.temperature),
    high: Math.round(environmentalData.current.temperature + 2),
    low: Math.round(environmentalData.current.temperature - 2),
    humidity: Math.round(environmentalData.current.humidity),
    condition: environmentalData.current.temperature > 30 ? 'sunny' : 'cloudy',
    chanceOfRain: Math.round(environmentalData.current.humidity / 2)
  };

  const co2Data = {
    current: environmentalData.current.co2,
    status: environmentalData.current.co2 < 800 ? 'Good' : 'Moderate',
    hourlyData: environmentalData.hourly.map(h => h.co2),
    times: environmentalData.hourly.map(h => h.hour)
  };

  const airQualityData = {
    current: environmentalData.current.aqi.value,
    status: environmentalData.current.aqi.category,
    hourlyData: environmentalData.hourly.map(h => h.aqi.value),
    times: environmentalData.hourly.map(h => h.hour)
  };

  return (
    <View className="flex-1 bg-gray-900">
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.2)', 'rgba(0, 0, 0, 0)']}
        style={{ position: 'absolute', width: '100%', height: 400 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View className="pt-12 pb-6">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-blue-400 text-sm font-medium mb-1">{formattedDate}</Text>
              <Text className="text-white text-3xl font-bold tracking-tight">
                Hey {user?.username || 'User'}!
              </Text>
            </View>
            <View className="w-36">
              <Picker
                selectedValue={selectedCity}
                onValueChange={handleCityChange}
                style={{ color: '#fff' }}
                dropdownIconColor="#fff"
              >
                {cities.map((city) => (
                  <Picker.Item
                    key={city.value}
                    label={city.label}
                    value={city.value}
                    color="#000"
                  />
                ))}
              </Picker>
            </View>
          </View>
          <Text className="text-blue-300 text-lg font-medium">
            Here's your environmental dashboard
          </Text>
        </View>

        {/* Main Content */}
        <View className="space-y-5">
          {/* Weather Widget */}
          <View className="shadow-xl shadow-blue-500/30">
            <WeatherWidget data={weatherData} city={selectedCity} />
          </View>

          {/* AQI Widget */}
          <View className="shadow-xl shadow-blue-500/30">
            <AQIWidget data={airQualityData} city={selectedCity} />
          </View>
          
          {/* CO2 Widget */}
          <View className="shadow-xl shadow-blue-500/30">
            <CO2Widget data={co2Data} city={selectedCity} />
          </View>

          {/* Tips Section */}
          <View className="bg-gray-800/90 p-5 rounded-xl backdrop-blur-lg shadow-xl shadow-blue-500/30">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="lightbulb-on" size={24} color="#60A5FA" />
                <Text className="text-blue-300 font-semibold text-lg ml-2">Tips & Insights</Text>
              </View>
            </View>
            <View className="space-y-3">
              {environmentalData.current.co2 > 1000 ? (
                <Tip
                  icon="window-maximize"
                  title="Open Windows"
                  description="CO₂ levels are high. Consider ventilating the room."
                  color="#F87171"
                />
              ) : null}
              {environmentalData.current.humidity > 60 ? (
                <Tip
                  icon="water-percent"
                  title="High Humidity"
                  description="Consider using a dehumidifier for comfort."
                  color="#60A5FA"
                />
              ) : null}
              <Tip
                icon="lightbulb"
                title="Energy Saving"
                description="Current temperature is optimal for energy efficiency."
                color="#34D399"
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
    <View className="flex-row items-center bg-gray-700/60 p-4 rounded-xl">
      <View style={{ backgroundColor: color + '20' }} className="p-3 rounded-xl mr-4">
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium text-base">{title}</Text>
        <Text className="text-gray-300 text-sm mt-0.5">{description}</Text>
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
