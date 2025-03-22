import React from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import "../global.css";
import { AuthProvider } from '@/providers/AuthProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  React.useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="comment" options={{headerShown: false, presentation: 'modal'}} />
        <Stack.Screen name="followers" options={{headerShown: false}} />
        <Stack.Screen name="user" options={{headerShown: false}} />
        <Stack.Screen name="search" options={{headerShown: false}} />
        <Stack.Screen name="chat" options={{headerShown: false, presentation: 'modal'}} />
        <Stack.Screen name="activity" options={{headerShown: false}} />
        <Stack.Screen name="camera" options={{headerShown: false}} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthProvider>
  );
}
