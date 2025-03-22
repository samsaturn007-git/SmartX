import { Text, View,TouchableOpacity,SafeAreaView,FlatList,Image} from 'react-native';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@/components/header';



export default function () {
    const router = useRouter();
    const { followers} = useAuth();

    return (
        <SafeAreaView className='flex-1 top-5'>
            <Header title='Followers' goBack color='black' />
            <FlatList
                data={followers}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push(`/user?user_id=${item.user_id}`)}
                        className='flex-row gap-2 items-center w-full m-1'
                    >
                        <View className='flex-row justify-between w-full items-center pr-3'>
                            <View className='flex-row gap-2'>
                                <Image 
                                    source={{uri:`${process.env.EXPO_PUBLIC_BUCKET}/avatars/${item.User?.id}/avatar.jpg`}}
                                    className='w-12 h-12 rounded-full bg-black'
                                />
                                <View>
                                    <Text className='font-bold text-base'>{item.User.username}</Text>
                                    <Text>Say Hi</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="black" />
                        </View>
                    </TouchableOpacity>
                )}
                />
        </SafeAreaView>
    );
}