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
import { router } from 'expo-router';

export default function LogScreen() {
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
    if (!value.trim()) {
      Alert.alert('Missing Value', 'Please enter a blood sugar reading.');
      return;
    }
    if (!isValidValue) {
      Alert.alert('Invalid Value', 'Blood sugar must be between 1 and 600 mg/dL.');
      return;
    }

    if (insulinUnits && (isNaN(Number(insulinUnits)) || Number(insulinUnits) < 0)) {
      Alert.alert('Invalid Insulin', 'Please enter a valid insulin amount.');
      return;
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

    // Reset form after short delay
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
            <Text className="text-2xl font-bold text-gray-900">Log Reading</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              Record your blood sugar level
            </Text>
          </View>

          <View className="px-4 pt-4">
            {/* Blood Sugar Input */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Blood Sugar Level <Text className="text-red-500">*</Text>
              </Text>

              <View className="flex-row items-center">
                <View className="flex-1 relative">
                  <TextInput
                    className="border-2 border-blue-200 rounded-xl px-4 py-4 text-4xl font-bold text-gray-900 text-center"
                    style={{ fontSize: 40 }}
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
                    name={
                      previewStatus === 'normal'
                        ? 'checkmark-circle'
                        : 'warning'
                    }
                    size={18}
                    color={getStatusColor(previewStatus)}
                  />
                  <Text
                    style={{ color: getStatusColor(previewStatus) }}
                    className="font-medium text-sm"
                  >
                    {previewStatus === 'low' && 'Low — below target range (70 mg/dL)'}
                    {previewStatus === 'normal' && 'Normal — within target range'}
                    {previewStatus === 'high' && 'Elevated — above target range (140 mg/dL)'}
                    {previewStatus === 'very_high' && 'High — significantly above target (>200 mg/dL)'}
                  </Text>
                </View>
              )}
            </View>

            {/* Meal Timing */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                When was this reading?
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setMealTiming('before')}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${
                    mealTiming === 'before'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text className="text-lg mb-1">🍽️</Text>
                  <Text
                    className={`text-sm font-medium ${
                      mealTiming === 'before' ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    Before Meal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMealTiming('after')}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${
                    mealTiming === 'after'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text className="text-lg mb-1">✅</Text>
                  <Text
                    className={`text-sm font-medium ${
                      mealTiming === 'after' ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    After Meal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Insulin Units */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Insulin Units{' '}
                <Text className="text-gray-400 font-normal">(optional)</Text>
              </Text>
              <Text className="text-gray-400 text-xs mb-3">
                Enter the amount of insulin taken for this reading
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                  placeholder="e.g. 4"
                  placeholderTextColor="#9ca3af"
                  value={insulinUnits}
                  onChangeText={setInsulinUnits}
                  keyboardType="decimal-pad"
                />
                <Text className="ml-3 text-gray-500">units</Text>
              </View>
            </View>

            {/* Notes */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Notes{' '}
                <Text className="text-gray-400 font-normal">(optional)</Text>
              </Text>
              <Text className="text-gray-400 text-xs mb-3">
                Add context: symptoms, activity, diet, etc.
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                placeholder="e.g. Felt dizzy, skipped breakfast..."
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Timestamp info */}
            <View className="flex-row items-center px-1 mb-4">
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text className="text-gray-400 text-xs ml-1">
                Timestamp will be recorded as: {new Date().toLocaleString()}
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || saved}
              className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${
                saved
                  ? 'bg-green-500'
                  : saving
                  ? 'bg-blue-400'
                  : 'bg-blue-600'
              }`}
            >
              {saved ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white text-base font-semibold">Saved!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save" size={20} color="white" />
                  <Text className="text-white text-base font-semibold">
                    {saving ? 'Saving...' : 'Save Reading'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Reference Card */}
            <View className="mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Text className="text-blue-800 font-semibold text-sm mb-2">
                📊 Blood Sugar Reference
              </Text>
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-red-500" />
                  <Text className="text-blue-900 text-xs">Low: Below 70 mg/dL</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                  <Text className="text-blue-900 text-xs">Normal: 70–140 mg/dL</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-yellow-500" />
                  <Text className="text-blue-900 text-xs">Elevated: 141–200 mg/dL</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-red-600" />
                  <Text className="text-blue-900 text-xs">High: Above 200 mg/dL</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
