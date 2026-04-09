export interface BloodSugarReading {
  id: string;
  value: number; // mg/dL
  mealTiming: 'before' | 'after';
  insulinUnits?: number;
  notes?: string;
  timestamp: string; // ISO string
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
  diabetesType?: 'Type 1' | 'Type 2' | 'Gestational' | 'Pre-diabetes';
  targetMin: number; // mg/dL
  targetMax: number; // mg/dL
  onboardingComplete: boolean;
}

export type BloodSugarStatus = 'low' | 'normal' | 'high' | 'very_high';
