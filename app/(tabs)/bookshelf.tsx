import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BookDetailModal } from '../../components/BookDetailModal';
import { PAGE_TO_KM } from '../../constants/config';
import { deleteBook, getBooks, updateBook } from '../../services/bookStorage';
import { Book } from '../../types/book';

const THEME     = '#4A90D9';
const SHELF_BG  = '#FDF6EC';
const SHELF_BOARD = '#8B7355';

const SPINE_WIDTH  = 70;
const SPINE_HEIGHT = 160;
const SPINE_RADIUS = 4;
const COLS = 3;
const ROW_HEIGHT = SPINE_HEIGHT + 4 + 20; // 184

type SortMode = 'newest' | 'pages' | 'reading' | 'finished';

const SORT_CHIPS: { key: SortMode; label: string }[] = [
  { key: 'newest',   label: '新しい順'   },
  { key: 'pages',    label: 'ページ数順' },
  { key: 'reading',  label: '読書中'     },
  { key: 'finished', label: '読了'       },
];

function groupRows<T>(arr: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += cols) {
    rows.push(arr.slice(i, i + cols));
  }
  return rows;
}

function SpineCard({
  book,
  onPress,
  onLongPress,
}: {
  book: Book;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const MAX_CHARS = 6;
  const chars =
    book.title.length <= MAX_CHARS
      ? book.title.split('')
      : [...book.title.slice(0, MAX_CHARS - 1).split(''), '…'];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onLongPress();
  };

  return (
    <TouchableOpacity
      style={[styles.spine, { backgroundColor: book.coverColor }]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.75}
    >
      {book.status === 'finished' && <View style={styles.finishedDot} />}
      <View style={styles.spineChars}>
        {chars.map((ch, i) => (
          <Text key={i} style={styles.spineChar}>{ch}</Text>
        ))}
      </View>
      <View style={styles.spineLine} />
      {book.author ? (
        <Text style={styles.spineAuthor} numberOfLines={1}>{book.author}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function ShelfRow({
  row,
  onPressBook,
  onLongPressBook,
}: {
  row: Book[];
  onPressBook: (book: Book) => void;
  onLongPressBook: (book: Book) => void;
}) {
  return (
    <View style={styles.shelfRow}>
      <View style={styles.shelfBooks}>
        {row.map((book) => (
          <SpineCard
            key={book.id}
            book={book}
            onPress={() => onPressBook(book)}
            onLongPress={() => onLongPressBook(book)}
          />
        ))}
        {Array.from({ length: COLS - row.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.spineEmpty} />
        ))}
      </View>
      <View style={styles.shelfBoard} />
    </View>
  );
}

export default function BookshelfScreen() {
  const [books, setBooks]         = useState<Book[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sortMode, setSortMode]   = useState<SortMode>('newest');
  const [modalBook, setModalBook] = useState<Book | null>(null);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await getBooks();
      setBooks(stored);
    } catch {
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks])
  );

  const displayBooks = useMemo(() => {
    let list = [...books];
    if (sortMode === 'reading')  list = list.filter((b) => b.status === 'reading');
    if (sortMode === 'finished') list = list.filter((b) => b.status === 'finished');
    if (sortMode === 'newest')   list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    if (sortMode === 'pages')    list.sort((a, b) => b.totalPages - a.totalPages);
    return list;
  }, [books, sortMode]);

  const rows = useMemo(() => groupRows(displayBooks, COLS), [displayBooks]);

  const totalPages = books.reduce((s, b) => s + b.pagesRead, 0);
  const totalKm    = totalPages * PAGE_TO_KM;

  const handleToggleStatus = async (book: Book) => {
    try {
      const next = book.status === 'reading' ? 'finished' : 'reading';
      await updateBook(book.id, { status: next });
      await loadBooks();
      setModalBook((prev) => prev?.id === book.id ? { ...prev, status: next } : prev);
    } catch {
      Alert.alert('エラー', 'データの更新に失敗しました');
    }
  };

  const handleDelete = async (book: Book) => {
    try {
      await deleteBook(book.id);
      setModalBook(null);
      await loadBooks();
    } catch {
      Alert.alert('エラー', 'データの削除に失敗しました');
    }
  };

  // 長押し → 直接削除確認
  const handleLongPressBook = (book: Book) => {
    Alert.alert(
      '削除確認',
      `「${book.title}」を削除しますか？\n\n${book.totalPages.toLocaleString('ja-JP')}ページ（${(book.totalPages * PAGE_TO_KM).toFixed(1)}km）分の距離が減ります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => handleDelete(book) },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* 統計サマリーカード */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📚 マイライブラリ</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{books.length}</Text>
            <Text style={styles.statLabel}>とうろく</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{totalPages.toLocaleString('ja-JP')}</Text>
            <Text style={styles.statLabel}>ページ</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
        </View>
      </View>

      {/* ソートチップ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {SORT_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, sortMode === chip.key && styles.chipActive]}
            onPress={() => setSortMode(chip.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, sortMode === chip.key && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 本棚 */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={THEME} />
        </View>
      ) : displayBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📚🏜️</Text>
          <Text style={styles.emptyTitle}>まだ本がありません</Text>
          <Text style={styles.emptyDesc}>
            {books.length === 0
              ? '"とうろく" タブから本を追加して\nあなたの本棚を作りましょう！'
              : 'このフィルターに該当する本はありません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <ShelfRow
              row={item}
              onPressBook={setModalBook}
              onLongPressBook={handleLongPressBook}
            />
          )}
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * index,
            index,
          })}
          contentContainerStyle={styles.shelfList}
          style={styles.shelfFlatList}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
        />
      )}

      <BookDetailModal
        visible={modalBook !== null}
        book={modalBook}
        allBooks={books}
        onClose={() => setModalBook(null)}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statChip: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  chipScroll: {
    maxHeight: 48,
    marginTop: 12,
  },
  chipContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: THEME,
    borderColor: THEME,
  },
  chipText: {
    fontSize: 13,
    color: '#777',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  shelfFlatList: {
    flex: 1,
    marginTop: 8,
  },
  shelfList: {
    paddingBottom: 24,
  },
  shelfRow: {
    backgroundColor: SHELF_BG,
    paddingHorizontal: 16,
    paddingTop: 10,
    height: ROW_HEIGHT,
  },
  shelfBooks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },

  spine: {
    width: SPINE_WIDTH,
    height: SPINE_HEIGHT,
    borderRadius: SPINE_RADIUS,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  spineEmpty: {
    width: SPINE_WIDTH,
    height: SPINE_HEIGHT,
    marginRight: 12,
  },
  spineChars: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spineChar: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  spineLine: {
    width: '75%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginVertical: 4,
  },
  spineAuthor: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textAlign: 'center',
    width: '100%',
  },
  finishedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },

  shelfBoard: {
    height: 4,
    backgroundColor: SHELF_BOARD,
    borderRadius: 2,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#aaa',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 22,
  },
});
