-- Migración: Sistema de Plantillas para Pantallas Públicas
-- Descripción: Permite configurar diferentes layouts para mostrar servicios en pantallas públicas
-- Fecha: 2025-10-03

-- ============================================================================
-- 1. CREAR TABLA DE PLANTILLAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.display_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Tipo de layout
  layout_type VARCHAR(20) NOT NULL CHECK (layout_type IN ('grid-2x2', 'grid-3x2', 'list', 'carousel')),

  -- Filtrado de servicios
  service_filter_type VARCHAR(20) NOT NULL CHECK (service_filter_type IN ('all', 'specific')),
  service_ids UUID[] DEFAULT '{}', -- Array de IDs de servicios específicos (solo si service_filter_type='specific')

  -- Configuración de carrusel
  carousel_interval INTEGER DEFAULT 8, -- Segundos entre rotaciones

  -- Metadata
  is_predefined BOOLEAN DEFAULT false, -- Plantilla del sistema (no se puede eliminar)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para mejorar performance
CREATE INDEX idx_display_template_active ON public.display_template(is_active);
CREATE INDEX idx_display_template_predefined ON public.display_template(is_predefined);

-- ============================================================================
-- 2. RLS POLICIES
-- ============================================================================

ALTER TABLE public.display_template ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver plantillas activas
CREATE POLICY "Cualquiera puede ver plantillas activas"
  ON public.display_template
  FOR SELECT
  USING (is_active = true);

-- Solo super admins pueden crear plantillas
CREATE POLICY "Solo super admins pueden crear plantillas"
  ON public.display_template
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Solo super admins pueden actualizar plantillas no predefinidas
CREATE POLICY "Solo super admins pueden actualizar plantillas"
  ON public.display_template
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
    AND is_predefined = false
  );

-- Solo super admins pueden eliminar plantillas no predefinidas
CREATE POLICY "Solo super admins pueden eliminar plantillas"
  ON public.display_template
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM membership
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
    AND is_predefined = false
  );

-- ============================================================================
-- 3. FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_display_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_display_template_updated_at
  BEFORE UPDATE ON public.display_template
  FOR EACH ROW
  EXECUTE FUNCTION public.update_display_template_updated_at();

-- ============================================================================
-- 4. INSERTAR PLANTILLAS PREDEFINIDAS
-- ============================================================================

-- Plantilla 1: Vista Completa (predeterminada)
INSERT INTO public.display_template (
  name,
  description,
  layout_type,
  service_filter_type,
  is_predefined,
  is_active
) VALUES (
  'Vista Completa',
  'Muestra todos los servicios en una grilla de 3x2. Ideal para sala de espera principal.',
  'grid-3x2',
  'all',
  true,
  true
);

-- Plantilla 2: Grilla Compacta
INSERT INTO public.display_template (
  name,
  description,
  layout_type,
  service_filter_type,
  is_predefined,
  is_active
) VALUES (
  'Grilla Compacta',
  'Muestra todos los servicios en grilla 2x2. Ideal para espacios reducidos.',
  'grid-2x2',
  'all',
  true,
  true
);

-- Plantilla 3: Lista Vertical
INSERT INTO public.display_template (
  name,
  description,
  layout_type,
  service_filter_type,
  is_predefined,
  is_active
) VALUES (
  'Lista Vertical',
  'Muestra todos los servicios en lista vertical. Ideal para pantallas verticales.',
  'list',
  'all',
  true,
  true
);

-- Plantilla 4: Carrusel Automático
INSERT INTO public.display_template (
  name,
  description,
  layout_type,
  service_filter_type,
  carousel_interval,
  is_predefined,
  is_active
) VALUES (
  'Carrusel Automático',
  'Rotación automática de todos los servicios cada 8 segundos.',
  'carousel',
  'all',
  8,
  true,
  true
);

-- ============================================================================
-- 5. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.display_template IS 'Plantillas de visualización para pantallas públicas';
COMMENT ON COLUMN public.display_template.layout_type IS 'Tipo de layout: grid-2x2, grid-3x2, list, carousel';
COMMENT ON COLUMN public.display_template.service_filter_type IS 'Cómo filtrar servicios: all (todos), specific (IDs específicos)';
COMMENT ON COLUMN public.display_template.service_ids IS 'IDs específicos de servicios (cuando service_filter_type=specific)';
COMMENT ON COLUMN public.display_template.carousel_interval IS 'Segundos entre rotaciones para layout tipo carousel';
COMMENT ON COLUMN public.display_template.is_predefined IS 'Plantilla del sistema que no puede ser eliminada';
