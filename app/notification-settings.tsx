import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  disableNotification,
  enableDailyNotification,
  getNotificationTime,
  isNotificationEnabled,
} from '../services/notificationService';

const THEME = '#4A90D9';

export default function NotificationSettingsScreen() {
  const [enabled,     setEnabled]     = useState(false);
  const [hour,        setHour]        = useState(21);
  const [minute,      setMinute]      = useState(0);
  const [showPicker,  setShowPicker]  = useState(false);
  const [saving,      setSaving]      = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [en, time] = await Promise.all([
          isNotificationEnabled(),
          getNotificationTime(),
        ]);
        setEnabled(en);
        setHour(time.hour);
        setMinute(time.minute);
      })();
    }, [])
  );

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      if (value) {
        const ok = await enableDailyNotification(hour, minute);
        if (!ok) {
          Alert.alert(
            '通知が許可されていません',
            'iOSの設定アプリ → ブックマーチ → 通知 からONにしてください'
          );
          setSaving(false);
          return;
        }
      } else {
        await disableNotification();
      }
      setEnabled(value);
    } catch {
      Alert.alert('エラー', '通知設定の変更に失敗しました');
    }
    setSaving(false);
  };

  const handleTimeChange = async (_: any, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // iOS は選択中もピッカーを表示
    if (!selected) return;
    const h = selected.getHours();
    const m = selected.getMinutes();
    setHour(h);
    setMinute(m);
    if (enabled) {
      await enableDailyNotification(h, m);
    }
  };

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const pickerDate = new Date();
  pickerDate.setHours(hour, minute, 0, 0);

  return (
    <View style={styles.root}>
      <View style={styles.descCard}>
        <Text style={styles.descTitle}>🔔 読書リマインダー</Text>
        <Text style={styles.descText}>
          毎日決まった時間に読書のリマインダーをお知らせします。{'\n'}
          読書習慣の継続をサポートします。
        </Text>
      </View>

      <View style={styles.settingsCard}>
        {/* ON/OFFトグル */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>通知</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#DDD', true: THEME }}
            thumbColor="#fff"
            disabled={saving}
          />
        </View>

        <View style={styles.divider} />

        {/* 通知時刻 */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => enabled && setShowPicker(true)}
          activeOpacity={enabled ? 0.7 : 1}
        >
          <Text style={[styles.rowLabel, !enabled && styles.rowLabelDisabled]}>
            通知時刻
          </Text>
          <Text style={[styles.timeText, !enabled && styles.rowLabelDisabled]}>
            {timeStr}
          </Text>
        </TouchableOpacity>
      </View>

      {!enabled && (
        <Text style={styles.hint}>
          ※ 通知をONにするとiOSの通知許可が求められます
        </Text>
      )}

      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          locale="ja"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  descCard: {
    backgroundColor: '#EBF3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: THEME,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  rowLabel: {
    fontSize: 15,
    color: '#333',
  },
  rowLabelDisabled: {
    color: '#CCC',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME,
  },
  hint: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
