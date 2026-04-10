import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_COURSE_KEY = '@BookMarch:activeCourseId';
const progressKey = (courseId: string) => `@BookMarch:arrivedStations:${courseId}`;

/** アクティブなコースIDを取得（デフォルト: 'yamanote'） */
export async function getActiveCourseId(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(ACTIVE_COURSE_KEY);
    return id || 'yamanote';
  } catch {
    return 'yamanote';
  }
}

/** アクティブなコースIDを保存 */
export async function setActiveCourseId(courseId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_COURSE_KEY, courseId);
}

/** コース別の到着済み駅IDリストを取得 */
export async function getArrivedStationsForCourse(courseId: string): Promise<number[]> {
  try {
    const json = await AsyncStorage.getItem(progressKey(courseId));
    if (!json) return [];
    return JSON.parse(json) as number[];
  } catch {
    return [];
  }
}

/** コース別の到着済み駅IDを追加（重複無視） */
export async function addArrivedStationForCourse(courseId: string, stationId: number): Promise<void> {
  const current = await getArrivedStationsForCourse(courseId);
  if (!current.includes(stationId)) {
    current.push(stationId);
    await AsyncStorage.setItem(progressKey(courseId), JSON.stringify(current));
  }
}

/** コース別の到着済みデータをリセット */
export async function clearArrivedStationsForCourse(courseId: string): Promise<void> {
  await AsyncStorage.removeItem(progressKey(courseId));
}
