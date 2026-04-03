-- ============================================================
-- SUPABASE SETUP — GymTracker
-- ============================================================
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- -------------------------------------------------------
-- TABLA: exercises
-- Ejercicios disponibles. Los globales tienen user_id NULL,
-- los personalizados tienen el user_id del creador.
-- -------------------------------------------------------
CREATE TABLE exercises (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_exercises_user ON exercises(user_id);


-- -------------------------------------------------------
-- TABLA: workout_logs
-- Un registro = una serie de un ejercicio en una fecha.
-- -------------------------------------------------------
CREATE TABLE workout_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight_kg   NUMERIC(6,2) NOT NULL CHECK (weight_kg >= 0),
  reps        INT NOT NULL CHECK (reps > 0 AND reps <= 500),
  sets        INT NOT NULL CHECK (sets > 0 AND sets <= 100),
  rpe         INT NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  notes       TEXT,
  logged_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logs_user       ON workout_logs(user_id);
CREATE INDEX idx_logs_exercise   ON workout_logs(exercise_id);
CREATE INDEX idx_logs_logged_at  ON workout_logs(logged_at DESC);


-- -------------------------------------------------------
-- TABLA: routines
-- Grupos de ejercicios organizados por el usuario.
-- -------------------------------------------------------
CREATE TABLE routines (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- -------------------------------------------------------
-- TABLA: routine_exercises
-- Tabla pivote: qué ejercicios tiene cada rutina y en qué orden.
-- -------------------------------------------------------
CREATE TABLE routine_exercises (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id  UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo puede leer/escribir sus propios datos.
-- Esto se aplica incluso si alguien obtiene la anon key.
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE exercises      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- --- POLÍTICAS para exercises ---
-- Leer: propios + globales (user_id IS NULL)
CREATE POLICY "exercises_select" ON exercises
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Crear: solo propios
CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Eliminar: solo propios
CREATE POLICY "exercises_delete" ON exercises
  FOR DELETE USING (user_id = auth.uid());


-- --- POLÍTICAS para workout_logs ---
CREATE POLICY "logs_select" ON workout_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "logs_insert" ON workout_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "logs_delete" ON workout_logs
  FOR DELETE USING (user_id = auth.uid());


-- --- POLÍTICAS para routines ---
CREATE POLICY "routines_select" ON routines
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "routines_insert" ON routines
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "routines_delete" ON routines
  FOR DELETE USING (user_id = auth.uid());


-- --- POLÍTICAS para routine_exercises ---
-- El usuario puede gestionar ejercicios de sus propias rutinas
CREATE POLICY "routine_ex_select" ON routine_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
        AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "routine_ex_insert" ON routine_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
        AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "routine_ex_delete" ON routine_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
        AND routines.user_id = auth.uid()
    )
  );


-- ============================================================
-- DATOS INICIALES — Ejercicios globales (sin user_id)
-- Estos aparecerán para todos los usuarios desde el inicio.
-- ============================================================
INSERT INTO exercises (name, muscle_group) VALUES
  -- Pecho
  ('Press de banca plano',        'Pecho'),
  ('Press de banca inclinado',     'Pecho'),
  ('Press con mancuernas',         'Pecho'),
  ('Fondos en paralelas',          'Pecho'),
  ('Aperturas con mancuernas',     'Pecho'),
  -- Espalda
  ('Peso muerto',                  'Espalda'),
  ('Dominadas',                    'Espalda'),
  ('Remo con barra',               'Espalda'),
  ('Jalón al pecho',               'Espalda'),
  ('Remo con mancuerna',           'Espalda'),
  -- Hombros
  ('Press militar',                'Hombros'),
  ('Press Arnold',                 'Hombros'),
  ('Elevaciones laterales',        'Hombros'),
  ('Face pull',                    'Hombros'),
  -- Bíceps
  ('Curl de bíceps con barra',     'Bíceps'),
  ('Curl martillo',                'Bíceps'),
  ('Curl en polea',                'Bíceps'),
  -- Tríceps
  ('Press francés',                'Tríceps'),
  ('Extensión en polea alta',      'Tríceps'),
  ('Dips',                         'Tríceps'),
  -- Piernas
  ('Sentadilla con barra',         'Piernas'),
  ('Prensa de piernas',            'Piernas'),
  ('Zancadas',                     'Piernas'),
  ('Curl femoral',                 'Piernas'),
  ('Extensión de cuádriceps',      'Piernas'),
  ('Hip thrust',                   'Glúteos'),
  -- Abdomen
  ('Crunch',                       'Abdomen'),
  ('Plancha',                      'Abdomen'),
  ('Elevación de piernas',         'Abdomen'),
  -- Cardio
  ('Correr en cinta',              'Cardio'),
  ('Bicicleta estática',           'Cardio');
