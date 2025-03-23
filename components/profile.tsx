import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, SafeAreaView, Modal, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { Picker } from '@react-native-picker/picker';

interface ProfileSettings {
  gender: 'Female' | 'Male' | null;
  age: number;
  hasDependent: boolean | null;
  allergies: string[];
}

interface ProfileProps {
  user: User;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const ALLERGY_OPTIONS = [
  'Air Pollution',
  'Smoke',
  'Dust',
  'Pollen',
  'Mold',
  'Pet Dander',
  'Chemical Fumes'
];

const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => i + 1);

export default function Profile({ user, signOut }: ProfileProps) {
  const [settings, setSettings] = useState<ProfileSettings>({
    gender: null,
    age: 29,
    hasDependent: null,
    allergies: []
  });
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfileSettings();
  }, []);

  const loadProfileSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('UserSettings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading profile settings:', error);
    }
  };

  const saveProfileSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('UserSettings')
        .upsert({
          user_id: user.id,
          gender: settings.gender,
          age: settings.age,
          hasDependent: settings.hasDependent,
          allergies: settings.allergies
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving profile settings:', error);
      alert(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAllergy = (allergy: string) => {
    setSettings(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        className="flex-1 px-6"
      >
        <Text className="text-white text-3xl font-bold mt-12 mb-4">
          Profile type
        </Text>
        <Text className="text-gray-400 mb-8">
          Please fill out the questions below. Our algorithm will make sure that you get the most relevant and important notifications.
        </Text>

        {/* Gender Selection */}
        <View className="mb-6">
          <Text className="text-white mb-3">What is your gender?</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => setSettings(prev => ({ ...prev, gender: 'Female' }))}
              className={`px-6 py-2 rounded-full ${
                settings.gender === 'Female' ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              <Text className="text-white">Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSettings(prev => ({ ...prev, gender: 'Male' }))}
              className={`px-6 py-2 rounded-full ${
                settings.gender === 'Male' ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              <Text className="text-white">Male</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Age Selection */}
        <View className="mb-6">
          <Text className="text-white mb-3">How old are you?</Text>
          <TouchableOpacity 
            onPress={() => setShowAgeModal(true)}
            className="bg-gray-700 px-4 py-3 rounded-lg flex-row justify-between items-center"
          >
            <Text className="text-white">{settings.age}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Dependent Question */}
        <View className="mb-6">
          <Text className="text-white mb-3">Do you have a child or an elder with you?</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => setSettings(prev => ({ ...prev, hasDependent: true }))}
              className={`px-6 py-2 rounded-full ${
                settings.hasDependent === true ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              <Text className="text-white">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSettings(prev => ({ ...prev, hasDependent: false }))}
              className={`px-6 py-2 rounded-full ${
                settings.hasDependent === false ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              <Text className="text-white">No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Allergies Selection */}
        <View className="mb-6">
          <Text className="text-white mb-3">Do you have any allergies?</Text>
          <TouchableOpacity 
            onPress={() => setShowAllergiesModal(true)}
            className="bg-gray-700 px-4 py-3 rounded-lg flex-row justify-between items-center"
          >
            <Text className="text-white">
              {settings.allergies.length > 0
                ? settings.allergies.join(', ')
                : 'Select allergies'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          onPress={saveProfileSettings}
          disabled={isSaving}
          className={`bg-blue-500 py-3 rounded-lg mb-4 ${isSaving ? 'opacity-50' : ''}`}
        >
          <Text className="text-white text-center font-semibold">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        {/* Progress Dots */}
        <View className="flex-row justify-center space-x-1">
          <View className="w-2 h-2 rounded-full bg-blue-500" />
          <View className="w-2 h-2 rounded-full bg-gray-600" />
          <View className="w-2 h-2 rounded-full bg-gray-600" />
        </View>

        {/* Sign Out Button */}
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity
            onPress={async () => {
              const { error } = await signOut();
              if (error) {
                console.error('Error signing out:', error);
              }
            }}
            className="bg-red-500 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Age Picker Modal */}
        <Modal
          visible={showAgeModal}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-gray-800 rounded-t-3xl">
              <View className="flex-row justify-between items-center p-4 border-b border-gray-700">
                <Text className="text-white text-xl font-bold">Select Age</Text>
                <TouchableOpacity onPress={() => setShowAgeModal(false)}>
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View className="px-4 py-2">
                <Picker
                  selectedValue={settings.age}
                  onValueChange={(value) => {
                    setSettings(prev => ({ ...prev, age: value }));
                  }}
                  style={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                >
                  {AGE_OPTIONS.map((age) => (
                    <Picker.Item key={age} label={age.toString()} value={age} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                onPress={() => setShowAgeModal(false)}
                className="bg-blue-500 m-4 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Allergies Modal */}
        <Modal
          visible={showAllergiesModal}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-gray-800 rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white text-xl font-bold">Select Allergies</Text>
                <TouchableOpacity onPress={() => setShowAllergiesModal(false)}>
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <ScrollView className="max-h-96">
                {ALLERGY_OPTIONS.map((allergy) => (
                  <TouchableOpacity
                    key={allergy}
                    onPress={() => toggleAllergy(allergy)}
                    className="flex-row items-center justify-between py-3 border-b border-gray-700"
                  >
                    <Text className="text-white text-lg">{allergy}</Text>
                    {settings.allergies.includes(allergy) && (
                      <MaterialIcons name="check" size={24} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowAllergiesModal(false)}
                className="bg-blue-500 py-3 rounded-lg mt-4"
              >
                <Text className="text-white text-center font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}
