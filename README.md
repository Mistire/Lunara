
# Lunara

## Digital Clinic Management & Electronic Health Record Platform

Lunara is an offline-first Progressive Web Application (PWA) designed to digitize outpatient clinic operations by connecting administrators, receptionists, doctors, laboratory technicians, and cashiers through a unified healthcare workflow platform.

The platform replaces manual paper-based processes with a secure digital system for managing patient records, appointments, consultations, laboratory workflows, electronic prescriptions, and billing operations.

---

## Project Status

*Currently under active development*.

Lunara is being developed as part of a Junior Full-Stack Developer Internship project at Sof Omar Technologies.

---

## Problem

Many private clinics and diagnostic centers still rely on handwritten medical files, paper prescriptions, and manual queue systems. These workflows create operational challenges such as:

- Lost or incomplete patient medical histories
- Slow retrieval of medical records
- Long and unpredictable patient waiting times
- Appointment scheduling difficulties
- Unreadable handwritten prescriptions
- Delayed laboratory communication
- Billing inconsistencies and revenue leakage

Lunara aims to provide a reliable digital healthcare infrastructure that improves clinic efficiency, reduces administrative workload, and enhances patient care.

---

# Features

## Patient Management

- Patient registration and digital health profiles
- Unique Medical Record Number (MRN) generation
- Medical history tracking
- Allergy and chronic condition records
- Emergency contact management
- Vital signs recording

---

## Appointment & Queue Management

- Doctor schedule management
- Appointment booking
- Walk-in patient registration
- Real-time patient queue tracking
- Consultation flow management

---

## Electronic Health Records (EHR)

- Digital patient medical records
- Consultation history
- SOAP notes documentation:
  - Subjective
  - Objective
  - Assessment
  - Plan
- Diagnosis tracking
- Previous visit history access

---

## Electronic Prescriptions

- Digital prescription generation
- Medication details management
- Dosage and frequency tracking
- Printable prescription documents
- Doctor authorization support

---

## Laboratory Workflow

- Digital laboratory test requests
- Laboratory technician dashboard
- Test processing workflow
- Result entry management
- Diagnostic report generation

---

## Billing & Payments

- Consultation billing
- Laboratory service billing
- Itemized invoices
- Payment status tracking
- Receipt generation

---

# User Roles

Lunara supports role-based workflows for different healthcare users:

| Role | Responsibilities |
|---|---|
| Clinic Administrator | Manage clinic operations and users |
| Receptionist | Patient registration, appointments, queue management |
| Doctor | Consultations, EHR updates, prescriptions |
| Nurse | Patient triage and vital signs |
| Laboratory Technician | Manage tests and results |
| Cashier | Billing and payment processing |

Each role has controlled access based on their responsibilities.

---

# Progressive Web Application (PWA)

Lunara is designed using an offline-first architecture, allowing healthcare workers to continue essential operations during unstable network conditions.

Planned PWA capabilities:

- Installable application experience
- Offline data access
- Local data caching
- Background synchronization
- Responsive support across desktop, tablet, and mobile devices

---

# Technology Stack

## Frontend

- TanStack Start
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- NestJS
- REST API
- WebSocket communication

## Database

- PostgreSQL
- Drizzle ORM

## Authentication & Security

- JWT Authentication
- Refresh Token Rotation
- Role-Based Access Control (RBAC)

---

# System Architecture

Lunara follows a modular full-stack architecture designed for scalability, security, and offline-first healthcare workflows.

```mermaid
flowchart TB

    subgraph Users["Healthcare Users"]
        Admin["Clinic Administrator"]
        Reception["Receptionist"]
        Doctor["Doctor"]
        Nurse["Nurse"]
        Lab["Laboratory Technician"]
        Cashier["Cashier"]
    end

    subgraph Client["Client Layer"]
        Web["Lunara PWA<br/>(TanStack Start + React)"]
        Cache["Service Worker<br/>Offline Cache"]
        LocalDB["IndexedDB<br/>Local Storage"]
    end

    subgraph Backend["Backend Layer"]
        API["NestJS REST API"]
        Auth["JWT Authentication<br/>RBAC Engine"]
        WS["WebSocket Gateway<br/>Real-time Updates"]
    end

    subgraph Data["Data Layer"]
        DB["PostgreSQL<br/>Drizzle ORM"]
        Files["File Storage<br/>Medical Documents & Reports"]
    end

    Users --> Web

    Web --> Cache
    Web --> LocalDB

    Web --> API
    Web --> WS

    API --> Auth
    API --> DB
    API --> Files

    WS --> DB

    Cache -. Sync when online .-> API
    LocalDB -. Background Sync .-> API
````

---

# Core Workflow

```mermaid
sequenceDiagram

    participant R as Receptionist
    participant P as Patient
    participant D as Doctor
    participant L as Lab Technician
    participant C as Cashier

    P->>R: Registration & Appointment
    R->>D: Add Patient to Queue
    D->>D: Record Consultation & Diagnosis
    D->>L: Request Laboratory Test
    L->>D: Submit Test Results
    D->>C: Generate Billing Request
    C->>P: Process Payment & Receipt
```

---

# Roadmap

## Phase 1 - Foundation

* [ ] Project setup
* [ ] Database design
* [ ] Authentication system
* [ ] Role-based authorization

## Phase 2 - Clinic Operations

* [ ] Patient management
* [ ] Appointment scheduling
* [ ] Queue management
* [ ] Doctor dashboard

## Phase 3 - Healthcare Workflows

* [ ] Electronic Health Records
* [ ] Laboratory management
* [ ] Digital prescriptions
* [ ] Billing system

## Phase 4 - PWA & Improvements

* [ ] Offline capabilities
* [ ] Background synchronization
* [ ] Analytics dashboard
* [ ] Deployment

---

# Future Enhancements

* Patient self-service portal
* Telemedicine integration
* Automated SMS appointment reminders
* Insurance claim integration
* AI-assisted clinical documentation
* Advanced healthcare analytics

---

# Screenshots

Coming soon.

---

# Development Setup

## Prerequisites

* Node.js
* PostgreSQL
* Docker

## Installation

```bash
git clone https://github.com/yourusername/lunara.git

cd lunara
```

Additional setup instructions will be added as development progresses.

---

# License

This project is currently developed for educational and portfolio purposes.

```
