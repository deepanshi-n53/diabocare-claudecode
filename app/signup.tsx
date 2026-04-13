import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS, Language } from '../lib/translations';

const DIABETES_TYPES = ['type1', 'type2', 'gestational', 'prediabetes'] as const;
type DiabetesType = typeof DIABETES_TYPES[number];

export default function SignUpScreen() {
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('type2');
  const [loading, setLoading] = useState(false);
  const [showDtPicker, setShowDtPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const dtLabels: Record<DiabetesType, string> = {
    type1: t.dt.type1,
    type2: t.dt.type2,
    gestational: t.dt.gestational,
    prediabetes: t.dt.prediabetes,
  };

  async function handleSignUp() {
    if (!name.trim()) { Alert.alert('', t.errors.missingName); return; }
    if (!email.trim()) { Alert.alert('', t.errors.missingEmail); return; }
    if (password.length < 6) { Alert.alert('', t.errors.missingPassword); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });

    if (error || !data.user) {
      Alert.alert('', error?.message ?? t.errors.authFailed);
      setLoading(false);
      return;
    }

    // Insert profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: name.trim(),
      diabetes_type: diabetesType,
      language,
    });

    setLoading(false);

    if (profileError) {
      Alert.alert('', t.errors.authFailed);
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

          <Text className="text-2xl font-bold text-gray-900 mb-1">{t.signup.title}</Text>
          <Text className="text-gray-500 text-sm mb-6">{t.signup.subtitle}</Text>

          {/* Full Name */}
          <Text className="text-sm font-medium text-gray-700 mb-1">{t.signup.fullName}</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-4"
            placeholder={t.signup.namePlaceholder}
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

          {/* Email */}
          <Text className="text-sm font-medium text-gray-700 mb-1">{t.signup.email}</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-4"
            placeholder={t.signup.emailPlaceholder}
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <Text className="text-sm font-medium text-gray-700 mb-1">{t.signup.password}</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-4"
            placeholder={t.signup.passwordPlaceholder}
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />

          {/* Diabetes Type */}
          <Text className="text-sm font-medium text-gray-700 mb-1">{t.signup.diabetesType}</Text>
          <TouchableOpacity
            onPress={() => setShowDtPicker(!showDtPicker)}
            className="border border-gray-200 rounded-xl px-4 py-3 bg-white mb-1 flex-row items-center justify-between"
          >
            <Text className="text-base text-gray-900">{dtLabels[diabetesType]}</Text>
            <Ionicons name={showDtPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
          </TouchableOpacity>
          {showDtPicker && (
            <View className="border border-gray-200 rounded-xl bg-white mb-4 overflow-hidden">
              {DIABETES_TYPES.map((dt, i) => (
                <TouchableOpacity
                  key={dt}
                  onPress={() => { setDiabetesType(dt); setShowDtPicker(false); }}
                  className={`px-4 py-3 flex-row items-center justify-between ${
                    i < DIABETES_TYPES.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Text className={`text-base ${diabetesType === dt ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                    {dtLabels[dt]}
                  </Text>
                  {diabetesType === dt && <Ionicons name="checkmark" size={16} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!showDtPicker && <View className="mb-4" />}

          {/* Language */}
          <Text className="text-sm font-medium text-gray-700 mb-1">{t.signup.language}</Text>
          <TouchableOpacity
            onPress={() => setShowLangPicker(!showLangPicker)}
            className="border border-gray-200 rounded-xl px-4 py-3 bg-white mb-1 flex-row items-center justify-between"
          >
            <Text className="text-base text-gray-900">
              {LANGUAGE_OPTIONS.find((l) => l.code === language)?.native ?? 'English'}
            </Text>
            <Ionicons name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
          </TouchableOpacity>
          {showLangPicker && (
            <View className="border border-gray-200 rounded-xl bg-white mb-4 overflow-hidden">
              {LANGUAGE_OPTIONS.map((lang, i) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => { setLanguage(lang.code); setShowLangPicker(false); }}
                  className={`px-4 py-3 flex-row items-center justify-between ${
                    i < LANGUAGE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View>
                    <Text className={`text-base ${language === lang.code ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                      {lang.native}
                    </Text>
                    {lang.native !== lang.label && (
                      <Text className="text-xs text-gray-400">{lang.label}</Text>
                    )}
                  </View>
                  {language === lang.code && <Ionicons name="checkmark" size={16} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!showLangPicker && <View className="mb-2" />}

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className={`rounded-2xl py-4 items-center mt-2 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white text-base font-bold">
              {loading ? t.signup.creating : t.signup.createAccount}
            </Text>
          </TouchableOpacity>

          {/* Login link */}
          <View className="flex-row justify-center mt-5">
            <Text className="text-gray-500 text-sm">{t.signup.haveAccount} </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text className="text-blue-600 font-semibold text-sm">{t.signup.loginLink}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
