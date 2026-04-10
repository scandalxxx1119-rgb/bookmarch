// 後方互換ラッパー。yamanoteコースに委譲する。
// 新規コードは courseStorage.ts を直接使うこと。
import {
  addArrivedStationForCourse,
  clearArrivedStationsForCourse,
  getArrivedStationsForCourse,
} from './courseStorage';

export async function getArrivedStations(): Promise<number[]> {
  return getArrivedStationsForCourse('yamanote');
}

export async function addArrivedStation(stationId: number): Promise<void> {
  return addArrivedStationForCourse('yamanote', stationId);
}

export async function clearArrivedStations(): Promise<void> {
  return clearArrivedStationsForCourse('yamanote');
}
