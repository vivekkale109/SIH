'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Users, Shield, Edit3, X, Check, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Role Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles = [
    'Super Admin',
    'Case Officer / Investigator',
    'Supervisor / Reviewing Officer',
    'Legal Officer / Prosecutor',
    'Auditor',
    'Records Clerk',
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const me = await apiFetch<any>('/auth/me');
      setUser(me.user);

      if (!me.user.roles.includes('Super Admin')) {
        router.push('/dashboard');
        return;
      }

      const data = await apiFetch<any>(`/admin/users`);
      setUsersList(data.users || []);
    } catch (err: any) {
      if (err.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (u: any) => {
    setSelectedUser(u);
    setSelectedRoles(u.roles || []);
  };

  const toggleRole = (rName: string) => {
    if (selectedRoles.includes(rName)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== rName));
    } else {
      setSelectedRoles([...selectedRoles, rName]);
    }
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/admin/users/${selectedUser.id}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleNames: selectedRoles }),
      });
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user roles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgPage flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-accentPrimarySoft border border-accentPrimary/20 flex items-center justify-center text-accentPrimary shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-textPrimary tracking-tight">User Accounts & Role Admin</h1>
              <p className="text-xs text-textSecondary mt-0.5">
                Super Admin administrative console for user provisioning and two-layer RBAC role assignments
              </p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-bgSurface border border-borderDefault rounded-2xl shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-textSecondary font-mono">
              Loading authorized user accounts...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgSurfaceMuted border-b border-borderDefault text-textSecondary uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Officer / User</th>
                    <th className="px-5 py-3.5">Email Address</th>
                    <th className="px-5 py-3.5">Assigned System Roles</th>
                    <th className="px-5 py-3.5">Case Scope</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderDefault">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-bgSurfaceMuted/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-textPrimary flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-accentPrimarySoft text-accentPrimary font-bold flex items-center justify-center text-xs">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold">{u.fullName}</div>
                          <div className="text-[11px] text-textSecondary">ID: {u.id?.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-textSecondary">{u.email}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles?.map((r: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-accentPrimarySoft text-accentPrimary font-semibold text-[11px] rounded-full"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-textSecondary">
                        {u.caseCount} Active Case(s)
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="px-3 py-1.5 bg-bgSurface hover:bg-accentPrimary hover:text-white border border-borderDefault text-textPrimary text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-all shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Roles</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Roles Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-2xl w-full max-w-lg shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceMuted">
              <h3 className="text-base font-bold text-textPrimary">Assign System Roles</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-textSecondary hover:text-textPrimary p-1.5 rounded-full hover:bg-bgSurface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoles} className="p-6 space-y-4">
              <div className="text-xs text-textSecondary">
                Target Officer: <strong className="text-textPrimary">{selectedUser.fullName}</strong> ({selectedUser.email})
              </div>

              {error && <div className="p-3 bg-rose-50 text-xs text-error rounded-xl">{error}</div>}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-textPrimary block">System RBAC Roles</label>
                <div className="space-y-2">
                  {availableRoles.map((r) => {
                    const isChecked = selectedRoles.includes(r);
                    return (
                      <div
                        key={r}
                        onClick={() => toggleRole(r)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-[#EAF8ED] border-accentPrimary text-textPrimary font-bold shadow-xs'
                            : 'bg-bgSurface border-borderDefault text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                        }`}
                      >
                        <span>{r}</span>
                        {isChecked && <Check className="w-4 h-4 text-accentPrimary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-bgSurface text-xs font-semibold rounded-xl border border-borderDefault hover:bg-bgSurfaceMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Role Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
