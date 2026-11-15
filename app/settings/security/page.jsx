'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Users, 
  Smartphone, 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Check,
  X,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';

export default function SecurityAndRolesPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Google Chrome on Windows 11', location: 'Delhi, India', ip: '103.21.144.82', isCurrent: true, time: 'Active now' },
    { id: 2, device: 'EV Fleet Mobile App on Android 14', location: 'Delhi, India', ip: '103.21.144.90', isCurrent: false, time: '2 hours ago' },
    { id: 3, device: 'Safari on iPad Pro', location: 'Mumbai, India', ip: '115.112.88.14', isCurrent: false, time: 'Yesterday at 4:15 PM' }
  ]);

  const teamRoles = [
    { name: 'Priyanshi Agarwal', email: 'priyanshi@evfleet.internal', role: 'Fleet Operations Lead', scope: 'Full Admin', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Priyanshi Saxena', email: 'saxena@evfleet.internal', role: 'Backend & Database Core', scope: 'Database & API Root', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Manisha', email: 'manisha@evfleet.internal', role: 'Battery ML & Maintenance', scope: 'Models & Telemetry', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Shivanshi', email: 'shivanshi@evfleet.internal', role: 'Procurement & Sustainability', scope: 'Procurement & ESG', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Field Technician Lead', email: 'depot.tech@evfleet.internal', role: 'Depot Maintenance Tech', scope: 'Inspection Checklists', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
  ];

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatusMessage({ text: 'Please fill in all password fields.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMessage({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setStatusMessage({ text: 'Password successfully updated! All active sessions refreshed.', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 4000);
  };

  const handleRevokeSession = (sessionId) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    setStatusMessage({ text: 'Session revoked successfully.', type: 'success' });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Role Permissions</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage authentication security, role permissions and session access</p>
          </div>
        </div>

        {/* Quick Nav */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings/account"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Account Settings
          </Link>
          <Link
            href="/settings/telemetry"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Telemetry Config
          </Link>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: Password Change & 2FA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Change Password Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Update Account Password</span>
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters with numbers"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPassword ? 'Hide passwords' : 'Show passwords'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Right: 2FA & Multi-Factor Auth (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Two-Factor Authentication</span>
            </h3>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Authenticator App (TOTP)</span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {is2FAEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Requires a 6-digit verification code from Google Authenticator or 1Password when signing in from an unverified IP address.
              </p>
              <button
                type="button"
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline block pt-1"
              >
                {is2FAEnabled ? 'Reconfigure 2FA Device' : 'Enable 2FA Protection'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
            <strong>Security Standard:</strong> Enforced under ISO/IEC 27001 & Automotive IoT Cybersecurity UNECE WP.29.
          </div>
        </div>
      </div>

      {/* Team Role-Based Access Control (RBAC) Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Role-Based Access Control (RBAC) Directory</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Assigned roles and permission scopes for your fleet intelligence sprint team</p>
          </div>
          <button 
            type="button"
            onClick={() => alert("Invite teammate dialog opened. Enter work email.")}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Invite Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Sprint Role</th>
                <th className="py-3 px-4">Access Scope</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamRoles.map((member, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <p className="text-[11px] text-slate-400">{member.email}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {member.role}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${member.badge}`}>
                      {member.scope}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Active Browser & Mobile Sessions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage devices currently logged into your account</p>
          </div>
          {activeSessions.length > 1 && (
            <button
              onClick={() => {
                setActiveSessions(prev => prev.filter(s => s.isCurrent));
                setStatusMessage({ text: 'All other remote sessions revoked!', type: 'success' });
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
            >
              Revoke All Other Sessions
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          {activeSessions.map((session) => (
            <div key={session.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{session.device}</p>
                  {session.isCurrent && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      This Device
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {session.location} • IP: {session.ip} • <span className="text-slate-500">{session.time}</span>
                </p>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                >
                  Log Out
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

