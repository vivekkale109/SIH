'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('investigator.sharma@sdms.gov.in');
  const [password, setPassword] = useState('DemoPass@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personas = [
    {
      role: 'Case Officer / Investigator',
      email: 'investigator.sharma@sdms.gov.in',
      name: 'Inspector Ramesh Sharma',
      desc: 'Creates cases, uploads FIRs, builds investigation timelines',
    },
    {
      role: 'Supervisor / Reviewing Officer',
      email: 'supervisor.verma@sdms.gov.in',
      name: 'ACP Sunita Verma',
      desc: 'Reviews case documents, approves files, grants access',
    },
    {
      role: 'Legal Officer / Prosecutor',
      email: 'prosecutor.mehta@sdms.gov.in',
      name: 'Advocate Vikram Mehta',
      desc: 'Verifies SHA-256 digests, prepares court charge sheets',
    },
    {
      role: 'Auditor',
      email: 'auditor.gupta@sdms.gov.in',
      name: 'Suresh Gupta (Audit)',
      desc: 'Read-only audit log inspection & compliance reporting',
    },
    {
      role: 'Super Admin',
      email: 'admin@sdms.gov.in',
      name: 'Rajesh Malhotra',
      desc: 'User provisioning, system roles & global controls',
    },
  ];

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectPersona = (pEmail: string) => {
    setEmail(pEmail);
    setPassword('DemoPass@123');
  };

  return (
    <div className="min-h-screen bg-bgPage flex flex-col justify-center items-center p-4 selection:bg-accentPrimary selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-bgSurface border border-borderDefault rounded-3xl shadow-modal overflow-hidden">
        {/* Left Panel: Branding & Prototype Notice */}
        <div className="p-8 bg-bgSurfaceMuted border-b md:border-b-0 md:border-r border-borderDefault flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accentPrimarySoft border border-accentPrimary/20 flex items-center justify-center text-accentPrimary shadow-xs">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-textPrimary tracking-tight">SDMS Platform</h1>
                <span className="text-xs text-textSecondary font-semibold block">SIH Problem Statement 26190</span>
              </div>
            </div>

            <div className="p-4 bg-bgSurface border border-borderDefault rounded-2xl text-xs text-textSecondary space-y-1.5 shadow-xs">
              <div className="text-amber-700 font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Synthetic Prototype Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This hackathon prototype uses synthetic demo data only. Designed per government & enterprise security guidelines.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                Core Security Architecture
              </h4>
              <ul className="space-y-2 text-xs text-textSecondary">
                <li className="flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-accentPrimary" />
                  <span className="font-medium text-textPrimary">SHA-256 Byte-Level Integrity Verification</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-medium text-textPrimary">Immutable Append-Only Audit Trail</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-info" />
                  <span className="font-medium text-textPrimary">Two-Layer RBAC & Case Membership</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  <span className="font-medium text-textPrimary">Advisory-Only AI Document Triage</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-[11px] text-textSecondary border-t border-borderDefault pt-4">
            Smart India Hackathon 2026 Reference Implementation
          </div>
        </div>

        {/* Right Panel: Login Form & Persona Switcher */}
        <div className="p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-textPrimary">Sign In to Repository</h2>
              <p className="text-xs text-textSecondary mt-0.5">
                Access authorized legal & investigation case records
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-error flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bgSurface border border-borderDefault rounded-xl pl-9 pr-3 py-2 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textPrimary block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bgSurface border border-borderDefault rounded-xl pl-9 pr-3 py-2 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Persona Selector for Judges / Evaluators */}
          <div className="space-y-2 pt-4 border-t border-borderDefault">
            <span className="text-[11px] font-bold uppercase tracking-wider text-textSecondary block">
              Evaluator Personas (Click to Auto-Fill)
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {personas.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => selectPersona(p.email)}
                  className={`text-left p-2.5 rounded-xl border text-[11px] transition-all ${
                    email === p.email
                      ? 'bg-[#EAF8ED] border-accentPrimary text-textPrimary shadow-xs'
                      : 'bg-bgSurface border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                  }`}
                >
                  <div className="font-semibold text-textPrimary flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-accentPrimary font-mono font-bold">{p.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
