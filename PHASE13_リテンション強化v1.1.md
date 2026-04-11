# Phase 13: リテンション強化（v1.1）— S優先度の全実装 + 審査対策

## 概要
行動心理学に基づくユーザー離脱防止策4つ + expo-barcode-scanner削除（審査対策）を一括実装。
これらは**工数が小さいのに効果が最も大きい**施策群。

---


## 13-2. オンボーディング体験記録（Day 0 離脱対策）

### 心理学的根拠
初回起動時、ユーザーは「報酬の予告」を脳に刻む前に離脱する。
アプリの価値を**0秒で体感させる**ことで Day 0〜3 の離脱を防ぐ。
Duolingoが初回レッスンで採用している原理と同じ。

### app/welcome.tsx の改修

現在のウェルカム画面のフローを変更:

**現在**: ウェルカム → コース選択 → メイン画面
**変更後**: ウェルカム → コース選択 → **体験デモ** → メイン画面

### app/onboarding-demo.tsx を新規作成

#### 画面フロー（3ステップ、各ステップ自動遷移 or タップで進む）

**ステップ1: 「試しに読書を記録してみよう！」**
```
┌──────────────────────────┐
│                          │
│   📖 ブックマーチの旅を   │
│      体験してみよう！     │
│                          │
│  ┌────────────────────┐  │
│  │ いま読んでいる本、    │  │
│  │ または最近読んだ本の  │  │
│  │ ページ数を入力してね  │  │
│  │                      │  │
│  │  [  50  ] ページ     │  │  ← 初期値50。ユーザーが変更可能
│  └────────────────────┘  │
│                          │
│  [ きろくしてみる！ ]     │  ← THEMEカラーのボタン
│                          │
│  「あとからいつでも変更OK」│  ← 小さい灰色テキスト
└──────────────────────────┘
```

- ページ数入力フィールド（数字キーボード）、初期値は50
- 「きろくしてみる！」ボタンをタップ → ステップ2へ

**ステップ2: 地図アニメーション**
```
┌──────────────────────────┐
│                          │
│   🎉 50ページ記録！       │
│   5.0km 旅が進んだよ！   │
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │  [地図 + キャラが   │  │
│  │   移動するアニメ]   │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  📍 東京駅を出発！       │  ← コースの最初の駅名
│     次の駅: 有楽町       │
│     あと ○.○ km        │
│                          │
│  ※この記録は体験用です。  │
│   メイン画面で本を登録    │
│   すると本当の旅が       │
│   始まります！           │
│                          │
│  [ はじめる！ ]          │
└──────────────────────────┘
```

- **重要**: この体験デモのデータは実際には保存しない。あくまで演出のみ
- 地図上でキャラクターが最初の駅付近を移動するアニメーションを簡易表示
  - 本物のMapViewを使う必要はない。距離とキャラクター画像でイメージを伝えればOK
  - キャラ画像（walk-frame1.png）を表示 + 進捗バーのアニメーション
- 「はじめる！」タップ → hasSeenWelcome フラグを立てて メイン画面へ

### 実装ポイント
- データは保存しない（AsyncStorageに書き込まない）
- 純粋にUI演出のみ
- ページ数入力は必須ではない（初期値50のまま進めてもOK）
- アニメーションは react-native-reanimated の FadeIn / SlideInDown 程度で十分

### app/_layout.tsx にルート追加:
```tsx
<Stack.Screen
  name="onboarding-demo"
  options={{ gestureEnabled: false, animation: 'slide_from_right' }}
/>
```

### app/course-select.tsx の遷移先を変更:
コース選択完了後の遷移先を変更:
```typescript
// 変更前
router.replace('/(tabs)');
// 変更後
router.replace('/onboarding-demo');
```

---

## 13-3. スモールステップUI（Day 4〜14 離脱対策）

### 心理学的根拠
「まだ30ページしか読んでないから記録するほどでもない」と思わせない。
小さな行動を正当化する言葉があるだけで行動率が2倍になる研究結果がある。

### app/(tabs)/register.tsx の改修

#### A. 読書記録セクションに励ましメッセージを常時表示

読書記録エリア（Phase 9で実装した「読書中の本」カード一覧）の上部に:

