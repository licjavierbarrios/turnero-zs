-- Datos semilla para Turnero ZS
-- Datos iniciales para desarrollo y testing

-- Limpiar datos existentes
TRUNCATE TABLE attendance_event, call_event, appointment, membership, users, patient, slot_template, professional, service, room, institution, zone CASCADE;

-- Zonas
INSERT INTO zone (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Zona Norte', 'Zona sanitaria norte de la provincia'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Zona Centro', 'Zona sanitaria centro de la provincia'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Zona Sur', 'Zona sanitaria sur de la provincia');

-- Instituciones
INSERT INTO institution (id, zone_id, name, type, address, phone) VALUES
  -- Zona Norte
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'CAPS Villa Esperanza', 'caps', 'Av. Libertad 123, Villa Esperanza', '0387-4123456'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Hospital Seccional Norte', 'hospital_seccional', 'Ruta Nacional 9 Km 1520', '0387-4123789'),

  -- Zona Centro
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'CAPS Centro Salud', 'caps', 'Calle San Martín 456, Capital', '0387-4234567'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'Hospital Regional Centro', 'hospital_regional', 'Av. Belgrano 789, Capital', '0387-4234890'),

  -- Zona Sur
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'CAPS Barrio Sur', 'caps', 'Pasaje Los Andes 321, Barrio Sur', '0387-4345678');

-- Consultorios/Salas
INSERT INTO room (id, institution_id, name, description) VALUES
  -- CAPS Villa Esperanza
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', 'Consultorio 1', 'Medicina General'),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440011', 'Consultorio 2', 'Pediatría'),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440011', 'Sala de Enfermería', 'Controles y vacunación'),

  -- Hospital Seccional Norte
  ('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440012', 'Consultorio A', 'Clínica Médica'),
  ('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440012', 'Consultorio B', 'Cardiología'),
  ('550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440012', 'Consultorio C', 'Ginecología'),

  -- CAPS Centro Salud
  ('550e8400-e29b-41d4-a716-446655440121', '550e8400-e29b-41d4-a716-446655440021', 'Consultorio Principal', 'Atención General'),
  ('550e8400-e29b-41d4-a716-446655440122', '550e8400-e29b-41d4-a716-446655440021', 'Sala de Procedimientos', 'Curaciones y procedimientos menores');

-- Servicios
INSERT INTO service (id, institution_id, name, description, duration_minutes) VALUES
  -- CAPS Villa Esperanza
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440011', 'Medicina General', 'Consulta médica general', 30),
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440011', 'Pediatría', 'Consulta pediátrica', 30),
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440011', 'Control de Enfermería', 'Controles y vacunación', 15),

  -- Hospital Seccional Norte
  ('550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440012', 'Clínica Médica', 'Consulta de clínica médica', 45),
  ('550e8400-e29b-41d4-a716-446655440212', '550e8400-e29b-41d4-a716-446655440012', 'Cardiología', 'Consulta cardiológica', 45),
  ('550e8400-e29b-41d4-a716-446655440213', '550e8400-e29b-41d4-a716-446655440012', 'Ginecología', 'Consulta ginecológica', 45);

-- Profesionales
INSERT INTO professional (id, institution_id, first_name, last_name, speciality, license_number, email, phone) VALUES
  -- CAPS Villa Esperanza
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440011', 'María', 'González', 'Medicina General', 'MP12345', 'maria.gonzalez@salud.gob.ar', '0387-4111222'),
  ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440011', 'Carlos', 'Rodríguez', 'Pediatría', 'MP12346', 'carlos.rodriguez@salud.gob.ar', '0387-4111223'),
  ('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440011', 'Ana', 'Fernández', 'Enfermería', 'ENF001', 'ana.fernandez@salud.gob.ar', '0387-4111224'),

  -- Hospital Seccional Norte
  ('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440012', 'Luis', 'Martínez', 'Clínica Médica', 'MP12347', 'luis.martinez@salud.gob.ar', '0387-4222333'),
  ('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440012', 'Patricia', 'López', 'Cardiología', 'MP12348', 'patricia.lopez@salud.gob.ar', '0387-4222334'),
  ('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440012', 'Roberto', 'Díaz', 'Ginecología', 'MP12349', 'roberto.diaz@salud.gob.ar', '0387-4222335');

