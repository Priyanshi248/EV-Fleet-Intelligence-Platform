'use client';

import { useState } from 'react';
import { Search, Bell, ChevronDown, Menu, User, Settings, ShieldCheck, LogOut, CheckCircle, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);

  const userName = user?.name || 'Priyanshi';
  const userRole = user?.role || 'Fleet Operations Lead';
  const userInitials = user?.avatarInitials || userName.substring(0, 2).toUpperCase();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/fleet?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSignOut = () => {
    setShowProfileMenu(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 shadow-sm">
      {/* Left: Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicles, reports, insights... (Press Enter)"
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
        </form>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 ? (
                    <button
                      onClick={() => setUnreadCount(0)}
                      className="text-[11px] text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  ) : null}
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} New
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <Link 
                  href="/maintenance" 
                  onClick={() => setShowNotifications(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">High Risk: EV-004 Thermal Alert</p>
                    <p className="text-xs text-slate-500 mt-0.5">Battery temperature hit 48°C during fast charge at Depot 3.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                  </div>
                </Link>

                <Link 
                  href="/fleet" 
                  onClick={() => setShowNotifications(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">EV-001 Charging Session Finished</p>
                    <p className="text-xs text-slate-500 mt-0.5">Charged to 88% SOC at Delhi Hub. Ready for route.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">35 mins ago</span>
                  </div>
                </Link>

                <Link 
                  href="/supply-chain" 
                  onClick={() => setShowNotifications(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Lithium Price Volatility Notice</p>
                    <p className="text-xs text-slate-500 mt-0.5">Spot lithium index shifted +4.2% overnight in Chinese markets.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                  </div>
                </Link>
              </div>

              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <Link 
                  href="/maintenance" 
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View all maintenance alerts &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition-colors"
            title="User Profile Menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-xs font-bold tracking-tight border border-slate-300">
              {userInitials}
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline-block">
              {userName}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{userName}</p>
                <p className="text-xs text-slate-500">{user?.email || 'priyanshi@evfleet.internal'}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-medium text-emerald-700">{userRole}</span>
                </div>
              </div>

              <div className="py-1">
                {/* 1. Account Settings */}
                <Link 
                  href="/settings/account"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                {/* 2. Security & Role Permissions */}
                <Link 
                  href="/settings/security"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Security & Role Permissions</span>
                </Link>

                {/* 3. Telemetry Preferences */}
                <Link 
                  href="/settings/telemetry"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Telemetry Preferences</span>
                </Link>
              </div>

              {/* 4. Sign Out */}
              <div className="pt-1 border-t border-slate-100">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
