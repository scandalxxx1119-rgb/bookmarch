# Phase 12: プッシュ通知（読書リマインダー）

## 概要
毎日の読書習慣を促すローカルプッシュ通知を実装。
サーバー不要、端末内で完結するローカル通知のみ。

---

## 12-1. パッケージインストール

```bash
npx expo install expo-notifications expo-device expo-constants
```

### app.json に追加
```json
{
  "plugins": [
    "expo-router",
    ["expo-camera", { ... }],
    [
      "expo-notifications",
      {
        "icon": "./assets/icons/notification-icon.png",
        "color": "#4A90D9"
      }
    ]
  ]
}
```

※ `notification-icon.png` は白色のシルエットアイコン（96×96、背景透過）。
  なければ一旦省略して後で追加。

---

## 12-2. 通知サービス

### services/notificationService.ts を新規作成

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_ENABLED_KEY = '@BookMarch:notificationEnabled';
const NOTIFICATION_HOUR_KEY = '@BookMarch:notificationHour';
const NOTIFICATION_MINUTE_KEY = '@BookMarch:notificationMinute';

// デフォルト通知時刻: 21:00（夜の読書タイム）
const DEFAULT_HOUR = 21;
const DEFAULT_MINUTE = 0;

// 通知メッセージのバリエーション（毎日違うメッセージ）
const MESSAGES = [
  { title: '📚 今日も読書タイム！', body: '1ページでも読めば、旅は進みます' },
  { title: '📖 本が待ってるよ！', body: '今日の読書記録をつけませんか？' },
  { title: '🚶 旅を続けよう！', body: 'あなたの読書が地図を進めます' },
  { title: '📚 読書の時間です', body: '少しだけでも、ページをめくってみませんか？' },
  { title: '✨ 今日はどこまで進む？', body: '読んだページを記録しよう' },
  { title: '📖 次の駅まであと少し！', body: '読書を続けて旅を進めませんか？' },
  { title: '🌙 夜の読書タイム', body: '静かな時間に本を開いてみませんか？' },
];

/**
 * 通知の権限をリクエスト
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    // シミュレータでは通知不可
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // iOS: 通知のプレゼンテーション設定
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  return true;
}

/**
 * 通知の有効/無効を取得
 */
export async function isNotificationEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
  return val === 'true';
}

/**
 * 通知の時刻設定を取得
 */
export async function getNotificationTime(): Promise<{ hour: number; minute: number }> {
  const h = await AsyncStorage.getItem(NOTIFICATION_HOUR_KEY);
  const m = await AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY);
  return {
    hour: h ? parseInt(h, 10) : DEFAULT_HOUR,
    minute: m ? parseInt(m, 10) : DEFAULT_MINUTE,
  };
}

/**
 * 通知を有効化して毎日のスケジュールを設定
 */
export async function enableDailyNotification(hour?: number, minute?: number): Promise<void> {
  const permitted = await requestNotificationPermission();
  if (!permitted) return;

  const h = hour ?? DEFAULT_HOUR;
  const m = minute ?? DEFAULT_MINUTE;

  // 既存のスケジュールをクリア
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ランダムなメッセージを選択
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  // 毎日繰り返しの通知をスケジュール
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: h,
      minute: m,
    },
  });

  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
  await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, String(h));
  await AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, String(m));
}

/**
 * 通知を無効化
 */
export async function disableNotification(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
}
```

---

## 12-3. 通知設定画面

### app/notification-settings.tsx を新規作成

```
┌──────────────────────────┐
│ [←]  通知設定             │
├──────────────────────────┤
│                          │
│  🔔 読書リマインダー      │
│                          │
│  毎日決まった時間に読書の  │
│  リマインダーを送ります。  │
│                          │
│  ┌────────────────────┐  │
│  │ 通知        [ON/OFF] │  │   ← Switch コンポーネント
│  ├────────────────────┤  │
│  │ 通知時刻    [21:00] │  │   ← タップで時刻選択
│  └────────────────────┘  │
│                          │
│  ※通知をONにするとiOSの   │
│    通知許可が求められます  │
│                          │
└──────────────────────────┘
```

実装ポイント:
- `Switch` コンポーネントで ON/OFF トグル
- ON にした瞬間に `enableDailyNotification()` を呼ぶ → 権限リクエストダイアログが出る
- OFF にしたら `disableNotification()` を呼ぶ
- 時刻選択: iOS なら `@react-native-community/datetimepicker` を使うか、
  シンプルにプリセット時刻を選ぶピッカー（6:00, 7:00, ... 23:00）
  → `npx expo install @react-native-community/datetimepicker` でインストール
- 時刻変更時は通知を再スケジュール

---

## 12-4. マイページから通知設定への遷移

Phase 10 で作ったマイページの「通知設定」行をタップ:
```typescript
onPress={() => router.push('/notification-settings')}
```

---

## 12-5. app/_layout.tsx にルート追加

```tsx
<Stack.Screen
  name="notification-settings"
  options={{
    headerShown: true,
    headerTitle: '通知設定',
    headerStyle: { backgroundColor: '#4A90D9' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
    animation: 'slide_from_right',
  }}
/>
```

---

## 12-6. ウェルカムフローで通知を提案（任意）

welcome.tsx → course-select.tsx のフローの最後に、
「読書リマインダーを設定しますか？」的な画面を挟むと通知ONの割合が上がる。
ただしPhase 12としては必須ではない。後からの追加でOK。

---

## 注意事項
- ローカル通知のみ使用（APNs トークン取得やサーバー連携は不要）
- Expo Go ではローカル通知は動作する（実機のみ。シミュレータでは動かない）
- App Store 審査で通知の目的を説明する必要がある。App Store Connect の「App Privacy」セクションで「通知はリマインダー目的のみ、ユーザーデータは収集しない」と記載
- 通知権限を拒否された場合のフォールバック: 設定画面で「通知が許可されていません。iOSの設定から許可してください」と表示
- @react-native-community/datetimepicker のインストールが必要:
  `npx expo install @react-native-community/datetimepicker`
