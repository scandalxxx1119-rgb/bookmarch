import { Course } from '../../types/course';
import { JAPAN_COURSE } from './japan';
import { SHINKANSEN_COURSE } from './shinkansen';
import { YAMANOTE_COURSE } from './yamanote';

export const ALL_COURSES: Course[] = [
  YAMANOTE_COURSE,
  SHINKANSEN_COURSE,
  JAPAN_COURSE,
];

export { JAPAN_COURSE, SHINKANSEN_COURSE, YAMANOTE_COURSE };
