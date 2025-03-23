import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Header from '@/components/header';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMcpTool } from '@/hooks/useMcpTool';

type CityKey = 'thane' | 'borivali' | 'pune' | 'nashik' | 'kharghar' | 'panvel';

interface CityData {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  name: string;
}

const CITIES: Record<CityKey, CityData> = {
  thane: { 
    latitude: 19.2183, 
    longitude: 72.9781, 
    latitudeDelta: 0.0922, 
    longitudeDelta: 0.0421,
    name: 'Thane'
  },
  borivali: { 
    latitude: 19.2307, 
    longitude: 72.8567, 
    latitudeDelta: 0.0922, 
    longitudeDelta: 0.0421,
    name: 'Borivali'
  },
  pune: { 
    latitude: 18.5204, 
    longitude: 73.8567, 
    latitudeDelta: 0.0922, 
    longitudeDelta: 0.0421,
    name: 'Pune'
  },
  nashik: { 
    latitude: 19.9975, 
    longitude: 73.7898, 
    latitudeDelta: 0.0922, 
    longitudeDelta: 0.0421,
    name: 'Nashik'
  },
  kharghar: { 
    latitude: 19.0474, 
    longitude: 73.0695, 
    latitudeDelta: 0.0922, 
    longitudeDelta: 0.0421,
    name: 'Kharghar'
  },
  panvel: { 
    latitude: 19.0259, 
    longitude: 73.1172, 
    latitudeDelta: 0.0922, 
    longitudeDelta: 0.0421,
    name: 'Panvel'
  }
};

interface Post {
  id: string;
  latitude: number;
  longitude: number;
  issue_type: 'environmental_hazard' | 'accident';
  caption: string;
  created_at: string;
}

interface NearbyPlace {
  name: string;
  vicinity: string;
  location: {
    lat: number;
    lng: number;
  };
}

export default function Emergency() {
  const [selectedCity, setSelectedCity] = useState<CityKey>('thane');
  const [posts, setPosts] = useState<Post[]>([]);
  const [mapRegion, setMapRegion] = useState<Region>(CITIES[selectedCity]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(CITIES[selectedCity], 1000);
    }
    setMapRegion(CITIES[selectedCity]);
  }, [selectedCity]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('id, latitude, longitude, issue_type, caption, created_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const getNearbyPlaces = async (post: Post) => {
    try {
      const placeType = post.issue_type === 'accident' ? 'hospital' : 'recycling';
      const result = await useMcpTool('places', 'get_nearby_places', {
        latitude: post.latitude,
        longitude: post.longitude,
        placeType,
        radius: 5000
      });

      if (result) {
        const places = JSON.parse(result.content[0].text);
        setNearbyPlaces(places);
      }

      // If it's an accident, also fetch police stations
      if (post.issue_type === 'accident') {
        const policeResult = await useMcpTool('places', 'get_nearby_places', {
          latitude: post.latitude,
          longitude: post.longitude,
          placeType: 'police',
          radius: 5000
        });

        if (policeResult) {
          const policeStations = JSON.parse(policeResult.content[0].text);
          setNearbyPlaces(prev => [...prev, ...policeStations]);
        }
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    }
  };

  const getMarkerColor = (issueType: 'environmental_hazard' | 'accident') => {
    return issueType === 'environmental_hazard' ? '#22C55E' : '#EF4444';
  };

  const handleMarkerPress = (postId: string) => {
    router.push({
      pathname: '/(tabs)/feedback',
      params: { selectedPostId: postId }
    });
  };

  const renderMarker = (post: Post) => (
    <Marker
      key={post.id}
      coordinate={{
        latitude: post.latitude,
        longitude: post.longitude
      }}
      pinColor={getMarkerColor(post.issue_type)}
      onPress={() => {
        getNearbyPlaces(post);
      }}
    >
      <Callout onPress={() => handleMarkerPress(post.id)}>
        <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 8, maxWidth: 200 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            {post.issue_type === 'environmental_hazard' ? 'Environmental Hazard' : 'Accident'}
          </Text>
          <Text>{post.caption.slice(0, 100)}...</Text>
          <Text style={{ color: '#666', marginTop: 5, fontSize: 12 }}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
          <Text style={{ color: '#3B82F6', marginTop: 5, fontSize: 12, textAlign: 'center' }}>
            Tap to view full post
          </Text>
        </View>
      </Callout>
    </Marker>
  );

  const renderNearbyPlace = (place: NearbyPlace) => (
    <Marker
      key={`${place.location.lat}-${place.location.lng}`}
      coordinate={{
        latitude: place.location.lat,
        longitude: place.location.lng
      }}
      pinColor="#3B82F6"
    >
      <Callout>
        <View style={{ padding: 10, maxWidth: 200 }}>
          <Text style={{ fontWeight: 'bold' }}>{place.name}</Text>
          <Text style={{ color: '#666', marginTop: 5 }}>{place.vicinity}</Text>
        </View>
      </Callout>
    </Marker>
  );

  return (
    <View className="flex-1 bg-gray-900">
      <View className='absolute top-10 left-0 right-0 z-10'>
        <View className='flex-row items-center justify-between mx-3'>
          <Text className="text-white font-bold text-2xl">
            {CITIES[selectedCity].name}
          </Text>
          <View className="w-32">
            <Picker
              selectedValue={selectedCity}
              onValueChange={(value: CityKey) => setSelectedCity(value)}
              style={{ color: 'white' }}
              dropdownIconColor="white"
            >
              {(Object.entries(CITIES) as [CityKey, CityData][]).map(([key, city]) => (
                <Picker.Item
                  key={key}
                  label={city.name}
                  value={key}
                  color="#000"
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      
      <View className="flex-1 mt-24">
        <MapView
          ref={mapRef}
          className="w-full h-full"
          initialRegion={mapRegion}
          onRegionChangeComplete={setMapRegion}
          style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
        >
          {posts.map(renderMarker)}
          {nearbyPlaces.map(renderNearbyPlace)}
        </MapView>

        <View className="absolute bottom-4 right-4">
          <View className="bg-white p-2 rounded-lg shadow-lg">
            <View className="flex-row items-center mb-2">
              <View className="w-4 h-4 rounded-full bg-green-500 mr-2" />
              <Text>Environmental Hazard</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <View className="w-4 h-4 rounded-full bg-red-500 mr-2" />
              <Text>Accident</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded-full bg-blue-500 mr-2" />
              <Text>Nearby Services</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}