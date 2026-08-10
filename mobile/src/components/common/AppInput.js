import { forwardRef, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './AppInput.styles';

const AppInput = forwardRef(function AppInput(
  { label, error, secureTextEntry, multiline, containerStyle, placeholderTextColor, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, multiline && styles.multilineRow, error && styles.errorBorder]}>
        <TextInput
          ref={ref}
          placeholderTextColor={placeholderTextColor ?? colors.placeholder}
          style={[styles.input, multiline && styles.multiline]}
          secureTextEntry={secureTextEntry && !visible}
          multiline={multiline}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            hitSlop={12}
            onPress={() => setVisible((current) => !current)}
            style={styles.eyeButton}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default AppInput;
