import { ScrollView, StyleSheet, Text, View } from 'react-native';

const THEME = '#4A90D9';

const SECTIONS = [
  {
    title: '1. サービスの概要',
    body:  'ブックマーチは、読書ページ数を距離に変換し、地図上の仮想的な旅として可視化する読書記録アプリです。',
  },
  {
    title: '2. 利用条件',
    body:  '本アプリは無料で利用できます。利用にあたりアカウント登録は不要です。',
  },
  {
    title: '3. 免責事項',
    body:  '・本アプリの利用により生じた損害について、開発者は責任を負いません。\n・端末の故障やアプリの削除によるデータの消失について、開発者は責任を負いません。\n・地図上のルートや距離は実際の交通ルートとは異なる場合があります。',
  },
  {
    title: '4. 知的財産権',
    body:  '本アプリに含まれるデザイン、イラスト、コードの著作権は開発者に帰属します。',
  },
  {
    title: '5. 規約の変更',
    body:  '本規約は予告なく変更される場合があります。',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>ブックマーチ 利用規約</Text>
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
