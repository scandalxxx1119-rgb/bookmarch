import { Course, Station } from '../types/course';
import { PAGE_TO_KM } from '../constants/config';
import {
  addArrivedStationForCourse,
  getArrivedStationsForCourse,
} from '../services/courseStorage';

export type NewArrivalResult = {
  newStations: Station[];
  isLandmark: boolean;
  isLapComplete: boolean;   // 周回完走 or 線形コースのゴール到達
  message: string;
  uniquePassedCount: number;
};

function kmInLapFor(pages: number, course: Course): number {
  const km = pages * PAGE_TO_KM;
  if (course.isLoop) return km % course.totalDistanceKm;
  return Math.min(km, course.totalDistanceKm);
}

function lapsFor(pages: number, course: Course): number {
  if (!course.isLoop) return 0;
  return Math.floor(pages * PAGE_TO_KM / course.totalDistanceKm);
}

/**
 * 登録前後のページ数を比較し、新たに通過した駅を記録して返す。
 * 複数駅・複数ラップ・ゴール到達に対応。
 */
export async function checkNewArrivals(
  courseId: string,
  course: Course,
  prevPages: number,
  newPages: number
): Promise<NewArrivalResult> {
  const { stations, isLoop, totalDistanceKm } = course;

  const prevKmInLap = kmInLapFor(prevPages, course);
  const nextKmInLap = kmInLapFor(newPages, course);
  const prevLaps    = lapsFor(prevPages, course);
  const nextLaps    = lapsFor(newPages, course);

  const lapCompleted = isLoop ? nextLaps > prevLaps : nextKmInLap >= totalDistanceKm && prevKmInLap < totalDistanceKm;
  const goalReached  = !isLoop && newPages * PAGE_TO_KM >= totalDistanceKm && prevPages * PAGE_TO_KM < totalDistanceKm;
  const isLapComplete = isLoop ? lapCompleted : goalReached;

  const crossed: Station[] = [];

  if (!isLapComplete) {
    for (const station of stations) {
      if (station.distanceFromStart > prevKmInLap && station.distanceFromStart <= nextKmInLap) {
        crossed.push(station);
      }
    }
  } else if (isLoop) {
    // 周回またぎ
    for (const station of stations) {
      if (station.distanceFromStart > prevKmInLap) crossed.push(station);
    }
    for (const station of stations) {
      if (station.distanceFromStart <= nextKmInLap) crossed.push(station);
    }
  } else {
    // 線形ゴール到達: prevKmInLap → ゴール
    for (const station of stations) {
      if (station.distanceFromStart > prevKmInLap) crossed.push(station);
    }
  }

  for (const s of crossed) {
    await addArrivedStationForCourse(courseId, s.id);
  }

  const allArrived = await getArrivedStationsForCourse(courseId);
  const uniquePassedCount = allArrived.length;

  const isLandmark = crossed.some((s) => s.isLandmark);

  let message = '';
  if (crossed.length === 1) {
    message = `${crossed[0].name}駅に到着！`;
    if (crossed[0].description) message += `\n─ ${crossed[0].description} ─`;
  } else if (crossed.length > 1) {
    const names = crossed.map((s) => s.name).join('・');
    message = `${names}を通過！`;
  }
  if (isLapComplete) {
    if (isLoop) {
      message += `\n🎊 山手線 ${nextLaps}周完走！`;
    } else {
      message += `\n🏆 ${course.name} 完全制覇！！`;
    }
  }

  return { newStations: crossed, isLandmark, isLapComplete, message, uniquePassedCount };
}
