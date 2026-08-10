import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pressable, Text, View } from 'react-native';
import { FREQUENCIES } from '../../constants/habits';
import AppButton from '../common/AppButton';
import AppInput from '../common/AppInput';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './HabitForm.styles';

const schema = z.object({
  title: z.string().trim().min(1, 'Başlık zorunludur.').max(100, 'Başlık en fazla 100 karakter olabilir.'),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir.'),
  frequency: z.enum(['daily', 'weekdays', 'weekends']),
  reminderTime: z
    .string()
    .refine((value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Saati HH:mm biçiminde girin.'),
});

export default function HabitForm({
  defaultValues,
  submitTitle,
  loading,
  serverError,
  onSubmit,
  existingReminder = '',
  onReminderFocus,
  onReminderBlur,
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      frequency: defaultValues?.frequency ?? 'daily',
      reminderTime: defaultValues?.reminderTime ?? '',
    },
  });

  const submit = (values) => {
    if (existingReminder && !values.reminderTime) {
      onSubmit({ ...values, reminderTime: existingReminder }, true);
      return;
    }

    const payload = {
      title: values.title.trim(),
      frequency: values.frequency,
    };
    const description = values.description.trim();
    if (description) payload.description = description;
    if (values.reminderTime) payload.reminderTime = values.reminderTime;
    onSubmit(payload, false);
  };

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Başlık"
            placeholder="Örn. Su iç"
            maxLength={100}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.title?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Açıklama"
            placeholder="Alışkanlığınla ilgili kısa bir not"
            maxLength={500}
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.description?.message}
          />
        )}
      />
      <View style={styles.group}>
        <Text style={styles.label}>Sıklık</Text>
        <Controller
          control={control}
          name="frequency"
          render={({ field: { onChange, value } }) => (
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: value === item.value }}
                  onPress={() => onChange(item.value)}
                  style={[styles.frequency, value === item.value && styles.frequencySelected]}
                >
                  <Text style={[styles.frequencyText, value === item.value && styles.frequencyTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>
      <Controller
        control={control}
        name="reminderTime"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Hatırlatma saati"
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            onBlur={() => {
              onBlur();
              onReminderBlur?.();
            }}
            onFocus={onReminderFocus}
            onChangeText={onChange}
            value={value}
            error={errors.reminderTime?.message}
          />
        )}
      />
      {serverError ? <Text accessibilityRole="alert" style={styles.error}>{serverError}</Text> : null}
      <AppButton title={submitTitle} loading={loading} onPress={handleSubmit(submit)} />
    </View>
  );
}
