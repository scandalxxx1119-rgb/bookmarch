import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_COURSES } from '../constants/courses/index';
import { PAGE_TO_KM } from '../constants/config';
import { Course } from '../types/course';
import {
  getActiveCourseId,
  getArrivedStationsForCourse,
  setActiveCourseId,
} from '../services/courseStorage';
import { getBooks } from '../services/bookStorage';

const DIFFICULTY_LABELS = {
  beginner:     '★☆☆ 初級',
  intermediate: '★★☆ 中級',
  advanced:     '★★★ 上級',
};


type CourseProgress = {
  arrivedCount: number;
  progressRate: number;  // 0〜1
};

export default function CourseSelectScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [activeCourseId, setActiveId]       = useState('yamanote');
  const [progressMap, setProgressMap]       = useState<Record<string, CourseProgress>>({});
  const [totalPages, setTotalPages]         = useState(0);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [activeId, books, ...arrivedArrays] = await Promise.all([
          getActiveCourseId(),
          getBooks(),
          ...ALL_COURSES.map(c => getArrivedStationsForCourse(c.id)),
        ]);

        setActiveId(activeId);
        const pages = books.reduce((s, b) => s + b.totalPages, 0);
        setTotalPages(pages);

        const map: Record<string, CourseProgress> = {};
        ALL_COURSES.forEach((course, i) => {
          const arrived = arrivedArrays[i] as number[];
          const totalKm = Math.min(pages * PAGE_TO_KM, course.totalDistanceKm);
          map[course.id] = {
            arrivedCount: arrived.length,
            progressRate: course.totalDistanceKm > 0 ? totalKm / course.totalDistanceKm : 0,
          };
        });
        setProgressMap(map);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSelect = async (course: Course) => {
    if (course.locked) return;
    await setActiveCourseId(course.id);
    router.replace('/(tabs)');
  };

  const allCourses = ALL_COURSES;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ コースをえらぶ</Text>
        <View style={{ width: 56 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageSubtitle}>
            📚 累計: {totalPages.toLocaleString('ja-JP')}ページ読了
          </Text>

          {allCourses.map((course) => {
            const prog     = progressMap[course.id];
            const isActive = course.id === activeCourseId;
            const isLocked = !!course.locked;
            const rate     = prog?.progressRate ?? 0;
            const arrived  = prog?.arrivedCount ?? 0;
            const total    = course.stations.length;

            return (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.card,
                  isActive && { borderLeftColor: course.color, borderLeftWidth: 4 },
                  isLocked && styles.cardLocked,
                ]}
                onPress={() => handleSelect(course)}
                activeOpacity={isLocked ? 1 : 0.8}
                disabled={isLocked}
              >
                {/* カード上部 */}
                <View style={styles.cardTop}>
                  <Image
                    source={course.iconImage}
                    style={styles.courseIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseName, isLocked && styles.textLocked]}>
                      {course.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.difficulty, isLocked && styles.textLocked]}>
                        {DIFFICULTY_LABELS[course.difficulty]}
                      </Text>
                      <Text style={[styles.distance, isLocked && styles.textLocked]}>
                        {course.totalDistanceKm >= 1000
                          ? `${(course.totalDistanceKm / 1000).toFixed(3)}km`
                          : `${course.totalDistanceKm}km`}
                      </Text>
                    </View>
                  </View>
                  {isActive && !isLocked && (
                    <View style={[styles.activeBadge, { backgroundColor: course.color }]}>
                      <Text style={styles.activeBadgeText}>選択中</Text>
                    </View>
                  )}
                </View>

                {/* 説明文 */}
                <Text style={[styles.courseDesc, isLocked && styles.textLocked]}>
                  {course.description}
                </Text>

                {/* プログレスバー（非ロック時のみ） */}
                {!isLocked && (
                  <View style={styles.progressArea}>
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.round(rate * 100)}%` as any, backgroundColor: course.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(rate * 100)}%
                    </Text>
                  </View>
                )}

                {!isLocked && total > 0 && (
                  <Text style={styles.stationCount}>🚉 {arrived}/{total}駅</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    width: 56,
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 16,
    color: '#4A90D9',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLocked: {
    opacity: 0.55,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseIcon: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficulty: {
    fontSize: 12,
    color: '#888',
    marginRight: 12,
  },
  distance: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  activeBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  courseDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 10,
  },
  textLocked: {
    color: '#AAA',
  },
  progressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    width: 36,
    textAlign: 'right',
  },
  stationCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
