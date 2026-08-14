import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/common/AppBackground';
import ErrorState from '../../components/common/ErrorState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { getProgress } from '../../services/progressService';
import { useAppTheme } from '../../hooks/useAppTheme';
import { layout, spacing } from '../../theme/spacing';
import { createStyles } from './ProgressScreen.styles';

const RANGES = [
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
];
const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const CALENDAR_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function ProgressScreen() {
  const [range, setRange] = useState('week');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bottomPadding = layout.tabBarHeight + Math.max(insets.bottom, 14) + spacing.xxl;
  const query = useQuery({
    queryKey: ['progress', range],
    queryFn: () => getProgress(range),
  });

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={query.refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          )}
        >
          <View>
            <Text style={styles.title}>İlerleme</Text>
            <Text style={styles.subtitle}>İstikrarını gör, serini büyüt.</Text>
          </View>

          <View style={styles.rangePicker}>
            {RANGES.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => setRange(option.value)}
                style={[styles.rangeButton, range === option.value && styles.rangeButtonActive]}
              >
                <Text style={[styles.rangeText, range === option.value && styles.rangeTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {query.isLoading ? (
            <LoadingScreen message="İlerlemen hesaplanıyor…" />
          ) : query.isError ? (
            <ErrorState message={query.error.message} onRetry={query.refetch} />
          ) : (
            <ProgressContent data={query.data} styles={styles} range={range} />
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

function ProgressContent({ data, styles, range }) {
  const { summary, points, habits } = data;
  const periodLabel = range === 'month' ? 'AYLIK BAŞARI' : 'HAFTALIK BAŞARI';
  const completionLabel = range === 'month'
    ? 'bu ay tamamlandı'
    : 'bu hafta tamamlandı';
  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{periodLabel}</Text>
          <Text style={styles.heroPercent}>%{summary.percent}</Text>
          <Text style={styles.heroCaption}>
            {summary.completed} / {summary.scheduled} görev {completionLabel}
          </Text>
        </View>
        <View style={styles.ring}>
          <Text style={styles.ringText}>🔥</Text>
          <Text style={styles.ringValue}>{summary.currentStreak}</Text>
          <Text style={styles.ringLabel}>gün seri</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Kusursuz gün" value={summary.perfectDays} styles={styles} />
        <StatCard label="En uzun seri" value={`${summary.longestStreak} gün`} styles={styles} />
        <StatCard label="Aktif alışkanlık" value={summary.activeHabits} styles={styles} />
        <StatCard label="En iyi gün" value={formatDate(summary.bestDay)} styles={styles} />
      </View>

      {range === 'month' ? (
        <MonthlyCalendar points={points} styles={styles} />
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Günlük başarı</Text>
          <View style={styles.chart}>
            {points.map((point) => (
              <View key={point.date} style={styles.barColumn}>
                <Text style={styles.barValue}>{point.percent ? `%${point.percent}` : ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(point.percent, 4)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{WEEKDAYS[point.weekday]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {range === 'month' ? 'Aylık alışkanlık oranları' : 'Haftalık alışkanlık oranları'}
        </Text>
        {habits.length ? habits.map((habit) => (
          <View key={habit.habitId} style={styles.habitRow}>
            <View style={styles.habitHeader}>
              <Text numberOfLines={1} style={styles.habitTitle}>{habit.title}</Text>
              <Text style={styles.habitPercent}>%{habit.percent}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${habit.percent}%` }]} />
            </View>
            <Text style={styles.habitCaption}>
              {habit.completed} / {habit.scheduled} {range === 'month' ? 'bu ay' : 'bu hafta'} tamamlandı
            </Text>
          </View>
        )) : <Text style={styles.emptyText}>Henüz gösterecek alışkanlık yok.</Text>}
      </View>
    </>
  );
}

function MonthlyCalendar({ points, styles }) {
  const firstPoint = points[0];
  const leadingEmptyDays = firstPoint ? (firstPoint.weekday + 6) % 7 : 0;
  const cells = [...Array(leadingEmptyDays).fill(null), ...points];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTitle = firstPoint
    ? new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${firstPoint.date}T00:00:00Z`))
    : 'Bu ay';

  return (
    <View style={styles.sectionCard}>
      <View style={styles.calendarTitleRow}>
        <Text style={styles.sectionTitle}>{monthTitle}</Text>
        <View style={styles.calendarLegend}>
          <View style={[styles.legendDot, styles.calendarComplete]} />
          <Text style={styles.legendText}>Günlük durum</Text>
        </View>
      </View>
      <View style={styles.calendarGrid}>
        {CALENDAR_WEEKDAYS.map((day) => (
          <Text key={day} style={styles.calendarWeekday}>{day}</Text>
        ))}
        {cells.map((point, index) => point ? (
          <View
            key={point.date}
            accessibilityLabel={`${point.date}, ${point.completed}/${point.scheduled} tamamlandı`}
            style={[
              styles.calendarDay,
              point.scheduled === 0 && styles.calendarEmpty,
              point.percent > 0 && point.percent < 100 && styles.calendarPartial,
              point.percent === 100 && point.scheduled > 0 && styles.calendarComplete,
            ]}
          >
            <Text style={[
              styles.calendarDayNumber,
              point.percent === 100 && point.scheduled > 0 && styles.calendarCompleteText,
            ]}>
              {Number(point.date.slice(-2))}
            </Text>
            {point.scheduled > 0 ? (
              <Text style={[
                styles.calendarCount,
                point.percent === 100 && styles.calendarCompleteText,
              ]}>
                {point.completed}/{point.scheduled}
              </Text>
            ) : null}
          </View>
        ) : <View key={`empty-${index}`} style={styles.calendarSpacer} />)}
      </View>
      <View style={styles.calendarScale}>
        <Text style={styles.legendText}>Boş</Text>
        <View style={styles.scaleDots}>
          <View style={[styles.legendDot, styles.calendarEmpty]} />
          <View style={[styles.legendDot, styles.calendarPartial]} />
          <View style={[styles.legendDot, styles.calendarComplete]} />
        </View>
        <Text style={styles.legendText}>%100</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, styles }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`));
}
