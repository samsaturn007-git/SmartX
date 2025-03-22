import {Text, SafeAreaView} from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/header';
import { supabase } from '@/utils/supabase';
import Profile from '@/components/profile';

export default function() {
    const [user, setUser] = React.useState(null);
    const params = useLocalSearchParams();
    const [following, setFollowing] = React.useState([]);
    const [followers, setFollowers] = React.useState([]);

    const getUser = async () => {
        const { data, error } = await supabase.from('User').select('*').eq('id', params.user_id).single();
        if(error) return console.error(error);
        console.log(data);
        setUser(data);
    }
    const getFollowing = async () => {
        const {data, error} = await supabase.from('Follower').select('*').eq('user_id', params.user_id);
        if(!error) return console.error(error);
        setFollowing(data);
    }
    const getFollowers = async () => {
        const {data, error} = await supabase.from('Follower').select('*, User(*)').eq('follower_user_id', params.user_id);
        if(!error) return console.error(error);
        setFollowers(data);
    }

    React.useEffect(() => {
        getUser();
        getFollowing();
        getFollowers();
    }, [params.user_id]);

    return (
        <SafeAreaView className='flex-1'>
            <Header title={user?.username} color="black" goBack />
            <Profile
                user={user}
                following={following}
                followers={followers}
            />

        </SafeAreaView>
    );
}    