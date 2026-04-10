export type Station = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number; // km
  isLandmark: boolean;
  description?: string;
};

export type Course = {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalDistanceKm: number;
  iconImage: any;        // require() で読み込んだ画像アセット
  stations: Station[];
  color: string;
  isLoop: boolean;       // true=周回あり（山手線）, false=線形（新幹線・縦断）
  locked?: boolean;
};
