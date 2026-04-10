export type BookSearchResult = {
  title: string;
  author: string;
  totalPages: number;
  isbn: string;
  thumbnail?: string;
};

/**
 * ISBN で Google Books API を検索
 */
export async function searchBookByISBN(isbn: string): Promise<BookSearchResult | null> {
  try {
    const res  = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return null;

    const info = data.items[0].volumeInfo;
    return {
      title:      info.title || '',
      author:     (info.authors || []).join(', '),
      totalPages: info.pageCount || 0,
      isbn,
      thumbnail:  info.imageLinks?.thumbnail,
    };
  } catch {
    return null;
  }
}

/**
 * タイトル検索（手動入力の補助用）
 */
export async function searchBookByTitle(title: string): Promise<BookSearchResult[]> {
  try {
    const res  = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=5&langRestrict=ja`
    );
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
      title:      item.volumeInfo.title || '',
      author:     (item.volumeInfo.authors || []).join(', '),
      totalPages: item.volumeInfo.pageCount || 0,
      isbn:       (item.volumeInfo.industryIdentifiers || []).find(
        (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || '',
      thumbnail:  item.volumeInfo.imageLinks?.thumbnail,
    }));
  } catch {
    return [];
  }
}
