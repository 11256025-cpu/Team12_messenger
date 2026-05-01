// app/(tabs)/profile.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // 呼叫 Expo Image Picker 開啟相簿
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // 確保裁切成正方形符合頭像比例
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={40} color="#8e8e93" />
            <Text style={styles.placeholderText}>選擇大頭貼</Text>
          </View>
        )}
        <View style={styles.editIconContainer}>
          <Ionicons name="pencil" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text style={styles.userName}>你的名字</Text>
      
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>從手機相簿更換照片</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#fff', paddingTop: 60 },
  imageContainer: { position: 'relative', marginBottom: 20 },
  avatar: { width: 140, height: 140, borderRadius: 70 },
  placeholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#f2f2f7', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#8e8e93', marginTop: 8, fontSize: 14 },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0a84ff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  button: { backgroundColor: '#f2f2f7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { fontSize: 16, color: '#0a84ff', fontWeight: '600' },
});