import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Video, ResizeMode } from 'expo-av';

interface LiveStreamProps {
  postId: string;
  userId: string;
  isStreamer: boolean;
  onViewerCountChange?: (count: number) => void;
}

export const LiveStream: React.FC<LiveStreamProps> = ({
  postId,
  userId,
  isStreamer,
  onViewerCountChange,
}) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    setupRealtimeChannel();
    if (isStreamer) {
      startStreaming();
    } else {
      joinStream();
    }

    return () => {
      cleanup();
    };
  }, []);

  const setupRealtimeChannel = () => {
    // Create a realtime channel for the stream
    const channel = supabase.channel(`stream-${postId}`, {
      config: {
        broadcast: { self: true },
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'join' }, ({ key }) => {
        const newCount = Object.keys(key).length;
        setViewerCount(newCount);
        onViewerCountChange?.(newCount);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        const newCount = Object.keys(key).length;
        setViewerCount(newCount);
        onViewerCountChange?.(newCount);
      })
      .on('broadcast', { event: 'stream-url' }, ({ payload }) => {
        if (!isStreamer && payload.url) {
          setStreamUrl(payload.url);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: userId });
          setIsConnected(true);
        }
      });

    channelRef.current = channel;
  };

  const startStreaming = async () => {
    if (!cameraRef.current) return;

    try {
      // In a real implementation, this would be your streaming server URL
      const streamingUrl = `rtmp://your-streaming-server/live/${postId}`;

      // Update the post with streaming info
      const { error } = await supabase
        .from('Post')
        .update({
          is_live: true,
          stream_id: postId,
          stream_url: streamingUrl,
          started_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      // Broadcast the stream URL to viewers
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stream-url',
        payload: { url: streamingUrl },
      });

    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const joinStream = async () => {
    try {
      // Get stream URL from the post
      const { data, error } = await supabase
        .from('Post')
        .select('stream_url')
        .eq('id', postId)
        .single();

      if (error) throw error;
      if (data?.stream_url) {
        setStreamUrl(data.stream_url);
      }

      // Add viewer record
      await supabase
        .from('LiveViewer')
        .insert({
          post_id: postId,
          user_id: userId,
        });

    } catch (error) {
      console.error('Error joining stream:', error);
    }
  };

  const cleanup = async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
    }

    if (isStreamer) {
      // End the stream
      await supabase
        .from('Post')
        .update({
          is_live: false,
          stream_url: null,
        })
        .eq('id', postId);
    } else {
      // Remove viewer record
      await supabase
        .from('LiveViewer')
        .delete()
        .match({
          post_id: postId,
          user_id: userId,
        });
    }

    setIsConnected(false);
  };

  return (
    <View style={styles.container}>
      {isStreamer ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          mode="video"
        />
      ) : streamUrl ? (
        <Video
          source={{ uri: streamUrl }}
          style={styles.video}
          shouldPlay
          isLooping={false}
          resizeMode={ResizeMode.COVER}
        />
      ) : (
        <View style={styles.videoContainer}>
          <Text style={styles.waitingText}>Waiting for stream...</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.viewerCount}>
          <Text style={styles.viewerText}>
            {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
          </Text>
        </View>
        {!isConnected && (
          <View style={styles.connecting}>
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Dimensions.get('window').height * 0.8,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: '#fff',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  viewerCount: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  viewerText: {
    color: '#fff',
    fontSize: 14,
  },
  connecting: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  connectingText: {
    color: '#fff',
    fontSize: 14,
  },
});