import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Profile from '@/components/profile';

export default function() {

    const { user, signOut, following, followers } = useAuth() 

    return <Profile user={user} following={following} followers={followers} signOut={signOut}/> 
}   