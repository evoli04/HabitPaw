import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  Image,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { acceptHabitSuggestions, suggestHabits } from '../../services/aiService';
import { createStyles } from './AiHabitAssistant.styles';
import { syncHabitReminder } from '../../services/notificationService';

const MINUTES = [10, 20, 30, 45];

export default function AiHabitAssistant() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [goal, setGoal] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dragY = useRef(new Animated.Value(0)).current;

  const close = () => {
    if (!loading && !accepting) {
      dragY.setValue(0);
      setVisible(false);
    }
  };

  const dragResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: (_event, gesture) =>
      gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_event, gesture) => dragY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dy > 45 || gesture.vy > 0.55) {
        close();
        return;
      }
      Animated.spring(dragY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 70,
        friction: 10,
      }).start();
    },
    onPanResponderTerminate: () => dragY.setValue(0),
  });

  const generate = async () => {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) {
      setError('Önce ulaşmak istediğin hedefi yaz.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await suggestHabits({
        goal: trimmedGoal,
        dailyMinutes,
        level: 'beginner',
      });
      setResult(response);
      setSelected(response.suggestions?.map((_, index) => index) ?? []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index) => {
    setSelected((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  const accept = async () => {
    if (!result?.recommendationId || selected.length === 0) return;
    setAccepting(true);
    setError('');
    try {
      const created = await acceptHabitSuggestions(result.recommendationId, selected);
      await Promise.all(created.map((habit) => syncHabitReminder(habit).catch(() => false)));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
      ]);
      setSuccess(`${created.length} alışkanlık listene eklendi.`);
      setResult(null);
      setSelected([]);
      setGoal('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Paw AI alışkanlık asistanını aç"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.bubble,
          { bottom: Math.max(insets.bottom, 14) + 88 },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.sparkle}><Text style={styles.sparkleText}>✦</Text></View>
        <Ionicons name="sparkles" size={25} color={colors.white} />
        <Text style={styles.bubbleLabel}>Paw AI</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.backdrop} onPress={close} />
          <Animated.View
            style={[
              styles.panel,
              { paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: dragY }] },
            ]}
          >
            <View pointerEvents="none" style={styles.catPeek}>
              <Image
                source={require('../../../assets/cats/yandancat.png')}
                resizeMode="contain"
                style={styles.catPeekImage}
              />
            </View>
            <View style={styles.dragArea} {...dragResponder.panHandlers}>
              <View style={styles.handle} />
            </View>
            <View style={styles.header} {...dragResponder.panHandlers}>
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles" size={22} color={colors.white} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Paw AI</Text>
                <Text style={styles.subtitle}>Hedefine uygun alışkanlıkları birlikte bulalım</Text>
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {!result ? (
                <>
                  <View style={styles.introCard}>
                    <Text style={styles.introEmoji}>🐾</Text>
                    <Text style={styles.introText}>
                      Bana hedefini anlat. Gemini, mevcut rutinlerini de dikkate alarak uygulanabilir öneriler hazırlasın.
                    </Text>
                  </View>
                  <Text style={styles.label}>Hedefin nedir?</Text>
                  <TextInput
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="Örn. Daha enerjik olmak istiyorum"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    maxLength={300}
                    editable={!loading}
                    style={styles.input}
                  />
                  <Text style={styles.label}>Günde ayırabileceğin süre</Text>
                  <View style={styles.chips}>
                    {MINUTES.map((minutes) => (
                      <Pressable
                        key={minutes}
                        onPress={() => setDailyMinutes(minutes)}
                        style={[styles.chip, dailyMinutes === minutes && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, dailyMinutes === minutes && styles.chipTextActive]}>
                          {minutes} dk
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {success ? <Text style={styles.success}>{success}</Text> : null}
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Pressable
                    disabled={loading}
                    onPress={generate}
                    style={({ pressed }) => [styles.primaryButton, (pressed || loading) && styles.pressed]}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={18} color={colors.white} />
                        <Text style={styles.primaryButtonText}>Önerileri hazırla</Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <View>
                      <Text style={styles.resultTitle}>Senin için öneriler</Text>
                      <Text style={styles.resultSubtitle}>Eklemek istediklerini seç</Text>
                    </View>
                    <Pressable onPress={() => { setResult(null); setSelected([]); setError(''); }}>
                      <Text style={styles.newSearch}>Yeniden sor</Text>
                    </Pressable>
                  </View>
                  {result.suggestions.map((suggestion, index) => {
                    const isSelected = selected.includes(index);
                    return (
                      <Pressable
                        key={`${suggestion.title}-${index}`}
                        onPress={() => toggleSuggestion(index)}
                        style={[styles.suggestion, isSelected && styles.suggestionSelected]}
                      >
                        <View style={[styles.check, isSelected && styles.checkSelected]}>
                          {isSelected ? <Ionicons name="checkmark" size={17} color={colors.white} /> : null}
                        </View>
                        <View style={styles.suggestionCopy}>
                          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                          <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                          <Text style={styles.reason}>✦ {suggestion.reason}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Pressable
                    disabled={accepting || selected.length === 0}
                    onPress={accept}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (pressed || accepting) && styles.pressed,
                      selected.length === 0 && styles.disabled,
                    ]}
                  >
                    {accepting ? <ActivityIndicator color={colors.white} /> : (
                      <Text style={styles.primaryButtonText}>Seçilenleri ekle ({selected.length})</Text>
                    )}
                  </Pressable>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
