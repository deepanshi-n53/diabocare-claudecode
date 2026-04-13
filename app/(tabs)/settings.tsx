import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_OPTIONS, Language } from '../../lib/translations';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [changing, setChanging] = useState(false);

  async function handleLanguageChange(lang: Language) {
    setChanging(true);
    await setLanguage(lang);
    // Also persist to Supabase profile
    if (profile?.id) {
      await supabase.from('profiles').update({ language: lang }).eq('id', profile.id);
    }
    setChanging(false);
  }

  function handleLogout() {
    Alert.alert(
      t.settings.logoutConfirmTitle,
      t.settings.logoutConfirmMsg,
      [
        { text: t.settings.cancelBtn, style: 'cancel' },
        {
          text: t.settings.logoutBtn,
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/welcome');
          },
        },
      ]
    );
  }

  const dtLabels: Record<string, string> = {
    type1: t.dt.type1,
    type2: t.dt.type2,
    gestational: t.dt.gestational,
    prediabetes: t.dt.prediabetes,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{t.settings.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Account Section */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          {t.settings.accountSection}
        </Text>
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="person" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs">{t.settings.name}</Text>
              <Text className="text-gray-900 font-semibold text-base">{profile?.name ?? '—'}</Text>
            </View>
          </View>
          <View className="flex-row items-center px-4 py-4">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="medical" size={20} color="#7c3aed" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs">{t.settings.diabetesType}</Text>
              <Text className="text-gray-900 font-semibold text-base">
                {profile?.diabetes_type ? (dtLabels[profile.diabetes_type] ?? profile.diabetes_type) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Language Section */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          {t.settings.languageSection}
        </Text>
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {LANGUAGE_OPTIONS.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              disabled={changing}
              className={`flex-row items-center px-4 py-3.5 ${
                i < LANGUAGE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-1">
                <Text className={`text-base font-medium ${language === lang.code ? 'text-blue-600' : 'text-gray-800'}`}>
                  {lang.native}
                </Text>
                {lang.native !== lang.label && (
                  <Text className="text-xs text-gray-400">{lang.label}</Text>
                )}
              </View>
              {language === lang.code && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 border border-red-100 rounded-2xl py-4 items-center flex-row justify-center gap-2"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-base">{t.settings.logoutBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
