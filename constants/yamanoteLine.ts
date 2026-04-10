// 後方互換 re-export。新規コードは constants/courses/index.ts を使うこと。
export type { Station } from '../types/course';
export { YAMANOTE_COURSE } from './courses/yamanote';
import { YAMANOTE_COURSE } from './courses/yamanote';
export const STATIONS = YAMANOTE_COURSE.stations;
export const TOTAL_DISTANCE_KM = YAMANOTE_COURSE.totalDistanceKm;
