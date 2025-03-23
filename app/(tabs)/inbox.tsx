import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Header from '@/components/header';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMcpTool } from '../../hooks/useMcpTool';

// ... rest of the file remains the same ...