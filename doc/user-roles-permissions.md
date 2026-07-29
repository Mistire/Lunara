# Lunara — User Roles & Permissions

## Overview

Lunara enforces **Role-Based Access Control (RBAC)** at the NestJS API level using Guards and Decorators. Every API endpoint is decorated with the minimum required role(s). Users receive a JWT containing their `role` field, which is verified on every request.

No role can access data or perform actions outside its defined scope.

---

## Table of Contents

- [Roles](#roles)
- [Permission Matrix](#permission-matrix)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Patient Management](#patient-management)
  - [Vital Signs & Triage](#vital-signs--triage)
  - [Doctor Schedules & Slots](#doctor-schedules--slots)
  - [Appointments & Queue](#appointments--queue)
  - [Consultations & EHR](#consultations--ehr)
  - [ICD-10 Diagnoses](#icd-10-diagnoses)
  - [Prescriptions](#prescriptions)
  - [Laboratory Orders](#laboratory-orders)
  - [Laboratory Results](#laboratory-results)
  - [Invoices & Billing](#invoices--billing)
  - [Payments](#payments)
  - [Analytics & Reports](#analytics--reports)
  - [Audit Logs](#audit-logs)
- [RBAC Implementation](#rbac-implementation)
- [Data Scoping Rules](#data-scoping-rules)

---

## Roles

| Role | Code | Description |
|---|---|---|
| **Clinic Administrator** | `admin` | Full system access, clinic configuration, staff management |
| **Receptionist** | `receptionist` | Patient registration, appointment booking, queue management |
| **Nurse** | `nurse` | Triage, vital signs recording |
| **Doctor** | `doctor` | Consultations, EHR, SOAP notes, prescriptions, lab orders |
| **Laboratory Technician** | `lab_technician` | Lab order processing, result entry |
| **Cashier** | `cashier` | Invoice management, payment collection |

---

## Permission Matrix

Legend:
- ✅ **Full access** (read + write)
- 👁️ **Read only**
- ✏️ **Write only / limited**
- ❌ **No access**

---

### Authentication

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Refresh token | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### User Management

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| List all staff | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create staff account | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View staff profile | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update staff profile | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deactivate staff | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reset staff password | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### Patient Management

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Search patients | ✅ | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Register new patient | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View patient profile | ✅ | ✅ | ✅ | ✅ | ❌ | 👁️ |
| View patient by MRN | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update patient profile | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete patient (soft) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View clinical timeline | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

> **Note:** Cashier access to patient data is limited to name and invoice/payment information only — no clinical data is exposed.

---

### Vital Signs & Triage

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Record vital signs | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View vitals history | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| View vitals for appointment | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

### Doctor Schedules & Slots

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View all schedules | ✅ | ✅ | ❌ | 👁️ | ❌ | ❌ |
| Create doctor schedule | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update schedule | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete schedule | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Generate time slots | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View available slots | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### Appointments & Queue

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| List appointments | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Book appointment | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View appointment detail | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update appointment status | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Cancel appointment | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View doctor queue | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Receive queue WebSocket updates | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

### Consultations & EHR

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Start consultation | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View consultation detail | ✅ | ❌ | ❌ | ✅ | ❌ | 👁️ |
| Update consultation | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View consultation history | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create/update SOAP notes | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View SOAP notes | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

> **Note:** Cashier can view consultation status (completed/in progress) for billing purposes but **cannot** access clinical notes, SOAP data, or diagnoses.

---

### ICD-10 Diagnoses

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Search ICD-10 codes | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View ICD-10 code detail | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Add diagnosis to consultation | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Remove diagnosis | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View consultation diagnoses | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

### Prescriptions

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Create prescription | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View prescription | ❌ | ❌ | ❌ | ✅ | ❌ | 👁️ |
| Update prescription | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Download prescription PDF | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |

> **Note:** Receptionist can download and print prescriptions for pharmacy handoff. Cashier can view prescription summary for billing reference only.

---

### Laboratory Orders

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Create lab order | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View lab order queue | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View lab order detail | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Update lab order status | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View patient lab orders | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Receive new order WebSocket | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### Laboratory Results

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Submit lab results | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View lab results | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Download lab report PDF | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Receive result notification | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

### Invoices & Billing

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| List all invoices | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Generate invoice | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View invoice detail | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update invoice | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cancel invoice | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Download invoice PDF | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### Payments

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Record payment | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View payment detail | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View invoice payments | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Download receipt PDF | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Void/reverse payment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### Analytics & Reports

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Revenue summary | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Patient flow analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Diagnosis distribution report | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Lab turnaround report | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### Audit Logs

| Action | admin | receptionist | nurse | doctor | lab_technician | cashier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## RBAC Implementation

### NestJS Guard

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Controller Usage

```typescript
// patients.controller.ts
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {

  @Post()
  @Roles('admin', 'receptionist')
  async registerPatient(@Body() dto: CreatePatientDto) { ... }

  @Get(':id')
  @Roles('admin', 'receptionist', 'nurse', 'doctor')
  async getPatient(@Param('id') id: string) { ... }

  @Delete(':id')
  @Roles('admin')
  async deletePatient(@Param('id') id: string) { ... }
}
```

---

## Data Scoping Rules

Beyond role-level access, all queries are **clinic-scoped**. A user can only access data belonging to their own clinic.

This is enforced at the service layer:

```typescript
// patients.service.ts
async findAll(user: JwtPayload, filters: PatientQueryDto) {
  return this.db
    .select()
    .from(patients)
    .where(
      and(
        eq(patients.clinicId, user.clinicId),   // always scoped to user's clinic
        isNull(patients.deletedAt),              // exclude soft-deleted
        // ... additional filters
      )
    );
}
```

**Additional scoping rules:**
- **Doctor:** Can only view their own consultations and queued patients. Cannot view other doctors' patient lists.
- **Lab Technician:** Can only view lab orders assigned to their clinic. Cannot see consultation or prescription data.
- **Cashier:** Can only view invoice and payment data. Cannot access clinical records, prescriptions, or lab results.
- **Nurse:** Can only record and view vital signs. Cannot access consultation notes or prescriptions.
