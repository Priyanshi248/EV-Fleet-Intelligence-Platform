'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  BatteryCharging, 
  Wrench, 
  ShoppingBag, 
  ShieldAlert, 
  Leaf, 
  Bot,
  X
} from 'lucide-react';

export const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fleet Monitoring', href: '/fleet', icon: Truck },
  { name: 'Battery Intelligence', href: '/battery', icon: BatteryCharging },
  { name: 'Predictive Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'EV Procurement', href: '/procurement', icon: ShoppingBag },
  { name: 'Supply Chain Risk', href: '/supply-chain', icon: ShieldAlert },
  { name: 'Net-Zero Tracking', href: '/net-zero', icon: Leaf },
  { name: 'AI Assistant', href: '/assistant', icon: Bot },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c131f] text-slate-300 flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-slate-800/60
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Header & Logo */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/40">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-tight text-base leading-tight">
                  EV Fleet
                </span>
                <span className="text-xs font-medium text-emerald-400 tracking-wider">
                  Intelligence
                </span>
              </div>
            </Link>

            <button 
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`
                    flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-[#10b981] text-white shadow-md shadow-emerald-600/30 font-semibold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Banner */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-b from-[#131f30] to-[#0f1826] border border-slate-800/70">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                Driving
              </p>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                Cleaner Roads
              </p>
              <p className="text-[11px] text-emerald-400/90 font-medium leading-tight mt-0.5">
                for a Greener Tomorrow
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

