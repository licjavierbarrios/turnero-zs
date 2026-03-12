# Base de Datos

## Entidades principales
- Zonas → Instituciones → Consultorios / Servicios / Profesionales.
- Pacientes, Usuarios y Membresías.
- Turnos con estados.
- Eventos de atención y llamados.

## Enums
- institution_type: caps | hospital_seccional | hospital_distrital | hospital_regional
- appointment_status: pendiente | esperando | llamado | en_consulta | finalizado | cancelado | ausente
- role_name: admin | administrativo | medico | enfermeria | pantalla

## DDL Resumido
```sql
create table zone (...);
create table institution (...);
create table room (...);
create table service (...);
create table professional (...);
create table slot_template (...);
create table patient (...);
create table appointment (...);
create table call_event (...);
create table attendance_event (...);
create table membership (...);
```
