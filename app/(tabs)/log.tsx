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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { saveReading } from '../../utils/storage';
import { generateId, getBloodSugarStatus, getStatusColor, getStatusBgColor, getStatusLabel } from '../../utils/helpers';
import { BloodSugarReading } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export default function LogScreen() {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const [mealTiming, setMealTiming] = useState<'before' | 'after'>('before');
  const [insulinUnits, setInsulinUnits] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const parsedValue = parseInt(value, 10);
  const isValidValue = !isNaN(parsedValue) && parsedValue > 0 && parsedValue <= 600;

  function getPreviewStatus() {
    if (!isValidValue) return null;
    return getBloodSugarStatus(parsedValue);
  }

  async function handleSave() {
    if (!value.trim()) { Alert.alert('', t.errors.missingBS); return; }
    if (!isValidValue) { Alert.alert('', t.errors.invalidBS); return; }
    if (insulinUnits && (isNaN(Number(insulinUnits)) || Number(insulinUnits) < 0)) {
      Alert.alert('', t.errors.invalidInsulin); return;
    }

    setSaving(true);
    const reading: BloodSugarReading = {
      id: generateId(),
      value: parsedValue,
      mealTiming,
      insulinUnits: insulinUnits ? parseFloat(insulinUnits) : undefined,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    await saveReading(reading);
    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setValue('');
      setMealTiming('before');
      setInsulinUnits('');
      setNotes('');
      setSaved(false);
    }, 1500);
  }

  const previewStatus = getPreviewStatus();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="bg-white px-5 py-4 border-b border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">{t.log.title}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{t.log.subtitle}</Text>
          </View>

          <View className="px-4 pt-4">
            {/* Blood Sugar Input */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                {t.log.bloodSugar} <Text className="text-red-500">*</Text>
              </Text>

              <View className="flex-row items-center">
                <View className="flex-1 relative">
                  <TextInput
                    className="border-2 border-blue-200 rounded-xl px-4 py-4 text-gray-900 text-center"
                    style={{ fontSize: 40, fontWeight: 'bold' }}
                    placeholder="---"
                    placeholderTextColor="#d1d5db"
                    value={value}
                    onChangeText={setValue}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-base font-medium">mg/dL</Text>
                </View>
              </View>

              {/* Live status preview */}
              {previewStatus && (
                <View
                  className="mt-3 rounded-xl px-4 py-3 flex-row items-center gap-2"
                  style={{ backgroundColor: getStatusBgColor(previewStatus) }}
                >
                  <Ionicons
                    name={previewStatus === 'normal' ? 'checkmark-circle' : 'warning'}
                    size={18}
                    color={getStatusColor(previewStatus)}
                  />
                  <Text style={{ color: getStatusColor(previewStatus) }} className="font-medium text-sm">
                    {previewStatus === 'low' && t.log.statusLow}
                    {previewStatus === 'normal' && t.log.statusNormal}
                    {previewStatus === 'high' && t.log.statusHigh}
                    {previewStatus === 'very_high' && t.log.statusVeryHigh}
                  </Text>
                </View>
              )}
            </View>

            {/* Meal Timing */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">{t.log.when}</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setMealTiming('before')}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${
                    mealTiming === 'before' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text className="text-lg mb-1">🍽️</Text>
                  <Text className={`text-sm font-medium ${mealTiming === 'before' ? 'text-blue-700' : 'text-gray-600'}`}>
                    {t.log.beforeMeal}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMealTiming('after')}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${
                    mealTiming === 'after' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text className="text-lg mb-1">✅</Text>
                  <Text className={`text-sm font-medium ${mealTiming === 'after' ? 'text-blue-700' : 'text-gray-600'}`}>
                    {t.log.afterMeal}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Insulin Units */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {t.log.insulinTitle}{' '}
                <Text className="text-gray-400 font-normal">{t.log.insulinOptional}</Text>
              </Text>
              <Text className="text-gray-400 text-xs mb-3">{t.log.insulinSub}</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                  placeholder={t.log.insulinPlaceholder}
                  placeholderTextColor="#9ca3af"
                  value={insulinUnits}
                  onChangeText={setInsulinUnits}
                  keyboardType="decimal-pad"
                />
                <Text className="ml-3 text-gray-500">{t.log.units}</Text>
              </View>
            </View>

            {/* Notes */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {t.log.notesTitle}{' '}
                <Text className="text-gray-400 font-normal">{t.log.notesOptional}</Text>
              </Text>
              <Text className="text-gray-400 text-xs mb-3">{t.log.notesSub}</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                placeholder={t.log.notesPlaceholder}
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {/* Timestamp info */}
            <View className="flex-row items-center px-1 mb-4">
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text className="text-gray-400 text-xs ml-1">
                {t.log.timestampPrefix} {new Date().toLocaleString()}
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || saved}
              className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${
                saved ? 'bg-green-500' : saving ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {saved ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white text-base font-semibold">{t.log.saved}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save" size={20} color="white" />
                  <Text className="text-white text-base font-semibold">
                    {saving ? t.log.saving : t.log.saveBtn}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Reference Card */}
            <View className="mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Text className="text-blue-800 font-semibold text-sm mb-2">
                📊 {t.log.referenceTitle}
              </Text>
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-red-500" />
                  <Text className="text-blue-900 text-xs">{t.log.refLow}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                  <Text className="text-blue-900 text-xs">{t.log.refNormal}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-yellow-500" />
                  <Text className="text-blue-900 text-xs">{t.log.refElevated}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-red-600" />
                  <Text className="text-blue-900 text-xs">{t.log.refHigh}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
