import axios from 'axios';
import { predictAQI, type AQIPrediction } from './ml/statistical_aqi_predictor';

const LOCATIONS = ["thane", "borivali", "kharghar", "pune", "nashik", "panvel"] as const;
type Location = typeof LOCATIONS[number];

interface WAQIResponse {
  status: string;
  data: {
    aqi: number;
    iaqi: {
      pm25?: { v: number };
      t?: { v: number };    // temperature
      h?: { v: number };    // humidity
      co?: { v: number };   // CO2
      no2?: { v: number };  // Nitrogen dioxide
      so2?: { v: number };  // Sulfur dioxide
      o3?: { v: number };   // Ozone
    };
    time: {
      s: string;  // timestamp
    };
    forecast?: {
      daily: {
        pm25: Array<{ avg: number; day: string; }>;
        o3: Array<{ avg: number; day: string; }>;
      };
    };
  };
}

export interface EnvironmentalData {
  current: {
    aqi: {
      value: number;
      category: string;
      prediction?: AQIPrediction;
      pollutants: {
        pm25?: number;
        no2?: number;
        so2?: number;
        o3?: number;
      };
    };
    temperature: number;
    humidity: number;
    co2: number;
    timestamp: string;
  };
  hourly: Array<{
    hour: string;
    aqi: {
      value: number;
      category: string;
      pollutants?: {
        no2?: number;
        so2?: number;
        o3?: number;
      };
    };
    temperature: number;
    humidity: number;
    co2: number;
  }>;
  locationAverages: Array<{
    location: string;
    averageAqi: number;
  }>;
  timeRangeAverages: {
    daily: Array<{
      hour: string;
      averageAqi: number;
    }>;
    weekly: Array<{
      week: string;
      averageAqi: number;
    }>;
    monthly: Array<{
      month: string;
      averageAqi: number;
    }>;
    yearly: Array<{
      year: string;
      averageAqi: number;
    }>;
  };
}

// Normalize location name to match our constants
const normalizeLocation = (location: string): Location => {
  const normalized = location.toLowerCase();
  if (LOCATIONS.includes(normalized as Location)) {
    return normalized as Location;
  }
  return 'pune'; // Default to pune if location not found
};

// Get AQI category and color based on value
export const getAqiCategory = (value: number): string => {
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'Unhealthy for Sensitive Groups';
  if (value <= 200) return 'Unhealthy';
  if (value <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Generate realistic mock data based on time, weather, and location patterns
const generateMockData = (location: Location, timestamp: Date): WAQIResponse['data'] => {
  const hour = timestamp.getHours();
  const month = timestamp.getMonth();
  
  // Base AQI values for each location (based on typical Indian city AQI ranges)
  const baseAqis: Record<Location, number> = {
    thane: 85,
    borivali: 75,
    kharghar: 80,
    pune: 65,
    nashik: 60,
    panvel: 78
  };

  // Time-based factors (more moderate variations)
  const getHourlyFactor = (h: number) => {
    if (h >= 7 && h <= 10) return 1.15; // Morning rush
    if (h >= 17 && h <= 20) return 1.2; // Evening rush
    if (h >= 1 && h <= 4) return 0.85;  // Early morning
    return 1;
  };

  // Seasonal factors (more moderate variations)
  const getSeasonalFactor = (m: number) => {
    if (m <= 1 || m === 11) return 1.2;  // Winter
    if (m >= 6 && m <= 8) return 0.8;    // Monsoon
    return 1;
  };

  const hourlyFactor = getHourlyFactor(hour);
  const seasonalFactor = getSeasonalFactor(month);
  const randomFactor = 0.9 + Math.random() * 0.2;

  const baseAqi = baseAqis[location];
  const aqi = Math.round(baseAqi * hourlyFactor * seasonalFactor * randomFactor);

  // Generate realistic pollutant values
  const pm25 = Math.round(aqi * (0.8 + Math.random() * 0.4));
  const no2 = Math.round(aqi * (0.4 + Math.random() * 0.3));
  const so2 = Math.round(aqi * (0.3 + Math.random() * 0.2));
  const o3 = Math.round(aqi * (0.5 + Math.random() * 0.3));

  // Temperature varies by time and season
  const baseTemp = month <= 1 || month === 11 ? 20 : month >= 3 && month <= 5 ? 35 : 28;
  const temperature = baseTemp + (hour >= 12 && hour <= 15 ? 5 : 0) + (Math.random() * 4 - 2);

  // Humidity varies inversely with temperature
  const baseHumidity = month >= 6 && month <= 8 ? 85 : 60;
  const humidity = baseHumidity + (Math.random() * 10 - 5);

  return {
    aqi,
    iaqi: {
      pm25: { v: pm25 },
      t: { v: temperature },
      h: { v: humidity },
      co: { v: Math.round(20 + Math.random() * 10) },
      no2: { v: no2 },
      so2: { v: so2 },
      o3: { v: o3 }
    },
    time: { s: timestamp.toISOString() }
  };
};

const fetchLocationAQI = async (location: string): Promise<WAQIResponse['data']> => {
  const normalizedLocation = normalizeLocation(location);
  const apiKey = 'cdae23acf69844c124b74727bf740402a7db3809';
  
  try {
    const response = await axios.get<WAQIResponse>(
      `https://api.waqi.info/feed/${normalizedLocation}/?token=${apiKey}`,
      { timeout: 5000 } // 5 second timeout
    );
    
    if (response.data.status !== 'ok') {
      throw new Error(`Failed to fetch data for ${location}`);
    }

    return response.data.data;
  } catch (error) {
    console.warn(`Using mock data for ${location}:`, error);
    return generateMockData(normalizedLocation, new Date());
  }
};

// Generate historical data with realistic patterns
const generateHistoricalData = (baseAqi: number, timestamp: Date) => {
  const dailyData = [];
  const weeksData = [];
  const monthsData = [];
  const yearsData = [];

  // Daily pattern
  for (let hour = 0; hour < 24; hour++) {
    const hourDate = new Date(timestamp);
    hourDate.setHours(hour);
    const mockData = generateMockData('kharghar', hourDate);
    
    dailyData.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      averageAqi: mockData.aqi
    });
  }

  // Weekly pattern
  for (let week = 0; week < 4; week++) {
    const weekDate = new Date(timestamp);
    weekDate.setDate(weekDate.getDate() - (week * 7));
    const mockData = generateMockData('kharghar', weekDate);
    
    weeksData.push({
      week: `Week ${week + 1}`,
      averageAqi: mockData.aqi
    });
  }

  // Monthly pattern
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(timestamp);
    monthDate.setMonth(monthDate.getMonth() - i);
    const mockData = generateMockData('kharghar', monthDate);
    
    monthsData.push({
      month: monthNames[monthDate.getMonth()],
      averageAqi: mockData.aqi
    });
  }

  // Yearly pattern (showing improvement trend)
  for (let i = 0; i < 5; i++) {
    const yearDate = new Date(timestamp);
    yearDate.setFullYear(yearDate.getFullYear() - i);
    const mockData = generateMockData('kharghar', yearDate);
    const improvementFactor = 1 + (i * 0.1); // 10% better each year back
    
    yearsData.push({
      year: yearDate.getFullYear().toString(),
      averageAqi: Math.round(mockData.aqi * improvementFactor)
    });
  }

  return {
    daily: dailyData,
    weekly: weeksData,
    monthly: monthsData,
    yearly: yearsData
  };
};

