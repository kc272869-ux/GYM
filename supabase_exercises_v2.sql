-- ============================================================
-- MIGRACIÓN v2 — Heavy
-- Ejecuta en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Nuevas columnas en exercises ──────────────────────────
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS type      TEXT NOT NULL DEFAULT 'weight_reps'
    CHECK (type IN ('weight_reps', 'time')),
  ADD COLUMN IF NOT EXISTS met_value NUMERIC(4,1) NOT NULL DEFAULT 4.0;

-- ── 2. workout_logs: hacer weight_kg y reps nullables + duration_sec ──
ALTER TABLE workout_logs
  ALTER COLUMN weight_kg DROP NOT NULL,
  ALTER COLUMN reps       DROP NOT NULL;

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS duration_sec INTEGER;

-- Eliminar checks que impiden valores nulos en ejercicios de tiempo
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_weight_kg_check;
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_reps_check;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_weight_kg_check CHECK (weight_kg IS NULL OR weight_kg >= 0),
  ADD CONSTRAINT workout_logs_reps_check      CHECK (reps IS NULL OR (reps > 0 AND reps <= 500));

-- ── 3. Actualizar ejercicios globales existentes ──────────────

-- Cardio → time
UPDATE exercises SET type = 'time', met_value = 8.0 WHERE name = 'Correr en cinta'    AND user_id IS NULL;
UPDATE exercises SET type = 'time', met_value = 6.0 WHERE name = 'Bicicleta estática' AND user_id IS NULL;

-- Plancha → time
UPDATE exercises SET type = 'time', met_value = 3.5 WHERE name = 'Plancha' AND user_id IS NULL;

-- Pecho
UPDATE exercises SET met_value = 5.0 WHERE name = 'Press de banca plano'    AND user_id IS NULL;
UPDATE exercises SET met_value = 5.0 WHERE name = 'Press de banca inclinado' AND user_id IS NULL;
UPDATE exercises SET met_value = 5.0 WHERE name = 'Press con mancuernas'    AND user_id IS NULL;
UPDATE exercises SET met_value = 5.0 WHERE name = 'Fondos en paralelas'     AND user_id IS NULL;
UPDATE exercises SET met_value = 4.0 WHERE name = 'Aperturas con mancuernas' AND user_id IS NULL;

-- Espalda
UPDATE exercises SET met_value = 6.0 WHERE name = 'Peso muerto'        AND user_id IS NULL;
UPDATE exercises SET met_value = 5.0 WHERE name = 'Dominadas'          AND user_id IS NULL;
UPDATE exercises SET met_value = 5.0 WHERE name = 'Remo con barra'     AND user_id IS NULL;
UPDATE exercises SET met_value = 4.5 WHERE name = 'Jalón al pecho'     AND user_id IS NULL;
UPDATE exercises SET met_value = 4.5 WHERE name = 'Remo con mancuerna' AND user_id IS NULL;

-- Hombros
UPDATE exercises SET met_value = 5.0 WHERE name = 'Press militar'         AND user_id IS NULL;
UPDATE exercises SET met_value = 4.5 WHERE name = 'Press Arnold'          AND user_id IS NULL;
UPDATE exercises SET met_value = 3.5 WHERE name = 'Elevaciones laterales' AND user_id IS NULL;
UPDATE exercises SET met_value = 4.0 WHERE name = 'Face pull'             AND user_id IS NULL;

-- Bíceps
UPDATE exercises SET met_value = 3.5 WHERE name = 'Curl de bíceps con barra' AND user_id IS NULL;
UPDATE exercises SET met_value = 3.5 WHERE name = 'Curl martillo'            AND user_id IS NULL;
UPDATE exercises SET met_value = 3.5 WHERE name = 'Curl en polea'            AND user_id IS NULL;

-- Tríceps
UPDATE exercises SET met_value = 4.0 WHERE name = 'Press francés'         AND user_id IS NULL;
UPDATE exercises SET met_value = 3.5 WHERE name = 'Extensión en polea alta' AND user_id IS NULL;
UPDATE exercises SET met_value = 5.0 WHERE name = 'Dips'                   AND user_id IS NULL;

-- Abdomen
UPDATE exercises SET met_value = 3.5 WHERE name = 'Crunch'             AND user_id IS NULL;
UPDATE exercises SET met_value = 3.5 WHERE name = 'Elevación de piernas' AND user_id IS NULL;

