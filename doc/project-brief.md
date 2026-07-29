# Lunara — Project Brief

## Digital Clinic Management & Electronic Health Record Platform

**Project Type:** Junior Full-Stack Developer Internship Project  
**Organization:** Sof Omar Technologies  
**Status:** Active Development  

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Target Users](#target-users)
- [Objectives](#objectives)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Technical Architecture](#technical-architecture)
- [Business Value](#business-value)
- [Future Enhancements](#future-enhancements)

---

## Project Overview

Lunara is an end-to-end Progressive Web Application (PWA) designed to streamline clinical workflows in Ethiopian outpatient clinics. It digitizes patient registrations, appointment scheduling, doctor consultations, electronic health records (EHR), digital prescriptions, laboratory test management, and billing operations.

The platform connects receptionists, nurses, doctors, laboratory technicians, cashiers, and clinic administrators into a unified digital ecosystem — eliminating paper medical files, reducing patient wait times, and unifying clinic revenue tracking.

Built with an **offline-first architecture**, Lunara allows clinical staff to access patient medical histories and record consultation notes during internet disruptions, automatically synchronizing data when connectivity is restored.

---

## Problem Statement

Many private clinics and diagnostic centers in Ethiopia rely on physical paper charts, handwritten prescription pads, and manual queue systems. This approach creates significant operational challenges:

### Lost or Disorganized Medical Files

Physical paper folders are easily misplaced, preventing doctors from accessing complete patient histories and significantly slowing consultation preparation.

### Long Waiting Times & Chaotic Queues

Without digital scheduling and queue systems, patients experience long, unpredictable wait times. Reception areas become crowded and difficult to manage during peak clinic hours.

### Unreadable Handwritten Prescriptions

Illegible prescription handwriting increases the risk of medication dispensing errors at pharmacies and delays patient treatment initiation.

### Fragmented Billing & Revenue Leakage

Manual cross-checking between consultation records, laboratory test orders, and the cashier desk frequently results in unbilled services and unaccounted clinic revenue.

### Disconnected Diagnostic Results

Laboratory technicians physically carry paper test reports back to doctors, creating delays in critical medical decisions and treatment adjustments.

---

## Proposed Solution

Develop a high-performance Progressive Web Application that enables clinics to:

- **Register patients** with unique Medical Record Numbers (MRN) and permanent digital health profiles, including medical history, allergies, blood group, and emergency contacts.
- **Manage doctor schedules** with weekly shift definitions, time-slot bookings, and real-time patient queue numbers.
- **Provide doctors** with a structured Electronic Health Record (EHR) interface for logging SOAP notes (Subjective, Objective, Assessment, Plan) and ICD-10 diagnostic codes via an autocomplete search interface.
- **Generate digital e-prescriptions** with medication, dosage, frequency, route, and duration fields — with printable PDF output using clinic letterhead and doctor authorization.
- **Digitally dispatch laboratory test orders** from the doctor's consultation desk and receive results in real-time through WebSocket notifications.
- **Process itemized billing** for consultations, procedures, and lab services with support for Cash, **Telebirr**, and **CBE Birr** payment methods, and generate thermal receipts.

---

## Target Users

The platform supports multi-role interactions within outpatient clinics:

| Role | Description |
|---|---|
| **Clinic Administrator** | Overall clinic director managing staff, settings, and operational reports |
| **Receptionist** | Front-desk staff managing patient registration and appointment booking |
| **Nurse** | Triage nurses recording initial vital signs before doctor consultation |
| **Doctor / General Practitioner** | Primary medical staff conducting consultations and managing EHR |
| **Laboratory Technician** | Diagnostic staff processing test orders and recording results |
| **Cashier / Finance Officer** | Staff managing billing, payment collection, and receipt generation |

---

## Objectives

The project aims to:

1. **Transition clinics to 100% paperless EHR** — Eliminate physical patient files and replace with secure, searchable digital records.
2. **Minimize patient wait times** — Structured time-slot booking and digital queue management reduce reception bottlenecks.
3. **Prevent medication errors** — Digital prescriptions with clear dosage and frequency details replace illegible handwritten pads.
4. **Unify clinic billing** — A single invoice aggregates consultation fees, lab services, and procedures to prevent revenue leakage.
5. **Accelerate laboratory turnaround** — Instant digital lab order dispatch and real-time result notification replaces physical report delivery.
6. **Support offline clinic operations** — Offline-first architecture ensures critical workflows function during internet disruptions.

---

## Functional Requirements

### Patient Registration & Triage

- Search existing patients by name, MRN, or phone number.
- Register new patients with full profile: name, date of birth, sex, contact, address, blood group, chronic conditions, allergies, and emergency contacts.
- Auto-generate unique Medical Record Number (MRN) per patient.
- Nurse triage module: Record initial vital signs per visit — blood pressure, temperature, pulse rate, respiratory rate, weight, height, and calculated BMI.

### Doctor Schedules & Appointment Booking

- Define weekly doctor availability by day of week, start/end time, and consultation duration.
- Auto-generate time slots from doctor schedule definitions.
- Book walk-in and advance appointments with automatic queue number assignment.
- Real-time queue status visible to receptionists and on waiting area monitors via WebSocket.
- Appointment status lifecycle: `Scheduled → Checked In → In Progress → Completed / No Show`.

### Electronic Health Records (EHR) & Consultation Desk

- Doctor dashboard showing current queue with patient details and triage vitals.
- Full patient medical history access: past consultations, diagnoses, prescriptions, lab results, and vital signs trends.
- SOAP notes structured entry form:
  - **Subjective:** Chief complaint, history of present illness
  - **Objective:** Physical examination findings (from triage vitals)
  - **Assessment:** ICD-10 diagnosis selection (autocomplete via full-text search)
  - **Plan:** Treatment plan, lab order referrals, prescription generation
- **ICD-10 Diagnostic Codes:** Local PostgreSQL lookup table seeded from the WHO ICD-10 dataset. Doctors search diagnoses via an autocomplete interface returning standardized ICD-10 codes and descriptions. Full-text search powered by PostgreSQL `tsvector` indexes for fast, offline-capable queries.

### Digital E-Prescriptions

- Prescription generator per consultation with one or more medication entries.
- Each medication entry: drug name, dosage, frequency, route of administration, duration, and special instructions.
- Generate printable prescription PDF (Puppeteer) with clinic letterhead, patient details, doctor name, license number, and date.
- Internal pharmacy handoff view for in-clinic dispensing.

### Laboratory & Diagnostics Management

- Doctor creates lab order during consultation, selecting one or more test types.
- Lab order dispatched to lab technician queue via WebSocket notification.
- Lab technician portal: View pending orders, mark sample collected, enter results per test.
- Attach external diagnostic file uploads or auto-generate structured lab result PDF (Puppeteer).
- Result notification sent to ordering doctor in real-time.
- Lab results linked to originating consultation and visible in patient EHR.

### Cashier Desk & Itemized Billing

- Invoice auto-generated from consultation and linked lab orders.
- Invoice line items: consultation fee, individual lab test fees, procedures, and supplies.
- Payment methods: **Cash**, **Telebirr**, **CBE Birr**.
- Payment status tracking: `Pending → Partial → Paid`.
- Generate thermal receipt (printable) and formal medical invoice PDF.

### Analytics & Operational Reports

- Daily financial revenue summary split by service type (Consultation, Lab, Procedures).
- Patient flow analytics: average wait times, daily consultation volume, peak clinic hours.
- Disease incidence report: Top ICD-10 diagnoses over a given date range.
- Lab turnaround time tracking per test type.

### Localization

- Multi-language interface support: **English**, **Amharic (አማርኛ)**, **Afaan Oromo**.
- Ethiopian date system awareness (Ethiopic calendar display where applicable).

---

## Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **PWA** | Installable on desktop, tablet, and mobile via browser prompt |
| **Offline-First** | Core workflows (vitals recording, consultation notes) functional without internet |
| **Data Security** | HIPAA-aligned PHI encryption at rest (Supabase) and in transit (HTTPS/TLS) |
| **Role-Based Security** | RBAC enforced at API level; no role sees data outside their scope |
| **Response Time** | API responses ≤ 200ms for dashboard and queue reads under normal load |
| **Concurrent Users** | NestJS architecture supports ≥ 50 concurrent clinic staff sessions |
| **Audit Logging** | All data mutations logged (who changed what, when) for compliance |
| **Localization** | English, Amharic, and Afaan Oromo interface support |

---

## Technical Architecture

### Frontend

| Technology | Role |
|---|---|
| **TanStack Start** | Full-stack React framework with SSR and file-based routing |
| **React + TypeScript** | Type-safe component development |
| **Tailwind CSS** | Utility-first styling system |
| **shadcn/ui** | Accessible, composable UI primitives |

### Backend

| Technology | Role |
|---|---|
| **NestJS** | Modular enterprise-grade Node.js backend framework |
| **REST API** | Primary client-server data exchange |
| **WebSocket (NestJS Gateway)** | Real-time queue updates and lab result notifications |
| **Puppeteer** | Server-side HTML-to-PDF generation for prescriptions and lab reports |

### Database

| Technology | Role |
|---|---|
| **PostgreSQL (Supabase)** | Primary relational database with managed hosting |
| **Drizzle ORM** | Type-safe schema definition and query builder |
| **ICD-10 Lookup Table** | Local PostgreSQL table with `tsvector` full-text search index |

### Authentication & Authorization

| Technology | Role |
|---|---|
| **JWT (Access Tokens)** | Stateless authentication (15-minute TTL) |
| **Refresh Token Rotation** | Secure sliding session management (7-day TTL) |
| **RBAC Engine** | NestJS Guards enforcing per-role endpoint access |

### Deployment

| Service | Purpose |
|---|---|
| **Vercel** | Frontend (TanStack Start) |
| **Render** | Backend (NestJS API) |
| **Supabase** | PostgreSQL database hosting |

---

## Business Value

Lunara replaces paper files and fragmented clinic desks with an integrated, high-speed digital healthcare platform. By:

- **Eliminating file retrieval delays** — Doctors access any patient's full history in under 2 seconds.
- **Streamlining lab workflows** — Real-time lab order dispatch and result notification cuts turnaround time.
- **Preventing billing oversights** — Auto-generated invoices from consultation and lab data prevent revenue leakage.
- **Speeding up consultations** — SOAP note templates and ICD-10 autocomplete reduce documentation time.
- **Supporting offline operations** — Ethiopian clinics with unstable internet can continue core workflows without disruption.

The platform improves patient care quality while driving higher daily patient throughput and financial performance for clinic owners.

---

## Future Enhancements

| Enhancement | Description |
|---|---|
| **Patient Self-Service Portal** | Patients view lab results, download prescriptions, and book appointments remotely |
| **Telemedicine / Video Consultations** | Virtual appointments with integrated video calling |
| **Automated SMS Appointment Reminders** | SMS alerts sent 24 hours before scheduled appointments |
| **Insurance Claim Integration** | Direct submission to third-party medical insurance portals |
| **AI-Assisted Documentation** | Suggested ICD-10 codes and SOAP note completion via AI |
| **Advanced Analytics** | Disease incidence heatmaps, clinic KPI dashboards, and revenue forecasting |
| **Pharmacy Module** | Internal dispensing tracking and drug inventory management |
