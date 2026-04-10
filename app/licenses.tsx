import { ScrollView, StyleSheet, Text, View } from 'react-native';

const THEME = '#4A90D9';

const LIBS = [
  { name: 'React Native',                            license: 'MIT License' },
  { name: 'Expo',                                    license: 'MIT License' },
  { name: 'expo-router',                             license: 'MIT License' },
  { name: 'react-native-maps',                       license: 'MIT License' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT License' },
  { name: 'expo-haptics',                            license: 'MIT License' },
  { name: 'expo-linear-gradient',                    license: 'MIT License' },
  { name: 'expo-splash-screen',                      license: 'MIT License' },
  { name: 'react-native-gesture-handler',            license: 'MIT License' },
  { name: 'react-native-safe-area-context',          license: 'MIT License' },
];

export default function LicensesScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>オープンソースライセンス</Text>
      <Text style={styles.intro}>
        本アプリは以下のオープンソースソフトウェアを使用しています。各ライブラリのライセンス全文は、それぞれのGitHubリポジトリをご参照ください。
      </Text>

      {LIBS.map((lib) => (
        <View key={lib.name} style={styles.row}>
          <Text style={styles.libName}>{lib.name}</Text>
          <Text style={styles.libLicense}>{lib.license}</Text>
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
    marginBottom: 8,
  },
  intro: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  libName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  libLicense: {
    fontSize: 12,
    color: '#888',
  },
});
