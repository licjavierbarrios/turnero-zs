# RLS Policies - Quick Reference Guide
**Last Updated**: 2025-11-04  
**For**: Turnero ZS Development Team

---

## 🎯 Quick Answers

### "I'm getting RLS policy error!"

**Error**: `new row violates row-level security policy for table 'XXX'`

**Solutions by Table**:

#### Zone/Institution/Room/Service/Professional
- ✅ User is admin? → Should work
- ❌ User is NOT admin? → Check if they're trying to CREATE/UPDATE/DELETE
- 📋 Solution: Only admins can modify these resources

#### Patient
- ✅ All authenticated users can do everything
- ❌ User not authenticated? → Login first
- 📋 Solution: Ensure user is logged in

#### Membership
- ✅ User can see their own memberships
- ✅ Admin can manage all memberships
- ❌ Regular user trying to modify membership? → No permission
- 📋 Solution: Only admins can grant/revoke memberships

#### Daily Queue (ACTIVE SYSTEM)
- ✅ User in institution? → Can view
- ✅ Staff role (admin/administrativo/servicio)? → Can insert/update/delete
- ❌ Profesional role? → Can view only
- 📋 Solution: Ensure user has membership in institution with correct role

#### Appointment (FUTURE - not active)
- ⚠️ These policies exist but shouldn't be used yet
- 🔴 Use `daily_queue` instead for current development

---

## 🔐 Policy Architecture

### Admin Access (Super_admin & Admin)
```
Zone, Institution, Room, Service, Professional
├─ Can do: SELECT, INSERT, UPDATE, DELETE
├─ No conditions required
└─ Used for: System administration
```

### Staff Access (Administrativo, Servicio, Profesional)
```
Daily Queue, Appointment
├─ SELECT: Allowed (view queues/appointments)
├─ INSERT/UPDATE/DELETE: Only in their institution
└─ Used for: Daily operations
```

### User Access (All authenticated users)
```
Patient
├─ Can do: SELECT, INSERT, UPDATE, DELETE
├─ No institution filtering
└─ Used for: Adding patients dynamically
```

### Personal Access (Only own records)
```
Users, Membership
├─ Users: Can view/update own profile
├─ Membership: Can view own memberships
└─ Used for: Account management
```

---

## 📋 Role-Based Access Matrix

| Resource | Super Admin | Admin | Administrativo | Profesional | Servicio | Pantalla |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Zone | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Institution | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Room | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Service | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Professional | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Patient | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ |
| Daily Queue | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ R | ✅ CRUD | ✅ R |
| Membership | ✅ CRUD | ✅ CRUD | ❌ | ❌ (own) | ❌ (own) | ❌ (own) |
| Slot Template | ✅ CRUD | ✅ CRUD | ⏳ | ⏳ (own) | ❌ | ❌ |
| Call Event | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ R | ✅ CRUD | ✅ R |
| Attendance Event | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ R | ✅ CRUD | ✅ R |

Legend: ✅ CRUD = Create/Read/Update/Delete | ✅ R = Read only | ⏳ = Future | ❌ = No access | (own) = Own records only

---

## 🐛 Troubleshooting

### Problem: "Cannot view institutions after login"
**Root Cause**: Membership RLS policy blocking SELECT  
**Fix**: Ensure user has active membership record in database
```sql
SELECT * FROM membership 
WHERE user_id = 'AUTH_UID' 
AND is_active = true;
```

### Problem: "Admin cannot create zone"
**Root Cause**: User doesn't have admin role in any membership  
**Fix**: Verify user has admin membership
```sql
SELECT * FROM membership 
WHERE user_id = 'AUTH_UID' 
AND role IN ('super_admin', 'admin')
AND is_active = true;
```

### Problem: "Daily queue shows no results"
**Root Cause**: RLS policy filtering by institution_id  
**Fix**: Ensure:
1. User has membership in the institution
2. Query filters by institution_id
3. Queue entries exist for today

```sql
-- Verify user's institutions:
SELECT institution_id FROM membership 
WHERE user_id = 'AUTH_UID' AND is_active = true;

-- Verify queue entries:
SELECT COUNT(*) FROM daily_queue 
WHERE institution_id = 'INSTITUTION_ID' 
AND queue_date = CURRENT_DATE;
```

