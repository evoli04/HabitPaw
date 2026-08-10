import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { formatReminderTime } from '../utils/timeUtils';

const CHANNEL_ID = 'habit-reminders';
const storageKey = (habitId) => `habitpaw_notification_${habitId}`;
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let handlerConfigured = false;

function getNotifications() {
  if (isExpoGo) return null;
  const Notifications = require('expo-notifications');
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  return Notifications;
}

async function ensurePermission() {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alışkanlık hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 180, 250],
      lightColor: '#6C5CE7',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function cancelHabitReminder(habitId) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  const key = storageKey(habitId);
  const stored = await AsyncStorage.getItem(key);
  if (stored) {
    let notificationIds;
    try {
      notificationIds = JSON.parse(stored);
    } catch {
      notificationIds = [stored];
    }
    await Promise.all(
      notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
    );
    await AsyncStorage.removeItem(key);
  }
}

export async function syncHabitReminder(habit) {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  if (!habit?.id) return false;
  await cancelHabitReminder(habit.id);
  const time = formatReminderTime(habit.reminderTime);
  if (!time || habit.isActive === false) return false;

  const permitted = await ensurePermission();
  if (!permitted) {
    throw new Error('Bildirim izni verilmedi. Telefon ayarlarından HabitPaw bildirimlerini açabilirsin.');
  }

  const [hour, minute] = time.split(':').map(Number);
  const content = {
    title: 'Paw seni bekliyor 🐾',
    body: `${habit.title} alışkanlığının zamanı geldi.`,
    data: { habitId: habit.id },
    sound: 'default',
  };
  const weekdays = habit.frequency === 'weekdays'
    ? [2, 3, 4, 5, 6]
    : habit.frequency === 'weekends'
      ? [1, 7]
      : null;
  const triggers = weekdays
    ? weekdays.map((weekday) => ({
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: CHANNEL_ID,
      }))
    : [{
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      }];
  const notificationIds = await Promise.all(
    triggers.map((trigger) => Notifications.scheduleNotificationAsync({ content, trigger })),
  );
  await AsyncStorage.setItem(storageKey(habit.id), JSON.stringify(notificationIds));
  return true;
}