export const fetchEnvironmentalData = async (city?: string): Promise<EnvironmentalData> => {
  try {
    const normalizedCity = city ? normalizeLocation(city) : 'kharghar';
    const currentTime = new Date();
    const cityData = await fetchLocationAQI(normalizedCity);

    // Generate historical data with realistic patterns
    const timeRangeAverages = generateHistoricalData(cityData.aqi, currentTime);

    let prediction: AQIPrediction | undefined;
    try {
      // Use historical data for AQI prediction
      const historicalData = timeRangeAverages.daily.map(d => d.averageAqi);
      prediction = await predictAQI(historicalData);
    } catch (error) {
      console.warn('AQI prediction failed:', error);
      prediction = undefined;
    }

    // Fetch data for all locations for comparison
    const locationData = await Promise.all(
      LOCATIONS.map(async (location) => {
        if (location === normalizedCity) {
          return { location, data: cityData };
        }
        const data = await fetchLocationAQI(location);
        return { location, data };
      })
    );

    // Calculate location averages
    const locationAverages = locationData.map(({ location, data }) => ({
      location,
      averageAqi: data.aqi
    }));

    // Generate hourly data
    const hourlyData = [];
    for (let hour = 1; hour <= 9; hour++) {
      const hourTime = new Date(currentTime);
      hourTime.setHours(hour);
      const hourData = generateMockData(normalizedCity, hourTime);
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        aqi: {
          value: hourData.aqi,
          category: getAqiCategory(hourData.aqi),
          pollutants: {
            no2: hourData.iaqi.no2?.v,
            so2: hourData.iaqi.so2?.v,
            o3: hourData.iaqi.o3?.v
          }
        },
        temperature: hourData.iaqi.t?.v || 20,
        humidity: hourData.iaqi.h?.v || 45,
        co2: hourData.iaqi.co?.v || 65
      });
    }

    return {
      current: {
        aqi: {
          value: cityData.aqi,
          category: getAqiCategory(cityData.aqi),
          prediction,
          pollutants: {
            pm25: cityData.iaqi.pm25?.v,
            no2: cityData.iaqi.no2?.v,
            so2: cityData.iaqi.so2?.v,
            o3: cityData.iaqi.o3?.v
          }
        },
        temperature: cityData.iaqi.t?.v || 20,
        humidity: cityData.iaqi.h?.v || 45,
        co2: cityData.iaqi.co?.v || 65,
        timestamp: cityData.time.s
      },
      hourly: hourlyData,
      locationAverages,
      timeRangeAverages
    };
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch environmental data: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching environmental data');
  }
};