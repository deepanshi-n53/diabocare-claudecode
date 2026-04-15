import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getLabTests, saveLabTest } from '../../utils/storage';
import { generateId, formatDate } from '../../utils/helpers';
import { LabTest, LabTestType, LabTestMeta } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

type TestStatus = 'normal' | 'warning' | 'critical';

const REFERENCE_RANGES: Partial<Record<LabTestType, { ranges: { max: number; label: string; status: TestStatus }[] }>> = {
  hba1c: {
    ranges: [
      { max: 5.7, label: 'Normal', status: 'normal' },
      { max: 6.4, label: 'Prediabetes', status: 'warning' },
      { max: 999, label: 'Diabetes range', status: 'critical' },
    ],
  },
  kidney: {
    ranges: [
      { max: 1.2, label: 'Normal creatinine', status: 'normal' },
      { max: 2.0, label: 'Mildly elevated', status: 'warning' },
      { max: 999, label: 'High — see doctor', status: 'critical' },
    ],
  },
  lipid: {
    ranges: [
      { max: 200, label: 'Desirable', status: 'normal' },
      { max: 239, label: 'Borderline high', status: 'warning' },
      { max: 999, label: 'High cholesterol', status: 'critical' },
    ],
  },
  uacr: {
    ranges: [
      { max: 30, label: 'Normal', status: 'normal' },
      { max: 300, label: 'Microalbuminuria', status: 'warning' },
      { max: 9999, label: 'Macroalbuminuria', status: 'critical' },
    ],
  },
};

function getTestStatus(type: LabTestType, value: string): TestStatus | null {
  const ref = REFERENCE_RANGES[type];
  if (!ref) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  for (const range of ref.ranges) {
    if (num <= range.max) return range.status;
  }
  return null;
}

function getTestStatusLabel(type: LabTestType, value: string): string | null {
  const ref = REFERENCE_RANGES[type];
  if (!ref) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  for (const range of ref.ranges) {
    if (num <= range.max) return range.label;
  }
  return null;
}

const STATUS_COLORS: Record<TestStatus, { text: string; bg: string }> = {
  normal: { text: '#16a34a', bg: '#dcfce7' },
  warning: { text: '#d97706', bg: '#fef3c7' },
  critical: { text: '#dc2626', bg: '#fee2e2' },
};

const LAB_TEST_META: LabTestMeta[] = [
  { type: 'hba1c', label: 'HbA1c', unit: '%', icon: '🩸', normalRange: '< 5.7%', description: 'Average blood sugar over 2–3 months' },
  { type: 'kidney', label: 'Kidney Profile', unit: 'mg/dL', icon: '🫘', normalRange: 'Creatinine < 1.2', description: 'Kidney function assessment' },
  { type: 'lipid', label: 'Lipid Profile', unit: 'mg/dL', icon: '💛', normalRange: 'LDL < 100 mg/dL', description: 'Cholesterol and triglyceride levels' },
  { type: 'uacr', label: 'UACR Test', unit: 'mg/g', icon: '💧', normalRange: '< 30 mg/g', description: 'Urine albumin-to-creatinine ratio' },
  { type: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: '❤️', normalRange: '< 120/80 mmHg', description: 'Systolic and diastolic pressure' },
  { type: 'eye_checkup', label: 'Eye Checkup', unit: '', icon: '👁️', normalRange: 'No retinopathy', description: 'Diabetic eye exam (retinopathy screening)' },
];

