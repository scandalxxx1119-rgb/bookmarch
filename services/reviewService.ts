import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_REQUESTED_KEY = '@BookMarch:reviewRequested';
const REVIEW_THRESHOLD = 10;

/**
 * 到達駅数をチェックし、条件を満たしていればレビューをリクエスト。
 * 1回だけ表示する。
 */
export async function checkAndRequestReview(passedStationCount: number): Promise<void> {
  if (passedStationCount < REVIEW_THRESHOLD) return;

  const alreadyRequested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
  if (alreadyRequested === 'true') return;

  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return;

  setTimeout(async () => {
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, 'true');
  }, 2000);
}
