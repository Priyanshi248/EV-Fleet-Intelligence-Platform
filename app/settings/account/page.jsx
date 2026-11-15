'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Globe, 
  Bell, 
  Save, 
  CheckCircle2, 
  ArrowLeft,
  Camera,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AccountSettingsPage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || 'Priyanshi',
    email: user?.email || 'priyanshi@evfleet.internal',
    phone: '+91 98765 43210',
    organization: 'CleanRoads EV Logistics India Pvt Ltd',
    role: user?.role || 'Fleet Operations Lead',
    depot: 'Delhi Central Hub',
    timezone: 'Asia/Kolkata (IST)',
    units: 'Metric (km, kWh, °C)',
    currency: '₹ INR',
    emailAlerts: true,
    smsAlerts: true,
    digestReport: true,
    maintenancePings: true
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Page Title */}
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage your personal profile, depot allocation, and alerts</p>
          </div>
        </div>

        {/* Quick Nav Pills to Other Settings */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings/security"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Security & Roles
          </Link>
          <Link
            href="/settings/telemetry"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Telemetry Config
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Profile and notification preferences have been saved successfully!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-2xl font-black tracking-tight border-4 border-slate-100 shadow-md">
            {formData.name.substring(0, 2).toUpperCase()}
          </div>
          <button 
            type="button" 
            onClick={() => alert("Avatar photo upload dialog opened.")}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors"
            title="Upload photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit mx-auto sm:mx-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {formData.role}
            </span>
          </div>
          <p className="text-xs text-slate-500">{formData.email}</p>
          <p className="text-xs text-slate-400">Assigned Territory: <strong>{formData.depot}</strong></p>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Personal & Work Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organization</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Depot Allocation</label>
              <select
                value={formData.depot}
                onChange={(e) => setFormData({...formData, depot: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              >
                <option value="Delhi Central Hub">Delhi Central Hub</option>
                <option value="Mumbai Western Depot">Mumbai Western Depot</option>
                <option value="Bengaluru Tech Park Hub">Bengaluru Tech Park Hub</option>
                <option value="Chennai Harbor Hub">Chennai Harbor Hub</option>
                <option value="Pune Expressway Depot">Pune Expressway Depot</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & Alert Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Telemetry Notification Rules</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">Critical Battery & Thermal Emergencies</p>
                <p className="text-xs text-slate-500">Send high-priority alerts when pack temperature &gt;45°C or cell voltage delta &gt;25mV.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailAlerts}
                onChange={(e) => setFormData({...formData, emailAlerts: e.target.checked})}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">Predictive Maintenance Work Orders</p>
                <p className="text-xs text-slate-500">Instant notification when AI models detect anomaly in charging or SOH degradation.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenancePings}
                onChange={(e) => setFormData({...formData, maintenancePings: e.target.checked})}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">SMS / Emergency Push to Operations Phone</p>
                <p className="text-xs text-slate-500">Dispatch SMS notifications for roadside immobilizations or battery disconnects.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.smsAlerts}
                onChange={(e) => setFormData({...formData, smsAlerts: e.target.checked})}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">Weekly Fleet Decarbonization Digest</p>
                <p className="text-xs text-slate-500">Receive Monday morning summary of cumulative CO₂ savings and energy costs.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.digestReport}
                onChange={(e) => setFormData({...formData, digestReport: e.target.checked})}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#10b981] hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Account Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

