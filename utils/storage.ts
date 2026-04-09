import AsyncStorage from '@react-native-async-storage/async-storage';
import { BloodSugarReading, Meal, LabTest, LabTestType, User } from '../types';

const KEYS = {
  READINGS: 'diabacare_readings',
  MEALS: 'diabacare_meals',
  LAB_TESTS: 'diabacare_lab_tests',
  USER: 'diabacare_user',
};

// ─── Blood Sugar Readings ───────────────────────────────────────────────────

export async function getReadings(): Promise<BloodSugarReading[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.READINGS);
    if (!raw) return [];
    return JSON.parse(raw) as BloodSugarReading[];
  } catch {
    return [];
  }
}

export async function saveReading(reading: BloodSugarReading): Promise<void> {
  const readings = await getReadings();
  readings.unshift(reading); // newest first
  await AsyncStorage.setItem(KEYS.READINGS, JSON.stringify(readings));
}

export async function deleteReading(id: string): Promise<void> {
  const readings = await getReadings();
  const updated = readings.filter((r) => r.id !== id);
  await AsyncStorage.setItem(KEYS.READINGS, JSON.stringify(updated));
}

export async function getTodaysReadings(): Promise<BloodSugarReading[]> {
  const readings = await getReadings();
  const today = new Date().toISOString().split('T')[0];
  return readings.filter((r) => r.timestamp.startsWith(today));
}

export async function getReadingsForDays(days: number): Promise<BloodSugarReading[]> {
  const readings = await getReadings();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return readings.filter((r) => new Date(r.timestamp) >= cutoff);
}

// ─── Meals ──────────────────────────────────────────────────────────────────

export async function getMeals(): Promise<Meal[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MEALS);
    if (!raw) return [];
    return JSON.parse(raw) as Meal[];
  } catch {
    return [];
  }
}

export async function saveMeal(meal: Meal): Promise<void> {
  const meals = await getMeals();
  meals.unshift(meal);
  await AsyncStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
}

export async function deleteMeal(id: string): Promise<void> {
  const meals = await getMeals();
  const updated = meals.filter((m) => m.id !== id);
  await AsyncStorage.setItem(KEYS.MEALS, JSON.stringify(updated));
}

export async function getTodaysMeals(): Promise<Meal[]> {
  const meals = await getMeals();
  const today = new Date().toISOString().split('T')[0];
  return meals.filter((m) => m.timestamp.startsWith(today));
}

// ─── Lab Tests ──────────────────────────────────────────────────────────────

export async function getLabTests(): Promise<LabTest[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAB_TESTS);
    if (!raw) return [];
    return JSON.parse(raw) as LabTest[];
  } catch {
    return [];
  }
}

export async function saveLabTest(test: LabTest): Promise<void> {
  const tests = await getLabTests();
  tests.unshift(test);
  await AsyncStorage.setItem(KEYS.LAB_TESTS, JSON.stringify(tests));
}

export async function deleteLabTest(id: string): Promise<void> {
  const tests = await getLabTests();
  const updated = tests.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEYS.LAB_TESTS, JSON.stringify(updated));
}

export async function getLatestLabTest(type: LabTestType): Promise<LabTest | null> {
  const tests = await getLabTests();
  const typeTests = tests.filter((t) => t.type === type);
  return typeTests.length > 0 ? typeTests[0] : null;
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function getUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function clearAllData(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((key) => AsyncStorage.removeItem(key)));
}
