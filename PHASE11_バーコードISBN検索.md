# Phase 11: バーコードスキャナー整理 + ISBN検索による本の情報自動入力

## 概要
app.json に expo-barcode-scanner プラグインが残っているが機能未実装。
このままだとApp Store審査で「未使用のカメラ権限要求」としてリジェクトされる。
ISBNバーコード読み取り → 書籍情報の自動入力機能を実装して正当化する。

---

## 11-1. expo-barcode-scanner → expo-camera に移行

expo-barcode-scanner は deprecated（SDK 51以降非推奨）。
代わりに `expo-camera` の barcode scanning 機能を使う。

### app.json の修正
```json
{
  "plugins": [
    "expo-router",
    [
      "expo-camera",
      {
        "cameraPermission": "本のバーコードを読み取って書籍情報を取得するためにカメラを使用します。"
      }
    ]
  ]
}
```

**expo-barcode-scanner を plugins から削除すること。**

### パッケージインストール
```bash
npx expo install expo-camera
npm uninstall expo-barcode-scanner
```

---

## 11-2. ISBN → 書籍情報の検索サービス

### services/bookSearchService.ts を新規作成

Google Books API（無料、APIキー不要）を使って ISBN から書籍情報を取得:

```typescript
export type BookSearchResult = {
  title: string;
  author: string;
  totalPages: number;
  isbn: string;
  thumbnail?: string;  // 将来的にカバー画像表示に使える
};

/**
 * ISBN で Google Books API を検索
 */
export async function searchBookByISBN(isbn: string): Promise<BookSearchResult | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    const data = await res.json();

    if (!data.items || data.items.length === 0) return null;

    const info = data.items[0].volumeInfo;
    return {
      title: info.title || '',
      author: (info.authors || []).join(', '),
      totalPages: info.pageCount || 0,
      isbn,
      thumbnail: info.imageLinks?.thumbnail,
    };
  } catch {
    return null;
  }
}

/**
 * タイトル検索（手動入力の補助用、将来拡張）
 */
export async function searchBookByTitle(title: string): Promise<BookSearchResult[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=5&langRestrict=ja`
    );
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
      title: item.volumeInfo.title || '',
      author: (item.volumeInfo.authors || []).join(', '),
      totalPages: item.volumeInfo.pageCount || 0,
      isbn: (item.volumeInfo.industryIdentifiers || []).find(
        (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || '',
      thumbnail: item.volumeInfo.imageLinks?.thumbnail,
    }));
  } catch {
    return [];
  }
}
```

---

## 11-3. バーコードスキャナー画面

### app/barcode-scanner.tsx を新規作成

```
┌──────────────────────────┐
│ [←]  バーコードで登録     │
├──────────────────────────┤
│                          │
│   ┌──────────────────┐   │
│   │                  │   │
│   │  カメラプレビュー  │   │
│   │                  │   │
│   │  [スキャン枠]    │   │
│   │                  │   │
│   └──────────────────┘   │
│                          │
│  本の裏側にあるバーコードに │
│  カメラをかざしてください  │
│                          │
└──────────────────────────┘
```

実装:
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  // カメラ権限がない場合は許可リクエスト画面を表示
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>バーコード読み取りにはカメラの許可が必要です</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || searching) return;
    setScanned(true);
    setSearching(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const result = await searchBookByISBN(data);

    if (result) {
      // 書籍情報が見つかった → 確認画面 or 登録画面にパラメータを渡す
      router.back();
      // 親画面にデータを渡す方法: グローバルステートまたはAsyncStorageの一時キー
      await AsyncStorage.setItem('@BookMarch:scannedBook', JSON.stringify(result));
    } else {
      Alert.alert(
        '書籍が見つかりません',
        'このバーコードに対応する書籍情報が見つかりませんでした。手動で登録してください。',
        [{ text: 'OK', onPress: () => { setScanned(false); setSearching(false); } }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {/* スキャン枠のオーバーレイ */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>
          本の裏側にあるバーコードにカメラをかざしてください
        </Text>
      </View>
      {searching && <ActivityIndicator style={styles.loading} size="large" color="#fff" />}
    </View>
  );
}
```

---

## 11-4. とうろく画面にバーコードボタンを追加

app/(tabs)/register.tsx の「新しい本をとうろくする」セクション内に:

```tsx
<TouchableOpacity
  style={styles.barcodeButton}
  onPress={() => router.push('/barcode-scanner')}
>
  <Text style={styles.barcodeButtonText}>📷 バーコードで自動入力</Text>
</TouchableOpacity>
```

バーコード画面から戻ってきた時の処理（useFocusEffect内）:
```typescript
useFocusEffect(
  useCallback(() => {
    // スキャン結果があればフォームに自動入力
    AsyncStorage.getItem('@BookMarch:scannedBook').then((json) => {
      if (json) {
        const result = JSON.parse(json) as BookSearchResult;
        setTitle(result.title);
        setAuthor(result.author);
        if (result.totalPages > 0) setPages(String(result.totalPages));
        AsyncStorage.removeItem('@BookMarch:scannedBook');
      }
    });
  }, [])
);
```

---

## 11-5. app/_layout.tsx にルート追加

```tsx
<Stack.Screen
  name="barcode-scanner"
  options={{
    headerShown: true,
    headerTitle: 'バーコードで登録',
    headerStyle: { backgroundColor: '#4A90D9' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
    animation: 'slide_from_bottom',
    presentation: 'modal',
  }}
/>
```

---

## 注意事項
- Google Books API はAPIキー不要で使える（レート制限あり: 1日1000リクエスト程度、個人利用には十分）
- ISBN-13（978で始まる13桁）とISBN-10（10桁）の両方に対応
- 日本の書籍は pageCount が取得できない場合が多い → その場合は手動入力を促す（ページ数フィールドを空のままにしてユーザーに入力させる）
- ネットワーク接続がない場合のエラーハンドリングも忘れずに
- カメラ権限の説明文は日本語で具体的に書くこと（審査対策）