-- Piernas → dividir en Cuádriceps y Femoral / Glúteo
UPDATE exercises SET muscle_group = 'Cuádriceps',      met_value = 5.5 WHERE name = 'Sentadilla con barra'   AND user_id IS NULL;
UPDATE exercises SET muscle_group = 'Cuádriceps',      met_value = 5.0 WHERE name = 'Prensa de piernas'      AND user_id IS NULL;
UPDATE exercises SET muscle_group = 'Cuádriceps',      met_value = 5.0 WHERE name = 'Zancadas'               AND user_id IS NULL;
UPDATE exercises SET muscle_group = 'Cuádriceps',      met_value = 4.0 WHERE name = 'Extensión de cuádriceps' AND user_id IS NULL;
UPDATE exercises SET muscle_group = 'Femoral / Glúteo', met_value = 4.0 WHERE name = 'Curl femoral'          AND user_id IS NULL;
UPDATE exercises SET muscle_group = 'Femoral / Glúteo', met_value = 5.5 WHERE name = 'Hip thrust'            AND user_id IS NULL;

-- ── 4. Insertar nuevos ejercicios globales ────────────────────
INSERT INTO exercises (name, muscle_group, type, met_value) VALUES

  -- Cardio (tiempo)
  ('Elíptica',                       'Cardio',           'time',        5.5),
  ('Escaladora',                     'Cardio',           'time',        8.5),

  -- Espalda
  ('Remo en polea',                  'Espalda',          'weight_reps', 4.5),
  ('Remo en máquina',                'Espalda',          'weight_reps', 4.5),
  ('Pull over',                      'Espalda',          'weight_reps', 4.0),
  ('Jalón al pecho en máquina',      'Espalda',          'weight_reps', 4.5),
  ('Jalón al pecho en polea',        'Espalda',          'weight_reps', 4.5),
  ('Dominadas asistidas',            'Espalda',          'weight_reps', 4.5),
  ('Remo unilateral',                'Espalda',          'weight_reps', 4.0),

  -- Hombros
  ('Elevaciones laterales en polea',     'Hombros',      'weight_reps', 3.5),
  ('Elevaciones laterales con mancuerna','Hombros',      'weight_reps', 3.5),
  ('Vuelos posteriores',                 'Hombros',      'weight_reps', 3.5),
  ('Elevaciones frontales',              'Hombros',      'weight_reps', 3.5),

  -- Pecho
  ('Aperturas en máquina',           'Pecho',            'weight_reps', 4.0),
  ('Aperturas en polea',             'Pecho',            'weight_reps', 4.0),
  ('Press inclinado mancuernas',     'Pecho',            'weight_reps', 5.0),
  ('Press inclinado máquina',        'Pecho',            'weight_reps', 4.5),
  ('Press inclinado smith',          'Pecho',            'weight_reps', 4.5),
  ('Press plano mancuernas',         'Pecho',            'weight_reps', 5.0),
  ('Press plano máquina',            'Pecho',            'weight_reps', 4.5),
  ('Press plano smith',              'Pecho',            'weight_reps', 4.5),
  ('Fondos',                         'Pecho',            'weight_reps', 5.0),

  -- Bíceps
  ('Curl predicador',                'Bíceps',           'weight_reps', 3.5),
  ('Curl Bayesian',                  'Bíceps',           'weight_reps', 3.5),

  -- Tríceps
  ('Fondos en máquina',              'Tríceps',          'weight_reps', 4.0),
  ('Extensión trasnuca',             'Tríceps',          'weight_reps', 3.5),
  ('Extensión unilateral',           'Tríceps',          'weight_reps', 3.5),

  -- Cuádriceps
  ('Sentadilla en smith',            'Cuádriceps',       'weight_reps', 5.5),
  ('Desplantes estáticos',           'Cuádriceps',       'weight_reps', 5.0),
  ('Desplantes caminando',           'Cuádriceps',       'weight_reps', 5.5),
  ('Step ups',                       'Cuádriceps',       'weight_reps', 5.0),

  -- Femoral / Glúteo
  ('Curl femoral sentado',           'Femoral / Glúteo', 'weight_reps', 4.0),
  ('Curl femoral acostado',          'Femoral / Glúteo', 'weight_reps', 4.0),
  ('Peso muerto en smith',           'Femoral / Glúteo', 'weight_reps', 5.5),
  ('Peso muerto unilateral',         'Femoral / Glúteo', 'weight_reps', 5.0),
  ('Peso muerto con mancuerna',      'Femoral / Glúteo', 'weight_reps', 5.0),
  ('Aductor de cadera',              'Femoral / Glúteo', 'weight_reps', 3.5),
  ('Abductor de cadera',             'Femoral / Glúteo', 'weight_reps', 3.5),
  ('Patada en polea',                'Femoral / Glúteo', 'weight_reps', 3.5),
  ('Patada en máquina',              'Femoral / Glúteo', 'weight_reps', 3.5),
  ('Good morning',                   'Femoral / Glúteo', 'weight_reps', 4.5),
  ('Hiperextensión de cadera',       'Femoral / Glúteo', 'weight_reps', 4.0),

  -- Pantorrilla
  ('Elevación de talones',           'Pantorrilla',      'weight_reps', 3.5);
