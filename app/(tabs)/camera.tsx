import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { LiveStream } from '@/components/LiveStream';
import { supabase, createLiveStream } from '@/utils/supabase';
import * as Location from 'expo-location';

// Generate a random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function CameraScreen() {
  const { user } = useAuth();
  const [postId] = useState(() => generateUUID());
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      getCurrentLocation();
    }
  }, [user]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required for live streaming.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationString = [
        address.street,
        address.city,
        address.region,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: locationString,
      });

      // Create live stream post with location
      if (user) {
        await createLiveStream(
          user.id,
          `rtmp://your-streaming-server/live/${postId}`,
          locationString,
          location.coords.latitude,
          location.coords.longitude
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get location. Please try again.');
    }
  };

  const handleViewerCountChange = (count: number) => {
    console.log(`Viewer count changed: ${count}`);
  };

  if (!location) {
    return null; // Don't show camera until we have location
  }

  return (
    <View className="flex-1 bg-black">
      {user && (
        <LiveStream
          postId={postId}
          userId={user.id}
          isStreamer={true}
          onViewerCountChange={handleViewerCountChange}
        />
      )}
    </View>
  );
}
