-- ============================================================
-- EJECUTA ESTO en Supabase → SQL Editor → New Query
-- Crea la tabla de perfiles de usuario
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  weight_kg   NUMERIC(5,1),   -- peso corporal para calcular calorías
  height_cm   INT,            -- altura en cm
  age         INT,
  sex         TEXT CHECK (sex IN ('male', 'female')),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());
