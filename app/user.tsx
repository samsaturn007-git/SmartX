import { Text, SafeAreaView } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/header';
import { supabase } from '@/utils/supabase';
import Profile from '@/components/profile';
import { useAuth } from '@/providers/AuthProvider';

interface User {
  id: string;
  username: string;
}

interface Follower {
  id: string;
  user_id: string;
  follower_user_id: string;
  User?: User;
}

export default function UserProfile() {
  const [user, setUser] = React.useState<User | null>(null);
  const params = useLocalSearchParams();
  const [following, setFollowing] = React.useState<Follower[]>([]);
  const [followers, setFollowers] = React.useState<Follower[]>([]);
  const { signOut } = useAuth();

  const getUser = async () => {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', params.user_id)
      .single();
    
    if (error) {
      console.error(error);
      return;
    }
    
    setUser(data);
  };

  const getFollowing = async () => {
    const { data, error } = await supabase
      .from('Follower')
      .select('*')
      .eq('user_id', params.user_id);
    
    if (error) {
      console.error(error);
      return;
    }
    
    setFollowing(data || []);
  };

  const getFollowers = async () => {
    const { data, error } = await supabase
      .from('Follower')
      .select('*, User(*)')
      .eq('follower_user_id', params.user_id);
    
    if (error) {
      console.error(error);
      return;
    }
    
    setFollowers(data || []);
  };

  React.useEffect(() => {
    if (params.user_id) {
      getUser();
      getFollowing();
      getFollowers();
    }
  }, [params.user_id]);

  if (!user) {
    return (
      <SafeAreaView className='flex-1'>
        <Header title="Loading..." color="black" goBack />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1'>
      <Header title={user.username} color="black" goBack />
      <Profile
        user={user}
        following={following}
        followers={followers}
        signOut={signOut}
      />
    </SafeAreaView>
  );
}