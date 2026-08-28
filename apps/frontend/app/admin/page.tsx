'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
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

      const data = await apiFetch<any>('/admin/users');
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
    <div className="min-h-screen bg-bgBase flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar userRole={user?.roles?.[0]} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          <div className="border-b border-borderDefault pb-5">
            <h1 className="text-xl font-bold text-textPrimary tracking-tight">User Accounts & System Roles</h1>
            <p className="text-xs text-textSecondary mt-1">
              Super Admin administration panel for user account status and RBAC system role assignments
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-textSecondary font-mono">Loading user directory...</div>
          ) : (
            <div className="bg-bgSurface border border-borderDefault rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgSurfaceRaised border-b border-borderDefault text-textSecondary font-mono uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Assigned System Roles</th>
                    <th className="px-4 py-3">Case Memberships</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderDefault">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-bgBase/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-textPrimary">{u.fullName}</td>
                      <td className="px-4 py-3 font-mono text-textSecondary">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-accentPrimary/15 text-accentPrimary font-mono text-[11px] rounded-sm"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-textSecondary">{u.caseCount} Cases</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 bg-bgBase border border-borderDefault hover:border-accentPrimary text-textPrimary text-xs rounded-sm inline-flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3 text-accentPrimary" />
                          <span>Edit Roles</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Edit Roles Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgSurface border border-borderDefault rounded-lg w-full max-w-lg shadow-modal overflow-hidden">
            <div className="px-6 py-4 border-b border-borderDefault flex items-center justify-between bg-bgSurfaceRaised">
              <h3 className="text-base font-semibold text-textPrimary">Assign System Roles</h3>
              <button onClick={() => setSelectedUser(null)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoles} className="p-6 space-y-4">
              <div className="text-xs text-textSecondary">
                Target User: <strong className="text-textPrimary">{selectedUser.fullName}</strong> ({selectedUser.email})
              </div>

              {error && <div className="p-3 bg-error/15 text-xs text-error rounded-sm">{error}</div>}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-textPrimary block">System Roles</label>
                <div className="space-y-1.5">
                  {availableRoles.map((r) => {
                    const isChecked = selectedRoles.includes(r);
                    return (
                      <div
                        key={r}
                        onClick={() => toggleRole(r)}
                        className={`p-3 rounded-sm border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-accentPrimary/15 border-accentPrimary text-textPrimary'
                            : 'bg-bgBase border-borderDefault text-textSecondary hover:text-textPrimary'
                        }`}
                      >
                        <span className="font-medium">{r}</span>
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
                  className="px-4 py-2 bg-bgBase text-xs font-medium rounded-sm border border-borderDefault"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-accentPrimary hover:bg-accentPrimaryHover text-white text-xs font-semibold rounded-sm"
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
