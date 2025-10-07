-- Crear tabla daily_queue para la cola diaria de pacientes
-- Sistema ultra-simple: pendiente → disponible → llamado → atendido

CREATE TABLE IF NOT EXISTS daily_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Número de orden del día (auto-incrementa por día e institución)
  order_number INTEGER NOT NULL,

  -- Datos del paciente (copiados del HSI)
  patient_name VARCHAR(255) NOT NULL,
  patient_dni VARCHAR(20) NOT NULL,

  -- Servicio/Especialidad
  service_id UUID NOT NULL REFERENCES service(id) ON DELETE RESTRICT,

  -- Institución
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,

  -- Estado simple
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'disponible', 'llamado', 'atendido', 'cancelado')),

  -- Fecha del turno (solo fecha, sin hora específica)
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Timestamps de eventos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enabled_at TIMESTAMP WITH TIME ZONE, -- Cuando se habilitó (pendiente → disponible)
  called_at TIMESTAMP WITH TIME ZONE,  -- Cuando se llamó
  attended_at TIMESTAMP WITH TIME ZONE, -- Cuando se marcó como atendido

  -- Usuario que realizó cada acción
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  called_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraint: order_number único por día e institución
  UNIQUE(institution_id, queue_date, order_number)
);

-- Índices para mejorar performance
CREATE INDEX idx_daily_queue_institution_date ON daily_queue(institution_id, queue_date);
CREATE INDEX idx_daily_queue_status ON daily_queue(status);
CREATE INDEX idx_daily_queue_service ON daily_queue(service_id);

-- Función para obtener el siguiente número de orden del día
CREATE OR REPLACE FUNCTION get_next_order_number(p_institution_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_number
  FROM daily_queue
  WHERE institution_id = p_institution_id
    AND queue_date = p_date;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE daily_queue ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo ven la cola de su institución
CREATE POLICY "Users can view daily_queue of their institution"
  ON daily_queue
  FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

-- Los usuarios pueden insertar en la cola de su institución
CREATE POLICY "Users can insert daily_queue in their institution"
  ON daily_queue
  FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

-- Los usuarios pueden actualizar la cola de su institución
CREATE POLICY "Users can update daily_queue of their institution"
  ON daily_queue
  FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id
      FROM membership
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

-- Comentarios
COMMENT ON TABLE daily_queue IS 'Cola diaria de pacientes con estados simples: pendiente → disponible → llamado → atendido';
COMMENT ON COLUMN daily_queue.order_number IS 'Número de orden del día (001, 002, 003...)';
COMMENT ON COLUMN daily_queue.status IS 'Estado: pendiente (gris, no llamar) | disponible (verde, listo) | llamado (en pantalla) | atendido (finalizado)';
