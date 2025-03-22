import { Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function () {
    const router = useRouter();
    const [email, setEmail] = React.useState('');   
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const { signIn } = useAuth();

    return ( 
        <>
            <StatusBar style="light" />
            <View className="flex-1 bg-[#f5f5f5]">
                {/* Header Section */}
                <View className="h-1/3 bg-[black] rounded-b-[50px] justify-center">
                    <View className="items-center mt-8">
                        <Image 
                            source={require('../../assets/images/eq_logo.png')}
                            className="w-28 h-28"
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Form Section */}
                <View className="flex-1 px-8 -mt-16">
                    <View className="bg-white p-8 rounded-3xl shadow-2xl">
                        <Text className="text-[#1a1a1a] font-bold text-3xl mb-6">Welcome Back</Text>
                        <Text className="text-gray-500 mb-6">Sign in to continue</Text>

                        {/* Email Input */}
                        <View className="mb-6">
                            <View className="flex-row items-center bg-[#f8f8f8] rounded-2xl px-4 border border-[#e0e0e0]">
                                <Ionicons name="mail-outline" size={20} color="#ff0077" />
                                <TextInput
                                    placeholder="Email"
                                    className="flex-1 p-4 font-medium"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    placeholderTextColor="#666"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View className="mb-8">
                            <View className="flex-row items-center bg-[#f8f8f8] rounded-2xl px-4 border border-[#e0e0e0]">
                                <Ionicons name="lock-closed-outline" size={20} color="#ff0077" />
                                <TextInput
                                    secureTextEntry={!showPassword}
                                    placeholder="Password"
                                    className="flex-1 p-4 font-medium"
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholderTextColor="#666"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons 
                                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                        size={20} 
                                        color="#666" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            className="bg-[#1a1a1a] py-4 rounded-2xl mb-6 shadow-lg"
                            onPress={() => signIn(email, password)}
                            style={{
                                shadowColor: '#ff0077',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 5,
                            }}
                        >
                            <Text className="text-white font-bold text-lg text-center">
                                Sign In
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center mb-6">
                            <View className="flex-1 h-[1px] bg-gray-300" />
                            <Text className="mx-4 text-gray-500">or use existing account</Text>
                            <View className="flex-1 h-[1px] bg-gray-300" />
                        </View>

                        {/* Social Sign In Buttons */}
                        <View className="mb-6">
                            <TouchableOpacity 
                                className="flex-row items-center justify-center bg-[#f8f8f8] py-4 rounded-2xl border border-[#e0e0e0] mb-4"
                                onPress={() => {/* Handle Google sign in */}}
                            >
                                <AntDesign name="google" size={20} color="#000" />
                                <Text className="ml-2 font-semibold">Continue with Google</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                className="flex-row items-center justify-center bg-[#f8f8f8] py-4 rounded-2xl border border-[#e0e0e0]"
                                onPress={() => {/* Handle Apple sign in */}}
                            >
                                <AntDesign name="apple1" size={20} color="#000" />
                                <Text className="ml-2 font-semibold">Continue with Apple</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Signup Link */}
                        <View className="flex-row justify-center items-center">
                            <Text className="text-gray-600">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/signup')}>
                                <Text className="text-[#ff0077] font-bold">Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}
