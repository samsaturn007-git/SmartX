import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View ,Dimensions} from 'react-native';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {Video,ResizeMode} from 'expo-av';


export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);    
  const cameraRef = React.useRef<CameraView>(null);
  const videoRef = React.useRef<Video>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState({isLoaded: false, isPlaying: false});

  if (!cameraPermission || !audioPermission || !cameraPermission.granted || !audioPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permissions to access the camera and record audio</Text>
        <Button onPress={requestCameraPermission} title="Grant Camera Permission" />
        <Button onPress={requestAudioPermission} title="Grant Audio Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const recordVideo = async () => { 
    if (isRecording) {
      setIsRecording(false);
      cameraRef.current?.stopRecording();
    } else {
      setIsRecording(true); 
      const video = await cameraRef.current?.recordAsync();
      setVideoUri(video.uri);
    }
  }

  const saveVideo = async () => {
    const formData = new FormData();
    const fileName = videoUri?.split('/').pop();
    formData.append('file',{
        uri: videoUri,
        type: `video/${fileName?.split('.').pop()}`,
        name: fileName
    });
    const { data, error } =  await supabase.storage
        .from(`videos/${user?.id}`)
        .upload(fileName, formData, {
            cacheControl: '3600000000',
            upsert: false,
        });
    if(error) console.error(error);


    const {error: videoError } = await supabase.from('Video').insert({
        title: "Test title here",
        uri: `${user?.id}/${fileName}`,
        user_id: user?.id,
    });
    if(videoError) console.error(videoError);
    router.back();
    }

    const pickImage = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.1,
      });
      console.log(result.assets[0].uri)
      setVideoUri(result.assets[0].uri);
    };

  
    return (
      <View className="flex-1">
        {videoUri ? (
          <View className="flex-1">
            <TouchableOpacity className="absolute bottom-10 left-36 z-10" onPress={saveVideo}>
              <Ionicons name="checkmark-circle" size={100} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className='flex-1' onPress={() => status.isPlaying ? videoRef.current.pauseAsync() : videoRef.current.playAsync()}>
              <Video
                ref={videoRef}
                style={{
                  flex: 1,
                  width: Dimensions.get('window').width,
                  height: Dimensions.get('window').height,

                }}
                source={{
                  uri: videoUri,
                }}
                resizeMode={ResizeMode.COVER}
                isLooping
                onPlaybackStatusUpdate={status => setStatus(() => status)}
              />
            </TouchableOpacity>
          </View>  
        )
        :
        
        <CameraView mode="video" ref={cameraRef} style={{flex: 1}} facing={facing}>
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 40}}>
              <TouchableOpacity onPress={pickImage}>
                <Ionicons name="aperture" size={50} color="white" />
              </TouchableOpacity>
              {videoUri ? (
                <TouchableOpacity onPress={saveVideo}>
                  <Ionicons name="checkmark-circle" size={100} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={recordVideo}>
                  {!isRecording ? <Ionicons name="radio-button-on" size={100} color="white" /> : <Ionicons name="pause-circle" size={100} color="red" />}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={50} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
        }
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