```tsx
<View style={styles.motivationBanner}>
  <Image
    source={require('../../assets/character/walk-frame1.png')}
    style={{ width: 32, height: 32 }}
    resizeMode="contain"
  />
  <Text style={styles.motivationText}>
    1ページでも旅は進みます ✨
  </Text>
</View>
```

スタイル:
```typescript
motivationBanner: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F0F4FF',
  borderRadius: 12,
  padding: 12,
  marginHorizontal: 20,
  marginBottom: 12,
},
motivationText: {
  fontSize: 14,
  color: '#4A90D9',
  fontWeight: '600',
  marginLeft: 10,
},
```

#### B. 記録完了時のフィードバック強化

通常記録（駅到着しない場合）の Alert を、より詳しい進捗情報に変更:

```typescript
// 変更前
Alert.alert('きろく完了', `「${book.title}」+${newPages}ページ`);

// 変更後
const kmGained = newPages * PAGE_TO_KM;
const nextStation = progress.nextStation;
const remainKm = nextStation.distanceFromStart - (progress.totalKm % activeCourse.totalDistanceKm);
Alert.alert(
  'きろく完了！',
  `📖「${book.title}」\n` +
  `+${newPages}ページ（+${kmGained.toFixed(1)}km）\n\n` +
  `📍 次の駅「${nextStation.name}」まで\n` +
  `　 あと ${Math.max(remainKm, 0).toFixed(1)} km！`
);
```

#### C. 記録ボタンのデザイン強化

読書中の本のカードにある「きろくする」ボタンを、画面内で最も目立つデザインに:
- サイズを大きく（paddingVertical: 14）
- THEMEカラー（#4A90D9）の塗りつぶし
- 白文字、太字、角丸24
- 軽いシャドウを追加

---

## 13-4. 読了直後の次目標提示（1冊目の谷 対策）

### 心理学的根拠
目標勾配効果: ゴール直後に動機がゼロになる。
読了の瞬間に「次の目標」を自動提示し、空白を作らない。

### 対象箇所

#### A. addReadingLog 後の status 自動変更時

services/bookStorage.ts の addReadingLog で `pagesRead >= totalPages` になった時、
status が自動的に 'finished' になる。このタイミングを検知。

#### B. app/(tabs)/register.tsx の読書記録ハンドラに追加

```typescript
const handleLogReading = async (book: Book, newPages: number) => {
  // ... 既存の記録処理 ...

  const updatedBook = await addReadingLog(book.id, newPages);

  // 読了判定
  if (updatedBook && updatedBook.status === 'finished' && book.status === 'reading') {
    // この本で読了になった！
    showCompletionPrompt(updatedBook);
    return;  // 通常のAlert/ArrivalModalは出さない（読了プロンプトに統合）
  }

  // ... 既存の駅到着チェック etc ...
};
```

#### C. 読了プロンプト画面（モーダル）

components/CompletionModal.tsx を新規作成:

```
┌──────────────────────────┐
│                          │
│  🎉 読了おめでとう！      │
│                          │
│  「コンビニ人間」         │
│  156ページ = 15.6kmの旅   │
│                          │
│  ─────────────────────── │
│                          │
│  📍 次の駅「渋谷」まで    │
│     あと 3.2 km          │
│     (あと約32ページ！)    │  ← ページ数に逆変換して表示
│                          │
│  ─────────────────────── │
│                          │
│  📊 あなたと同じくらいの  │
│  旅人は平均3冊で          │
│  次の駅に到達しています    │  ← 社会的証明（固定文言でOK）
│                          │
│  ┌────────────────────┐  │
│  │ 次の本をとうろくする │  │  ← メインボタン（THEME色）
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ あとで               │  │  ← サブボタン（グレー文字）
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

Props:
```typescript
type CompletionModalProps = {
  visible: boolean;
  book: Book;                // 読了した本
  nextStation: Station;      // 次の駅
  remainKm: number;          // 次の駅までの残り距離
  courseName: string;        // 現在のコース名
  onRegisterNext: () => void;  // 「次の本をとうろくする」タップ
  onClose: () => void;         // 「あとで」タップ
};
```

- 「次の本をとうろくする」タップ → モーダルを閉じて登録フォームを展開
- 「あとで」タップ → モーダルを閉じるだけ
- 「あと約○ページ」: remainKm / PAGE_TO_KM で逆変換
- 社会的証明の文言は固定値でOK（将来的にはサーバーから取得も可能だが今は不要）
- アニメーション: spring でポップアップ（ArrivalModal と同様の演出）

---

## 13-5. レビュー促進（SKStoreReviewController）

### 心理学的根拠
達成感のピークでレビューを依頼すると高評価がつきやすい。
到達駅10駅超のタイミングが最適。

### パッケージ
expo に StoreReview が含まれている:
```bash
npx expo install expo-store-review
```

### services/reviewService.ts を新規作成

```typescript
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_REQUESTED_KEY = '@BookMarch:reviewRequested';
const REVIEW_THRESHOLD = 10; // 10駅到達でレビュー依頼

