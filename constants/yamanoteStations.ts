export type Station = {
  id: string;
  name: string;
  nameEn: string;
  latitude: number;
  longitude: number;
};

export const YAMANOTE_STATIONS: Station[] = [
  { id: 'tokyo', name: '東京', nameEn: 'Tokyo', latitude: 35.6812, longitude: 139.7671 },
  { id: 'kanda', name: '神田', nameEn: 'Kanda', latitude: 35.6916, longitude: 139.7706 },
  { id: 'akihabara', name: '秋葉原', nameEn: 'Akihabara', latitude: 35.6984, longitude: 139.7731 },
  { id: 'okachimachi', name: '御徒町', nameEn: 'Okachimachi', latitude: 35.7075, longitude: 139.7745 },
  { id: 'ueno', name: '上野', nameEn: 'Ueno', latitude: 35.7141, longitude: 139.7774 },
  { id: 'uguisudani', name: '鶯谷', nameEn: 'Uguisudani', latitude: 35.7210, longitude: 139.7787 },
  { id: 'nippori', name: '日暮里', nameEn: 'Nippori', latitude: 35.7278, longitude: 139.7706 },
  { id: 'nishininpori', name: '西日暮里', nameEn: 'Nishi-Nippori', latitude: 35.7325, longitude: 139.7668 },
  { id: 'tabata', name: '田端', nameEn: 'Tabata', latitude: 35.7379, longitude: 139.7608 },
  { id: 'komagome', name: '駒込', nameEn: 'Komagome', latitude: 35.7368, longitude: 139.7467 },
  { id: 'sugamo', name: '巣鴨', nameEn: 'Sugamo', latitude: 35.7333, longitude: 139.7393 },
  { id: 'otsuka', name: '大塚', nameEn: 'Otsuka', latitude: 35.7313, longitude: 139.7281 },
  { id: 'ikebukuro', name: '池袋', nameEn: 'Ikebukuro', latitude: 35.7295, longitude: 139.7109 },
  { id: 'mejiro', name: '目白', nameEn: 'Mejiro', latitude: 35.7220, longitude: 139.7061 },
  { id: 'takadanobaba', name: '高田馬場', nameEn: 'Takadanobaba', latitude: 35.7126, longitude: 139.7037 },
  { id: 'shinjuku', name: '新宿', nameEn: 'Shinjuku', latitude: 35.6896, longitude: 139.7006 },
  { id: 'yoyogi', name: '代々木', nameEn: 'Yoyogi', latitude: 35.6832, longitude: 139.7023 },
  { id: 'harajuku', name: '原宿', nameEn: 'Harajuku', latitude: 35.6702, longitude: 139.7026 },
  { id: 'shibuya', name: '渋谷', nameEn: 'Shibuya', latitude: 35.6580, longitude: 139.7016 },
  { id: 'ebisu', name: '恵比寿', nameEn: 'Ebisu', latitude: 35.6467, longitude: 139.7101 },
  { id: 'meguro', name: '目黒', nameEn: 'Meguro', latitude: 35.6334, longitude: 139.7158 },
  { id: 'gotanda', name: '五反田', nameEn: 'Gotanda', latitude: 35.6259, longitude: 139.7232 },
  { id: 'osaki', name: '大崎', nameEn: 'Osaki', latitude: 35.6197, longitude: 139.7282 },
  { id: 'shinagawa', name: '品川', nameEn: 'Shinagawa', latitude: 35.6284, longitude: 139.7387 },
  { id: 'tamachi', name: '田町', nameEn: 'Tamachi', latitude: 35.6457, longitude: 139.7476 },
  { id: 'hamamatsucho', name: '浜松町', nameEn: 'Hamamatsucho', latitude: 35.6551, longitude: 139.7566 },
  { id: 'shimbashi', name: '新橋', nameEn: 'Shimbashi', latitude: 35.6657, longitude: 139.7585 },
  { id: 'yurakucho', name: '有楽町', nameEn: 'Yurakucho', latitude: 35.6749, longitude: 139.7628 },
];
