import { router, Tabs, useRouter } from 'expo-router';
import { Text,View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
export default function TabLayout() {


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({focused}) => <Ionicons name={focused ? "home-sharp" : "home-outline"} size={24} color="black" />,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Issues',
          tabBarIcon: ({focused}) => <Ionicons name={focused ? "hand-left" : "hand-left-outline"} size={24} color="black" />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarIcon: () => 
            <View className='flex-1 items-center justify-center'>
              <Ionicons name="add-circle" size={30} color="black" />
            </View>,
          }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Emergency',
          tabBarIcon: ({focused}) => <Ionicons name={focused ? "alert-circle" : "alert-circle-outline"} size={24} color="black" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({focused}) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color="black" />,
        }}
      />
    </Tabs>
  );
}
