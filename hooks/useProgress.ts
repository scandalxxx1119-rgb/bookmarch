import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_TO_KM } from '../constants/config';
import { YAMANOTE_COURSE } from '../constants/courses/yamanote';
import { Course, Station } from '../types/course';
import { getBooksByCourse } from '../services/bookStorage';

export type ProgressData = {
  totalPages: number;
  totalKm: number;
  currentStation: Station;
  nextStation: Station;
  progressToNext: number;  // 0〜1
  passedStations: Station[];
  laps: number;
  isGoalReached: boolean;  // 線形コースの完走フラグ
  course: Course;
};

export function useProgress(course: Course = YAMANOTE_COURSE): ProgressData {
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    const books = await getBooksByCourse(course.id);
    const pages = books.reduce((sum, b) => sum + b.pagesRead, 0);
    setTotalPages(pages);
  }, [course.id]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalKm = totalPages * PAGE_TO_KM;
  const { totalDistanceKm, isLoop, stations } = course;

  // 線形コースはゴール超過をキャップ
  const isGoalReached = !isLoop && totalKm >= totalDistanceKm;
  const effectiveKm   = isLoop ? totalKm : Math.min(totalKm, totalDistanceKm);

  const laps    = isLoop ? Math.floor(effectiveKm / totalDistanceKm) : 0;
  const kmInLap = isLoop ? effectiveKm % totalDistanceKm : effectiveKm;

  // 現在地の駅インデックス
  let currentIdx = 0;
  for (let i = 0; i < stations.length; i++) {
    if (stations[i].distanceFromStart <= kmInLap) currentIdx = i;
  }

  // ゴール済みの場合は最終駅で停止
  if (isGoalReached) currentIdx = stations.length - 1;

  const nextIdx = isGoalReached
    ? stations.length - 1
    : isLoop
    ? (currentIdx + 1) % stations.length
    : Math.min(currentIdx + 1, stations.length - 1);

  const currentStation = stations[currentIdx];
  const nextStation    = stations[nextIdx];

  // 次の駅までの進捗率
  let progressToNext = 0;
  if (!isGoalReached && currentIdx !== nextIdx) {
    const nextDist = nextIdx === 0 && isLoop ? totalDistanceKm : nextStation.distanceFromStart;
    const segLen   = nextDist - currentStation.distanceFromStart;
    progressToNext = segLen > 0
      ? Math.min((kmInLap - currentStation.distanceFromStart) / segLen, 1)
      : 0;
  } else if (isGoalReached) {
    progressToNext = 1;
  }

  const passedStations = stations.filter((s) => s.distanceFromStart <= kmInLap);

  return {
    totalPages,
    totalKm,
    currentStation,
    nextStation,
    progressToNext,
    passedStations,
    laps,
    isGoalReached,
    course,
  };
}
