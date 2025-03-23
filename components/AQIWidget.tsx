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
    prediction?: {
      nextHour: number;
      nextDay: number;
      confidence: number;
    };
  };
  city: string;
}

export default function AQIWidget({ data, city }: AQIWidgetProps) {
  const router = useRouter();
  const width = Dimensions.get('window').width - 40;
  const [pressed, setPressed] = React.useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;
  const chartOpacity = React.useRef(new Animated.Value(0)).current;
  const chartScale = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    // Animate chart entry
    Animated.parallel([
      Animated.timing(chartOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(chartScale, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

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
        onPress={() => router.push({ pathname: '/air-quality', params: { city } })}
        activeOpacity={1}
      >
        <View 
          className="rounded-3xl overflow-hidden"
          style={{
            borderWidth: 2,
            borderColor: '#2563EB',
            backgroundColor: 'white'
          }}
        >
          {/* Header */}
          <View className="px-4 pt-4 flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-sky-600 font-semibold text-lg">Air Quality</Text>
              <Text className="text-sky-600/70 text-sm">{city}</Text>
            </View>
            <MaterialCommunityIcons name="air-filter" size={20} color="#2563EB" />
          </View>

          {/* Chart */}
          <View className="mb-4 px-[5px]">
            <Animated.View
              style={{
                opacity: chartOpacity,
                transform: [{ scale: chartScale }]
              }}
            >
              <LineChart
                data={{
                  labels: data.times,
                  datasets: [{
                    data: data.hourlyData,
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                    strokeWidth: 3
                  }]
                }}
                width={width - 10}
                height={180}
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
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  style: {
                    borderRadius: 0
                  },
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: "#2563EB",
                    fill: "white"
                  },
                  strokeWidth: 3,
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    stroke: "rgba(37, 99, 235, 0.1)"
                  },
                  propsForLabels: {
                    fontSize: 10
                  }
                }}
                bezier
                style={{
                  marginVertical: 0,
                  borderRadius: 0,
                  paddingRight: 0
                }}
              />
            </Animated.View>
          </View>

          {/* Status and Prediction */}
          <View className="px-4 mb-4">
            {/* Current AQI */}
            <View className="flex-row items-center justify-between">
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
                <Text className="text-sky-600 opacity-90">{data.status}</Text>
              </View>
            </View>

            {/* Prediction */}
            {data.prediction && (
              <View className="mt-3 bg-sky-50 rounded-lg p-3">
                <Text className="text-sky-600/80 text-sm mb-2">AI Prediction</Text>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-sky-600/60 text-xs">Next Hour</Text>
                    <Text className="text-sky-600 font-semibold">
                      {data.prediction.nextHour} AQI
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sky-600/60 text-xs">Next Day</Text>
                    <Text className="text-sky-600 font-semibold">
                      {data.prediction.nextDay} AQI
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sky-600/60 text-xs">Confidence</Text>
                    <Text className="text-sky-600 font-semibold">
                      {Math.round(data.prediction.confidence * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Interaction Hint */}
          <View className="flex-row items-center justify-center pb-4 px-4">
            <Text className="text-sky-600/75 text-xs">Tap for details</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}