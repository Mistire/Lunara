import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, Key, Server, Users, Search, CheckCircle2, ChevronRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'roles' | 'api'>('architecture');

  const roles = [
    { title: 'Clinic Administrator', code: 'admin', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', desc: 'System management, user provisioning, revenue analytics, audit logs' },
    { title: 'Receptionist', code: 'receptionist', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', desc: 'Patient registration, MRN assignment, appointment scheduling & queues' },
    { title: 'Nurse', code: 'nurse', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', desc: 'Patient triage, vital signs entry (BP, Temp, Pulse, O2, BMI)' },
    { title: 'Doctor', code: 'doctor', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', desc: 'EHR consultations, SOAP notes, ICD-10 search, e-prescriptions, lab orders' },
    { title: 'Laboratory Technician', code: 'lab_technician', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', desc: 'Lab worklist queue, sample tracking, diagnostic result entry' },
    { title: 'Cashier', code: 'cashier', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', desc: 'Itemized invoices, multi-method payment collection (Cash, Telebirr, CBE Birr)' },
  ];

  const endpoints = [
    { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate & issue JWT access token + HttpOnly refresh cookie', role: 'Public' },
    { method: 'POST', path: '/api/v1/auth/refresh', desc: 'Rotate refresh token and issue new access token', role: 'Public' },
    { method: 'GET', path: '/api/v1/auth/me', desc: 'Retrieve authenticated user profile & clinic scope', role: 'All' },
    { method: 'GET', path: '/api/v1/users', desc: 'List all staff accounts for clinic', role: 'admin' },
    { method: 'POST', path: '/api/v1/users', desc: 'Create new clinic staff user account', role: 'admin' },
    { method: 'GET', path: '/api/v1/icd10/search?q=...', desc: 'Full-text autocomplete search for ICD-10 codes', role: 'doctor, admin' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">Lunara</h1>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">Phase 1 — Foundation Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-emerald-300">Backend Ready (Port 3001)</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-8 overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Phase 1 Core Completed
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Digital Healthcare Infrastructure & Role-Based Platform
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Lunara Foundation provides NestJS REST services, Drizzle ORM database schemas, JWT token rotation security, RBAC authorization guards, and PostgreSQL full-text ICD-10 search capabilities.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <div className="bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-lg flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">PostgreSQL + Drizzle ORM</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-lg flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">JWT + HttpOnly Cookie Refresh</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">RBAC Guard Engine</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-lg flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">ICD-10 FTS Search Vector</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Database Architecture
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            User Roles & Access (6 Roles)
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'api'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            API Endpoints & Auth
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'architecture' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'clinics & users', tables: 'clinics, users', desc: 'Multi-clinic support, staff accounts, bcrypt password hashing, role assignment' },
              { name: 'patients & triage', tables: 'patients, vital_signs', desc: 'Permanent health profiles with unique MRN (LUN-YYYY-NNNNN), nurse vitals recording' },
              { name: 'schedules & queue', tables: 'doctor_schedules, time_slots, appointments', desc: 'Weekly doctor shifts, 30-min time slots, walk-in and scheduled queue management' },
              { name: 'consultation & EHR', tables: 'consultations, soap_notes, icd10_codes', desc: 'SOAP note clinical documentation, ICD-10 GIN search vector indexing' },
              { name: 'prescriptions & lab', tables: 'prescriptions, lab_orders, lab_results', desc: 'Medication dosages, lab test dispatching, result JSON data payloads' },
              { name: 'billing & audit', tables: 'invoices, payments, audit_logs', desc: 'Itemized billing, Cash/Telebirr/CBE Birr payments, immutable HIPAA audit trail' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200 capitalize">{item.name}</h3>
                  <span className="text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded">
                    {item.tables}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-200">{role.title}</h3>
                    <span className={`text-xs font-mono border px-2.5 py-0.5 rounded-full ${role.badge}`}>
                      {role.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{role.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Scoped: Clinic Data</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-900">
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Roles Required</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {endpoints.map((ep, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 font-mono">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        ep.method === 'POST' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        ep.method === 'GET' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-semibold">{ep.path}</td>
                    <td className="py-3 px-4 text-cyan-400">{ep.role}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