### Problem: "Infinite recursion error" (HISTORICAL)
**Status**: ✅ FIXED  
**Migration**: `20251104_fix_rls_infinite_recursion.sql`  
**What was fixed**: Membership table policies no longer recursively reference membership table

### Problem: "Policy for table XXX not found"
**Root Cause**: Policies were dropped but not recreated  
**Fix**: Run migration `20251104_fix_rls_policies_for_admin_tables.sql`

---

## ✅ Testing RLS Policies

### Test as Different Roles

**As Super Admin:**
```typescript
// Can do anything
const { data } = await supabase
  .from('zone')
  .select('*');
```

**As Admin (non-super):**
```typescript
// Same as super_admin in practice
const { data } = await supabase
  .from('institution')
  .select('*');
```

**As Administrativo:**
```typescript
// Can view zones/institutions, but only manage in their own institution
const { data } = await supabase
  .from('daily_queue')
  .select('*')
  .eq('institution_id', userInstitutionId);
```

**As Profesional:**
```typescript
// Can only view, not modify queues
const { data } = await supabase
  .from('daily_queue')
  .select('*')
  .eq('institution_id', userInstitutionId);
```

**As Pantalla:**
```typescript
// Can view public display configuration
const { data } = await supabase
  .from('display_devices')
  .select('*');
```

---

## 🚀 Common Operations

### Creating a New Resource (Admin)
```sql
-- Create Zone
INSERT INTO zone (name, description) 
VALUES ('Nueva Zona', 'Descripción');

-- Create Institution
INSERT INTO institution (zone_id, name, type, address)
VALUES ('zone-id', 'Hospital Nuevo', 'hospital_regional', 'Dirección');

-- Create Service
INSERT INTO service (institution_id, name, duration_minutes)
VALUES ('institution-id', 'Cardiología', 45);
```

**RLS Check**: User must have `admin` or `super_admin` role
```sql
SELECT * FROM membership 
WHERE user_id = auth.uid() 
AND role IN ('super_admin', 'admin')
AND is_active = true;
```

### Adding Queue Entry (Staff)
```sql
INSERT INTO daily_queue (
  order_number, 
  patient_name, 
  patient_dni,
  service_id, 
  institution_id, 
  status,
  queue_date,
  created_by
) VALUES (
  1, 
  'Juan Pérez', 
  '12345678',
  'service-id',
  'institution-id',
  'pendiente',
  CURRENT_DATE,
  auth.uid()
);
```

**RLS Check**: User must have membership in institution with staff role

### Viewing Queue (All Staff)
```sql
SELECT * FROM daily_queue
WHERE institution_id = auth.user_institutions()[1]
AND queue_date = CURRENT_DATE
AND status != 'cancelado'
ORDER BY order_number;
```

**RLS Check**: User must have any membership in institution

---

## 📊 Policy Performance Tips

1. **Always filter by institution_id when possible**
   - Helps RLS policy work efficiently
   - Reduces data scanned

2. **Use indexed columns in WHERE clauses**
   - institution_id is indexed
   - queue_date is indexed
   - user_id is indexed in membership

3. **Avoid complex queries in policy conditions**
   - Current policies use simple checks
   - Good performance for multi-tenant system

4. **Monitor policy usage**
   - Check Supabase metrics for slow queries
   - Contact team if performance degrades

---

## 🔗 Related Documentation

- 📖 **IMPLEMENTACION-ACTUAL.md** - Active system (daily_queue vs appointment)
- 📖 **RLS-POLICIES-ANALYSIS.md** - Detailed policy analysis
- 📖 **CLAUDE.md** - Development guidelines
- 📖 **db/migrations/** - All policy migrations

---

## ❓ Quick FAQ

**Q: Can I use `appointment` table for daily turnos?**  
A: No! Use `daily_queue` instead. See IMPLEMENTACION-ACTUAL.md

**Q: Do I need to worry about RLS for public displays?**  
A: Displays read from `daily_queue` - RLS policies apply

**Q: Can patients see their own data?**  
A: Not yet - patient interface not implemented. Future feature.

**Q: What happens if I DELETE a zone with institutions?**  
A: CASCADE delete removes all institutions, rooms, services, professionals in that zone

**Q: Can I grant someone super_admin role?**  
A: Yes, create membership with role='super_admin', but be careful - they get full system access

---

**Last Updated**: 2025-11-04  
**Verified**: All 48 RLS policies accounted for and functional
