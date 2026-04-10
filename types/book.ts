export type ReadingLog = {
  id: string;
  pagesRead: number;  // この記録で読んだページ数
  loggedAt: string;   // ISO日時
};

export type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;       // 累計の読了ページ数
  coverColor: string;
  registeredAt: string;
  status: 'reading' | 'finished';
  readingLogs: ReadingLog[];  // 読書記録の履歴
  courseId?: string;          // 未設定の既存データは 'yamanote' 扱い
};
