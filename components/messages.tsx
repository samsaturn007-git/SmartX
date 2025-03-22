import React from 'react';
import { Text, TextInput, View, TouchableOpacity, Image, FlatList,SafeAreaView, KeyboardAvoidingView,TouchableWithoutFeedback,Keyboard, Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function({
    messages,
    addMessage
}: {
    messages: any[];
    addMessage: (message: string) => void;
}) {

  const [text, setText] = React.useState<string>('');
  const { user } = useAuth();
  return (
    <KeyboardAvoidingView className='flex-1' behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className='flex-1 items-center justify-center bg-white'>
          <FlatList className='flex-1 w-full'
            data={messages}
            renderItem={({ item }) => {
                return (
                    <View className='flex-row gap-2 items-start justify-start w-full m-2'>
                        <Image
                            source={{ uri: `${process.env.EXPO_PUBLIC_BUCKET}/avatars/${item.User?.id}/avatar.jpg` }}
                            className='w-10 h-10 rounded-full bg-black'
                        />
                        <View>
                            <Text className='font-bold' text-base >{item.User.username}</Text>
                            <Text>{item.text}</Text>
                        </View>
                    </View>
                );
                
            }
            }
            />
            
            <View className='flex-row gap-2 bottom-6 left-1 w-full mx-3'>
                <TextInput
                    className=' flex-1 bg-white p-4 rounded-3xl border border-gray-300'
                    placeholder='Add a comment'
                    onChangeText={(i) => setText(i)}
                    value={text} 
                />   
                <TouchableOpacity onPress={() => {
                    setText('')
                    Keyboard.dismiss()
                    addMessage(text)
                }}>
                    <Ionicons name="arrow-forward-circle" size={50} color="red" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
