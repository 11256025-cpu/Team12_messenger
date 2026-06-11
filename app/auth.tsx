import { Ionicons } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius, Shadow } from '@/constants/design';
import { useAuth } from '@/contexts/auth-context';

type Mode = 'login' | 'register';

function getAuthMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return '發生錯誤，請稍後再試。';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return '這個 Email 已經註冊過。';
    case 'auth/invalid-email':
      return 'Email 格式不正確。';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email 或密碼不正確。';
    case 'auth/weak-password':
      return '密碼至少需要 6 個字。';
    case 'auth/network-request-failed':
      return '網路連線失敗，請稍後再試。';
    default:
      return error.message;
  }
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isRegistering = mode === 'register';

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    const cleanName = displayName.trim();

    setError('');

    if (!cleanEmail || !password) {
      setError('請輸入 Email 和密碼。');
      return;
    }

    if (isRegistering && !cleanName) {
      setError('請輸入名字。');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('兩次輸入的密碼不一致。');
      return;
    }

    try {
      setSubmitting(true);

      if (isRegistering) {
        await signUp(cleanEmail, password, cleanName);
      } else {
        await signIn(cleanEmail, password);
      }
    } catch (submitError) {
      setError(getAuthMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 28 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Ionicons name="chatbubbles" size={30} color="#fff" />
          </View>
          <Text style={styles.brandName}>Messenger</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>{isRegistering ? '建立帳號' : '歡迎回來'}</Text>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMode('login');
                setError('');
              }}
              style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                登入
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMode('register');
                setError('');
              }}
              style={[styles.segmentButton, mode === 'register' && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>
                註冊
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {isRegistering ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>名字</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setDisplayName}
                  placeholder="王小明"
                  placeholderTextColor={Palette.faint}
                  style={styles.input}
                  value={displayName}
                />
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={Palette.faint}
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>密碼</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="至少 6 個字"
                  placeholderTextColor={Palette.faint}
                  secureTextEntry={!isPasswordVisible}
                  style={styles.passwordInput}
                  textContentType={isRegistering ? 'newPassword' : 'password'}
                  value={password}
                />
                <TouchableOpacity
                  accessibilityLabel={isPasswordVisible ? '隱藏密碼' : '顯示密碼'}
                  onPress={() => setIsPasswordVisible((current) => !current)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color={Palette.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isRegistering ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>確認密碼</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="再次輸入密碼"
                  placeholderTextColor={Palette.faint}
                  secureTextEntry={!isPasswordVisible}
                  style={styles.input}
                  textContentType="newPassword"
                  value={confirmPassword}
                />
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Palette.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              onPress={handleSubmit}
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={isRegistering ? 'person-add' : 'log-in'} size={20} color="#fff" />
                  <Text style={styles.submitText}>{isRegistering ? '建立帳號' : '登入'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  brandName: {
    color: Palette.text,
    fontSize: 28,
    fontWeight: '900',
  },
  panel: {
    ...Shadow.soft,
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 18,
    width: '100%',
    maxWidth: 520,
  },
  title: {
    color: Palette.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 18,
  },
  segmentedControl: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.card,
    flexDirection: 'row',
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  segmentButtonActive: {
    backgroundColor: Palette.surface,
  },
  segmentText: {
    color: Palette.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: Palette.primary,
  },
  form: {
    gap: 15,
    marginTop: 18,
  },
  inputGroup: {
    gap: 7,
  },
  label: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.control,
    borderWidth: 1,
    color: Palette.text,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 13,
  },
  passwordRow: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
  },
  passwordInput: {
    color: Palette.text,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 13,
  },
  iconButton: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: Palette.dangerSoft,
    borderColor: '#ffd5d2',
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  errorText: {
    color: Palette.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.control,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
