import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { searchBookByISBN } from '../services/bookSearchService';

const THEME = '#4A90D9';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned,   setScanned]   = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          バーコード読み取りにはカメラの許可が必要です
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.permissionBtnText}>カメラを許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || searching) return;
    setScanned(true);
    setSearching(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const result = await searchBookByISBN(data);

    if (result) {
      await AsyncStorage.setItem('@BookMarch:scannedBook', JSON.stringify(result));
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.replace('/(tabs)/register');
      }
    } else {
      Alert.alert(
        '書籍が見つかりません',
        'このバーコードに対応する書籍情報が見つかりませんでした。手動で登録してください。',
        [{
          text: 'OK',
          onPress: () => {
            setScanned(false);
            setSearching(false);
          },
        }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* スキャン枠オーバーレイ */}
      <View style={styles.overlay}>
        {/* 上部暗幕 */}
        <View style={styles.overlayDark} />
        {/* 中段: 左暗幕 + スキャン枠 + 右暗幕 */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayDarkSide} />
          <View style={styles.scanFrame}>
            {/* 四隅のコーナー */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlayDarkSide} />
        </View>
        {/* 下部暗幕 + ヒント */}
        <View style={[styles.overlayDark, styles.overlayBottom]}>
          <Text style={styles.hint}>
            本の裏側にあるバーコードにカメラをかざしてください
          </Text>
        </View>
      </View>

      {searching && (
        <View style={styles.searchingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.searchingText}>書籍情報を検索中...</Text>
        </View>
      )}
    </View>
  );
}

const FRAME_SIZE  = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  permissionText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: THEME,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ─── オーバーレイ ───
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayBottom: {
    justifyContent: 'flex-start',
    paddingTop: 20,
    alignItems: 'center',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlayDarkSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },

  // ─── コーナーマーカー ───
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },

  hint: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  searchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  searchingText: {
    color: '#fff',
    fontSize: 14,
  },
});
