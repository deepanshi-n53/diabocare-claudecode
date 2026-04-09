import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getUser } from '../utils/storage';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      const user = await getUser();
      if (!user || !user.onboardingComplete) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
      setChecked(true);
    }
    checkOnboarding();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
