# Phase 10: マイページタブ + 設定画面

## 概要
4つ目のタブ「マイページ」を追加。ユーザー統計、設定、プライバシーポリシー、データ管理を集約する。
App Store審査で「設定がない」「プライバシーポリシーがない」「データ削除手段がない」でリジェクトされるのを防ぐ。

---

## 10-1. タブに「マイページ」を追加

### app/(tabs)/mypage.tsx を新規作成
### app/(tabs)/_layout.tsx を修正

4つ目のタブを追加:
```tsx
<Tabs.Screen
  name="mypage"
  options={{
    title: 'マイページ',
    tabBarLabel: 'マイページ',
    tabBarIcon: ({ focused }) => (
      <Image
        source={require('../../assets/icons/tab-mypage.png')}
        style={{ width: 26, height: 26, opacity: focused ? 1 : 0.4 }}
        resizeMode="contain"
      />
    ),
    headerTitle: 'マイページ',
  }}
/>
```

**タブアイコン**: `assets/icons/tab-mypage.png` が必要。
→ 今は無いので、仮でシンプルな歯車 or 人型アイコンを使用。
→ Expo のビルトインアイコン（`@expo/vector-icons` の `Ionicons` から `person-circle-outline`）で代用してOK。
→ 他の3タブと同様に Image で表示する形に統一したい場合は、一旦 Ionicons で実装し、後でアセットを差し替える。

---

## 10-2. マイページ画面の構成

上から順に:

### A. ユーザー統計カード
```
┌──────────────────────────┐
│  📊 あなたの読書たび      │
│                          │
│  [12冊]   [3,450P]  [345.0km] │
│  とうろく   ページ    きょり  │
│                          │
│  📅 読書開始: 2026/04/01  │
│  🔥 連続読書: 5日         │
│  🏆 到達した駅: 15駅      │
└──────────────────────────┘
```

- 冊数: getBooks().length
- 読了ページ: books.reduce(pagesRead)
- 距離: pagesRead合計 × PAGE_TO_KM
- 読書開始日: books の registeredAt で最も古い日
- 連続読書日数: readingLogs の loggedAt から計算（日をまたがない連続日数）
- 到達した駅数: getArrivedStationsForCourse(activeCourseId) の件数

### B. コース情報カード
```
┌──────────────────────────┐
│  🗺️ 現在のコース          │
│  [コースアイコン] 山手線一周  │
│  進捗: ████████░░ 80%     │
│  27.6 / 34.5 km          │
│                          │
│  [コースを変更する →]     │
└──────────────────────────┘
```
- 「コースを変更する」タップ → course-select.tsx に遷移（router.push('/course-select')）

### C. 設定セクション（リスト形式）

```
┌──────────────────────────┐
│  ⚙️ せってい              │
├──────────────────────────┤
│  🔔 通知設定         [>]  │   ← Phase 12 で実装。今は空のページに遷移
├──────────────────────────┤
│  📖 プライバシーポリシー [>] │
├──────────────────────────┤
│  📄 利用規約         [>]  │
├──────────────────────────┤
│  📋 オープンソースライセンス [>] │
├──────────────────────────┤
│  🗑️ データをすべて削除  [>] │   ← 赤テキスト
├──────────────────────────┤
│  ℹ️ バージョン     0.1.0  │
└──────────────────────────┘
```

---

## 10-3. プライバシーポリシー画面

### app/privacy-policy.tsx を新規作成

ScrollView にテキストで表示する（WebView不要）。

内容:

