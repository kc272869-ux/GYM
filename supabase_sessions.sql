-- ============================================================
-- EJECUTA ESTO en Supabase → SQL Editor → New Query
-- Agrega la tabla sessions y vincula workout_logs a ella
-- ============================================================

-- Tabla de sesiones de entrenamiento
CREATE TABLE sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,                        -- nombre opcional ej: "Día A - Pecho"
  logged_at  TIMESTAMPTZ DEFAULT now()    -- fecha/hora de la sesión
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Agregar columna session_id a workout_logs
ALTER TABLE workout_logs
  ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_logs_session ON workout_logs(session_id);

-- RLS para sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE USING (user_id = auth.uid());
