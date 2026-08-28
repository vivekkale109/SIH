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
    <div className="min-h-screen bg-bgBase flex flex-col justify-center items-center p-4 selection:bg-accentPrimary selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-bgSurface border border-borderDefault rounded-xl shadow-modal overflow-hidden">
        {/* Left Panel: Branding & Prototype Notice */}
        <div className="p-8 bg-bgSurfaceRaised border-b md:border-b-0 md:border-r border-borderDefault flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-sm bg-accentPrimary/20 border border-accentPrimary/40 flex items-center justify-center text-accentPrimary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-textPrimary tracking-tight">SDMS Platform</h1>
                <span className="text-xs text-textSecondary font-mono block">SIH Problem Statement 26190</span>
              </div>
            </div>

            <div className="p-3 bg-bgBase border border-borderDefault rounded-sm text-xs text-textSecondary space-y-1">
              <div className="text-warning font-medium flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Synthetic Prototype Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This hackathon prototype uses synthetic/demo data only. It does not connect to or replace CCTNS, ICJS, eCourts, or e-Forensics.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-textPrimary uppercase tracking-wider font-mono">
                Key Security Pillars
              </h4>
              <ul className="space-y-1.5 text-xs text-textSecondary">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accentPrimary" />
                  <span>SHA-256 Hash Integrity Verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span>Immutable Insert-Only Audit Trail</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-info" />
                  <span>Two-Layer RBAC & Case Membership</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  <span>Advisory-Only AI Document Triage</span>
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
              <p className="text-xs text-textSecondary mt-1">
                Access authorized legal & investigation case files
              </p>
            </div>

            {error && (
              <div className="p-3 bg-error/15 border border-error/30 rounded-sm text-xs text-error flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bgBase border border-borderDefault rounded-sm pl-9 pr-3 py-2 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:border-accentPrimary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-textPrimary block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bgBase border border-borderDefault rounded-sm pl-9 pr-3 py-2 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:border-accentPrimary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Persona Selector for Judges / Evaluators */}
          <div className="space-y-2 pt-4 border-t border-borderDefault">
            <span className="text-[11px] font-mono uppercase tracking-wider text-textSecondary block">
              Quick Evaluator Personas (Click to Load)
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {personas.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => selectPersona(p.email)}
                  className={`text-left p-2 rounded-sm border text-[11px] transition-colors ${
                    email === p.email
                      ? 'bg-accentPrimary/15 border-accentPrimary text-textPrimary'
                      : 'bg-bgBase border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceRaised'
                  }`}
                >
                  <div className="font-semibold text-textPrimary flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-accentPrimary font-mono">{p.role}</span>
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
