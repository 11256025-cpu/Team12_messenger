import { Image, StyleSheet, Text, View } from 'react-native';

import { Palette, avatarColors } from '@/constants/design';

type AppAvatarProps = {
  name: string;
  photoURL?: string | null;
  size?: number;
};

function initialsFromName(name: string) {
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() || '?';
}

function colorFromName(name: string) {
  const code = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[code % avatarColors.length];
}

export function AppAvatar({ name, photoURL, size = 48 }: AppAvatarProps) {
  const radius = size / 2;

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[styles.image, { borderRadius: radius, height: size, width: size }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          backgroundColor: colorFromName(name),
          borderRadius: radius,
          height: size,
          width: size,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.max(15, size * 0.38) }]}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Palette.surfaceAlt,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '800',
  },
});
