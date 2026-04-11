# Phase 9: 読書ページ記録システム改修

## 概要
現在は「本を登録した瞬間に全ページ数が距離に加算される」仕様。
これを「本を登録 → 読んだページを都度記録 → 少しずつ距離が伸びる」に変更する。
アプリのコアループ（読む→記録→地図で確認→また読みたくなる）を成立させる最重要改修。

---

## 9-1. types/book.ts を拡張

```typescript
export type ReadingLog = {
  id: string;
  pagesRead: number;    // この記録で読んだページ数
  loggedAt: string;     // ISO日時
};

export type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;      // ← 新規: 累計の読了ページ数
  coverColor: string;
  registeredAt: string;
  status: 'reading' | 'finished';
  readingLogs: ReadingLog[];  // ← 新規: 読書記録の履歴
};
```

## 9-2. services/bookStorage.ts に読書記録関数を追加

既存の addBook, updateBook, deleteBook, getBooks はそのまま。
以下を追加:

```typescript
import { Book, ReadingLog } from '../types/book';

/**
 * 指定の本に読書記録を追加し、pagesRead を加算する。
 * totalPages を超えないようにキャップする。
 * 戻り値: 更新後の Book オブジェクト
 */
export async function addReadingLog(
  bookId: string,
  pagesRead: number
): Promise<Book | null> {
  const books = await getBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index === -1) return null;

  const book = books[index];
  const newTotal = Math.min(book.pagesRead + pagesRead, book.totalPages);

  const log: ReadingLog = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    pagesRead,
    loggedAt: new Date().toISOString(),
  };

  books[index] = {
    ...book,
    pagesRead: newTotal,
    readingLogs: [...book.readingLogs, log],
    // 全ページ読了したら自動的に status を 'finished' に
    status: newTotal >= book.totalPages ? 'finished' : book.status,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  return books[index];
}
```

## 9-3. hooks/useProgress.ts の計算ロジックを変更

**重要な変更**: `b.totalPages` → `b.pagesRead` に変更。
距離は「実際に読んだページ数」から算出するようにする。

```typescript
const load = useCallback(async () => {
  const books = await getBooks();
  // ★ totalPages ではなく pagesRead を合計
  const pages = books.reduce((sum, b) => sum + b.pagesRead, 0);
  setTotalPages(pages);
}, []);
```

## 9-4. app/(tabs)/register.tsx を大幅改修

### 画面の役割変更
「本の新規登録」と「読書記録の追加」を両方できる画面にする。

### UI構成（上から順に）

#### A. 読書記録セクション（メイン機能）
- 「読書中」の本をカード形式で一覧表示（横スクロール）
- 各カードには: タイトル、進捗バー（pagesRead / totalPages）、「きろくする」ボタン
- カードをタップ → ページ数入力ダイアログ表示
  - テキスト入力「今日読んだページ数」
  - 「残り○ページ」の表示
  - 「きろくする」ボタン
- 記録後に駅到着判定（checkNewArrivals）を実行 → ArrivalModal表示

#### B. 新しい本の登録セクション（サブ機能）
- 「＋ 新しい本をとうろくする」ボタン → タップで登録フォームを展開/折りたたみ
- フォーム内容は今と同じ（タイトル、著者、ページ数）
- 登録時の初期値: `pagesRead: 0, readingLogs: []`
- 登録直後は距離加算なし（0ページ読了の状態）

### 読書記録時の駅到着チェック
```typescript
const handleLogReading = async (book: Book, newPages: number) => {
  // 記録前の全体pagesRead合計
  const allBooks = await getBooks();
  const pagesBefore = allBooks.reduce((sum, b) => sum + b.pagesRead, 0);

  // 読書記録を追加
  const updatedBook = await addReadingLog(book.id, newPages);
  if (!updatedBook) return;

  const pagesAfter = pagesBefore + newPages;

  // 駅到着チェック
  const result = await checkNewArrivals(
    activeCourse.id,
    activeCourse,
    pagesBefore,
    pagesAfter
  );

  if (result.newStations.length > 0) {
    // ArrivalModal を表示
  } else {
    Alert.alert(
      'きろく完了',
      `「${book.title}」+${newPages}ページ（+${(newPages * PAGE_TO_KM).toFixed(1)}km）`
    );
  }
};
```

## 9-5. app/(tabs)/bookshelf.tsx の統計修正

ほんだな画面の統計サマリーも `totalPages` → `pagesRead` に修正:

```typescript
const totalPagesRead = books.reduce((s, b) => s + b.pagesRead, 0);
const totalKm = totalPagesRead * PAGE_TO_KM;
```

また、統計表示を以下に変更:
- 「とうろく」→ books.length（冊数はそのまま）
- 「ページ」→ totalPagesRead（読了ページ数）
- 「km」→ totalKm

## 9-6. components/BookDetailModal.tsx の修正

- 読書進捗バー（pagesRead / totalPages）を追加表示
- `infoRow` の表示:
  - 「📄 150 / 300 ページ（50%）」のような形式に
  - 「🛤️ 15.0km ぶんの旅」→ pagesRead ベースで計算
- calcCoveredStations も pagesRead ベースに修正

## 9-7. 既存データのマイグレーション

すでに登録されている本は `pagesRead` と `readingLogs` フィールドが無い。
`getBooks()` 内でマイグレーション処理を追加:

```typescript
export async function getBooks(): Promise<Book[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  const raw = JSON.parse(json) as any[];

  // マイグレーション: 旧データに pagesRead, readingLogs が無い場合
  const books = raw.map((b) => ({
    ...b,
    pagesRead: b.pagesRead ?? b.totalPages, // 旧データは全ページ読了済みとして扱う
    readingLogs: b.readingLogs ?? [],
  })) as Book[];

  return books;
}
```

---

## 注意事項
- 「とうろく」画面の構成が大きく変わる。「読書記録（メイン）」が上、「新規登録」が下の折りたたみ
- 読書中の本が0冊の時は「本を登録して読書を始めよう！」的な空状態を表示
- expo-barcode-scanner プラグインは app.json の plugins から削除すること（使っていないので）
- テーマカラー: #4A90D9
- 全体のフォントやスタイルは既存と統一
