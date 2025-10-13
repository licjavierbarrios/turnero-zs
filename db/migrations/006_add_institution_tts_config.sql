-- Migración: Agregar configuración TTS a instituciones
-- Fecha: 2025-10-13
-- Descripción: Agrega columnas para configurar Text-to-Speech (volumen, velocidad, habilitado)

-- Agregar columnas de configuración TTS
ALTER TABLE institution
ADD COLUMN IF NOT EXISTS tts_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tts_volume DECIMAL(3, 2) DEFAULT 0.80 CHECK (tts_volume >= 0 AND tts_volume <= 1),
ADD COLUMN IF NOT EXISTS tts_rate DECIMAL(3, 2) DEFAULT 0.90 CHECK (tts_rate >= 0.5 AND tts_rate <= 1.5);

-- Comentarios para documentación
COMMENT ON COLUMN institution.tts_enabled IS 'Habilitar/deshabilitar anuncios de voz en pantallas públicas';
COMMENT ON COLUMN institution.tts_volume IS 'Volumen del TTS (0.0 a 1.0, donde 1.0 = 100%)';
COMMENT ON COLUMN institution.tts_rate IS 'Velocidad del TTS (0.5 a 1.5, donde 1.0 = velocidad normal)';
