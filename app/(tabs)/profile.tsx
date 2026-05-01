import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_OPTIONS = ['線上', '離線', '忙碌中', '專注中'];

export default function ProfileScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('我的帳戶');
  const [status, setStatus] = useState('線上');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [statusColor, setStatusColor] = useState('#31a24c');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const insets = useSafeAreaInsets();

  const statusColorMap = {
    '線上': '#31a24c',
    '離線': '#8e8e93',
    '忙碌中': '#ff3b30',
    '專注中': '#9a5bff',
  };

  useEffect(() => {
    requestImagePickerPermission();
  }, []);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
      setIsEditingName(false);
      Alert.alert('成功', '名稱已更新');
    } else {
      Alert.alert('錯誤', '名稱不能為空');
    }
  };

  const handleCancelNameEdit = () => {
    setTempName(displayName);
    setIsEditingName(false);
  };

  const handleEditStatus = () => {
    setTempStatus(status);
    setIsEditingStatus(true);
  };

  const handleSaveStatus = () => {
    setStatus(tempStatus);
    setStatusColor(statusColorMap[tempStatus as keyof typeof statusColorMap]);
    setIsEditingStatus(false);
    Alert.alert('成功', `狀態已更新為「${tempStatus}」`);
  };

  const handleCancelStatusEdit = () => {
    setTempStatus(status);
    setIsEditingStatus(false);
  };

  const requestImagePickerPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限提示', '需要開放相簿權限才能設定頭像');
    }
  };

  const pickImage = async () => {
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        Alert.alert('提示', '頭像已更新');
      }
    } catch (error) {
      Alert.alert('錯誤', '選擇圖片時出錯');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setConfirmRemove(true);
  };

  const handleConfirmRemove = () => {
    setImage(null);
    setConfirmRemove(false);
  };

  const handleCancelRemove = () => {
    setConfirmRemove(false);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>帳戶設定</Text>
      </View>

      <View style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>大頭貼</Text>
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={pickImage}
            disabled={loading}
          >
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.avatar} />
                <View style={styles.editIconContainer}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="camera-outline" size={48} color="#0a84ff" />
                <Text style={styles.placeholderText}>點擊新增大頭貼</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="image" size={20} color="#fff" />
              <Text style={styles.buttonText}>從相簿選擇</Text>
            </TouchableOpacity>

            {image && !confirmRemove && (
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton]} 
                onPress={removeImage}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.buttonText}>刪除大頭貼</Text>
              </TouchableOpacity>
            )}
          </View>

          {image && confirmRemove && (
            <View style={styles.confirmRemoveCard}>
              <Text style={styles.confirmRemoveText}>確定要刪除大頭貼嗎？</Text>
              <View style={styles.confirmButtonRow}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelRemove}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleConfirmRemove}>
                  <Text style={styles.buttonText}>確認刪除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>帳戶資訊</Text>
          
          {/* 顯示名稱編輯 */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>顯示名稱</Text>
              <TouchableOpacity 
                style={styles.editAction}
                onPress={() => {
                  setTempName(displayName);
                  setIsEditingName(true);
                }}
              >
                <Ionicons name="pencil" size={18} color="#0a84ff" />
              </TouchableOpacity>
            </View>
            {isEditingName ? (
              <View style={styles.inlineEditorInner}>
                <TextInput
                  style={styles.textInput}
                  placeholder="輸入新的顯示名稱"
                  placeholderTextColor="#999"
                  value={tempName}
                  onChangeText={setTempName}
                  maxLength={20}
                />
                <Text style={styles.charCount}>{tempName.length}/20</Text>
                <View style={styles.inlineButtonGroup}> 
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelNameEdit}>
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveName}>
                    <Text style={styles.saveButtonText}>確認</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.nameDisplay}>
                <Text style={styles.nameValue}>{displayName}</Text>
              </View>
            )}
          </View>

          {/* 狀態設定 */}
          <View style={[styles.infoCard, { marginTop: 12 }]}> 
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>狀態</Text>
              <TouchableOpacity style={styles.statusBadge} onPress={handleEditStatus}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusText}>{status}</Text>
                <Ionicons name="chevron-down" size={18} color="#0a84ff" />
              </TouchableOpacity>
            </View>
            {isEditingStatus ? (
              <View style={styles.statusEditor}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.statusOption,
                      tempStatus === option && styles.statusOptionActive,
                    ]}
                    onPress={() => setTempStatus(option)}
                  >
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: statusColorMap[option as keyof typeof statusColorMap] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusOptionText,
                        tempStatus === option && styles.statusOptionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.inlineButtonGroup}>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelStatusEdit}>
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveStatus}>
                    <Text style={styles.saveButtonText}>確認</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>建議</Text>
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={24} color="#0a84ff" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>使用方提示</Text>
              <Text style={styles.tipText}>
                選擇清晰的正方形圖片作為大頭貼，效果最佳
              </Text>
            </View>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#000' },
  
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#f0f0f0' },
  placeholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#f2f2f7', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#8e8e93', marginTop: 8, fontSize: 13, textAlign: 'center' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0a84ff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  
  buttonGroup: { gap: 12 },
  button: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButton: { backgroundColor: '#0a84ff' },
  dangerButton: { backgroundColor: '#ff3b30' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  confirmRemoveCard: { marginTop: 12, backgroundColor: '#fff2f2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#ffd2d0' },
  confirmRemoveText: { color: '#d32f2f', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  confirmButtonRow: { flexDirection: 'row', gap: 12 },
  
  infoCard: { backgroundColor: '#f2f2f7', borderRadius: 12, overflow: 'hidden' },
  infoRow: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 16, color: '#8e8e93' },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#000' },
  divider: { height: 1, backgroundColor: '#d4d4d9' },
  
  editAction: { paddingLeft: 8 },

  nameDisplay: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5ea' },
  nameValue: { fontSize: 16, fontWeight: '500', color: '#000' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#31a24c' },
  statusText: { fontSize: 15, color: '#000', fontWeight: '500' },
  
  tipCard: { backgroundColor: '#f0f7ff', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 15, fontWeight: '600', color: '#0a84ff', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#0a84ff', lineHeight: 18 },

  inlineEditorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e5e5ea' },
  inlineEditorTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#000' },
  statusEditor: { paddingHorizontal: 16, paddingBottom: 16 },
  inlineEditorInner: { paddingHorizontal: 16, paddingBottom: 16 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0f0f0' },
  statusOptionActive: { backgroundColor: '#f0f7ff', borderColor: '#bbe1ff' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  statusOptionText: { flex: 1, fontSize: 15, color: '#000' },
  statusOptionTextActive: { fontWeight: '700', color: '#0a84ff' },
  inlineButtonGroup: { flexDirection: 'row', gap: 12, marginTop: 12 },

  // Modal 樣式
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
  statusModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#000' },
  textInput: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 8, color: '#000' },
  charCount: { fontSize: 12, color: '#8e8e93', marginBottom: 16, textAlign: 'right' },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f2f2f7' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  saveButton: { backgroundColor: '#0a84ff' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
