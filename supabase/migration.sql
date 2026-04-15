-- ============================================================
-- DiabaCare — Complete Database Migration
-- Run this entire script in Supabase SQL Editor → SQL
-- ============================================================


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Table already created by the auth trigger setup.
-- Add any missing columns here:

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name        TEXT,
  ADD COLUMN IF NOT EXISTS age              INTEGER,
  ADD COLUMN IF NOT EXISTS target_range_min INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS target_range_max INTEGER DEFAULT 140;

-- If the old `name` column exists, migrate data and clean up
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'name'
  ) THEN
    UPDATE public.profiles SET full_name = name WHERE full_name IS NULL;
    ALTER TABLE public.profiles DROP COLUMN name;
  END IF;
END $$;

-- Make sure RLS is on (it was set earlier but just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies cleanly
DROP POLICY IF EXISTS "Own profile"              ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ─── BLOOD SUGAR LOGS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blood_sugar_logs (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading       INTEGER     NOT NULL,
  meal_timing   TEXT        CHECK (meal_timing IN ('before', 'after')),
  insulin_units REAL,
  notes         TEXT,
  timestamp     TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blood_sugar_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bsl_select" ON public.blood_sugar_logs;
DROP POLICY IF EXISTS "bsl_insert" ON public.blood_sugar_logs;
DROP POLICY IF EXISTS "bsl_delete" ON public.blood_sugar_logs;

CREATE POLICY "bsl_select" ON public.blood_sugar_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bsl_insert" ON public.blood_sugar_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bsl_delete" ON public.blood_sugar_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bsl_user    ON public.blood_sugar_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bsl_ts      ON public.blood_sugar_logs(timestamp);


-- ─── DIET LOGS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.diet_logs (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type       TEXT        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name       TEXT        NOT NULL,
  estimated_carbs REAL,
  calories        REAL,
  portion         TEXT,
  notes           TEXT,
  timestamp       TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dl_select" ON public.diet_logs;
DROP POLICY IF EXISTS "dl_insert" ON public.diet_logs;
DROP POLICY IF EXISTS "dl_delete" ON public.diet_logs;

CREATE POLICY "dl_select" ON public.diet_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dl_insert" ON public.diet_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dl_delete" ON public.diet_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dl_user ON public.diet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dl_ts   ON public.diet_logs(timestamp);


-- ─── TEST RESULTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.test_results (
  id           TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  result_value TEXT        NOT NULL,
  unit         TEXT,
  notes        TEXT,
  date_logged  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tr_select" ON public.test_results;
DROP POLICY IF EXISTS "tr_insert" ON public.test_results;
DROP POLICY IF EXISTS "tr_delete" ON public.test_results;

CREATE POLICY "tr_select" ON public.test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tr_insert" ON public.test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tr_delete" ON public.test_results
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tr_user ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tr_date ON public.test_results(date_logged);


-- ─── WORKOUT LOGS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id               TEXT        PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type    TEXT        NOT NULL,
  duration_minutes INTEGER,
  timestamp        TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wl_select" ON public.workout_logs;
DROP POLICY IF EXISTS "wl_insert" ON public.workout_logs;
DROP POLICY IF EXISTS "wl_delete" ON public.workout_logs;

CREATE POLICY "wl_select" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wl_insert" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wl_delete" ON public.workout_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wl_user ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wl_ts   ON public.workout_logs(timestamp);
