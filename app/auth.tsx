import { Ionicons } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/design';
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

  const changeMode = (nextMode: Mode) => {
    if (nextMode === mode) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(nextMode);
    setError('');
  };

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
              onPress={() => changeMode('login')}
              style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                登入
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => changeMode('register')}
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
    justifyContent: 'flex-start',
    padding: 20,
  },
  brand: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderColor: '#ffffff',
    borderRadius: 36,
    borderWidth: 4,
    height: 72,
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    width: 72,
    elevation: 4,
  },
  brandName: {
    color: Palette.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  panel: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 460,
    padding: 24,
    shadowColor: '#25252d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    width: '100%',
    elevation: 3,
  },
  title: {
    color: Palette.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  segmentedControl: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 5,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 11,
  },
  segmentButtonActive: {
    backgroundColor: Palette.surface,
    shadowColor: '#25252d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentText: {
    color: '#777780',
    fontSize: 15,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: Palette.primary,
  },
  form: {
    gap: 17,
    marginTop: 22,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#35353d',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 3,
  },
  input: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: 1,
    color: Palette.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  passwordRow: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
  },
  passwordInput: {
    color: Palette.text,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  iconButton: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: Palette.dangerSoft,
    borderColor: '#ffd5d2',
    borderRadius: 16,
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
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
