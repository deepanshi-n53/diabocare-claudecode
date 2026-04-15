import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_OPTIONS, Language } from '../../lib/translations';
import { supabase } from '../../lib/supabase';
import { isValidAge, isValidTargetRange } from '../../utils/validators';

const DIABETES_TYPES = ['type1', 'type2', 'gestational', 'prediabetes'] as const;
type DiabetesType = typeof DIABETES_TYPES[number];

export default function SettingsScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // ── Profile state ──────────────────────────────────────
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('type2');
  const [age, setAge] = useState('');
  const [targetMin, setTargetMin] = useState('70');
  const [targetMax, setTargetMax] = useState('140');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingLang, setChangingLang] = useState(false);

  const dtLabels: Record<DiabetesType, string> = {
    type1: t.dt.type1,
    type2: t.dt.type2,
    gestational: t.dt.gestational,
    prediabetes: t.dt.prediabetes,
  };

  // ── Load profile on mount ──────────────────────────────
  useEffect(() => {
    async function load() {
      setProfileLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfileLoading(false); return; }

      setUserEmail(user.email ?? '');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name ?? '');
        const dt = DIABETES_TYPES.includes(data.diabetes_type as DiabetesType)
          ? (data.diabetes_type as DiabetesType)
          : 'type2';
        setDiabetesType(dt);
        setAge(data.age != null ? String(data.age) : '');
        setTargetMin(data.target_range_min != null ? String(data.target_range_min) : '70');
        setTargetMax(data.target_range_max != null ? String(data.target_range_max) : '140');
        setEmergencyName(data.emergency_contact_name ?? '');
        setEmergencyPhone(data.emergency_contact_phone ?? '');
      }
      setProfileLoading(false);
    }
    load();
  }, []);

  // ── Save profile ───────────────────────────────────────
  async function handleSaveProfile() {
    if (!fullName.trim()) {
      Alert.alert('', 'Please enter your full name.');
      return;
    }

    const minVal = parseInt(targetMin, 10);
    const maxVal = parseInt(targetMax, 10);

    if (isNaN(minVal) || isNaN(maxVal) || !isValidTargetRange(minVal, maxVal)) {
      Alert.alert('', 'Target minimum must be ≥ 40, maximum ≤ 400, and min < max.');
      return;
    }

    const ageNum = age.trim() ? parseInt(age, 10) : null;
    if (ageNum !== null && !isValidAge(ageNum)) {
      Alert.alert('', 'Please enter a valid age (1–120).');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim(),
      diabetes_type: diabetesType,
      age: ageNum,
      target_range_min: minVal,
      target_range_max: maxVal,
      emergency_contact_name: emergencyName.trim() || null,
      emergency_contact_phone: emergencyPhone.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save profile: ' + error.message);
      return;
    }

    await refreshProfile();
    Alert.alert('Saved', 'Profile updated successfully!');
  }

  // ── Language change ────────────────────────────────────
  async function handleLanguageChange(lang: Language) {
    setChangingLang(true);
    await setLanguage(lang);
    if (profile?.id) {
      await supabase.from('profiles').update({ language: lang }).eq('id', profile.id);
    }
    setChangingLang(false);
  }

  // ── Logout ─────────────────────────────────────────────
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="bg-white px-5 py-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">{t.settings.title}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Profile Section ───────────────────────────── */}
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Profile
          </Text>

          {profileLoading ? (
            <View className="bg-white rounded-2xl shadow-sm p-6 items-center mb-4">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : (
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              {/* Email (read-only) */}
              {userEmail ? (
                <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
                  <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="mail-outline" size={16} color="#2563eb" />
                  </View>
                  <Text className="text-gray-500 text-sm">{userEmail}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Full Name
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4"
                placeholder="Your full name"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={setFullName}
              />

              {/* Diabetes Type */}
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Diabetes Type
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {DIABETES_TYPES.map((dt) => (
                  <TouchableOpacity
                    key={dt}
                    onPress={() => setDiabetesType(dt)}
                    className={`px-4 py-2 rounded-full border ${
                      diabetesType === dt
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        diabetesType === dt ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {dtLabels[dt]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Age */}
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Age
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4"
                placeholder="e.g. 35"
                placeholderTextColor="#9ca3af"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
              />

              {/* Target Range */}
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Target Blood Sugar Range (mg/dL)
              </Text>
              <View className="flex-row items-center gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-1">Minimum</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                    placeholder="70"
                    placeholderTextColor="#9ca3af"
                    value={targetMin}
                    onChangeText={setTargetMin}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <Text className="text-gray-400 text-lg mt-4">—</Text>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-1">Maximum</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                    placeholder="140"
                    placeholderTextColor="#9ca3af"
                    value={targetMax}
                    onChangeText={setTargetMax}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </View>

              {/* Emergency Contact */}
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Emergency Contact (optional)
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-2"
                placeholder="Contact name"
                placeholderTextColor="#9ca3af"
                value={emergencyName}
                onChangeText={setEmergencyName}
              />
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4"
                placeholder="Phone number"
                placeholderTextColor="#9ca3af"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={saving}
                className={`rounded-xl py-3.5 items-center ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Language Section ──────────────────────────── */}
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {t.settings.languageSection}
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            {LANGUAGE_OPTIONS.map((lang, i) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                disabled={changingLang}
                className={`flex-row items-center px-4 py-3.5 ${
                  i < LANGUAGE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-base font-medium ${
                      language === lang.code ? 'text-blue-600' : 'text-gray-800'
                    }`}
                  >
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

          {/* ── Logout ───────────────────────────────────── */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-100 rounded-2xl py-4 items-center flex-row justify-center gap-2"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-semibold text-base">{t.settings.logoutBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
