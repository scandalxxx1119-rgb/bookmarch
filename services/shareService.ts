import { Share } from 'react-native';
import { Station } from '../types/course';

export async function shareArrival(
  station: Station,
  totalPages: number,
  totalKm: number,
  passedCount: number,
  laps: number,
  isLapComplete: boolean,
  courseId: string = 'yamanote',
  totalStations?: number
): Promise<void> {
  let text = '';

  if (courseId === 'shinkansen') {
    if (isLapComplete) {
      // 東京→博多 完全制覇
      text =
        `🏆 ブックマーチで東京→博多 完全制覇！\n` +
        `📚 ${totalPages.toLocaleString('ja-JP')}ページ読んで1,175km踏破！\n` +
        `本で日本を縦断しました！🚄🎉\n` +
        `#ブックマーチ #BookMarch #日本縦断 #読書の旅`;
    } else {
      const stationCount = totalStations ? `${passedCount}/${totalStations}駅` : `${passedCount}駅`;
      text =
        `📖 ブックマーチで読書の旅！\n` +
        `🚄 ${station.name}駅に到着しました！\n` +
        (station.description ? `─ ${station.description} ─\n` : '') +
        `📚 累計${totalPages.toLocaleString('ja-JP')}ページ（${totalKm.toFixed(1)}km）\n` +
        `🗺️ 新幹線 ${stationCount}\n` +
        `#ブックマーチ #BookMarch #読書の旅`;
    }
  } else {
    // 山手線
    if (isLapComplete) {
      text =
        `🎊 山手線 ${laps}周完走！\n` +
        `📚 累計 ${totalPages.toLocaleString('ja-JP')}ページ（${totalKm.toFixed(1)}km）\n` +
        `📍 通過駅 ${passedCount}駅\n` +
        `#ブックマーチ #BookMarch #読書記録 #山手線`;
    } else if (station.isLandmark) {
      text =
        `🗼 ランドマーク駅「${station.name}」に到着！\n` +
        `📚 累計 ${totalPages.toLocaleString('ja-JP')}ページ（${totalKm.toFixed(1)}km）\n` +
        `📍 通過駅 ${passedCount}駅\n` +
        `#ブックマーチ #BookMarch #読書記録 #山手線`;
    } else {
      text =
        `📖 「${station.name}駅」に到着！\n` +
        `📚 累計 ${totalPages.toLocaleString('ja-JP')}ページ（${totalKm.toFixed(1)}km）\n` +
        `📍 通過駅 ${passedCount}駅\n` +
        `#ブックマーチ #BookMarch #読書記録`;
    }
  }

  try {
    await Share.share({ message: text });
  } catch {
    // シェアキャンセルや非対応端末では無視
  }
}
