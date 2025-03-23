import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Profile from '@/components/profile';

export default function() {
    const { user, signOut } = useAuth();

    if (!user) return null;

    return <Profile user={user} signOut={signOut} />;
}