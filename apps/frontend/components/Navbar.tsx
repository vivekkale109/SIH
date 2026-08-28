'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Search, Bell, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMe();
    fetchNotifications();
  }, []);

  const fetchMe = async () => {
    try {
      const data = await apiFetch<any>('/auth/me');
      setUser(data.user);
    } catch (err) {
      // Not logged in or expired
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

  return (
    <header className="h-16 bg-bgSurface border-b border-borderDefault sticky top-0 z-40 flex items-center justify-between px-6">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-sm bg-accentPrimary/20 border border-accentPrimary/40 flex items-center justify-center text-accentPrimary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-textPrimary tracking-wide text-base block leading-none">SDMS</span>
            <span className="text-[10px] text-textSecondary tracking-wider uppercase block mt-1">Digital Evidence & Records</span>
          </div>
        </Link>

        <span className="ml-4 px-2 py-0.5 text-[10px] uppercase font-mono bg-warning/10 text-warning border border-warning/30 rounded-sm">
          SIH Prototype (Synthetic Data)
        </span>
      </div>

      {/* Global Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, case numbers, OCR text, metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bgBase border border-borderDefault rounded-sm pl-9 pr-4 py-1.5 text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:border-accentPrimary"
          />
        </div>
      </form>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceRaised rounded-sm relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accentPrimary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-bgSurfaceRaised border border-borderDefault rounded-md shadow-modal p-3 z-50">
              <div className="flex items-center justify-between border-b border-borderDefault pb-2 mb-2">
                <span className="text-sm font-semibold text-textPrimary">Notifications</span>
                <span className="text-xs text-textSecondary">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-textSecondary py-4 text-center">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded bg-bgBase/50 border border-borderDefault">
                      <div className="font-medium text-textPrimary">{n.title}</div>
                      <div className="text-textSecondary mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-textSecondary/70 mt-1 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        {user ? (
          <div className="flex items-center space-x-3 border-l border-borderDefault pl-4">
            <div className="text-right">
              <div className="text-sm font-medium text-textPrimary">{user.fullName}</div>
              <div className="text-[11px] text-accentPrimary font-mono">
                {user.roles?.[0] || 'User'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-textSecondary hover:text-error hover:bg-error/10 rounded-sm transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-medium bg-accentPrimary hover:bg-accentPrimaryHover text-white rounded-sm transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
};
