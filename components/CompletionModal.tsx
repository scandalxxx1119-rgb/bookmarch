import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types/book';
import { Station } from '../types/course';
import { PAGE_TO_KM } from '../constants/config';

const IMG_COMPLETE = require('../assets/icons/arrival-complete.png');
const THEME = '#4A90D9';

type Props = {
  visible: boolean;
  book: Book;
  nextStation: Station;
  remainKm: number;
  courseName: string;
  onRegisterNext: () => void;
  onClose: () => void;
};

export function CompletionModal({
  visible,
  book,
  nextStation,
  remainKm,
  courseName,
  onRegisterNext,
  onClose,
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

  const remainPages = Math.ceil(remainKm / PAGE_TO_KM);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Image
              source={IMG_COMPLETE}
              style={{ width: 72, height: 72, marginBottom: 6 }}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>読了おめでとう！</Text>
          </View>

          <View style={styles.body}>
            {/* 読了した本 */}
            <Text style={styles.bookTitle} numberOfLines={2}>
              「{book.title}」
            </Text>
            <Text style={styles.bookStats}>
              {book.totalPages}ページ = {(book.totalPages * PAGE_TO_KM).toFixed(1)}kmの旅
            </Text>

            <View style={styles.divider} />

            {/* 次の駅情報 */}
            <View style={styles.nextRow}>
              <Text style={styles.nextLabel}>次の駅</Text>
              <Text style={styles.nextStation}>📍 {nextStation.name}</Text>
            </View>
            <View style={styles.nextRow}>
              <Text style={styles.nextLabel}>あと</Text>
              <Text style={styles.nextRemain}>
                {remainKm.toFixed(1)} km（約 {remainPages}ページ！）
              </Text>
            </View>

            <View style={styles.divider} />

            {/* 社会的証明 */}
            <Text style={styles.socialProof}>
              📊 あなたと同じくらいの旅人は{'\n'}
              平均3冊で次の駅に到達しています
            </Text>
          </View>

          {/* ボタン */}
          <View style={styles.btnArea}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onRegisterNext}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>次の本をとうろくする</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSecondaryText}>あとで</Text>
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
    backgroundColor: '#27AE60',
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  body: {
    padding: 20,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 22,
  },
  bookStats: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 12,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nextLabel: {
    fontSize: 12,
    color: '#888',
    width: 42,
  },
  nextStation: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME,
    flex: 1,
  },
  nextRemain: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  socialProof: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  btnArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: THEME,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSecondary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#aaa',
    fontSize: 14,
  },
});
