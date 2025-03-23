import {Text, View, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';

export default function Header ({
    title, 
    color, 
    goBack = false, 
    search = false,
    showCitySelector = false,
    onCityChange
}: { 
    title: string, 
    color: string, 
    goBack?: boolean, 
    search?: boolean,
    showCitySelector?: boolean,
    onCityChange?: (city: string) => void 
}) {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState('thane');

    const cities = [
        { label: 'Thane', value: 'thane' },
        { label: 'Borivali', value: 'borivali' },
        { label: 'Pune', value: 'pune' },
        { label: 'Nashik', value: 'nashik' },
        { label: 'Kharghar', value: 'kharghar' },
        { label: 'Panvel', value: 'panvel' }
    ];

    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        if (onCityChange) {
            onCityChange(city);
        }
    };

    return (
        <View className='flex-row items-center justify-between mx-3'>
            <View className='w-10'>
                {goBack && (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={32} color={color}/>
                    </TouchableOpacity>
                )}
            </View>
            <Text className={`text-${color} font-bold text-xl`}>{title}</Text>
            <View className='w-36'>
                {showCitySelector && (
                    <Picker
                        selectedValue={selectedCity}
                        onValueChange={handleCityChange}
                        style={{ color: color }}
                        dropdownIconColor={color}
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
                )}
            </View>
        </View>
    );
}