import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Button, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

interface CoordsType {
    latitude: number;
    longitude: number;
}

export default function App() {
    const [location, setLocation] = useState<CoordsType | null>(null);
    const [isLocationEnabled, setIsLocationEnabled] = useState(false); // 控制定位開關
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isWebviewReady, setIsWebviewReady] = useState(false);
    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        if (isLocationEnabled) {
            fetchLocation();
        } else {
            setLocation(null);
            setIsLoading(false);
        }
    }, [isLocationEnabled]);

    useEffect(() => {
        if (webViewRef.current) {
            console.log('Init Webview完成載入');
        } else {
            console.warn('WebView Failed!');
        }
    }, []);

    async function fetchLocation() {
        setIsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync(); // 取得存取位置授權
            if (status !== 'granted') {
                setErrorMsg('拒絕存取位置');
                setIsLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({}); // 取得使用者當前位置
            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            if (!isWebviewReady || !webViewRef.current) {
                console.log('Webview 尚未準備好');
                let attempts = 0;
                const interval = setInterval(() => {
                    if (webViewRef.current) {
                        clearInterval(interval);
                        sendMessageToWebView(latitude, longitude);
                    }
                    attempts++;
                    if (attempts >= 10) clearInterval(interval);
                }, 500);

                return;
            }
            sendMessageToWebView();
        } catch (error) {
            setErrorMsg('無法搜尋使用者位置');
        } finally {
            setIsLoading(false);
        }
    }

    // 接 Webview 傳送過來的資訊, 並執行對應動作
    const handleWebViewMessage = (e: any) => {
        try {
            // alert(`(外框) 接收 Webview 傳送過來的資訊 ${JSON.stringify(e)}`);
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === 'REQUEST_LOCATION') {
                fetchLocation();
            }
        } catch (error) {
            setErrorMsg('Webview資訊接收失敗');
        }
    };

    const sendMessageToWebView = (latitude = 25.033964, longitude = 121.564472) => {
        if (!webViewRef.current) {
            console.log('WebView 尚未準備好');
            return;
        }

        const message = JSON.stringify({
            type: 'UPDATE_LOCATION',
            latitude,
            longitude,
        });
        console.log('測試框傳訊息--> WebView', message);
        webViewRef.current.postMessage(message);

        webViewRef.current.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message',{data: '${message}'}))`);
    };

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>定位中，請稍候...</Text>
            </View>
        )
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
                <Button title={isLocationEnabled ? "關閉定位" : "開啟定位"}
                    onPress={() => setIsLocationEnabled(!isLocationEnabled)}>
                </Button>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ uri: `https://mdev.houseflow.tw/exploreMap` }}
                    style={styles.webview}
                    onMessage={handleWebViewMessage} // 接收
                    onLoad={() => {
                        console.log('Webview完成載入');
                        setIsWebviewReady(true);
                    }}
                    injectedJavaScript={`
                        (function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'UPDATE_LOCATION',
                                latitude,
                                longitude,
                                }););
                                })();
                                `}
                />
                {/* <Button title="傳送訊息至 WebView" onPress={sendMessageToWebView} /> */}
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
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
