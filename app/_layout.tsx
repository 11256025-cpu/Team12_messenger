import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/design';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    const isAuthRoute = segments[0] === 'auth';

    if (!user && !isAuthRoute) {
      router.replace('/auth');
      return;
    }

    if (user && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [loading, navigationState?.key, router, segments, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Palette.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    flex: 1,
    justifyContent: 'center',
  },
});
