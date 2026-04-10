import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Station } from '../types/course';

const IMG_NORMAL   = require('../assets/icons/arrival-normal.png');
const IMG_LANDMARK = require('../assets/icons/arrival-landmark.png');
const IMG_COMPLETE = require('../assets/icons/arrival-complete.png');

type Props = {
  visible: boolean;
  station: Station | null;
  totalPages: number;
  totalKm: number;
  passedCount: number;
  laps: number;
  isLapComplete: boolean;
  courseId?: string;        // コース識別（表示切り替え用）
  courseColor?: string;     // コースのテーマカラー
  totalStations?: number;   // 全駅数（表示用）
  onContinue: () => void;
  onShare: () => void;
};

const THEME  = '#4A90D9';
const GOLD   = '#F4A72A';
const SHINK  = '#0072BC';

export function ArrivalModal({
  visible,
  station,
  totalPages,
  totalKm,
  passedCount,
  laps,
  isLapComplete,
  courseId = 'yamanote',
  courseColor,
  totalStations,
  onContinue,
  onShare,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale]);

  if (!station) return null;

  const isShinkansen = courseId === 'shinkansen';
  const isGoalComplete = isLapComplete && isShinkansen;

  // バリアント判定
  const isLandmark = !isLapComplete && station.isLandmark;
  const accentColor = isGoalComplete
    ? GOLD
    : isShinkansen
    ? (courseColor || SHINK)
    : isLapComplete
    ? GOLD
    : isLandmark
    ? '#9B59B6'
    : (courseColor || THEME);

  // ヘッダー内容
  let headerImage: any;
  let headerImageSize: number;
  let headerTitle: string;
  let stationLabel: string;

  if (isGoalComplete) {
    headerImage     = IMG_COMPLETE;
    headerImageSize = 120;
    headerTitle     = '東京→博多 完全制覇！！';
    stationLabel    = `${station.name}でゴール！\n1,174.9km 踏破`;
  } else if (isLapComplete && !isShinkansen) {
    headerImage     = IMG_COMPLETE;
    headerImageSize = 120;
    headerTitle     = `山手線 ${laps}周完走！`;
    stationLabel    = `${station.name}駅を経て\n${laps}周目スタート`;
  } else if (isLandmark) {
    headerImage     = IMG_LANDMARK;
    headerImageSize = 100;
    headerTitle     = 'ランドマーク到着！';
    stationLabel    = `${station.name}駅`;
  } else if (isShinkansen) {
    headerImage     = IMG_NORMAL;
    headerImageSize = 80;
    headerTitle     = `${station.name}駅に到着！`;
    stationLabel    = station.description ? `─ ${station.description} ─` : station.name;
  } else {
    headerImage     = IMG_NORMAL;
    headerImageSize = 80;
    headerTitle     = '新しい駅に到着！';
    stationLabel    = `${station.name}駅`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* ヘッダー */}
          <View style={[styles.header, { backgroundColor: accentColor }]}>
            <Image
              source={headerImage}
              style={{ width: headerImageSize, height: headerImageSize, marginBottom: 6 }}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          </View>

          {/* 駅名 / 特別メッセージ */}
          <Text style={[styles.stationName, { color: accentColor }]}>{stationLabel}</Text>

          {/* 完走特別メッセージ */}
          {isGoalComplete && (
            <Text style={styles.goalMessage}>
              📚 累計{totalPages.toLocaleString('ja-JP')}ページで日本縦断達成！{'\n'}
              おめでとうございます！{'\n'}あなたは本で日本を縦断しました！
            </Text>
          )}

          {/* 統計 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPages.toLocaleString('ja-JP')}</Text>
              <Text style={styles.statLabel}>ページ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {passedCount}{totalStations ? `/${totalStations}` : ''}
              </Text>
              <Text style={styles.statLabel}>通過駅</Text>
            </View>
          </View>

          {/* ボタン */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnShare, { borderColor: accentColor }]}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnShareText, { color: accentColor }]}>シェアする</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnContinue, { backgroundColor: accentColor }]}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.btnContinueText}>つづける</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 16,
    lineHeight: 32,
  },
  goalMessage: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 14,
    paddingVertical: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  btnRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnShare: {
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  btnShareText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnContinue: {},
  btnContinueText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
