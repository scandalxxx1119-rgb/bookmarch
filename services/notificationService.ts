import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_ENABLED_KEY = '@BookMarch:notificationEnabled';
const NOTIFICATION_HOUR_KEY    = '@BookMarch:notificationHour';
const NOTIFICATION_MINUTE_KEY  = '@BookMarch:notificationMinute';

const DEFAULT_HOUR   = 21;
const DEFAULT_MINUTE = 0;

const MESSAGES = [
  { title: '📚 今日も読書タイム！',     body: '1ページでも読めば、旅は進みます' },
  { title: '📖 本が待ってるよ！',       body: '今日の読書記録をつけませんか？' },
  { title: '🚶 旅を続けよう！',         body: 'あなたの読書が地図を進めます' },
  { title: '📚 読書の時間です',         body: '少しだけでも、ページをめくってみませんか？' },
  { title: '✨ 今日はどこまで進む？',   body: '読んだページを記録しよう' },
  { title: '📖 次の駅まであと少し！',   body: '読書を続けて旅を進めませんか？' },
  { title: '🌙 夜の読書タイム',         body: '静かな時間に本を開いてみませんか？' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function isNotificationEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
  return val === 'true';
}

export async function getNotificationTime(): Promise<{ hour: number; minute: number }> {
  const h = await AsyncStorage.getItem(NOTIFICATION_HOUR_KEY);
  const m = await AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY);
  return {
    hour:   h ? parseInt(h, 10) : DEFAULT_HOUR,
    minute: m ? parseInt(m, 10) : DEFAULT_MINUTE,
  };
}

export async function enableDailyNotification(hour?: number, minute?: number): Promise<boolean> {
  const permitted = await requestNotificationPermission();
  if (!permitted) return false;

  const h = hour   ?? DEFAULT_HOUR;
  const m = minute ?? DEFAULT_MINUTE;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body:  msg.body,
      sound: 'default',
    },
    trigger: {
      type:   Notifications.SchedulableTriggerInputTypes.DAILY,
      hour:   h,
      minute: m,
    },
  });

  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
  await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY,    String(h));
  await AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY,  String(m));
  return true;
}

export async function disableNotification(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
}
