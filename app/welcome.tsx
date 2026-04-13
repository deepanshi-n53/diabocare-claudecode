import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

export default function WelcomeScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView className="flex-1 bg-blue-600">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo area */}
        <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-6 shadow-lg">
          <Text style={{ fontSize: 48 }}>💉</Text>
        </View>

        <Text className="text-white text-4xl font-bold mb-2">DiabaCare</Text>
        <Text className="text-blue-100 text-base text-center mb-16">
          {t.welcome.tagline}
        </Text>

        {/* Buttons */}
        <View className="w-full gap-3">
          <TouchableOpacity
            onPress={() => router.push('/signup')}
            className="bg-white rounded-2xl py-4 items-center"
          >
            <Text className="text-blue-600 text-base font-bold">{t.welcome.signUp}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/login')}
            className="border-2 border-white rounded-2xl py-4 items-center"
          >
            <Text className="text-white text-base font-bold">{t.welcome.login}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom tagline */}
      <View className="pb-8 items-center">
        <Text className="text-blue-200 text-xs text-center">
          🔒 Your data is private and stored securely
        </Text>
      </View>
    </SafeAreaView>
  );
}
