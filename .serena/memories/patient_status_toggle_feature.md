# Patient Status Toggle & Modal Scroll Feature - COMPLETED

## Overview
Added a toggle switch to the "Add Patient" dialog for choosing initial patient status, implemented proper modal scrolling, and updated all tests to match the new functionality.

## Changes Made

### 1. AddPatientDialog Component
**File**: `components/turnos/AddPatientDialog.tsx`

#### Toggle Switch Feature
- Added `initialStatus` prop to onSubmit data (type: 'pendiente' | 'disponible')
- Added `isHabilitado` state (false = pendiente, true = disponible)
- Visual toggle switch with clear labeling:
  - "⟳ Pendiente" in amber (default)
  - "✓ Disponible" in green (when enabled)
- Descriptive text explains the difference between states

#### Modal Scroll Implementation
- DialogContent: `max-h-[90vh]` + `flex flex-col`
- Form element: `overflow-y-auto flex-1 pr-4`
- Header: Fixed at top
- Footer: Fixed at bottom with buttons
- Content: Scrolls when exceeds viewport

### 2. Queue Page
**File**: `app/(dashboard)/turnos/page.tsx`
- Updated `handleAddPatient` to accept and use `initialStatus`
- Optimistic items use selected status with proper `enabled_at` setting
- Database insertion respects the chosen initial status

### 3. Tests Updated
**File**: `tests/turnos/AddPatientDialog.spec.tsx`
- Updated existing submission tests to expect `initialStatus: 'pendiente'`
- Added new "Initial Status Toggle" test suite:
  - Test: should default to pendiente status
  - Test: should submit with disponible status when toggle is enabled
  - Test: should display Estado Inicial del Paciente section
- Total: 22 tests, all passing

## Test Results
```
✓ 9 test files passed
✓ 152 total tests passed
✓ TypeCheck: No errors
✓ Lint: No warnings or errors
```

## User Experience
- Default: Load as "Pendiente" (requires enablement)
- Option: Toggle to "Disponible" (immediately available)
- Modal: Scrolls when many professionals/services
- UX: Header and footer always visible

## Technical Details
- No breaking changes to permissions model
- Compatible with optimistic updates
- Works with realtime subscriptions
- Form submission uses requestSubmit() for out-of-form button