-- Usuarios del sistema
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', 'admin@salud.gob.ar', crypt('admin123', gen_salt('bf')), 'Administrador', 'Sistema'),
  ('550e8400-e29b-41d4-a716-446655440402', 'maria.admin@salud.gob.ar', crypt('maria123', gen_salt('bf')), 'María', 'Administradora'),
  ('550e8400-e29b-41d4-a716-446655440403', 'carlos.medico@salud.gob.ar', crypt('carlos123', gen_salt('bf')), 'Carlos', 'Médico'),
  ('550e8400-e29b-41d4-a716-446655440404', 'ana.enfermera@salud.gob.ar', crypt('ana123', gen_salt('bf')), 'Ana', 'Enfermera');

-- Membresías (relación usuario-institución-rol)
INSERT INTO membership (user_id, institution_id, role) VALUES
  -- Admin global
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440011', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440012', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440021', 'admin'),

  -- Administrativa en CAPS Villa Esperanza
  ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440011', 'administrativo'),

  -- Médico en CAPS Villa Esperanza
  ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440011', 'medico'),

  -- Enfermera en CAPS Villa Esperanza
  ('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440011', 'enfermeria');

-- Plantillas de horarios (lunes a viernes)
INSERT INTO slot_template (professional_id, service_id, room_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES
  -- María González - Medicina General (Lunes a Viernes 8:00-12:00)
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 1, '08:00', '12:00', 30),
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 2, '08:00', '12:00', 30),
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 3, '08:00', '12:00', 30),
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 4, '08:00', '12:00', 30),
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 5, '08:00', '12:00', 30),

  -- Carlos Rodríguez - Pediatría (Martes y Jueves 14:00-18:00)
  ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 2, '14:00', '18:00', 30),
  ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 4, '14:00', '18:00', 30);

-- Pacientes de ejemplo
INSERT INTO patient (id, first_name, last_name, dni, email, phone, birth_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440501', 'Juan', 'Pérez', '12345678', 'juan.perez@email.com', '0387-4555111', '1980-05-15'),
  ('550e8400-e29b-41d4-a716-446655440502', 'María', 'García', '23456789', 'maria.garcia@email.com', '0387-4555222', '1975-08-22'),
  ('550e8400-e29b-41d4-a716-446655440503', 'Pedro', 'López', '34567890', 'pedro.lopez@email.com', '0387-4555333', '1990-12-03'),
  ('550e8400-e29b-41d4-a716-446655440504', 'Ana', 'Martínez', '45678901', 'ana.martinez@email.com', '0387-4555444', '1985-03-18'),
  ('550e8400-e29b-41d4-a716-446655440505', 'Luis', 'Fernández', '56789012', 'luis.fernandez@email.com', '0387-4555555', '2010-07-25');

-- Turnos de ejemplo para demostración
INSERT INTO appointment (id, patient_id, professional_id, service_id, room_id, institution_id, scheduled_at, status, created_by) VALUES
  -- Turnos para hoy
  ('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '2 hours', 'pendiente', '550e8400-e29b-41d4-a716-446655440402'),
  ('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '2.5 hours', 'esperando', '550e8400-e29b-41d4-a716-446655440402'),
  ('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '3 hours', 'llamado', '550e8400-e29b-41d4-a716-446655440402'),

  -- Turno pediátrico
  ('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440505', '550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '4 hours', 'pendiente', '550e8400-e29b-41d4-a716-446655440402');

-- Eventos de llamado de ejemplo
INSERT INTO call_event (appointment_id, called_by, room_id, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440101', 'Primer llamado');

-- Eventos de asistencia de ejemplo
INSERT INTO attendance_event (appointment_id, event_type, recorded_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440602', 'check_in', '550e8400-e29b-41d4-a716-446655440404', 'Paciente presente'),
  ('550e8400-e29b-41d4-a716-446655440603', 'check_in', '550e8400-e29b-41d4-a716-446655440404', 'Paciente presente');