import { useRef, useState } from 'react';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions, CameraOrientation } from 'expo-camera';
import { Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function App() {
    const [permission, requestPermission] = useCameraPermissions(); // 相機權限
    const [micPermission, requestMicPermission] = useMicrophonePermissions(); // 麥克風權限
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions(); // Camera Roll(檔案存取)權限
    const [errorMsg, setErrorMsg] = useState('');
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
            const { action, content, photoUrl } = JSON.parse(e.nativeEvent.data);

            if (action === 'SEND_PHOTO') {
                console.log('action', action, 'content', content);

                const base64 = photoUrl.split(',')[1];
                const filename = FileSystem.documentDirectory + 'photo.png';

                FileSystem.writeAsStringAsync(filename, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    await MediaLibrary.saveToLibraryAsync(filename);
                    alert('照片已存到相簿！');
                } else {
                    alert('未授權存取相簿！');
                }
            }
        } catch (error) {
            setErrorMsg('接收失敗');
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
            <WebView
                ref={webViewRef}
                style={styles.webview}
                source={{ uri: `https://lucie0417.github.io/react-webview-test/` }}
                onMessage={handleMessage}
            />
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
