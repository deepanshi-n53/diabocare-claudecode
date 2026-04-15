export interface BloodSugarReading {
  id: string;
  value: number; // mg/dL
  mealTiming: 'before' | 'after';
  insulinUnits?: number;
  notes?: string;
  timestamp: string; // ISO string
  source?: 'manual' | 'cgm';
}

export interface Meal {
  id: string;
  name: string;
  carbs?: number; // grams
  calories?: number;
  portion?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  timestamp: string; // ISO string
}

export interface LabTest {
  id: string;
  type: LabTestType;
  value: string;
  unit: string;
  date: string; // ISO string
  notes?: string;
  status?: 'normal' | 'warning' | 'critical';
}

export type LabTestType =
  | 'hba1c'
  | 'kidney'
  | 'lipid'
  | 'uacr'
  | 'blood_pressure'
  | 'eye_checkup';

export interface LabTestMeta {
  type: LabTestType;
  label: string;
  unit: string;
  icon: string;
  normalRange?: string;
  description: string;
}

export interface User {
  name: string;
  age?: number;
  diabetesType?: 'type1' | 'type2' | 'gestational' | 'prediabetes';
  targetMin: number; // mg/dL
  targetMax: number; // mg/dL
  onboardingComplete: boolean;
}

export interface Medication {
  id: string;
  user_id: string;
  medication_name: string;
  dose: number;
  unit: string;
  scheduled_time?: string; // HH:MM
  is_active: boolean;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_id: string;
  taken_at?: string; // ISO string
  scheduled_at: string; // ISO string
  missed: boolean;
  dose_taken?: number;
  created_at: string;
}

export type BloodSugarStatus = 'low' | 'normal' | 'high' | 'very_high';
