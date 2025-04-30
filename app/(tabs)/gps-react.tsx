import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Button, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

interface CoordsType {
    latitude: number;
    longitude: number;
}

export default function gpsReact() {
    const [location, setLocation] = useState<CoordsType | null>(null);
    const [isLocationEnabled, setIsLocationEnabled] = useState(true); // 控制定位開關
    const [getLocationAgain, setGetLocationAgain] = useState(false); // 重取定位開關
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isWebviewReady, setIsWebviewReady] = useState(false);
    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        if (isLocationEnabled) {
            fetchLocation(); // 首次開啟頁面或控制器開啟時,自動取得座標
        } else {
            setLocation(null);
            setIsLoading(false);
        }
    }, [isLocationEnabled, getLocationAgain]);


    const fetchLocation = async () => {
        setIsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync(); // 取得存取位置授權
            if (status !== 'granted') {
                setErrorMsg('拒絕存取位置');
                return;
            }

            let location = await Location.getCurrentPositionAsync({}); // 取得使用者當前位置
            const { latitude, longitude } = location.coords;

            const message = JSON.stringify({
                status: 'LOCATION_INFO',
                latitude,
                longitude,
            });

            setTimeout(() => {
                webViewRef.current?.postMessage(message);
            }, 1000);

        } catch (error) {
            setErrorMsg('無法搜尋使用者位置');
        } finally {
            setIsLoading(false);
        }
    }

    // 接收 Web 傳來資訊, 並執行對應動作
    const handleGPSMessage = (e: any) => {
        try {
            const { action, content } = JSON.parse(e.nativeEvent.data);
            console.log('action', action, 'content', content);

            if (action === 'GET_INIT_LOCATION') {
                setIsLocationEnabled(true);
            } else if (action === 'UPDATE_LOCATION') {
                setGetLocationAgain(true);
            } else if (action === 'GPS_OFF') {
                setIsLocationEnabled(false);
                setGetLocationAgain(false);
                setLocation(null);
            }
        } catch (error) {
            setErrorMsg('Web 資訊接收失敗');
        }
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
                <Text style={styles.text}>{isLocationEnabled ? "(APP區域) GPS已開啟" : "(APP區域) GPS關閉"}</Text>

                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ uri: `https://lucie0417.github.io/react-webview-test/?t=${Date.now()}` }}
                    style={styles.webview}
                    onMessage={handleGPSMessage} // 接收
                />
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
    text: {
        margin: 10,
        fontSize: 18,
    }
});
