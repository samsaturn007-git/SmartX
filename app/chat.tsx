
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import Messages from '@/components/messages';



export default function() {
  const { user} = useAuth();
  const params = useLocalSearchParams();
  const [messages, setMessages] = React.useState<any[]>([]);
  const users_key = [user.id, params.chat_user_id].sort().join(':');

  React.useEffect(() => {
    getMessages();
  }, []);

  React.useEffect(() => {
    const channel = supabase.channel(users_key).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'Chat',
      filter: `users_key=eq.${users_key}`,
    }, (payload) => {
      getMessages();
    }).subscribe()
    return () => {
      supabase.removeChannel(channel);
    }
    },[messages, setMessages, users_key])

  const getMessages = async() => {
    const {data, error} = await supabase
      .from('Chat')
      .select('*, User(*)')
      .eq('users_key',users_key)
    if (error) {
      console.log(error);
    } else if (data) {
      setMessages(data);
    }
  }
  const addMessage = async(text: string) => {
    const {error} = await supabase.from('Chat').insert({
      user_id: user.id,
      chat_user_id: params.chat_user_id,
      text,
      users_key
    });
    if(error) return console.log(error)
    getMessages();
}

  return <Messages messages={messages} addMessage={addMessage} />
}
