import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from 'expo-sqlite/kv-store';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const plateformOS = Platform.OS; // 裝置類型
  const osVersion = Device.osVersion; // 裝置版本號
  const osModelName = Device.modelName; // 裝置型號

  const [deviceId, setDeviceId] = useState<string | null>(null);

  const getSafeDevice = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'android') {
        return Application.getAndroidId() ?? null;
      } else if (Platform.OS === 'ios') {
        return await Application.getIosIdForVendorAsync();
      } else { return null }
    } catch (error) {
      console.warn('取得裝置發生錯誤');
      return null;
    }
  }

  useEffect(() => {
    const fetchDevice = async () => {
      let id = await getSafeDevice();
      setDeviceId(id);
    }
    fetchDevice();
  }, []);


  const handleMessage = async (event: any) => {
    try {
      const { action, payload } = JSON.parse(event.nativeEvent.data);
      console.log('action', action, 'payload', payload);


      if (action === 'getPlatformInfo') {
        console.log('傳送裝置資訊給Web:', plateformOS, osVersion, osModelName, deviceId);
        webViewRef.current?.postMessage(
          JSON.stringify(
            {
              status: 'sendDeviceInfo',
              content: { plateformOS, osVersion, osModelName, deviceId },
              message: '傳送裝置資訊'
            }));
      }

      if (action === 'saveToken') {
        const { token } = payload;
        AsyncStorage.setItemSync('authToken', token);
        console.log('已儲存 token:', token);
        webViewRef.current?.postMessage(JSON.stringify({ status: 'saved', message: 'Token 已儲存' }));
      }
    } catch (error) {
      console.error('處理訊息錯誤：', error);
      webViewRef.current?.postMessage(JSON.stringify({ status: 'error', message: '格式錯誤或儲存失敗' }));
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: 'https://mdev.houseflow.tw?t=${Date.now()}' }}
        style={styles.webview}
        onMessage={handleMessage} // 接收
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  webview: {
    flex: 1,
  },
});