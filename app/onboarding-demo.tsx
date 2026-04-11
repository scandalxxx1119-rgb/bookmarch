import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PAGE_TO_KM } from '../constants/config';
import { ALL_COURSES, YAMANOTE_COURSE } from '../constants/courses/index';
import { getActiveCourseId } from '../services/courseStorage';
import { Course, Station } from '../types/course';

const THEME = '#4A90D9';
const CHAR_FRAME = require('../assets/character/walk-frame1.png');

export default function OnboardingDemoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep]       = useState<1 | 2>(1);
  const [pages, setPages]     = useState('50');
  const [course, setCourse]   = useState<Course>(YAMANOTE_COURSE);

  // Step 2 用
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const id = await getActiveCourseId();
      const found = ALL_COURSES.find((c) => c.id === id) ?? YAMANOTE_COURSE;
      setCourse(found);
    })();
  }, []);

  const handleTryRecord = () => {
    const num = parseInt(pages, 10);
    const validPages = (!isNaN(num) && num > 0) ? num : 50;
    setPages(String(validPages));
    setStep(2);

    const km = validPages * PAGE_TO_KM;
    const kmInLap = course.isLoop
      ? km % course.totalDistanceKm
      : Math.min(km, course.totalDistanceKm);
    const targetRate = Math.min(kmInLap / (course.totalDistanceKm * 0.15), 1); // 15%上限で見た目よく

    progressAnim.setValue(0);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: targetRate,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  const inputPages = parseInt(pages, 10) || 50;
  const km = inputPages * PAGE_TO_KM;

  // 次の駅を探す
  const kmInLap = course.isLoop
    ? km % course.totalDistanceKm
    : Math.min(km, course.totalDistanceKm);
  const firstStation: Station | undefined = course.stations[0];
  const nextStation: Station | undefined = course.stations.find(
    (s) => s.distanceFromStart > kmInLap
  ) ?? course.stations[course.stations.length - 1];
  const remainKm = nextStation
    ? Math.max(nextStation.distanceFromStart - kmInLap, 0)
    : 0;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === 1 ? (
        <View style={styles.stepContainer}>
          <Text style={styles.stepEmoji}>📖</Text>
          <Text style={styles.stepTitle}>ブックマーチの旅を{'\n'}体験してみよう！</Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>
              いま読んでいる本、または最近読んだ本の{'\n'}ページ数を入力してね
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={pages}
                onChangeText={setPages}
                keyboardType="numeric"
                returnKeyType="done"
                selectTextOnFocus
              />
              <Text style={styles.inputUnit}>ページ</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleTryRecord}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>きろくしてみる！</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>あとからいつでも変更OK</Text>
        </View>
      ) : (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>
            {inputPages}ページ記録！{'\n'}
            {km.toFixed(1)}km 旅が進んだよ！
          </Text>

          {/* キャラ + 進捗バー */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth, backgroundColor: course.color },
                ]}
              />
            </View>
            <Image
              source={CHAR_FRAME}
              style={styles.charIcon}
              resizeMode="contain"
            />
          </View>

          {/* 出発・次の駅 */}
          <View style={styles.stationCard}>
            {firstStation && (
              <Text style={styles.departText}>
                📍 {firstStation.name}を出発！
              </Text>
            )}
            {nextStation && (
              <>
                <Text style={styles.nextText}>次の駅: {nextStation.name}</Text>
                <Text style={styles.remainText}>あと {remainKm.toFixed(1)} km</Text>
              </>
            )}
          </View>

          <Text style={styles.demoNote}>
            ※この記録は体験用です。{'\n'}
            メイン画面で本を登録すると本当の旅が始まります！
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>はじめる！</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  stepEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 28,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  input: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME,
    width: 120,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: THEME,
  },
  inputUnit: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: THEME,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: THEME,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: '#aaa',
  },

  // Step 2
  resultEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 24,
  },
  progressSection: {
    width: '100%',
    marginBottom: 20,
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E0E8F8',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: 12,
    borderRadius: 6,
  },
  charIcon: {
    width: 40,
    height: 40,
    marginTop: 6,
    alignSelf: 'flex-start',
    marginLeft: '5%',
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  departText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  nextText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  remainText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME,
  },
  demoNote: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
  },
});
