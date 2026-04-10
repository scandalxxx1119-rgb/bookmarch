import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapCharacter } from '../../components/MapCharacter';
import { PAGE_TO_KM } from '../../constants/config';
import { ALL_COURSES, YAMANOTE_COURSE } from '../../constants/courses/index';
import { Course } from '../../types/course';
import { getActiveCourseId } from '../../services/courseStorage';
import { useProgress } from '../../hooks/useProgress';

const GRAY = '#CCCCCC';

function formatNumber(n: number): string {
  return n.toLocaleString('ja-JP');
}

function overviewRegionFor(course: Course) {
  if (course.id === 'shinkansen') {
    return { latitude: 35.0, longitude: 136.0, latitudeDelta: 9.0, longitudeDelta: 9.0 };
  }
  if (course.id === 'japan-crossing') {
    return { latitude: 36.0, longitude: 137.0, latitudeDelta: 20.0, longitudeDelta: 15.0 };
  }
  return { latitude: 35.683, longitude: 139.735, latitudeDelta: 0.12, longitudeDelta: 0.12 };
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mapReady, setMapReady] = useState(false);
  const [activeCourse, setActiveCourse] = useState<Course>(YAMANOTE_COURSE);

  // アクティブコースをフォーカス時にリロード
  useFocusEffect(
    useCallback(() => {
      getActiveCourseId().then((id) => {
        const found = ALL_COURSES.find((c) => c.id === id) || YAMANOTE_COURSE;
        setActiveCourse(found);
        userMovedMap.current = false;
      });
    }, [])
  );

  const {
    totalPages,
    totalKm,
    currentStation,
    nextStation,
    progressToNext,
    passedStations,
    laps,
    isGoalReached,
  } = useProgress(activeCourse);

  const THEME = activeCourse.color || '#4A90D9';
  const hasBooks  = totalPages > 0;
  const kmInLap   = activeCourse.isLoop
    ? totalKm % activeCourse.totalDistanceKm
    : Math.min(totalKm, activeCourse.totalDistanceKm);
  const currentIdx = activeCourse.stations.findIndex((s) => s.id === currentStation.id);

  // 次の駅までの残りページ
  const nextDist =
    nextStation.distanceFromStart > currentStation.distanceFromStart
      ? nextStation.distanceFromStart
      : activeCourse.isLoop ? activeCourse.totalDistanceKm : nextStation.distanceFromStart;
  const pagesToNext = isGoalReached
    ? 0
    : Math.max(1, Math.ceil((nextDist - kmInLap) / PAGE_TO_KM));

  // キャラクター座標
  const charLat = hasBooks
    ? currentStation.latitude  + (nextStation.latitude  - currentStation.latitude)  * progressToNext
    : activeCourse.stations[0].latitude;
  const charLng = hasBooks
    ? currentStation.longitude + (nextStation.longitude - currentStation.longitude) * progressToNext
    : activeCourse.stations[0].longitude;

  // Polyline 座標
  const stations = activeCourse.stations;
  const passedCoords =
    hasBooks && currentIdx > 0
      ? stations.slice(0, currentIdx + 1).map((s) => ({ latitude: s.latitude, longitude: s.longitude }))
      : [];

  const remainingStart = hasBooks && currentIdx > 0 ? currentIdx : 0;
  const remainingBase = stations.slice(remainingStart).map((s) => ({
    latitude: s.latitude, longitude: s.longitude,
  }));
  const remainingCoords = activeCourse.isLoop
    ? [...remainingBase, { latitude: stations[0].latitude, longitude: stations[0].longitude }]
    : remainingBase;

  const passedSet = new Set(passedStations.map((s) => s.id));

  // カメラ制御
  const mapRef       = useRef<MapView>(null);
  const userMovedMap = useRef(false);

  const animateToChar = useCallback(
    (duration = 800) => {
      mapRef.current?.animateToRegion(
        { latitude: charLat, longitude: charLng, latitudeDelta: 0.05, longitudeDelta: 0.04 },
        duration
      );
    },
    [charLat, charLng]
  );

  // コース変更時はズームリセット
  const prevCourseId = useRef(activeCourse.id);
  useEffect(() => {
    if (prevCourseId.current !== activeCourse.id && mapReady) {
      mapRef.current?.animateToRegion(overviewRegionFor(activeCourse), 600);
      prevCourseId.current = activeCourse.id;
    }
  }, [activeCourse, mapReady]);

  useEffect(() => {
    if (!userMovedMap.current && mapReady && activeCourse.id === prevCourseId.current) {
      animateToChar();
    }
  }, [charLat, charLng, animateToChar, mapReady]);

  const handleReturnToLocation = () => {
    userMovedMap.current = false;
    animateToChar(500);
  };

  // プログレスバーアニメーション
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressToNext,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progressToNext, progressAnim]);

  const animatedBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, barWidth],
    extrapolate: 'clamp',
  });

  // ステータスカードの内容
  const lapLabel = activeCourse.isLoop
    ? `🔄 山手線 ${laps}周目`
    : isGoalReached
    ? `🏆 完全制覇！`
    : `🏁 残り ${(activeCourse.totalDistanceKm - totalKm).toFixed(1)}km`;

  return (
    <View style={styles.root}>
      {/* フルスクリーンマップ */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={overviewRegionFor(activeCourse)}
        mapType="standard"
        onMapReady={() => setMapReady(true)}
        onPanDrag={() => { userMovedMap.current = true; }}
      >
        {remainingCoords.length >= 2 && (
          <Polyline
            coordinates={remainingCoords}
            strokeColor={GRAY}
            strokeWidth={1}
            lineDashPattern={[6, 4]}
          />
        )}
        {passedCoords.length >= 2 && (
          <Polyline coordinates={passedCoords} strokeColor={THEME} strokeWidth={3} />
        )}
        {stations.map((station) => {
          const isPassed = passedSet.has(station.id) && hasBooks;
          const stationKm =
            station.distanceFromStart <= kmInLap ? 0 : station.distanceFromStart - kmInLap;
          const pagesTo = Math.ceil(stationKm / PAGE_TO_KM);
          return (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.latitude, longitude: station.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.dot, isPassed ? { backgroundColor: THEME } : styles.dotGray]} />
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{station.name}駅</Text>
                  {station.description ? (
                    <Text style={styles.calloutDesc}>{station.description}</Text>
                  ) : null}
                  <Text style={styles.calloutSub}>
                    {isPassed ? '到着済み ✅' : `あと${pagesTo}ページ`}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
        <MapCharacter latitude={charLat} longitude={charLng} hasBooks={hasBooks} />
      </MapView>

      {/* ステータスカード（オーバーレイ） */}
      <View style={[styles.card, { top: insets.top + 8 }]}>
        {/* カードヘッダー行 */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            ブックマーチ ─ {activeCourse.name}
          </Text>
          <TouchableOpacity
            style={styles.courseSwitch}
            onPress={() => router.push('/course-select')}
            activeOpacity={0.7}
          >
            <Text style={styles.courseSwitchText}>🔄 コース変更</Text>
          </TouchableOpacity>
        </View>

        {hasBooks ? (
          <>
            <View style={styles.stationRow}>
              <Text style={styles.stationLabel}>📍 現在地: </Text>
              <Text style={[styles.stationName, { color: THEME }]}>
                {isGoalReached ? `🏆 ${currentStation.name}` : `${currentStation.name}駅`}
              </Text>
            </View>

            <View
              style={styles.progressBg}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[styles.progressFill, { width: animatedBarWidth, backgroundColor: THEME }]}
              />
            </View>
            {!isGoalReached && (
              <Text style={styles.nextInfo}>
                次の駅: {nextStation.name}駅まであと {pagesToNext}ページ
              </Text>
            )}

            <Text style={styles.stat}>
              📚 累計: {formatNumber(totalPages)}ページ（{totalKm.toFixed(1)}km）
            </Text>
            <Text style={styles.lap}>{lapLabel}</Text>
          </>
        ) : (
          <Text style={styles.emptyMsg}>本をとうろくして旅を始めよう！</Text>
        )}
      </View>

      {/* ローディング */}
      {!mapReady && (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      )}

      {/* 現在地に戻るボタン */}
      <TouchableOpacity
        style={[styles.returnBtn, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={handleReturnToLocation}
        activeOpacity={0.8}
      >
        <Text style={styles.returnBtnText}>📍 現在地に戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle:   { fontSize: 12, fontWeight: 'bold', color: '#555', flex: 1 },
  courseSwitch: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginLeft: 8,
  },
  courseSwitchText: { fontSize: 16 },

  stationRow:   { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  stationLabel: { fontSize: 13, color: '#555' },
  stationName:  { fontSize: 20, fontWeight: 'bold' },
  progressBg: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: 8, borderRadius: 4 },
  nextInfo: { fontSize: 12, color: '#666', marginBottom: 4 },
  stat:     { fontSize: 12, color: '#555', marginBottom: 2 },
  lap:      { fontSize: 12, color: '#888' },
  emptyMsg: { fontSize: 14, color: '#aaa', textAlign: 'center', paddingVertical: 4 },

  dot:     { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
  dotGray: { backgroundColor: '#CCCCCC' },

  callout:     { padding: 8, minWidth: 110, maxWidth: 180 },
  calloutName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  calloutDesc: { fontSize: 11, color: '#888', marginTop: 2, fontStyle: 'italic' },
  calloutSub:  { fontSize: 12, color: '#666', marginTop: 3 },

  returnBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  returnBtnText: { fontSize: 13, fontWeight: 'bold', color: '#333' },

  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
