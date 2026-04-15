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
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { saveMeal, getTodaysMeals, deleteMeal } from '../../utils/storage';
import { isValidCarbs } from '../../utils/validators';
import { generateId, formatTime } from '../../utils/helpers';
import { Meal } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

type MealType = Meal['mealType'];

export default function DietScreen() {
  const { t } = useLanguage();
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
  const [portion, setPortion] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const MEAL_TYPES: { type: MealType; label: string; icon: string; color: string; bg: string }[] = [
    { type: 'breakfast', label: t.diet.breakfast, icon: '🌅', color: '#d97706', bg: '#fffbeb' },
    { type: 'lunch', label: t.diet.lunch, icon: '☀️', color: '#2563eb', bg: '#eff6ff' },
    { type: 'dinner', label: t.diet.dinner, icon: '🌙', color: '#7c3aed', bg: '#f5f3ff' },
    { type: 'snack', label: t.diet.snack, icon: '🍎', color: '#16a34a', bg: '#f0fdf4' },
  ];

  const loadMeals = useCallback(async () => {
    const meals = await getTodaysMeals();
    setTodaysMeals(meals);
  }, []);

  useFocusEffect(
    useCallback(() => { loadMeals(); }, [loadMeals])
  );

  function resetForm() {
    setMealName(''); setMealType('breakfast');
    setCarbs(''); setCalories(''); setPortion(''); setNotes('');
  }

  async function handleSave() {
    if (!mealName.trim()) { Alert.alert('', t.errors.missingMealName); return; }
    if (carbs && (isNaN(Number(carbs)) || !isValidCarbs(Number(carbs)))) {
      Alert.alert('', t.errors.invalidCarbs); return;
    }
    if (calories && (isNaN(Number(calories)) || Number(calories) < 0)) {
      Alert.alert('', t.errors.invalidCalories); return;
    }

    setSaving(true);
    const meal: Meal = {
      id: generateId(),
      name: mealName.trim(),
      mealType,
      carbs: carbs ? parseFloat(carbs) : undefined,
      calories: calories ? parseFloat(calories) : undefined,
      portion: portion.trim() || undefined,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    const { error: saveError } = await saveMeal(meal);
    setSaving(false);
    if (saveError) { Alert.alert('Save Failed', saveError); return; }
    await loadMeals();
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('', 'Delete this meal?', [
      { text: t.settings.cancelBtn, style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteMeal(id);
          if (error) { Alert.alert('Delete Failed', error); return; }
          await loadMeals();
        },
      },
    ]);
  }

  const totalCarbs = todaysMeals.reduce((sum, m) => sum + (m.carbs ?? 0), 0);
  const totalCalories = todaysMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);

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
          <View className="bg-white px-5 py-4 border-b border-gray-100 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-gray-900">{t.diet.title}</Text>
              <Text className="text-gray-500 text-sm mt-0.5">{t.diet.subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowForm(!showForm)}
              className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center"
            >
              <Ionicons name={showForm ? 'close' : 'add'} size={22} color="white" />
            </TouchableOpacity>
          </View>

          <View className="px-4 pt-4">
            {/* Daily summary */}
            {todaysMeals.length > 0 && (
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-2xl">🍞</Text>
                  <Text className="text-xl font-bold text-gray-900 mt-1">{Math.round(totalCarbs)}g</Text>
                  <Text className="text-gray-500 text-xs">{t.diet.totalCarbs}</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-2xl">🔥</Text>
                  <Text className="text-xl font-bold text-gray-900 mt-1">{Math.round(totalCalories)}</Text>
                  <Text className="text-gray-500 text-xs">{t.diet.totalCalories}</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-2xl">🍽️</Text>
                  <Text className="text-xl font-bold text-gray-900 mt-1">{todaysMeals.length}</Text>
                  <Text className="text-gray-500 text-xs">{t.diet.mealsToday}</Text>
                </View>
              </View>
            )}

            {/* Add Meal Form */}
            {showForm && (
              <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
                <Text className="text-base font-semibold text-gray-800 mb-4">{t.diet.formTitle}</Text>

                {/* Meal Type Selector */}
                <View className="flex-row gap-2 mb-4">
                  {MEAL_TYPES.map((mt) => (
                    <TouchableOpacity
                      key={mt.type}
                      onPress={() => setMealType(mt.type)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        mealType === mt.type ? 'border-blue-600' : 'border-gray-200'
                      }`}
                      style={mealType === mt.type ? { backgroundColor: mt.bg } : { backgroundColor: '#f9fafb' }}
                    >
                      <Text style={{ fontSize: 16 }}>{mt.icon}</Text>
                      <Text
                        className="text-xs mt-0.5"
                        style={{ color: mealType === mt.type ? mt.color : '#9ca3af', fontWeight: mealType === mt.type ? '600' : '400' }}
                      >
                        {mt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Meal Name */}
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  {t.diet.mealName} <Text className="text-red-500">{t.diet.mealNameRequired}</Text>
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
                  placeholder={t.diet.mealNamePH}
                  placeholderTextColor="#9ca3af"
                  value={mealName}
                  onChangeText={setMealName}
                />

                {/* Carbs & Calories Row */}
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t.diet.carbs}</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t.diet.calories}</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Portion */}
                <Text className="text-sm font-medium text-gray-700 mb-1">{t.diet.portion}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
                  placeholder={t.diet.portionPH}
                  placeholderTextColor="#9ca3af"
                  value={portion}
                  onChangeText={setPortion}
                />

                {/* Notes */}
                <Text className="text-sm font-medium text-gray-700 mb-1">{t.diet.notes}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
                  style={{ minHeight: 64, textAlignVertical: 'top' }}
                  placeholder="..."
                  placeholderTextColor="#9ca3af"
                  value={notes}
                  onChangeText={setNotes}
                  multiline={true}
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => { resetForm(); setShowForm(false); }}
                    className="flex-1 border border-gray-200 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-600 font-medium">{t.diet.cancelBtn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-3 items-center ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
                  >
                    <Text className="text-white font-semibold">
                      {saving ? t.diet.saving : t.diet.saveBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Today's Meals */}
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <Text className="text-gray-800 font-semibold text-base mb-3">{t.diet.todayMeals}</Text>

              {todaysMeals.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-4xl mb-3">🥗</Text>
                  <Text className="text-gray-500 text-sm text-center">
                    {t.diet.noMeals}{'\n'}{t.diet.noMealsSub}
                  </Text>
                </View>
              ) : (
                todaysMeals.map((meal, index) => {
                  const meta = MEAL_TYPES.find((m) => m.type === meal.mealType)!;
                  return (
                    <View
                      key={meal.id}
                      className={`py-3 ${index < todaysMeals.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <View className="flex-row items-start">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: meta.bg }}
                        >
                          <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-900 font-semibold text-sm flex-1" numberOfLines={1}>
                              {meal.name}
                            </Text>
                            <TouchableOpacity onPress={() => handleDelete(meal.id)} className="ml-2 p-1">
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>

                          <View className="flex-row items-center gap-2 mt-0.5">
                            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: meta.bg }}>
                              <Text className="text-xs font-medium" style={{ color: meta.color }}>
                                {meta.label}
                              </Text>
                            </View>
                            <Text className="text-gray-400 text-xs">{formatTime(meal.timestamp)}</Text>
                          </View>

                          {(meal.carbs !== undefined || meal.calories !== undefined) && (
                            <View className="flex-row gap-3 mt-1">
                              {meal.carbs !== undefined && (
                                <Text className="text-gray-500 text-xs">🍞 {meal.carbs}g {t.diet.carbsUnit}</Text>
                              )}
                              {meal.calories !== undefined && (
                                <Text className="text-gray-500 text-xs">🔥 {meal.calories} {t.diet.kcal}</Text>
                              )}
                              {meal.portion && (
                                <Text className="text-gray-500 text-xs">· {meal.portion}</Text>
                              )}
                            </View>
                          )}

                          {meal.notes && (
                            <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                              {meal.notes}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Tip */}
            <View className="mt-4 bg-green-50 rounded-2xl p-4 border border-green-100">
              <Text className="text-green-800 font-semibold text-sm mb-1">🥦 {t.diet.tipTitle}</Text>
              <Text className="text-green-700 text-xs leading-5">{t.diet.tipBody}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
