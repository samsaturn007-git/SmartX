import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AQIWidgetProps {
  data: {
    current: number;
    status: string;
    hourlyData: number[];
    times: string[];
  };
}

export default function AQIWidget({ data }: AQIWidgetProps) {
  const router = useRouter();
  const width = Dimensions.get('window').width - 48; // Account for padding
  const [pressed, setPressed] = React.useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = (value: number) => {
    if (value <= 50) return '#4CAF50';
    if (value <= 100) return '#FFC107';
    if (value <= 150) return '#FF9800';
    return '#F44336';
  };

  const statusColor = getStatusColor(data.current);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        width: '100%',
        ...Platform.select({
          ios: {
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    >
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push('/air-quality' as any)}
        activeOpacity={1}
      >
        <View className="p-6 rounded-3xl bg-sky-600">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-semibold text-lg">Air Quality</Text>
            <MaterialCommunityIcons name="air-filter" size={20} color="white" />
          </View>

          {/* Chart */}
          <View className="mt-2">
            <LineChart
              data={{
                labels: data.times,
                datasets: [{
                  data: data.hourlyData
                }]
              }}
              width={width - 48}
              height={100}
              withDots={true}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#fff"
                },
                strokeWidth: 3,
                propsForBackgroundLines: {
                  strokeWidth: 1,
                  stroke: "rgba(255, 255, 255, 0.1)"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>

          {/* Status */}
          <View className="flex-row items-center justify-between mt-2">
            <View
              style={{ backgroundColor: `${statusColor}30` }}
              className="px-3 py-1.5 rounded-full"
            >
              <Text style={{ color: statusColor }} className="font-bold text-lg">
                {data.current}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View
                style={{ backgroundColor: statusColor }}
                className="w-2 h-2 rounded-full mr-2"
              />
              <Text className="text-white opacity-90">{data.status}</Text>
            </View>
          </View>

          {/* Interaction Hint */}
          <View className="flex-row items-center justify-center mt-3">
            <Text className="text-white text-xs opacity-75">Tap for details</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}