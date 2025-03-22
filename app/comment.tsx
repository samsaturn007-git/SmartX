
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Keyboard } from 'react-native';
import Messages from '@/components/messages';



export default function() {
  const { user} = useAuth();
  const params = useLocalSearchParams();
  const [comments, setComments] = React.useState<any[]>([]);

  React.useEffect(() => {
    getComments();
  }, []);

  const getComments = async() => {
    const {data, error} = await supabase
      .from('Comment')
      .select('*, User(*)')
      .eq('video_id', params.video_id)
    if (error) {
      console.log(error);
    } else if (data) {
      setComments(data);
    }
  }
  const addComment = async(text: string) => {
    const {error} = await supabase.from('Comment').insert({
      user_id: user.id,
      video_id: params.video_id,
      text,
      video_user_id: params.video_user_id,
    });
    if(error) return console.log(error)
    getComments();
}

  return <Messages messages={comments} addMessage={addComment} />
}
