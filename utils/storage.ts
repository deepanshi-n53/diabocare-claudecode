import { supabase } from '../lib/supabase';
import { BloodSugarReading, Meal, LabTest, LabTestType, User } from '../types';

/** Returns the current user id. Tries the session cache first; falls back
 *  to a network call so it works on web where AsyncStorage may not persist. */
async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;
  // Fallback: verified network call (works when localStorage has the token)
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Blood Sugar Readings ───────────────────────────────────────────────────

export async function getReadings(): Promise<BloodSugarReading[]> {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('blood_sugar_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      value: row.reading,
      mealTiming: row.meal_timing as 'before' | 'after',
      insulinUnits: row.insulin_units ?? undefined,
      notes: row.notes ?? undefined,
      timestamp: row.timestamp,
    }));
  } catch {
    return [];
  }
}

export async function saveReading(reading: BloodSugarReading): Promise<{ error: string | null }> {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated — please log in again.' };

  const { error } = await supabase.from('blood_sugar_logs').insert({
    id: reading.id,
    user_id: userId,
    reading: reading.value,
    meal_timing: reading.mealTiming,
    insulin_units: reading.insulinUnits ?? null,
    notes: reading.notes ?? null,
    timestamp: reading.timestamp,
  });

  if (error) {
    console.error('[saveReading]', error.code, error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function deleteReading(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('blood_sugar_logs').delete().eq('id', id);
  if (error) { console.error('[deleteReading]', error.message); return { error: error.message }; }
  return { error: null };
}

export async function updateReading(
  id: string,
  data: Partial<Pick<BloodSugarReading, 'value' | 'mealTiming' | 'insulinUnits' | 'notes'>>
): Promise<{ error: string | null }> {
  const update: Record<string, unknown> = {};
  if (data.value !== undefined) update.reading = data.value;
  if (data.mealTiming !== undefined) update.meal_timing = data.mealTiming;
  if ('insulinUnits' in data) update.insulin_units = data.insulinUnits ?? null;
  if ('notes' in data) update.notes = data.notes ?? null;
  const { error } = await supabase.from('blood_sugar_logs').update(update).eq('id', id);
  if (error) { console.error('[updateReading]', error.message); return { error: error.message }; }
  return { error: null };
}

export async function getTodaysReadings(): Promise<BloodSugarReading[]> {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('blood_sugar_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      value: row.reading,
      mealTiming: row.meal_timing as 'before' | 'after',
      insulinUnits: row.insulin_units ?? undefined,
      notes: row.notes ?? undefined,
      timestamp: row.timestamp,
    }));
  } catch {
    return [];
  }
}

export async function getReadingsForDays(days: number): Promise<BloodSugarReading[]> {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('blood_sugar_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', cutoff.toISOString())
      .order('timestamp', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      value: row.reading,
      mealTiming: row.meal_timing as 'before' | 'after',
      insulinUnits: row.insulin_units ?? undefined,
      notes: row.notes ?? undefined,
      timestamp: row.timestamp,
    }));
  } catch {
    return [];
  }
}

// ─── Meals ──────────────────────────────────────────────────────────────────

export async function getMeals(): Promise<Meal[]> {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.food_name,
      mealType: row.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      carbs: row.estimated_carbs ?? undefined,
      calories: row.calories ?? undefined,
      portion: row.portion ?? undefined,
      notes: row.notes ?? undefined,
      timestamp: row.timestamp,
    }));
  } catch {
    return [];
  }
}

export async function saveMeal(meal: Meal): Promise<{ error: string | null }> {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated — please log in again.' };

  const { error } = await supabase.from('diet_logs').insert({
    id: meal.id,
    user_id: userId,
    meal_type: meal.mealType,
    food_name: meal.name,
    estimated_carbs: meal.carbs ?? null,
    calories: meal.calories ?? null,
    portion: meal.portion ?? null,
    notes: meal.notes ?? null,
    timestamp: meal.timestamp,
  });

  if (error) { console.error('[saveMeal]', error.code, error.message); return { error: error.message }; }
  return { error: null };
}

export async function deleteMeal(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('diet_logs').delete().eq('id', id);
  if (error) { console.error('[deleteMeal]', error.message); return { error: error.message }; }
  return { error: null };
}

export async function getTodaysMeals(): Promise<Meal[]> {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.food_name,
      mealType: row.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      carbs: row.estimated_carbs ?? undefined,
      calories: row.calories ?? undefined,
      portion: row.portion ?? undefined,
      notes: row.notes ?? undefined,
      timestamp: row.timestamp,
    }));
  } catch {
    return [];
  }
}

// ─── Lab Tests ──────────────────────────────────────────────────────────────

export async function getLabTests(): Promise<LabTest[]> {
  try {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('date_logged', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      type: row.type as LabTestType,
      value: row.result_value,
      unit: row.unit ?? '',
      date: row.date_logged,
      notes: row.notes ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function saveLabTest(test: LabTest): Promise<{ error: string | null }> {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated — please log in again.' };

  const { error } = await supabase.from('test_results').insert({
    id: test.id,
    user_id: userId,
    type: test.type,
    result_value: test.value,
    unit: test.unit || null,
    notes: test.notes ?? null,
    date_logged: test.date,
  });

  if (error) { console.error('[saveLabTest]', error.code, error.message); return { error: error.message }; }
  return { error: null };
}

export async function deleteLabTest(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('test_results').delete().eq('id', id);
  if (error) { console.error('[deleteLabTest]', error.message); return { error: error.message }; }
  return { error: null };
}

export async function getLatestLabTest(type: LabTestType): Promise<LabTest | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('date_logged', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      type: data.type as LabTestType,
      value: data.result_value,
      unit: data.unit ?? '',
      date: data.date_logged,
      notes: data.notes ?? undefined,
    };
  } catch {
    return null;
  }
}

// ─── User ────────────────────────────────────────────────────────────────────
// Profile data is managed via Supabase Auth + AuthContext (lib/supabase.ts Profile type).
// These stubs keep existing import sites compiling without changes.

export async function getUser(): Promise<User | null> {
  return null;
}

export async function saveUser(_user: User): Promise<void> {
  // no-op: replaced by Supabase profiles table
}

export async function clearAllData(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await Promise.all([
    supabase.from('blood_sugar_logs').delete().eq('user_id', userId),
    supabase.from('diet_logs').delete().eq('user_id', userId),
    supabase.from('test_results').delete().eq('user_id', userId),
    supabase.from('workout_logs').delete().eq('user_id', userId),
  ]);
}
