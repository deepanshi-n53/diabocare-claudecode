import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim()) { Alert.alert('', t.errors.missingEmail); return; }
    if (!password) { Alert.alert('', t.errors.missingPassword); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('', error.message ?? t.errors.authFailed);
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Icon */}
          <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
            <Text style={{ fontSize: 32 }}>💉</Text>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-1">{t.login.title}</Text>
          <Text className="text-gray-500 text-sm mb-8">{t.login.subtitle}</Text>

          {/* Email */}
          <Text className="text-sm font-medium text-gray-700 mb-1">{t.login.email}</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-4"
            placeholder={t.login.emailPlaceholder}
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-gray-700">{t.login.password}</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 text-sm">{t.login.forgotPassword}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-6"
            placeholder={t.login.passwordPlaceholder}
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-2xl py-4 items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white text-base font-bold">
              {loading ? t.login.submitting : t.login.submit}
            </Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View className="flex-row justify-center mt-5">
            <Text className="text-gray-500 text-sm">{t.login.noAccount} </Text>
            <TouchableOpacity onPress={() => router.replace('/signup')}>
              <Text className="text-blue-600 font-semibold text-sm">{t.login.signUpLink}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
