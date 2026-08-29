'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  FolderKanban,
  LayoutDashboard,
  History,
  Users,
  Settings,
  Sun,
  Moon,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    fetchMe();
    fetchNotifications();

    // Check dark mode
    if (typeof document !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
        setIsDark(false);
      } else {
        root.classList.add('dark');
        setIsDark(true);
      }
    }
  };

  const fetchMe = async () => {
    try {
      const data = await apiFetch<any>('/auth/me');
      setUser(data.user);
    } catch (err) {
      // Not logged in
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<any>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Ignore background errors
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userRole = user?.roles?.[0] || 'Case Officer / Investigator';
  const isAuditorOrAdmin = ['Auditor', 'Super Admin', 'Supervisor / Reviewing Officer'].includes(userRole);
  const isSuperAdmin = userRole === 'Super Admin';

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Cases', href: '/cases', icon: FolderKanban },
    { label: 'Search', href: '/search', icon: Search },
    ...(isAuditorOrAdmin ? [{ label: 'Audit Trail', href: '/audit', icon: History }] : []),
    ...(isSuperAdmin ? [{ label: 'User Admin', href: '/admin', icon: Users }] : []),
  ];

  return (
    <header className="h-16 bg-bgSurface border-b border-borderDefault sticky top-0 z-40 px-6 flex items-center justify-between shadow-card">
      {/* Brand & Prototype Tag */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/20 flex items-center justify-center text-accentPrimary group-hover:bg-accentPrimary group-hover:text-white transition-all shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-textPrimary tracking-tight text-lg block leading-none">
              SDMS
            </span>
            <span className="text-[11px] text-textSecondary font-medium tracking-normal block mt-1">
              Secure Document Repository
            </span>
          </div>
        </Link>

        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-warning/15 dark:text-warning dark:border-warning/30">
          SIH Prototype
        </span>
      </div>

      {/* Pill-shaped Global Search Bar (Design.md §8 & §14) */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases, documents, SHA-256 hashes, OCR text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bgSurfaceMuted hover:bg-bgSurfaceMuted/80 border border-borderDefault rounded-full pl-10 pr-4 py-2 text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:border-accentPrimary transition-all"
          />
        </div>
      </form>

      {/* Nav Links + User Controls */}
      <div className="flex items-center space-x-2 lg:space-x-3">
        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 mr-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? 'bg-textPrimary text-bgSurface dark:bg-accentPrimary dark:text-white shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle (Light/Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted rounded-full transition-colors"
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceMuted rounded-full relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accentPrimary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-bgSurface border border-borderDefault rounded-2xl shadow-modal p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-borderDefault pb-2.5 mb-2.5">
                <span className="text-xs font-bold text-textPrimary">Notifications</span>
                <span className="text-[11px] text-accentPrimary font-semibold px-2 py-0.5 bg-accentPrimarySoft rounded-full">
                  {unreadCount} unread
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-textSecondary py-4 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="text-xs p-2.5 rounded-xl bg-bgSurfaceMuted border border-borderDefault space-y-1"
                    >
                      <div className="font-semibold text-textPrimary">{n.title}</div>
                      <div className="text-textSecondary text-[11px] leading-relaxed">{n.message}</div>
                      <div className="text-[10px] text-textSecondary/70 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-bgSurfaceMuted transition-colors border border-transparent hover:border-borderDefault"
            >
              <div className="w-8 h-8 rounded-full bg-accentPrimary/15 border-2 border-accentPrimary flex items-center justify-center text-accentPrimary font-bold text-xs">
                {user.fullName?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-textPrimary leading-tight">{user.fullName}</div>
                <div className="text-[10px] text-textSecondary">{user.roles?.[0] || 'Investigator'}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-textSecondary" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-bgSurface border border-borderDefault rounded-2xl shadow-modal p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3 border-b border-borderDefault mb-1">
                  <div className="text-xs font-bold text-textPrimary">{user.fullName}</div>
                  <div className="text-[11px] text-textSecondary truncate">{user.email}</div>
                  <div className="mt-1.5 inline-block px-2 py-0.5 bg-accentPrimarySoft text-accentPrimary border border-accentPrimary/20 rounded-full text-[10px] font-semibold">
                    {user.roles?.[0]}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-textPrimary hover:bg-bgSurfaceMuted rounded-xl transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-textSecondary" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/cases"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-textPrimary hover:bg-bgSurfaceMuted rounded-xl transition-colors"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-textSecondary" />
                    <span>My Cases</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-error hover:bg-rose-50 dark:hover:bg-error/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold bg-accentPrimary hover:bg-accentPrimaryHover text-white rounded-xl transition-colors shadow-sm"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
