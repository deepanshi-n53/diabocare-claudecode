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
import { generateId, formatTime } from '../../utils/helpers';
import { Meal } from '../../types';

type MealType = Meal['mealType'];

const MEAL_TYPES: { type: MealType; label: string; icon: string; color: string; bg: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#d97706', bg: '#fffbeb' },
  { type: 'lunch', label: 'Lunch', icon: '☀️', color: '#2563eb', bg: '#eff6ff' },
  { type: 'dinner', label: 'Dinner', icon: '🌙', color: '#7c3aed', bg: '#f5f3ff' },
  { type: 'snack', label: 'Snack', icon: '🍎', color: '#16a34a', bg: '#f0fdf4' },
];

export default function DietScreen() {
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
  const [portion, setPortion] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMeals = useCallback(async () => {
    const meals = await getTodaysMeals();
    setTodaysMeals(meals);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [loadMeals])
  );

  function resetForm() {
    setMealName('');
    setMealType('breakfast');
    setCarbs('');
    setCalories('');
    setPortion('');
    setNotes('');
  }

  async function handleSave() {
    if (!mealName.trim()) {
      Alert.alert('Missing Name', 'Please enter a meal name.');
      return;
    }
    if (carbs && (isNaN(Number(carbs)) || Number(carbs) < 0)) {
      Alert.alert('Invalid Carbs', 'Please enter a valid carb amount.');
      return;
    }
    if (calories && (isNaN(Number(calories)) || Number(calories) < 0)) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
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

    await saveMeal(meal);
    await loadMeals();
    setSaving(false);
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Meal', 'Remove this meal from today\'s log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(id);
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
              <Text className="text-2xl font-bold text-gray-900">Diet Log</Text>
              <Text className="text-gray-500 text-sm mt-0.5">Track today's meals</Text>
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
                  <Text className="text-xl font-bold text-gray-900 mt-1">
                    {Math.round(totalCarbs)}g
                  </Text>
                  <Text className="text-gray-500 text-xs">Total Carbs</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-2xl">🔥</Text>
                  <Text className="text-xl font-bold text-gray-900 mt-1">
                    {Math.round(totalCalories)}
                  </Text>
                  <Text className="text-gray-500 text-xs">Total Calories</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-2xl">🍽️</Text>
                  <Text className="text-xl font-bold text-gray-900 mt-1">
                    {todaysMeals.length}
                  </Text>
                  <Text className="text-gray-500 text-xs">Meals Today</Text>
                </View>
              </View>
            )}

            {/* Add Meal Form */}
            {showForm && (
              <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
                <Text className="text-base font-semibold text-gray-800 mb-4">
                  Add Meal
                </Text>

                {/* Meal Type Selector */}
                <View className="flex-row gap-2 mb-4">
                  {MEAL_TYPES.map((mt) => (
                    <TouchableOpacity
                      key={mt.type}
                      onPress={() => setMealType(mt.type)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        mealType === mt.type
                          ? 'border-blue-600'
                          : 'border-gray-200'
                      }`}
                      style={
                        mealType === mt.type ? { backgroundColor: mt.bg } : { backgroundColor: '#f9fafb' }
                      }
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
                  Meal Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
                  placeholder="e.g. Oatmeal with banana"
                  placeholderTextColor="#9ca3af"
                  value={mealName}
                  onChangeText={setMealName}
                />

                {/* Carbs & Calories Row */}
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Carbs (g)
                    </Text>
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
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Calories
                    </Text>
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
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Portion Size
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
                  placeholder="e.g. 1 cup, 200g, 1 slice..."
                  placeholderTextColor="#9ca3af"
                  value={portion}
                  onChangeText={setPortion}
                />

                {/* Notes */}
                <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
                  style={{ minHeight: 64, textAlignVertical: 'top' }}
                  placeholder="Any additional notes..."
                  placeholderTextColor="#9ca3af"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => { resetForm(); setShowForm(false); }}
                    className="flex-1 border border-gray-200 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-600 font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-3 items-center ${
                      saving ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
                  >
                    <Text className="text-white font-semibold">
                      {saving ? 'Saving...' : 'Save Meal'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Today's Meals */}
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <Text className="text-gray-800 font-semibold text-base mb-3">
                Today's Meals
              </Text>

              {todaysMeals.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-4xl mb-3">🥗</Text>
                  <Text className="text-gray-500 text-sm text-center">
                    No meals logged today.{'\n'}Tap the + button to add your first meal.
                  </Text>
                </View>
              ) : (
                todaysMeals.map((meal, index) => {
                  const meta = MEAL_TYPES.find((m) => m.type === meal.mealType)!;
                  return (
                    <View
                      key={meal.id}
                      className={`py-3 ${
                        index < todaysMeals.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <View className="flex-row items-start">
                        {/* Icon */}
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: meta.bg }}
                        >
                          <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-900 font-semibold text-sm flex-1" numberOfLines={1}>
                              {meal.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleDelete(meal.id)}
                              className="ml-2 p-1"
                            >
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>

                          <View className="flex-row items-center gap-2 mt-0.5">
                            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: meta.bg }}>
                              <Text className="text-xs font-medium" style={{ color: meta.color }}>
                                {meta.label}
                              </Text>
                            </View>
                            <Text className="text-gray-400 text-xs">
                              {formatTime(meal.timestamp)}
                            </Text>
                          </View>

                          {(meal.carbs !== undefined || meal.calories !== undefined) && (
                            <View className="flex-row gap-3 mt-1">
                              {meal.carbs !== undefined && (
                                <Text className="text-gray-500 text-xs">
                                  🍞 {meal.carbs}g carbs
                                </Text>
                              )}
                              {meal.calories !== undefined && (
                                <Text className="text-gray-500 text-xs">
                                  🔥 {meal.calories} kcal
                                </Text>
                              )}
                              {meal.portion && (
                                <Text className="text-gray-500 text-xs">
                                  · {meal.portion}
                                </Text>
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
              <Text className="text-green-800 font-semibold text-sm mb-1">
                🥦 Carb Counting Tip
              </Text>
              <Text className="text-green-700 text-xs leading-5">
                Monitoring carbohydrate intake is essential for managing blood sugar.
                Aim to spread carbs evenly throughout the day. Consult your dietitian
                for a personalized carb target.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