export default function TestsScreen() {
  const { t } = useLanguage();
  const [latestTests, setLatestTests] = useState<Record<LabTestType, LabTest | null>>(
    {} as Record<LabTestType, LabTest | null>
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<LabTestMeta | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const tests = await getLabTests();
    const map: Record<string, LabTest | null> = {};
    for (const meta of LAB_TEST_META) {
      const typeTests = tests.filter((t) => t.type === meta.type);
      map[meta.type] = typeTests.length > 0 ? typeTests[0] : null;
    }
    setLatestTests(map as Record<LabTestType, LabTest | null>);
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  function openModal(meta: LabTestMeta) {
    setSelectedMeta(meta);
    setInputValue('');
    setInputNotes('');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!selectedMeta) return;
    if (!inputValue.trim()) { Alert.alert('', t.errors.missingTestValue); return; }

    setSaving(true);
    const test: LabTest = {
      id: generateId(),
      type: selectedMeta.type,
      value: inputValue.trim(),
      unit: selectedMeta.unit,
      date: new Date().toISOString(),
      notes: inputNotes.trim() || undefined,
    };

    const { error: saveError } = await saveLabTest(test);
    setSaving(false);
    if (saveError) { Alert.alert('Save Failed', saveError); return; }
    await loadData();
    setModalVisible(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{t.tests.title}</Text>
        <Text className="text-gray-500 text-sm mt-0.5">{t.tests.subtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="gap-3">
          {LAB_TEST_META.map((meta) => {
            const latest = latestTests[meta.type];
            return (
              <TouchableOpacity
                key={meta.type}
                onPress={() => openModal(meta)}
                className="bg-white rounded-2xl shadow-sm p-5 flex-row items-center"
              >
                <View className="w-14 h-14 rounded-2xl bg-gray-50 items-center justify-center mr-4">
                  <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">{meta.label}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{meta.description}</Text>

                  {latest ? (
                    <View className="mt-2 flex-row items-center gap-2 flex-wrap">
                      <Text className="text-blue-600 font-bold text-sm">
                        {latest.value}{latest.unit ? ` ${latest.unit}` : ''}
                      </Text>
                      <Text className="text-gray-400 text-xs">· {formatDate(latest.date)}</Text>
                      {(() => {
                        const st = getTestStatus(meta.type, latest.value);
                        const lb = getTestStatusLabel(meta.type, latest.value);
                        if (!st || !lb) return null;
                        const colors = STATUS_COLORS[st];
                        return (
                          <View
                            style={{ backgroundColor: colors.bg }}
                            className="rounded-full px-2 py-0.5"
                          >
                            <Text style={{ color: colors.text }} className="text-xs font-semibold">
                              {lb}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  ) : (
                    <Text className="text-gray-400 text-xs mt-1 italic">{t.tests.noResult}</Text>
                  )}

                  {meta.normalRange && (
                    <Text className="text-gray-300 text-xs mt-0.5">
                      {t.tests.normal} {meta.normalRange}
                    </Text>
                  )}
                </View>

                <View className="ml-2">
                  <Ionicons name="add-circle-outline" size={22} color="#2563eb" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <Text className="text-blue-800 font-semibold text-sm mb-1">💡 {t.tests.tipTitle}</Text>
          <Text className="text-blue-700 text-xs leading-5">{t.tests.tipBody}</Text>
        </View>
      </ScrollView>

      {/* Add Result Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View>
                <Text className="text-xl font-bold text-gray-900">
                  {selectedMeta?.icon} {selectedMeta?.label}
                </Text>
                <Text className="text-gray-500 text-sm">{selectedMeta?.description}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Value Input */}
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {t.tests.modalResult} <Text className="text-red-500">*</Text>
              </Text>
              {selectedMeta?.type === 'eye_checkup' ? (
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
                  placeholder="e.g. No retinopathy, Mild NPDR..."
                  placeholderTextColor="#9ca3af"
                  value={inputValue}
                  onChangeText={setInputValue}
                />
              ) : (
                <View className="flex-row items-center mb-4">
                  <TextInput
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                    placeholder={
                      selectedMeta?.type === 'blood_pressure' ? 'e.g. 120/80' :
                      selectedMeta?.type === 'hba1c' ? 'e.g. 6.5' : 'Enter value'
                    }
                    placeholderTextColor="#9ca3af"
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType={selectedMeta?.type === 'blood_pressure' ? 'default' : 'decimal-pad'}
                  />
                  {selectedMeta?.unit ? (
                    <Text className="ml-3 text-gray-500 font-medium">{selectedMeta.unit}</Text>
                  ) : null}
                </View>
              )}

              {/* Date info */}
              <View className="flex-row items-center mb-4 gap-1">
                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                <Text className="text-gray-400 text-xs">
                  {t.tests.modalDate} {new Date().toLocaleDateString()}
                </Text>
              </View>

              {/* Normal Range */}
              {selectedMeta?.normalRange && (
                <View className="bg-green-50 rounded-xl p-3 mb-4 flex-row items-center gap-2">
                  <Ionicons name="information-circle" size={16} color="#16a34a" />
                  <Text className="text-green-700 text-xs">
                    {t.tests.modalNormalRange} {selectedMeta.normalRange}
                  </Text>
                </View>
              )}

              {/* Notes */}
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {t.tests.modalNotes}{' '}
                <Text className="text-gray-400 font-normal">{t.tests.modalNotesOptional}</Text>
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                placeholder={t.tests.modalNotesPH}
                placeholderTextColor="#9ca3af"
                value={inputNotes}
                onChangeText={setInputNotes}
                multiline={true}
              />

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className={`rounded-2xl py-4 items-center ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
              >
                <Text className="text-white text-base font-semibold">
                  {saving ? t.tests.saving : t.tests.saveBtn}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
