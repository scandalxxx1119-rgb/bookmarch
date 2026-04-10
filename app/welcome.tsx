import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KEY_SEEN = '@BookMarch:hasSeenWelcome';
const BG_IMAGE = require('../assets/welcome-bg.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const anims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const delays = [0, 350, 700, 1050, 1450];
    Animated.parallel(
      anims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: delays[i],
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem(KEY_SEEN, 'true');
    } catch {}
    router.replace('/course-select');
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.root} resizeMode="cover">
      <StatusBar style="light" />

      {/* 暗幕オーバーレイ（テキスト読みやすさ確保） */}
      <View style={styles.overlay} />

      <View style={[styles.inner, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}>
        {/* 絵文字 */}
        <Animated.View style={[styles.center, { opacity: anims[0] }]}>
          <Text style={styles.emoji}>📖✨</Text>
        </Animated.View>

        {/* アプリ名 */}
        <Animated.View style={[styles.center, { opacity: anims[1], marginTop: 28 }]}>
          <Text style={styles.appName}>ブックマーチ</Text>
          <Text style={styles.appNameEn}>BookMarch</Text>
        </Animated.View>

        {/* キャッチコピー */}
        <Animated.View style={[styles.center, { opacity: anims[2], marginTop: 22 }]}>
          <Text style={styles.catchcopy}>読書を、旅にしよう。</Text>
        </Animated.View>

        {/* 説明文 */}
        <Animated.View style={[styles.center, { opacity: anims[3], marginTop: 36, paddingHorizontal: 40 }]}>
          <Text style={styles.description}>
            あなたが読んだ本のページ数が{'\n'}距離にかわります。{'\n\n'}
            本を読んで、山手線を一周{'\n'}してみませんか？
          </Text>
        </Animated.View>

        {/* ボタン */}
        <Animated.View style={[styles.btnWrapper, { opacity: anims[4] }]}>
          <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.buttonText}>旅をはじめる 🚶</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 15, 40, 0.55)',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  appNameEn: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4,
    marginTop: 4,
  },
  catchcopy: {
    fontSize: 18,
    color: '#fff',
    fontStyle: 'italic',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 28,
  },
  btnWrapper: {
    marginTop: 52,
    paddingHorizontal: 48,
    width: '100%',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#1E4080',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
