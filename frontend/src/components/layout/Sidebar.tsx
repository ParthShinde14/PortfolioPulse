import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, ArrowLeftRight,
  BarChart3, TrendingUp, Shield, Eye
} from 'lucide-react';

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/holdings',     icon: Briefcase,       label: 'Holdings'     },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/watchlist',    icon: Eye,             label: 'Watchlist'    },
  { to: '/analytics',    icon: BarChart3,       label: 'Analytics'    },
  { to: '/health',       icon: Shield,          label: 'Health & Risk'},
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-surface-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-200">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-slate-800 tracking-tight">
          Portfolio<span className="text-brand-600">Pulse</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-surface-100 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-brand-600' : 'text-slate-400'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-surface-200">
        <p className="text-xs text-slate-400">Market data via Yahoo Finance</p>
        <p className="text-xs text-slate-300 mt-0.5">Prices 3 min delayed</p>
      </div>
    </aside>
  );
}