/**
 * 到達駅数をチェックし、条件を満たしていればレビューをリクエスト。
 * 1回だけ表示する（2回目以降は何もしない）。
 */
export async function checkAndRequestReview(passedStationCount: number): Promise<void> {
  if (passedStationCount < REVIEW_THRESHOLD) return;

  const alreadyRequested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
  if (alreadyRequested === 'true') return;

  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return;

  // 少し待ってから表示（到着モーダルの後に出すため）
  setTimeout(async () => {
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, 'true');
  }, 2000);
}
```

### 呼び出し箇所

app/(tabs)/register.tsx の駅到着処理の後:

```typescript
// ArrivalModal を表示した後
if (result.newStations.length > 0) {
  // ... ArrivalModal表示処理 ...

  // レビュー促進チェック（モーダルが閉じた後に発火するよう遅延）
  checkAndRequestReview(result.uniquePassedCount);
}
```

### 注意事項
- `StoreReview.requestReview()` はiOSが表示回数を制御する（年3回まで）
- 開発中（TestFlight/Expo Go）では表示されない場合がある
- App Store審査ではレビュー促進の実装自体は問題なし（Appleの推奨方法）
- **1回だけ表示**する設計にすること（ユーザーを煩わせない）

---

## 13-6. app/_layout.tsx の最終形

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen
    name="welcome"
    options={{ gestureEnabled: false, animation: 'fade' }}
  />
  <Stack.Screen
    name="course-select"
    options={{ animation: 'slide_from_bottom' }}
  />
  <Stack.Screen
    name="onboarding-demo"
    options={{ gestureEnabled: false, animation: 'slide_from_right' }}
  />
  <Stack.Screen
    name="privacy-policy"
    options={{
      headerShown: true,
      headerTitle: 'プライバシーポリシー',
      headerStyle: { backgroundColor: '#4A90D9' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      animation: 'slide_from_right',
    }}
  />
  <Stack.Screen
    name="terms"
    options={{
      headerShown: true,
      headerTitle: '利用規約',
      headerStyle: { backgroundColor: '#4A90D9' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      animation: 'slide_from_right',
    }}
  />
  <Stack.Screen
    name="licenses"
    options={{
      headerShown: true,
      headerTitle: 'オープンソースライセンス',
      headerStyle: { backgroundColor: '#4A90D9' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      animation: 'slide_from_right',
    }}
  />
  <Stack.Screen
    name="notification-settings"
    options={{
      headerShown: true,
      headerTitle: '通知設定',
      headerStyle: { backgroundColor: '#4A90D9' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      animation: 'slide_from_right',
    }}
  />
</Stack>
```

---

## 実装順序（推奨）

1. **13-1**: expo-barcode-scanner 削除（5分で完了）
2. **13-5**: レビュー促進（最も工数が小さい、半日）
3. **13-3**: スモールステップUI（UIの微調整、1日）
4. **13-4**: 読了直後の次目標提示（新コンポーネント1つ、2日）
5. **13-2**: オンボーディング体験デモ（新画面1つ、2〜3日）

---

## 注意事項
- テーマカラー: #4A90D9
- 背景色: #F8F9FA
- 全体のフォントやスタイルは既存と統一
- 新しい画面/コンポーネントを作る際は TypeScript で型を付けること
- console.log のデバッグ出力は残さないこと
