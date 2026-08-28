'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Search, History, Users, ShieldAlert, FileCheck } from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole = 'Case Officer / Investigator' }) => {
  const pathname = usePathname();

  const isAuditorOrAdmin = ['Auditor', 'Super Admin', 'Supervisor / Reviewing Officer'].includes(userRole);
  const isSuperAdmin = userRole === 'Super Admin';

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Cases Repository', href: '/cases', icon: FolderKanban },
    { label: 'Full-Text Search', href: '/search', icon: Search },
    { label: 'Audit Trail', href: '/audit', icon: History, visible: isAuditorOrAdmin },
    { label: 'User & Role Admin', href: '/admin', icon: Users, visible: isSuperAdmin },
  ];

  return (
    <aside className="w-64 bg-bgSurface border-r border-borderDefault min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-textSecondary px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map(
              (item) =>
                item.visible !== false && (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                        ? 'bg-accentPrimary/15 text-accentPrimary border-l-2 border-accentPrimary'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceRaised'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
            )}
          </nav>
        </div>

        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-textSecondary px-3 mb-2">
            Verification & Trust
          </div>
          <div className="p-3 rounded-sm bg-bgBase border border-borderDefault space-y-2 text-xs text-textSecondary">
            <div className="flex items-center space-x-2 text-success font-medium">
              <FileCheck className="w-4 h-4" />
              <span>SHA-256 Digest Standard</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every uploaded file version is hashed server-side at intake for cryptographic byte integrity verification.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-borderDefault text-[11px] text-textSecondary space-y-1">
        <div className="font-mono text-textPrimary">SIH Problem Statement 26190</div>
        <div>System Version: 1.0.0 (MVP)</div>
      </div>
    </aside>
  );
};
