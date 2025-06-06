import { useRef, useState } from 'react';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions, CameraOrientation } from 'expo-camera';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function App() {
    const [permission, requestPermission] = useCameraPermissions(); // 相機權限
    const [micPermission, requestMicPermission] = useMicrophonePermissions(); // 麥克風權限
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions(); // Camera Roll(檔案存取)權限
    const [photo, setPhoto] = useState<string | null>(null);
    const [orientation, setOrientation] = useState<CameraOrientation>('landscapeLeft');
    const [facing, setFacing] = useState<CameraType>('back');
    const [showCamera, setShowCamera] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const cameraRef = useRef<any>(null);
    const webViewRef = useRef<WebView>(null);


    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.container}>
                    <Text style={styles.message}>We need your permission to show the camera and record audio.</Text>
                    <Button onPress={requestPermission} title="Camera grant permission" />
                    <Button onPress={requestMicPermission} title="Microphone grant permission" color="#841584" />
                </View>
            </SafeAreaView>
        );
    }

    const handleMessage = async (e: any) => {
        try {
            const { action, payload } = JSON.parse(e.nativeEvent.data);

            if (action === 'openCamera') {
                console.log('action', action, 'payload', payload);
                setPhoto(null);
                setShowCamera(true);
            }
        } catch (error) {
            setErrorMsg('Web 資訊接收失敗');
        }
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePicture = async () => {
        if (!mediaPermission?.granted) {
            await requestMediaPermission();
        }

        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                const asset = await MediaLibrary.createAssetAsync(photo.uri);
                setPhoto(asset.uri);

                const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const message = JSON.stringify({
                    status: 'sendPhoto',
                    message: '傳送照片',
                    content: `https://unsplash.com/photos/a-cozy-kitchen-with-cooking-utensils-eNBXKqj-88M`,
                });

                
                setTimeout(() => {
                    setShowCamera(false);
                    webViewRef.current?.postMessage(JSON.stringify({
                        status: 'sendPhoto',
                        message: '傳送照片',
                        content: `https://unsplash.com/photos/a-cozy-kitchen-with-cooking-utensils-eNBXKqj-88M`,
                    }));
                    console.log('發送到Web', message);
                }, 100);
            } catch (error) {
                console.error('takePicture Error', error);
            }
        }
    }


    if (errorMsg) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.container}>
                {showCamera ? (
                    // 顯示相機
                    <CameraView
                        style={styles.camera}
                        ref={cameraRef}
                        facing={facing}
                        responsiveOrientationWhenOrientationLocked={true}
                        onResponsiveOrientationChanged={(e) => setOrientation(e.orientation)}
                    >
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                                <Text style={styles.text}>Flip Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={takePicture}>
                                <Text style={styles.text}>Take Picture</Text>
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                ) : (
                    // 顯示 WebView
                    <WebView
                        ref={webViewRef}
                        style={styles.webview}
                        source={{ uri: `https://mdev.houseflow.tw?t=${Date.now()}` }}
                        mediaPlaybackRequiresUserAction={false}
                        onMessage={handleMessage}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    message: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    buttonContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 50,
    },
    button: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
    },
    text: {
        color: '#000',
        fontWeight: 'bold',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    preview: {
        width: '100%',
        height: '80%',
        resizeMode: 'contain',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#BF3131',
        fontSize: 18,
    },
});
