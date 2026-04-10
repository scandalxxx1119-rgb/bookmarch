import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PAGE_TO_KM } from '../../constants/config';
import { ALL_COURSES, YAMANOTE_COURSE } from '../../constants/courses/index';
import { getBooks } from '../../services/bookStorage';
import { getActiveCourseId, getArrivedStationsForCourse } from '../../services/courseStorage';
import { Book, ReadingLog } from '../../types/book';
import { Course } from '../../types/course';

const THEME   = '#4A90D9';
const VERSION = '0.1.0';

/** 連続読書日数を計算 */
function calcStreak(books: Book[]): number {
  const allLogs: string[] = [];
  books.forEach((b) => {
    b.readingLogs.forEach((l: ReadingLog) => {
      allLogs.push(l.loggedAt.slice(0, 10)); // YYYY-MM-DD
    });
  });
  if (allLogs.length === 0) return 0;

  const days = [...new Set(allLogs)].sort().reverse(); // 降順ユニーク日付
  const today = new Date().toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== getPrevDay(today)) return 0;

  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    if (getPrevDay(days[i]) === days[i + 1]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getPrevDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

type Stats = {
  bookCount: number;
  totalPagesRead: number;
  totalKm: number;
  startDate: string | null;
  streak: number;
  arrivedCount: number;
};

export default function MyPageScreen() {
  const router = useRouter();
  const [stats, setStats]               = useState<Stats | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course>(YAMANOTE_COURSE);
  const [courseProgress, setCourseProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [books, courseId] = await Promise.all([
            getBooks(),
            getActiveCourseId(),
          ]);
          const course  = ALL_COURSES.find((c) => c.id === courseId) || YAMANOTE_COURSE;
          const arrived = await getArrivedStationsForCourse(courseId);

          setActiveCourse(course);

          const courseBooks = books.filter((b) => (b.courseId ?? 'yamanote') === courseId);
          const coursePagesRead = courseBooks.reduce((s, b) => s + b.pagesRead, 0);
          const courseKm = Math.min(coursePagesRead * PAGE_TO_KM, course.totalDistanceKm);
          setCourseProgress(course.totalDistanceKm > 0 ? courseKm / course.totalDistanceKm : 0);

          const totalPagesRead = books.reduce((s, b) => s + b.pagesRead, 0);
          const totalKm = totalPagesRead * PAGE_TO_KM;
          const dates = books.map((b) => b.registeredAt).sort();
          const startDate = dates.length > 0 ? dates[0] : null;

          setStats({
            bookCount:      books.length,
            totalPagesRead,
            totalKm,
            startDate,
            streak:         calcStreak(books),
            arrivedCount:   arrived.length,
          });
        } catch {}
      })();
    }, [])
  );

  const handleDeleteAllData = () => {
    Alert.alert(
      'データをすべて削除',
      'すべての読書記録、本の登録、コースの進捗が削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'すべて削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys   = await AsyncStorage.getAllKeys();
              const bmKeys = keys.filter((k) => k.startsWith('@BookMarch:'));
              await AsyncStorage.multiRemove(bmKeys);
              router.replace('/welcome');
            } catch {
              Alert.alert('エラー', 'データの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const progressPct = Math.round(courseProgress * 100);
  const courseKmStr = (courseProgress * activeCourse.totalDistanceKm).toFixed(1);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      {/* ─── 統計カード ─── */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>📊 あなたの読書たび</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats?.bookCount ?? '–'}</Text>
            <Text style={styles.statLabel}>とうろく</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>
              {stats ? stats.totalPagesRead.toLocaleString('ja-JP') : '–'}
            </Text>
            <Text style={styles.statLabel}>ページ</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>
              {stats ? stats.totalKm.toFixed(1) : '–'}
            </Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
        </View>
        <View style={styles.metaRows}>
          {stats?.startDate && (
            <Text style={styles.metaRow}>📅 読書開始: {formatDate(stats.startDate)}</Text>
          )}
          <Text style={styles.metaRow}>🔥 連続読書: {stats?.streak ?? 0}日</Text>
          <Text style={styles.metaRow}>🏆 到達した駅: {stats?.arrivedCount ?? 0}駅</Text>
        </View>
      </View>

      {/* ─── コース情報カード ─── */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>🗺️ 現在のコース</Text>
        <View style={styles.courseRow}>
          <Image
            source={activeCourse.iconImage}
            style={styles.courseIcon}
            resizeMode="contain"
          />
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{activeCourse.name}</Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPct}%` as any, backgroundColor: activeCourse.color },
                ]}
              />
            </View>
            <Text style={styles.courseKm}>
              {progressPct}%　{courseKmStr} / {activeCourse.totalDistanceKm}km
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.changeBtn, { borderColor: activeCourse.color }]}
          onPress={() => router.push('/course-select')}
          activeOpacity={0.8}
        >
          <Text style={[styles.changeBtnText, { color: activeCourse.color }]}>
            コースを変更する →
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── 設定セクション ─── */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsHeading}>⚙️ せってい</Text>

        <SettingsRow
          icon="🔔"
          label="通知設定"
          onPress={() => router.push('/notification-settings')}
        />
        <SettingsRow
          icon="📖"
          label="プライバシーポリシー"
          onPress={() => router.push('/privacy-policy')}
        />
        <SettingsRow
          icon="📄"
          label="利用規約"
          onPress={() => router.push('/terms')}
        />
        <SettingsRow
          icon="📋"
          label="オープンソースライセンス"
          onPress={() => router.push('/licenses')}
        />
        <SettingsRow
          icon="🗑️"
          label="データをすべて削除"
          onPress={handleDeleteAllData}
          danger
        />

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>ℹ️ バージョン　{VERSION}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>
        {label}
      </Text>
      <Text style={styles.settingsChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // ─── カード共通 ───
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
  },

  // ─── 統計 ───
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
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
  metaRows: {
    gap: 4,
  },
  metaRow: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },

  // ─── コース ───
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseIcon: {
    width: 52,
    height: 52,
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  courseKm: {
    fontSize: 12,
    color: '#888',
  },
  changeBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  changeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // ─── 設定 ───
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingsIcon: {
    fontSize: 18,
    width: 28,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  settingsLabelDanger: {
    color: '#E74C3C',
  },
  settingsChevron: {
    fontSize: 20,
    color: '#CCC',
  },
  versionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  versionText: {
    fontSize: 13,
    color: '#AAA',
  },
});
