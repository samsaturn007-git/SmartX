import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  following: any[];
  followers: any[];
  myFollowing: any[];
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (username: string, email: string, password: string) => Promise<{ error: AuthError | null; message?: string }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  getFollowing: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  following: [],
  followers: [],
  myFollowing: [],
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  getFollowing: async () => {},
});

const STORAGE_KEY = 'auth_state';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  interface ExtendedUser extends User {
    username?: string;
  }

  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [myFollowing, setMyFollowing] = useState<any[]>([]);

  const getFollowing = async (userId: string) => {
    try {
      // Get followers
      const { data: followersData } = await supabase
        .from('Follower')
        .select('*')
        .eq('follower_user_id', userId);
      
      // Get following
      const { data: followingData } = await supabase
        .from('Follower')
        .select('*')
        .eq('user_id', userId);

      // Get my following (for follow/unfollow button)
      const { data: myFollowingData } = await supabase
        .from('Follower')
        .select('*')
        .eq('user_id', user?.id);

      setFollowers(followersData || []);
      setFollowing(followingData || []);
      setMyFollowing(myFollowingData || []);
    } catch (error) {
      console.error('Error fetching following data:', error);
    }
  };

  const createOrUpdateUser = async (sessionUser: User, username: string) => {
    try {
      // Get user data from our database
      const { data: existingUser, error: fetchError } = await supabase
        .from('User')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (!existingUser) {
        // Create new user
        const { error: createError } = await supabase
          .from('User')
          .insert([
            {
              id: sessionUser.id,
              email: sessionUser.email,
              username: username
            }
          ]);

        if (createError) {
          console.error('Error creating user record:', createError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Unexpected error during user management:', error);
      return false;
    }
  };

  const persistAuthState = async (authState: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Error persisting auth state:', error);
    }
  };

  const loadPersistedAuthState = async () => {
    try {
      const persistedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (persistedState) {
        const authState = JSON.parse(persistedState);
        setUser(authState.user);
        if (authState.user?.id) {
          await getFollowing(authState.user.id);
        }
      }
    } catch (error) {
      console.error('Error loading persisted auth state:', error);
    }
  };

  useEffect(() => {
    // Initialize auth state from persistent storage
    const initializeAuth = async () => {
      try {
        // Load persisted state first
        await loadPersistedAuthState();

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setLoading(false);
          return;
        }

        if (session) {
          // If we have a session, refresh it to ensure it's valid
          const { data: { session: refreshedSession }, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('Error refreshing session:', refreshError.message);
            // Session refresh failed, clear the invalid session
            await supabase.auth.signOut();
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUser(null);
          } else {
            if (refreshedSession?.user) {
              // Get user data from our database
              const { data: dbUser } = await supabase
                .from('User')
                .select('*')
                .eq('id', refreshedSession.user.id)
                .single();

              const userData = {
                ...refreshedSession.user,
                username: dbUser?.username || refreshedSession.user.email?.split('@')[0]
              };

              // Persist and set user state
              await persistAuthState({ user: userData });
              setUser(userData);

              // Fetch following data
              await getFollowing(refreshedSession.user.id);
            } else {
              await AsyncStorage.removeItem(STORAGE_KEY);
              setUser(null);
            }
          }
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        const username = session.user.user_metadata.username || session.user.email?.split('@')[0];
        const success = await createOrUpdateUser(session.user, username);

        if (!success) {
          await supabase.auth.signOut();
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }

        const userData = {
          ...session.user,
          username: username
        };

        await persistAuthState({ user: userData });
        setUser(userData);

        // Fetch following data
        await getFollowing(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setFollowing([]);
        setFollowers([]);
        setMyFollowing([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        return { error };
      }

      if (!data.session) {
        console.error('No session after sign in');
        return { error: new Error('Authentication failed') as AuthError };
      }

      const username = data.session.user.user_metadata.username || data.session.user.email?.split('@')[0];
      const success = await createOrUpdateUser(data.session.user, username);

      if (!success) {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem(STORAGE_KEY);
        return {
          error: {
            name: 'Database Error',
            message: 'Failed to create/update user profile',
            status: 500
          } as AuthError
        };
      }

      const userData = {
        ...data.session.user,
        username: username
      };

      await persistAuthState({ user: userData });
      setUser(userData);

      return { error: null };
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      return { error: err as AuthError };
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error.message);
        return { error };
      }

      if (!data.session) {
        console.log('Sign up successful, email confirmation required');
        return { error: null, message: 'Please check your email for confirmation' };
      }

      const success = await createOrUpdateUser(data.session.user, username);

      if (!success) {
        await supabase.auth.signOut();
        await AsyncStorage.removeItem(STORAGE_KEY);
        return {
          error: {
            name: 'Database Error',
            message: 'Failed to create user profile',
            status: 500
          } as AuthError
        };
      }

      const userData = {
        ...data.session.user,
        username: username
      };

      await persistAuthState({ user: userData });
      setUser(userData);

      return { error: null };
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Fetch following data when user changes
  useEffect(() => {
    if (user?.id) {
      getFollowing(user.id);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        following,
        followers,
        myFollowing,
        signIn,
        signUp,
        signOut,
        getFollowing
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};