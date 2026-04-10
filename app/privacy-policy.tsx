import { ScrollView, StyleSheet, Text, View } from 'react-native';

const THEME = '#4A90D9';

type Section = { title: string; body: string };

const SECTIONS: Section[] = [
  {
    title: '1. はじめに',
    body:  'ブックマーチ（以下「本アプリ」）は、お客様のプライバシーを尊重し、個人情報の保護に努めます。本ポリシーは、本アプリにおける情報の取り扱いについて説明します。',
  },
  {
    title: '2. 収集する情報',
    body:  '本アプリは以下の情報をお客様の端末内にのみ保存します:\n・登録した書籍の情報（タイトル、著者名、ページ数）\n・読書記録（読んだページ数、記録日時）\n・コース選択状況と進捗データ\n・通知設定',
  },
  {
    title: '3. 情報の保存場所',
    body:  'すべてのデータはお客様の端末内（ローカルストレージ）にのみ保存されます。外部サーバーへの送信は一切行いません。',
  },
  {
    title: '4. カメラの使用',
    body:  '本アプリは書籍のISBNバーコードを読み取るためにカメラを使用します。撮影した画像は端末内で処理されるのみで、外部に送信・保存されることはありません。',
  },
  {
    title: '5. 書籍情報の検索',
    body:  'バーコードスキャン時、ISBNコードをGoogle Books API（Googleが提供する公開API）に送信して書籍情報を取得します。送信されるのはISBNコードのみです。Googleのプライバシーポリシーについては https://policies.google.com/privacy をご参照ください。',
  },
  {
    title: '6. プッシュ通知',
    body:  '本アプリはローカル通知（端末内で完結する通知）を使用します。外部サーバーへのトークン送信は行いません。通知はアプリ内の設定からいつでもOFF/ONできます。',
  },
  {
    title: '7. 第三者への提供',
    body:  '本アプリはお客様のデータを第三者に提供・販売することはありません。',
  },
  {
    title: '8. データの削除',
    body:  'アプリ内の「マイページ」→「データをすべて削除」から、すべてのデータを削除できます。また、アプリをアンインストールすることでも全データが削除されます。',
  },
  {
    title: '9. お問い合わせ',
    body:  '本ポリシーに関するお問い合わせは以下までご連絡ください:\ndtnhj4mx27@privaterelay.appleid.com',
  },
  {
    title: '10. ポリシーの変更',
    body:  '本ポリシーは予告なく変更される場合があります。変更後のポリシーはアプリ内および公式サポートページに掲載した時点で効力を生じます。',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>ブックマーチ プライバシーポリシー</Text>
      <Text style={styles.updated}>最終更新日: 2026年4月10日</Text>

      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME,
    marginBottom: 4,
  },
  updated: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    color: '#555',
    lineHeight: 22,
  },
});
