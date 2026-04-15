import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  saveReading,
  getTodaysReadings,
  deleteReading,
  updateReading,
} from '../../utils/storage';
import {
  generateId,
  getBloodSugarStatus,
  getStatusColor,
  getStatusBgColor,
  formatTime,
  getStatusLabel,
} from '../../utils/helpers';
import {
  isValidBloodSugar,
  isValidInsulin,
  getBloodSugarAlert,
} from '../../utils/validators';
import { BloodSugarReading } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import CriticalAlert from '../../components/CriticalAlert';

export default function LogScreen() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  // ── Form state ──────────────────────────────────────
  const [value, setValue] = useState('');
  const [mealTiming, setMealTiming] = useState<'before' | 'after'>('before');
  const [insulinUnits, setInsulinUnits] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Today's readings ─────────────────────────────────
  const [todaysReadings, setTodaysReadings] = useState<BloodSugarReading[]>([]);

  // ── Critical alert ───────────────────────────────────
  const [criticalAlert, setCriticalAlert] = useState<{
    reading: number;
    type: 'critical-low' | 'critical-high';
  } | null>(null);

  // ── Edit modal ───────────────────────────────────────
  const [editReading, setEditReading] = useState<BloodSugarReading | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editMealTiming, setEditMealTiming] = useState<'before' | 'after'>('before');
  const [editInsulin, setEditInsulin] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const parsedValue = parseInt(value, 10);
  const isValidValue = !isNaN(parsedValue) && isValidBloodSugar(parsedValue);

  const loadReadings = useCallback(async () => {
    const readings = await getTodaysReadings();
    setTodaysReadings(readings);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReadings();
    }, [loadReadings])
  );

  function getPreviewStatus() {
    if (!isValidValue) return null;
    return getBloodSugarStatus(parsedValue);
  }

  async function handleSave() {
    if (!value.trim()) {
      Alert.alert('', t.errors.missingBS);
      return;
    }
    if (!isValidValue) {
      Alert.alert('', t.errors.invalidBS);
      return;
    }
    const insulinNum = insulinUnits ? parseFloat(insulinUnits) : undefined;
    if (insulinNum !== undefined && !isValidInsulin(insulinNum)) {
      Alert.alert('', t.errors.invalidInsulin);
      return;
    }

    setSaving(true);
    const reading: BloodSugarReading = {
      id: generateId(),
      value: parsedValue,
      mealTiming,
      insulinUnits: insulinNum,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
      source: 'manual',
    };

    const { error: saveError } = await saveReading(reading);
    if (saveError) {
      setSaving(false);
      Alert.alert('Save Failed', saveError);
      return;
    }
    await loadReadings();
    setSaving(false);
    setSaved(true);

    // Check for critical or out-of-range alert
    const targetMin = profile?.target_range_min ?? 70;
    const targetMax = profile?.target_range_max ?? 140;
    const alertLevel = getBloodSugarAlert(parsedValue, targetMin, targetMax);
    if (alertLevel === 'critical-low' || alertLevel === 'critical-high') {
      setCriticalAlert({ reading: parsedValue, type: alertLevel });
    } else if (alertLevel === 'low') {
      Alert.alert(
        '⚠️ Low Blood Sugar',
        `${parsedValue} mg/dL is below your target minimum of ${targetMin} mg/dL. Consider eating a small snack.`
      );
    } else if (alertLevel === 'high') {
      Alert.alert(
        '⚠️ High Blood Sugar',
        `${parsedValue} mg/dL is above your target maximum of ${targetMax} mg/dL. Consult your care plan.`
      );
    }

    setTimeout(() => {
      setValue('');
      setMealTiming('before');
      setInsulinUnits('');
      setNotes('');
      setSaved(false);
    }, 1500);
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this blood sugar reading?',
      [
        { text: t.settings.cancelBtn, style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReading(id);
            await loadReadings();
          },
        },
      ]
    );
  }

  function openEditModal(reading: BloodSugarReading) {
    setEditReading(reading);
    setEditValue(String(reading.value));
    setEditMealTiming(reading.mealTiming);
    setEditInsulin(reading.insulinUnits != null ? String(reading.insulinUnits) : '');
    setEditNotes(reading.notes ?? '');
  }

  async function handleEditSave() {
    if (!editReading) return;
    const parsed = parseInt(editValue, 10);
    if (isNaN(parsed) || !isValidBloodSugar(parsed)) {
      Alert.alert('', t.errors.invalidBS);
      return;
    }
    setEditSaving(true);
    await updateReading(editReading.id, {
      value: parsed,
      mealTiming: editMealTiming,
      insulinUnits: editInsulin ? parseFloat(editInsulin) : undefined,
      notes: editNotes.trim() || undefined,
    });
    await loadReadings();
    setEditSaving(false);
    setEditReading(null);
  }

  const previewStatus = getPreviewStatus();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Critical Alert overlay */}
      {criticalAlert && (
        <CriticalAlert
          reading={criticalAlert.reading}
          type={criticalAlert.type}
          onDismiss={() => setCriticalAlert(null)}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={editReading !== null}
        animationType="slide"
        onRequestClose={() => setEditReading(null)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Edit Reading</Text>
              <TouchableOpacity
                onPress={() => setEditReading(null)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Blood Sugar */}
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {t.log.bloodSugar} <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center mb-4">
                <TextInput
                  className="flex-1 border-2 border-blue-200 rounded-xl px-4 py-3 text-gray-900 text-center"
                  style={{ fontSize: 32, fontWeight: 'bold' }}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="---"
                  placeholderTextColor="#d1d5db"
                />
                <Text className="ml-3 text-gray-500 font-medium">mg/dL</Text>
              </View>

              {/* Meal Timing */}
              <Text className="text-sm font-medium text-gray-700 mb-2">{t.log.when}</Text>
              <View className="flex-row gap-3 mb-4">
                {(['before', 'after'] as const).map((timing) => (
                  <TouchableOpacity
                    key={timing}
                    onPress={() => setEditMealTiming(timing)}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${
                      editMealTiming === timing
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${editMealTiming === timing ? 'text-blue-700' : 'text-gray-600'}`}>
                      {timing === 'before' ? t.log.beforeMeal : t.log.afterMeal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Insulin */}
              <Text className="text-sm font-medium text-gray-700 mb-1">{t.log.insulinTitle}</Text>
              <View className="flex-row items-center mb-4">
                <TextInput
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                  placeholder={t.log.insulinPlaceholder}
                  placeholderTextColor="#9ca3af"
                  value={editInsulin}
                  onChangeText={setEditInsulin}
                  keyboardType="decimal-pad"
                />
                <Text className="ml-3 text-gray-500">{t.log.units}</Text>
              </View>

              {/* Notes */}
              <Text className="text-sm font-medium text-gray-700 mb-1">{t.log.notesTitle}</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                placeholder={t.log.notesPlaceholder}
                placeholderTextColor="#9ca3af"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                maxLength={500}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setEditReading(null)}
                  className="flex-1 border border-gray-200 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-gray-600 font-medium">{t.diet.cancelBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditSave}
                  disabled={editSaving}
                  className={`flex-1 rounded-xl py-3.5 items-center ${editSaving ? 'bg-blue-400' : 'bg-blue-600'}`}
                >
                  <Text className="text-white font-semibold">
                    {editSaving ? t.log.saving : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

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
                <View className="flex-1">
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
                multiline
                numberOfLines={3}
                maxLength={500}
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

            {/* Today's Readings History */}
            {todaysReadings.length > 0 && (
              <View className="mt-4 bg-white rounded-2xl shadow-sm p-5">
                <Text className="text-gray-800 font-semibold text-base mb-1">
                  Today's Readings
                </Text>
                <Text className="text-gray-400 text-xs mb-3">Long-press a reading to edit it</Text>

                {todaysReadings.map((reading, index) => {
                  const status = getBloodSugarStatus(reading.value);
                  return (
                    <TouchableOpacity
                      key={reading.id}
                      onLongPress={() => openEditModal(reading)}
                      activeOpacity={0.7}
                      className={`flex-row items-center py-3 ${
                        index < todaysReadings.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <View
                        style={{ backgroundColor: getStatusBgColor(status) }}
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      >
                        <Text
                          style={{ color: getStatusColor(status) }}
                          className="font-bold text-sm"
                        >
                          {reading.value}
                        </Text>
                      </View>

                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium text-sm">
                          {reading.value} mg/dL
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {formatTime(reading.timestamp)} ·{' '}
                          {reading.mealTiming === 'before' ? t.home.beforeMeal : t.home.afterMeal}
                          {reading.insulinUnits
                            ? ` · ${reading.insulinUnits}u ${t.home.insulin}`
                            : ''}
                        </Text>
                      </View>

                      <View
                        style={{ backgroundColor: getStatusBgColor(status) }}
                        className="rounded-full px-2 py-0.5 mr-2"
                      >
                        <Text
                          style={{ color: getStatusColor(status) }}
                          className="text-xs font-medium"
                        >
                          {getStatusLabel(status)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDelete(reading.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
