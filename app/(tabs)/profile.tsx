import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppAvatar } from '@/components/app-avatar';
import { Palette, Radius, Shadow } from '@/constants/design';
import { useAuth } from '@/contexts/auth-context';
import { createOrUpdateChatMember } from '@/services/chat-service';
import { UserProfile } from '@/types/user';

function mergeProfile(profile: UserProfile, updates: Partial<UserProfile>) {
  return { ...profile, ...updates };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, updateAccount, changePassword, uploadAvatar, signOut } = useAuth();
  const [nameDraft, setNameDraft] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setNameDraft(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const handleSaveName = async () => {
    if (!profile) return;

    const nextName = nameDraft.trim();

    if (!nextName) {
      Alert.alert('無法儲存', '名字不能空白。');
      return;
    }

    try {
      setSavingName(true);
      await updateAccount({ displayName: nextName });
      await createOrUpdateChatMember(profile.uid, mergeProfile(profile, { displayName: nextName }));
      Alert.alert('已更新', '名字已儲存。');
    } catch {
      Alert.alert('更新失敗', '請稍後再試一次。');
    } finally {
      setSavingName(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!profile) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('需要權限', '請允許相簿權限後再選擇頭像。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
    });

    if (result.canceled) return;

    try {
      setUploadingAvatar(true);
      const photoURL = await uploadAvatar(result.assets[0].uri);
      await updateAccount({ photoURL });
      await createOrUpdateChatMember(profile.uid, mergeProfile(profile, { photoURL }));
      Alert.alert('已更新', '頭像已儲存。');
    } catch {
      Alert.alert('上傳失敗', '請確認 Firebase Storage 已啟用，或稍後再試。');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !nextPassword || !confirmPassword) {
      Alert.alert('無法修改', '請完整輸入目前密碼與新密碼。');
      return;
    }

    if (nextPassword.length < 6) {
      Alert.alert('無法修改', '新密碼至少需要 6 個字。');
      return;
    }

    if (nextPassword !== confirmPassword) {
      Alert.alert('無法修改', '兩次輸入的新密碼不一致。');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(currentPassword, nextPassword);
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      Alert.alert('已更新', '密碼已修改完成。');
    } catch {
      Alert.alert('修改失敗', '目前密碼可能不正確，請重新登入後再試。');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Account</Text>
          <Text style={styles.headerTitle}>帳號</Text>
        </View>
      </View>

      <View style={styles.identityCard}>
        <AppAvatar name={profile?.displayName ?? 'Me'} photoURL={profile?.photoURL} size={92} />
        <View style={styles.identityText}>
          <Text numberOfLines={1} style={styles.identityName}>{profile?.displayName ?? '未命名'}</Text>
          <Text numberOfLines={1} style={styles.identityEmail}>{profile?.email ?? user?.email ?? ''}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="變更頭像"
          activeOpacity={0.85}
          disabled={uploadingAvatar}
          onPress={handlePickAvatar}
          style={styles.avatarButton}
        >
          {uploadingAvatar ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="camera" size={19} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>會員資料</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={18} color={Palette.primary} />
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text selectable numberOfLines={1} style={styles.infoValue}>{profile?.email ?? user?.email ?? ''}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="finger-print-outline" size={18} color={Palette.primary} />
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>UID</Text>
              <Text selectable numberOfLines={1} style={styles.infoValue}>{profile?.uid ?? user?.uid ?? ''}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>顯示名稱</Text>
        <View style={styles.editorBox}>
          <TextInput
            onChangeText={setNameDraft}
            placeholder="輸入名字"
            placeholderTextColor={Palette.faint}
            style={styles.input}
            value={nameDraft}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={savingName}
            onPress={handleSaveName}
            style={[styles.primaryButton, savingName && styles.buttonDisabled]}
          >
            {savingName ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={19} color="#fff" />
                <Text style={styles.primaryButtonText}>儲存</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>修改密碼</Text>
        <View style={styles.editorBox}>
          <TextInput
            autoCapitalize="none"
            onChangeText={setCurrentPassword}
            placeholder="目前密碼"
            placeholderTextColor={Palette.faint}
            secureTextEntry
            style={styles.input}
            value={currentPassword}
          />
          <TextInput
            autoCapitalize="none"
            onChangeText={setNextPassword}
            placeholder="新密碼"
            placeholderTextColor={Palette.faint}
            secureTextEntry
            style={styles.input}
            value={nextPassword}
          />
          <TextInput
            autoCapitalize="none"
            onChangeText={setConfirmPassword}
            placeholder="再次輸入新密碼"
            placeholderTextColor={Palette.faint}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={savingPassword}
            onPress={handleChangePassword}
            style={[styles.primaryButton, savingPassword && styles.buttonDisabled]}
          >
            {savingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="key-outline" size={19} color="#fff" />
                <Text style={styles.primaryButtonText}>修改密碼</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={handleSignOut} style={styles.signOutButton}>
        <Ionicons name="log-out-outline" size={20} color={Palette.danger} />
        <Text style={styles.signOutText}>登出</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  content: {
    paddingBottom: 42,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerEyebrow: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitle: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  identityCard: {
    ...Shadow.soft,
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 18,
    padding: 16,
  },
  identityText: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  identityName: {
    color: Palette.text,
    fontSize: 21,
    fontWeight: '900',
  },
  identityEmail: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 4,
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  infoIcon: {
    alignItems: 'center',
    backgroundColor: Palette.primarySoft,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  infoBody: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
  },
  infoValue: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  infoDivider: {
    backgroundColor: Palette.border,
    height: 1,
    marginLeft: 62,
  },
  editorBox: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.control,
    borderWidth: 1,
    color: Palette.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.control,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: Palette.dangerSoft,
    borderColor: '#ffd5d2',
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginHorizontal: 18,
    marginTop: 22,
    minHeight: 50,
  },
  signOutText: {
    color: Palette.danger,
    fontSize: 16,
    fontWeight: '900',
  },
});
