import { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PAGE_TO_KM } from '../constants/config';
import { YAMANOTE_COURSE } from '../constants/courses/yamanote';
import { type Station } from '../types/course';
const STATIONS = YAMANOTE_COURSE.stations;
const TOTAL_DISTANCE_KM = YAMANOTE_COURSE.totalDistanceKm;
import { Book } from '../types/book';

type Props = {
  visible: boolean;
  book: Book | null;
  allBooks: Book[];
  onClose: () => void;
  onDelete: (book: Book) => void;
  onToggleStatus: (book: Book) => void;
};

const THEME = '#4A90D9';

/** この本がカバーする駅区間を算出 */
function calcCoveredStations(book: Book, allBooks: Book[]): Station[] {
  const sorted = [...allBooks].sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  const idx = sorted.findIndex((b) => b.id === book.id);
  const prevPages = sorted.slice(0, idx < 0 ? 0 : idx).reduce((s, b) => s + b.pagesRead, 0);

  const kmBefore = (prevPages * PAGE_TO_KM) % TOTAL_DISTANCE_KM;
  const totalKmAfter = prevPages * PAGE_TO_KM + book.pagesRead * PAGE_TO_KM;
  const kmAfter = totalKmAfter % TOTAL_DISTANCE_KM;
  const lapsBefore = Math.floor(prevPages * PAGE_TO_KM / TOTAL_DISTANCE_KM);
  const lapsAfter = Math.floor(totalKmAfter / TOTAL_DISTANCE_KM);

  if (lapsAfter > lapsBefore) {
    return STATIONS.filter(
      (s) => s.distanceFromStart > kmBefore || s.distanceFromStart <= kmAfter
    );
  }
  return STATIONS.filter(
    (s) => s.distanceFromStart > kmBefore && s.distanceFromStart <= kmAfter
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function BookDetailModal({ visible, book, allBooks, onClose, onDelete, onToggleStatus }: Props) {
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9);
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale]);

  const coveredStations = useMemo(() => {
    if (!book) return [];
    return calcCoveredStations(book, allBooks);
  }, [book, allBooks]);

  if (!book) return null;

  const bookKm   = book.pagesRead * PAGE_TO_KM;
  const readRate = book.totalPages > 0 ? book.pagesRead / book.totalPages : 0;
  const readPct  = Math.round(readRate * 100);
  const stationLabel = (() => {
    if (coveredStations.length === 0) return 'なし';
    if (coveredStations.length <= 5) return coveredStations.map((s) => s.name).join(' → ');
    const head = coveredStations.slice(0, 2).map((s) => s.name).join(' → ');
    const tail = coveredStations[coveredStations.length - 1].name;
    return `${head} → … → ${tail}`;
  })();

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      `「${book.title}」を削除しますか？\n\nこの本を削除すると、${book.totalPages.toLocaleString('ja-JP')}ページ（${bookKm.toFixed(1)}km）分の距離が減ります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => onDelete(book),
        },
      ]
    );
  };

  // 背表紙用の文字列（最大6文字）
  const MAX_CHARS = 6;
  const spineChars =
    book.title.length <= MAX_CHARS
      ? book.title.split('')
      : [...book.title.slice(0, MAX_CHARS - 1).split(''), '…'];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* ヘッダー: 背表紙 + 基本情報 */}
            <View style={styles.header}>
              {/* ミニ背表紙 */}
              <View style={[styles.miniSpine, { backgroundColor: book.coverColor }]}>
                <View style={styles.miniSpineInner}>
                  {spineChars.map((ch, i) => (
                    <Text key={i} style={styles.miniSpineChar}>{ch}</Text>
                  ))}
                </View>
                <View style={styles.miniSpineLine} />
                {book.author ? (
                  <Text style={styles.miniSpineAuthor} numberOfLines={1}>{book.author}</Text>
                ) : null}
                {book.status === 'finished' && <View style={styles.finishedDot} />}
              </View>

              {/* 基本情報 */}
              <View style={styles.info}>
                <Text style={styles.infoTitle} numberOfLines={3}>{book.title}</Text>
                {book.author ? (
                  <Text style={styles.infoAuthor}>{book.author}</Text>
                ) : null}
                <Text style={styles.infoRow}>
                  📄 {book.pagesRead.toLocaleString('ja-JP')} / {book.totalPages.toLocaleString('ja-JP')}ページ（{readPct}%）
                </Text>
                <View style={styles.readProgressBg}>
                  <View style={[styles.readProgressFill, { width: `${readPct}%` as any }]} />
                </View>
                <Text style={styles.infoRow}>📅 {formatDate(book.registeredAt)} 登録</Text>
                <Text style={styles.infoRow}>🛤️ {bookKm.toFixed(1)}km ぶんの旅</Text>
                <Text style={styles.infoRow}>
                  📖 {book.status === 'reading' ? '読書中' : '読了'}
                </Text>
              </View>
            </View>

            {/* 旅の区間 */}
            <View style={styles.journeyBox}>
              <Text style={styles.journeyTitle}>🗺️ この本で旅した距離: {bookKm.toFixed(1)}km</Text>
              <Text style={styles.journeyStationLabel}>🚉 通過した駅:</Text>
              <Text style={styles.journeyStations}>
                {coveredStations.length > 0 ? stationLabel : 'まだ通過駅はありません'}
              </Text>
              {coveredStations.length > 0 && (
                <Text style={styles.journeyCount}>{coveredStations.length}駅を通過</Text>
              )}
            </View>

            {/* アクションボタン */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnToggle]}
                onPress={() => onToggleStatus(book)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnToggleText}>
                  {book.status === 'reading' ? '✅ 読了にする' : '📖 読書中に戻す'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnDelete]}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.btnDeleteText}>削除 🗑️</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>とじる</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  // ミニ背表紙
  miniSpine: {
    width: 56,
    height: 130,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginRight: 14,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  miniSpineInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniSpineChar: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  miniSpineLine: {
    width: '80%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginVertical: 4,
  },
  miniSpineAuthor: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 7,
    textAlign: 'center',
    width: '100%',
  },
  finishedDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  // 情報パネル
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    lineHeight: 22,
  },
  infoAuthor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  infoRow: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  readProgressBg: {
    height: 5,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
    marginTop: 2,
  },
  readProgressFill: {
    height: 5,
    backgroundColor: THEME,
    borderRadius: 3,
  },
  // 旅の区間
  journeyBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME,
    marginBottom: 8,
  },
  journeyStationLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  journeyStations: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  journeyCount: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
  },
  // ボタン
  btnRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnToggle: {
    backgroundColor: THEME,
    marginRight: 8,
  },
  btnToggleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnDelete: {
    borderWidth: 1.5,
    borderColor: '#E74C3C',
  },
  btnDeleteText: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: 'bold',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeBtnText: {
    fontSize: 14,
    color: '#aaa',
  },
});
