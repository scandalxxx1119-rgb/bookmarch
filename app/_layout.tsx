import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ネイティブスプラッシュをキープしてflashを防ぐ
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('@BookMarch:hasSeenWelcome');
        if (!seen) {
          router.replace('/welcome');
        }
      } catch {
        // AsyncStorage失敗時はウェルカムスキップ
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="welcome"
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="course-select"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="onboarding-demo"
          options={{ gestureEnabled: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="barcode-scanner"
          options={{
            headerShown: true,
            headerTitle: 'バーコードで登録',
            headerStyle: { backgroundColor: '#4A90D9' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            headerShown: true,
            headerTitle: 'プライバシーポリシー',
            headerStyle: { backgroundColor: '#4A90D9' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: true,
            headerTitle: '利用規約',
            headerStyle: { backgroundColor: '#4A90D9' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="licenses"
          options={{
            headerShown: true,
            headerTitle: 'オープンソースライセンス',
            headerStyle: { backgroundColor: '#4A90D9' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{
            headerShown: true,
            headerTitle: '通知設定',
            headerStyle: { backgroundColor: '#4A90D9' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
