import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, ReadingLog } from '../types/book';

const STORAGE_KEY = '@BookMarch:books';

export async function getBooks(): Promise<Book[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  const raw = JSON.parse(json) as any[];
  // マイグレーション: 旧データに pagesRead/readingLogs がない場合
  return raw.map((b) => ({
    ...b,
    pagesRead:    b.pagesRead    ?? b.totalPages,  // 旧データは全ページ読了済み扱い
    readingLogs:  b.readingLogs  ?? [],
  })) as Book[];
}

export async function getBooksByCourse(courseId: string): Promise<Book[]> {
  const books = await getBooks();
  return books.filter((b) => (b.courseId ?? 'yamanote') === courseId);
}

export async function addBook(book: Book): Promise<void> {
  const books = await getBooks();
  books.unshift(book);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<void> {
  const books = await getBooks();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return;
  books[index] = { ...books[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export async function deleteBook(id: string): Promise<void> {
  const books = await getBooks();
  const filtered = books.filter((b) => b.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 指定の本に読書記録を追加し、pagesRead を加算する。
 * totalPages を超えないようにキャップ。
 * 戻り値: 更新後の Book
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
    pagesRead:   newTotal,
    readingLogs: [...book.readingLogs, log],
    status:      newTotal >= book.totalPages ? 'finished' : book.status,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  return books[index];
}
