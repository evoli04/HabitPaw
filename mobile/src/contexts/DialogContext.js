import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [dialog, setDialog] = useState(null);

  const hideDialog = useCallback(() => setDialog(null), []);
  const showDialog = useCallback((options) => setDialog(options), []);
  const actions = dialog?.actions?.length ? dialog.actions : [{ text: 'Tamam' }];

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Modal visible={Boolean(dialog)} transparent animationType="fade" onRequestClose={hideDialog}>
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={hideDialog} />
          <View accessibilityRole="alert" style={styles.card}>
            <View style={styles.icon}>
              <Ionicons
                name={dialog?.tone === 'danger' ? 'warning-outline' : 'paw-outline'}
                size={25}
                color={dialog?.tone === 'danger' ? colors.danger : colors.primary}
              />
            </View>
            <Text style={styles.title}>{dialog?.title}</Text>
            {dialog?.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
            <View style={styles.actions}>
              {actions.map((action, index) => (
                <Pressable
                  key={`${action.text}-${index}`}
                  onPress={() => {
                    hideDialog();
                    action.onPress?.();
                  }}
                  style={[
                    styles.button,
                    action.style !== 'cancel' && styles.buttonPrimary,
                    action.style === 'destructive' && styles.buttonDanger,
                  ]}
                >
                  <Text style={[styles.buttonText, action.style !== 'cancel' && styles.buttonTextPrimary]}>
                    {action.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useAppDialog, DialogProvider içinde kullanılmalıdır.');
  return value;
}

const createStyles = (colors) => StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,17,32,0.62)' },
  card: { width: '100%', maxWidth: 430, padding: spacing.lg, borderRadius: 26, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, shadowColor: colors.shadow, shadowOpacity: 0.2, shadowRadius: 24, elevation: 18 },
  icon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, marginBottom: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary },
  message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  button: { minHeight: 46, minWidth: 92, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: 15, borderWidth: 1, borderColor: colors.border },
  buttonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  buttonText: { ...typography.label, color: colors.textPrimary },
  buttonTextPrimary: { color: colors.white },
});
