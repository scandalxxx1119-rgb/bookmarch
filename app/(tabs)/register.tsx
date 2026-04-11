import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrivalModal } from '../../components/ArrivalModal';
import { CompletionModal } from '../../components/CompletionModal';
import { PAGE_TO_KM } from '../../constants/config';
import { ALL_COURSES, YAMANOTE_COURSE } from '../../constants/courses/index';
import { checkNewArrivals } from '../../hooks/useStationArrival';
import {
  addBook,
  addReadingLog,
  deleteBook,
  getBooksByCourse,
  updateBook,
} from '../../services/bookStorage';
import { BookSearchResult } from '../../services/bookSearchService';
import { getActiveCourseId } from '../../services/courseStorage';
import { checkAndRequestReview } from '../../services/reviewService';
import { shareArrival } from '../../services/shareService';
import { Book } from '../../types/book';
import { Course, Station } from '../../types/course';

const THEME = '#4A90D9';
const COVER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function randomColor(): string {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

export default function RegisterScreen() {
  const router = useRouter();
  const [books, setBooks]               = useState<Book[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeCourse, setActiveCourse] = useState<Course>(YAMANOTE_COURSE);
  const [formExpanded, setFormExpanded] = useState(false);
  const listRef = useRef<FlatList<Book>>(null);

  // 新規登録フォーム
  const [title, setTitle]   = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages]   = useState('');

  // 読書記録ダイアログ
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logBook, setLogBook]                 = useState<Book | null>(null);
  const [logPages, setLogPages]               = useState('');

  // 到着モーダル
  const [modalVisible, setModalVisible]               = useState(false);
  const [arrivalStation, setArrivalStation]           = useState<Station | null>(null);
  const [arrivalTotalPages, setArrivalTotalPages]     = useState(0);
  const [arrivalTotalKm, setArrivalTotalKm]           = useState(0);
  const [arrivalPassedCount, setArrivalPassedCount]   = useState(0);
  const [arrivalLaps, setArrivalLaps]                 = useState(0);
  const [arrivalIsLapComplete, setArrivalIsLapComplete] = useState(false);

  // 読了モーダル
  const [completionVisible, setCompletionVisible]     = useState(false);
  const [completionBook, setCompletionBook]           = useState<Book | null>(null);
  const [completionNextStation, setCompletionNextStation] = useState<Station | null>(null);
  const [completionRemainKm, setCompletionRemainKm]   = useState(0);

  const loadBooks = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      const stored = await getBooksByCourse(courseId);
      setBooks(stored);
    } catch {
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const id = await getActiveCourseId();
        const found = ALL_COURSES.find((c) => c.id === id) || YAMANOTE_COURSE;
        setActiveCourse(found);
        await loadBooks(id);

        // バーコードスキャン結果があればフォームに自動入力
        const json = await AsyncStorage.getItem('@BookMarch:scannedBook');
        if (json) {
          const result = JSON.parse(json) as BookSearchResult;
          setTitle(result.title);
          setAuthor(result.author);
          if (result.totalPages > 0) setPages(String(result.totalPages));
          setFormExpanded(true);
          await AsyncStorage.removeItem('@BookMarch:scannedBook');
        }
      })();
    }, [loadBooks])
  );

  const readingBooks = books.filter((b) => b.status === 'reading');

  // ─── 読書記録 ───────────────────────────────────────
  const openLogModal = (book: Book) => {
    setLogBook(book);
    setLogPages('');
    setLogModalVisible(true);
  };

  const handleLogReading = async () => {
    if (!logBook) return;
    const newPages = parseInt(logPages, 10);
    if (!logPages.trim() || isNaN(newPages) || newPages <= 0) {
      Alert.alert('入力エラー', 'ページ数を正しく入力してください');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLogModalVisible(false);

    try {
      const courseBooks = await getBooksByCourse(activeCourse.id);
      const pagesBefore = courseBooks.reduce((sum, b) => sum + b.pagesRead, 0);

      const updatedBook = await addReadingLog(logBook.id, newPages);
      if (!updatedBook) return;

      const actualAdded = updatedBook.pagesRead - logBook.pagesRead;
      const pagesAfter  = pagesBefore + actualAdded;
      const totalKm     = pagesAfter * PAGE_TO_KM;
      const lapsAfter   = activeCourse.isLoop
        ? Math.floor(totalKm / activeCourse.totalDistanceKm)
        : 0;

      await loadBooks(activeCourse.id);

      // 読了判定
      if (updatedBook.status === 'finished' && logBook.status === 'reading') {
        const kmInLap = activeCourse.isLoop
          ? totalKm % activeCourse.totalDistanceKm
          : Math.min(totalKm, activeCourse.totalDistanceKm);
        const next = activeCourse.stations.find((s) => s.distanceFromStart > kmInLap)
          ?? activeCourse.stations[activeCourse.stations.length - 1];
        const remain = Math.max(next.distanceFromStart - kmInLap, 0);
        setCompletionBook(updatedBook);
        setCompletionNextStation(next);
        setCompletionRemainKm(remain);
        setCompletionVisible(true);
        return;
      }

      const result = await checkNewArrivals(activeCourse.id, activeCourse, pagesBefore, pagesAfter);

      if (result.newStations.length > 0) {
        const displayStation = result.newStations[result.newStations.length - 1];
        setArrivalStation(displayStation);
        setArrivalTotalPages(pagesAfter);
        setArrivalTotalKm(totalKm);
        setArrivalPassedCount(result.uniquePassedCount);
        setArrivalLaps(lapsAfter);
        setArrivalIsLapComplete(result.isLapComplete);
        setModalVisible(true);
        checkAndRequestReview(result.uniquePassedCount).catch(() => {});
      } else {
        // 次の駅情報を計算して表示
        const kmInLap = activeCourse.isLoop
          ? totalKm % activeCourse.totalDistanceKm
          : Math.min(totalKm, activeCourse.totalDistanceKm);
        const next = activeCourse.stations.find((s) => s.distanceFromStart > kmInLap);
        const remain = next ? Math.max(next.distanceFromStart - kmInLap, 0) : 0;
        Alert.alert(
          'きろく完了！',
          `📖「${logBook.title}」\n` +
          `+${actualAdded}ページ（+${(actualAdded * PAGE_TO_KM).toFixed(1)}km）\n\n` +
          (next
            ? `📍 次の駅「${next.name}」まで\n　 あと ${remain.toFixed(1)} km！`
            : `${updatedBook.pagesRead}/${updatedBook.totalPages}ページ`)
        );
      }
    } catch {
      Alert.alert('エラー', 'データの保存に失敗しました');
    }
  };

  // ─── 新規登録 ────────────────────────────────────────
  const handleRegister = async () => {
    if (!title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください');
      return;
    }
    const pageNum = parseInt(pages, 10);
    if (!pages.trim() || isNaN(pageNum) || pageNum <= 0) {
      Alert.alert('入力エラー', 'ページ数を正しく入力してください');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const newBook: Book = {
      id:          randomId(),
      title:       title.trim(),
      author:      author.trim(),
      totalPages:  pageNum,
      pagesRead:   0,
      coverColor:  randomColor(),
      registeredAt: new Date().toISOString(),
      status:      'reading',
      readingLogs: [],
      courseId:    activeCourse.id,
    };

    try {
      await addBook(newBook);
      setTitle('');
      setAuthor('');
      setPages('');
      setFormExpanded(false);
      await loadBooks(activeCourse.id);
      Alert.alert('とうろく完了', `「${newBook.title}」を登録しました！\n読んだページを記録して旅を進めよう。`);
    } catch {
      Alert.alert('エラー', 'データの保存に失敗しました');
    }
  };

  const handleToggleStatus = async (book: Book) => {
    try {
      const next = book.status === 'reading' ? 'finished' : 'reading';
      await updateBook(book.id, { status: next });
      await loadBooks(activeCourse.id);
    } catch {
      Alert.alert('エラー', 'データの更新に失敗しました');
    }
  };

  const handleDelete = (book: Book) => {
    Alert.alert(
      '削除確認',
      `「${book.title}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(book.id);
              await loadBooks(activeCourse.id);
            } catch {
              Alert.alert('エラー', 'データの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleModalShare = async () => {
    if (!arrivalStation) return;
    await shareArrival(
      arrivalStation,
      arrivalTotalPages,
      arrivalTotalKm,
      arrivalPassedCount,
      arrivalLaps,
      arrivalIsLapComplete,
      activeCourse.id,
      activeCourse.stations.length
    );
  };

  const listHeader = (
    <View>
      {/* ─── 読書記録セクション ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 読んだページをきろくする</Text>

        {/* 動機付けバナー */}
        <View style={styles.motivationBanner}>
          <Image
            source={require('../../assets/character/walk-frame1.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <Text style={styles.motivationText}>1ページでも旅は進みます ✨</Text>
        </View>

        {loading ? null : readingBooks.length === 0 ? (
          <View style={styles.emptyReading}>
            <Text style={styles.emptyReadingText}>
              読書中の本がありません{'\n'}下の「＋ 新しい本をとうろくする」から追加しよう！
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.readingCardList}
          >
            {readingBooks.map((book) => {
              const rate = book.totalPages > 0 ? book.pagesRead / book.totalPages : 0;
              const remaining = book.totalPages - book.pagesRead;
              return (
                <TouchableOpacity
                  key={book.id}
                  style={styles.readingCard}
                  onPress={() => openLogModal(book)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.readingCardAccent, { backgroundColor: book.coverColor }]} />
                  <Text style={styles.readingCardTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.readingCardPages}>
                    {book.pagesRead} / {book.totalPages}p
                  </Text>
                  <View style={styles.readingProgressBg}>
                    <View
                      style={[
                        styles.readingProgressFill,
                        { width: `${Math.round(rate * 100)}%` as any, backgroundColor: book.coverColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.readingCardRemaining}>残り {remaining}p</Text>
                  <View style={[styles.readingCardBtn, { backgroundColor: THEME }]}>
                    <Text style={styles.readingCardBtnText}>きろくする</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ─── 新規登録セクション ─── */}
      <TouchableOpacity
        style={styles.addBookBtn}
        onPress={() => setFormExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.addBookBtnText}>
          {formExpanded ? '▲ とじる' : '＋ 新しい本をとうろくする'}
        </Text>
      </TouchableOpacity>

      {formExpanded && (
        <View style={styles.form}>
          <TouchableOpacity
            style={styles.barcodeBtn}
            onPress={() => router.push('/barcode-scanner')}
            activeOpacity={0.8}
          >
            <Text style={styles.barcodeBtnText}>📷 バーコードで自動入力</Text>
          </TouchableOpacity>
          <Text style={styles.label}>タイトル（必須）</Text>
          <TextInput
            style={styles.input}
            placeholder="本のタイトルを入力"
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.label}>著者名（任意）</Text>
          <TextInput
            style={styles.input}
            placeholder="著者名（なくてもOK）"
            placeholderTextColor="#bbb"
            value={author}
            onChangeText={setAuthor}
          />
          <Text style={styles.label}>ページ数（必須）</Text>
          <TextInput
            style={styles.input}
            placeholder="ページ数を入力"
            placeholderTextColor="#bbb"
            value={pages}
            onChangeText={setPages}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.8}>
            <Text style={styles.registerBtnText}>とうろくする</Text>
          </TouchableOpacity>
        </View>
      )}

      {books.length > 0 && (
        <Text style={styles.allBooksTitle}>登録した本 ({books.length}冊)</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={THEME} style={{ marginTop: 80 }} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleToggleStatus(item)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.spine, { backgroundColor: item.coverColor }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                {item.author ? (
                  <Text style={styles.cardAuthor} numberOfLines={1}>{item.author}</Text>
                ) : null}
                <Text style={styles.cardPages}>
                  {item.pagesRead}/{item.totalPages}ページ
                </Text>
              </View>
              <View style={[
                styles.badge,
                item.status === 'finished' ? styles.badgeFinished : styles.badgeReading,
              ]}>
                <Text style={styles.badgeText}>
                  {item.status === 'reading' ? '読書中📖' : '読了✅'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* 読書記録ダイアログ */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLogModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.logOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.logCard}>
            <Text style={styles.logCardTitle} numberOfLines={2}>
              📖 {logBook?.title}
            </Text>
            <Text style={styles.logCardSub}>
              {logBook?.pagesRead} / {logBook?.totalPages}ページ読了
              （残り {(logBook?.totalPages ?? 0) - (logBook?.pagesRead ?? 0)}ページ）
            </Text>
            <Text style={styles.label}>今日読んだページ数</Text>
            <TextInput
              style={styles.input}
              placeholder="ページ数を入力"
              placeholderTextColor="#bbb"
              value={logPages}
              onChangeText={setLogPages}
              keyboardType="numeric"
              returnKeyType="done"
              autoFocus
            />
            <View style={styles.logBtnRow}>
              <TouchableOpacity
                style={styles.logCancelBtn}
                onPress={() => setLogModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.logCancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logConfirmBtn}
                onPress={handleLogReading}
                activeOpacity={0.8}
              >
                <Text style={styles.logConfirmBtnText}>きろくする</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ArrivalModal
        visible={modalVisible}
        station={arrivalStation}
        totalPages={arrivalTotalPages}
        totalKm={arrivalTotalKm}
        passedCount={arrivalPassedCount}
        laps={arrivalLaps}
        isLapComplete={arrivalIsLapComplete}
        courseId={activeCourse.id}
        courseColor={activeCourse.color}
        totalStations={activeCourse.stations.length}
        onContinue={() => setModalVisible(false)}
        onShare={handleModalShare}
      />

      {completionBook && completionNextStation && (
        <CompletionModal
          visible={completionVisible}
          book={completionBook}
          nextStation={completionNextStation}
          remainKm={completionRemainKm}
          courseName={activeCourse.name}
          onRegisterNext={() => {
            setCompletionVisible(false);
            setFormExpanded(true);
          }}
          onClose={() => setCompletionVisible(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },

  // ─── 読書記録セクション ───
  section: {
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  motivationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 14,
    color: THEME,
    fontWeight: '600',
    marginLeft: 10,
  },
  emptyReading: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyReadingText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  readingCardList: {
    paddingRight: 20,
  },
  readingCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  readingCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  readingCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
    marginBottom: 6,
    lineHeight: 18,
    minHeight: 36,
  },
  readingCardPages: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  readingProgressBg: {
    height: 5,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  readingProgressFill: {
    height: 5,
    borderRadius: 3,
  },
  readingCardRemaining: {
    fontSize: 10,
    color: '#aaa',
    marginBottom: 10,
  },
  readingCardBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: THEME,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  readingCardBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // ─── 新規登録 ───
  addBookBtn: {
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME,
    borderStyle: 'dashed',
  },
  addBookBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME,
  },
  form: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  barcodeBtn: {
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME,
  },
  barcodeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME,
  },
  registerBtn: {
    backgroundColor: THEME,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  allBooksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 20,
  },

  // ─── 本カード ───
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  spine: {
    width: 12,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  cardAuthor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  cardPages: {
    fontSize: 12,
    color: '#aaa',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  badgeReading: {
    backgroundColor: '#EBF5FB',
  },
  badgeFinished: {
    backgroundColor: '#EAFAF1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ─── 読書記録ダイアログ ───
  logOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
    lineHeight: 22,
  },
  logCardSub: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
    lineHeight: 18,
  },
  logBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  logCancelBtn: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  logCancelBtnText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  logConfirmBtn: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: THEME,
  },
  logConfirmBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});
