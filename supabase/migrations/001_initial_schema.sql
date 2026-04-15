-- ============================================================
-- DiabaCare — Initial Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               text,
  diabetes_type           text CHECK (diabetes_type IN ('type1','type2','gestational','prediabetes')),
  age                     int  CHECK (age > 0 AND age < 120),
  target_range_min        int  DEFAULT 70,
  target_range_max        int  DEFAULT 140,
  language                text DEFAULT 'en',
  emergency_contact_name  text,
  emergency_contact_phone text,
  streak_count            int  DEFAULT 0,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- ── blood_sugar_logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blood_sugar_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reading       numeric NOT NULL CHECK (reading > 0 AND reading < 1000),
  meal_timing   text    CHECK (meal_timing IN ('before','after')),
  insulin_units numeric,
  notes         text,
  source        text DEFAULT 'manual',
  timestamp     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz DEFAULT now()
);

-- ── diet_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type       text CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name       text NOT NULL,
  estimated_carbs numeric CHECK (estimated_carbs >= 0),
  calories        numeric,
  portion         text,
  notes           text,
  timestamp       timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- ── workout_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type    text NOT NULL,
  duration_minutes int  NOT NULL CHECK (duration_minutes > 0),
  calories_burned  int,
  timestamp        timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- ── test_results ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_results (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type         text CHECK (type IN ('hba1c','kidney','lipid','uacr','blood_pressure','eye_checkup')),
  result_value text NOT NULL,
  unit         text,
  notes        text,
  status       text CHECK (status IN ('normal','warning','critical')),
  date_logged  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

-- ── medications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  medication_name   text NOT NULL,
  dose              numeric NOT NULL,
  unit              text NOT NULL,
  scheduled_time    time,
  is_active         bool DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- ── medication_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  medication_id  uuid REFERENCES medications(id) ON DELETE CASCADE,
  taken_at       timestamptz,
  scheduled_at   timestamptz NOT NULL,
  missed         bool DEFAULT false,
  dose_taken     numeric,
  created_at     timestamptz DEFAULT now()
);

-- ── Enable RLS ───────────────────────────────────────────────
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_sugar_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results     ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs  ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own profile"            ON profiles;
DROP POLICY IF EXISTS "Users manage own blood sugar logs"   ON blood_sugar_logs;
DROP POLICY IF EXISTS "Users manage own diet logs"          ON diet_logs;
DROP POLICY IF EXISTS "Users manage own workout logs"       ON workout_logs;
DROP POLICY IF EXISTS "Users manage own test results"       ON test_results;
DROP POLICY IF EXISTS "Users manage own medications"        ON medications;
DROP POLICY IF EXISTS "Users manage own medication logs"    ON medication_logs;

CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own blood sugar logs"
  ON blood_sugar_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own diet logs"
  ON diet_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own workout logs"
  ON workout_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own test results"
  ON test_results FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own medications"
  ON medications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own medication logs"
  ON medication_logs FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blood_sugar_user_time ON blood_sugar_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_diet_user_time        ON diet_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_workout_user_time     ON workout_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_test_user_type        ON test_results(user_id, type, date_logged DESC);
CREATE INDEX IF NOT EXISTS idx_med_logs_user         ON medication_logs(user_id, scheduled_at DESC);

-- ── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup even if the profiles insert fails
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