```
ブックマーチ プライバシーポリシー

最終更新日: 2026年4月10日

1. はじめに
ブックマーチ（以下「本アプリ」）は、お客様のプライバシーを尊重し、
個人情報の保護に努めます。

2. 収集する情報
本アプリは以下の情報をお客様の端末内にのみ保存します:
- 登録した書籍の情報（タイトル、著者名、ページ数）
- 読書記録（読んだページ数、記録日時）
- コース選択状況と進捗データ
- 通知設定

3. 情報の保存場所
すべてのデータはお客様の端末内（ローカルストレージ）にのみ保存されます。
外部サーバーへの送信は一切行いません。

4. 第三者への提供
本アプリはお客様のデータを第三者に提供・販売することはありません。

5. データの削除
アプリ内の「マイページ」→「データをすべて削除」から、
すべてのデータを削除できます。
また、アプリをアンインストールすることでも全データが削除されます。

6. お問い合わせ
本ポリシーに関するお問い合わせは以下までご連絡ください:
[メールアドレスをここに記載]

7. ポリシーの変更
本ポリシーは予告なく変更される場合があります。
変更後のポリシーはアプリ内に掲載した時点で効力を生じます。
```

画面デザイン:
- ヘッダー: 「プライバシーポリシー」（THEMEカラー）
- 背景: #F8F9FA
- テキスト: ScrollView 内にセクションごとに表示
- Stack.Screen で headerShown: true にする

### app/_layout.tsx に追加:
```tsx
<Stack.Screen
  name="privacy-policy"
  options={{
    headerShown: true,
    headerTitle: 'プライバシーポリシー',
    headerStyle: { backgroundColor: '#4A90D9' },
    headerTintColor: '#fff',
    animation: 'slide_from_right',
  }}
/>
```

---

## 10-4. 利用規約画面

### app/terms.tsx を新規作成

プライバシーポリシーと同様のScrollView形式。

内容:

```
ブックマーチ 利用規約

最終更新日: 2026年4月10日

1. サービスの概要
ブックマーチは、読書ページ数を距離に変換し、
地図上の仮想的な旅として可視化する読書記録アプリです。

2. 利用条件
本アプリは無料で利用できます。
利用にあたりアカウント登録は不要です。

3. 免責事項
- 本アプリの利用により生じた損害について、開発者は責任を負いません。
- 端末の故障やアプリの削除によるデータの消失について、
  開発者は責任を負いません。
- 地図上のルートや距離は実際の交通ルートとは異なる場合があります。

4. 知的財産権
本アプリに含まれるデザイン、イラスト、コードの著作権は
開発者に帰属します。

5. 規約の変更
本規約は予告なく変更される場合があります。
```

---

## 10-5. オープンソースライセンス画面

### app/licenses.tsx を新規作成

使用している主要ライブラリのライセンスを表示:

```
オープンソースライセンス

本アプリは以下のオープンソースソフトウェアを使用しています。

- React Native (MIT License)
- Expo (MIT License)
- react-native-maps (MIT License)
- @react-native-async-storage/async-storage (MIT License)
- expo-haptics (MIT License)
- expo-router (MIT License)
- react-native-gesture-handler (MIT License)
- react-native-reanimated (MIT License)

各ライブラリのライセンス全文は、それぞれのGitHubリポジトリをご参照ください。
```

---

## 10-6. データ削除機能

マイページの「データをすべて削除」タップ時:

```typescript
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
            // AsyncStorage の BookMarch 関連キーをすべて削除
            const keys = await AsyncStorage.getAllKeys();
            const bmKeys = keys.filter((k) => k.startsWith('@BookMarch:'));
            await AsyncStorage.multiRemove(bmKeys);

            // ウェルカム画面に戻す
            router.replace('/welcome');
          } catch {
            Alert.alert('エラー', 'データの削除に失敗しました');
          }
        },
      },
    ]
  );
};
```

---

## 10-7. app/_layout.tsx の更新

新しい画面のルートを追加:

```tsx
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
```

---

## 注意事項
- タブアイコンは一旦 `@expo/vector-icons` の Ionicons で代用してOK（後でアセット差し替え）
- テーマカラー: #4A90D9
- 背景色: #F8F9FA
- プライバシーポリシーのメールアドレス欄は `[メールアドレスをここに記載]` のまま残す（後で差し替え）
- app.json の version は "0.1.0" のまま
- 「通知設定」は Phase 12 で実装するので、今は「準備中です」的な表示でOK
