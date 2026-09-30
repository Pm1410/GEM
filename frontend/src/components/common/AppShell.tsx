import React, { useState, Fragment } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  CheckSquare,
  Files,
  FileBarChart,
  History,
  Shield,
  Settings,
  Search,
  Bell,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  Building2,
  Activity,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface AppShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  onOpenPortalSimulator: () => void;
  children: React.ReactNode;
  breadcrumb?: { label: string; view?: string }[];
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  user,
  onSwitchRole,
  onLogout,
  onOpenPortalSimulator,
  children,
  breadcrumb = [],
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tenders', label: 'Tenders', icon: FileSpreadsheet },
    { id: 'bidders', label: 'Bidders', icon: Users },
    { id: 'verification', label: 'Verification', icon: CheckSquare },
    { id: 'documents', label: 'Documents', icon: Files },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'evaluation', label: 'Evaluation', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ambient-grain flex flex-col font-sans text-[#2A2826]">
      {/* Top Application Bar */}
      <header className="h-16 border-b border-[#E5DFD9] bg-white/90 backdrop-blur-md sticky top-0 z-40 px-5 flex items-center justify-between shadow-2xs">
        {/* Left: Brand & Organization */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#124E59] flex items-center justify-center text-[#FEFAF7] font-extrabold text-sm shadow-sm group-hover:bg-[#0A323A] transition-colors">
              TG
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[#2A2826] block leading-none">
                TenderGuard
              </span>
              <span className="text-xs text-[#5F6675] font-mono-tech leading-tight block mt-1">
                CPCL &bull; MoPNG &bull; SIH 26100
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search command bar (Mac style) */}
        <div className="hidden md:flex items-center w-96 relative">
          <Search className="w-4 h-4 text-[#5F6675] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tenders, bidders, GSTIN, PAN, documents..."
            className="w-full pl-10 pr-12 py-2 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-medium text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white transition-all shadow-2xs"
          />
          <kbd className="absolute right-2.5 top-2.5 px-2 py-0.5 text-xs font-mono-tech text-[#5F6675] bg-white rounded-md border border-[#E5DFD9]">
            ⌘K
          </kbd>
        </div>

        {/* Right: Actions, Simulator trigger, Role switcher */}
        <div className="flex items-center gap-2.5">
          {/* Simulated Gateway Status Badge */}
          <button
            onClick={onOpenPortalSimulator}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono-tech font-bold bg-[#FBF9F6] border border-[#B7A08B]/50 hover:bg-white text-[#124E59] transition-all cursor-pointer shadow-2xs"
            title="Configure Simulated Gateways & Portals"
          >
            <Radio className="w-3.5 h-3.5 text-[#124E59] animate-pulse" />
            <span>PORTAL GATEWAYS</span>
          </button>

          <button
            title="Notifications"
            className="p-2 text-[#5F6675] hover:text-[#2A2826] rounded-xl hover:bg-[#F4EFEB] transition-colors cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-[#E5DFD9] bg-white hover:bg-[#FBF9F6] transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-[#124E59] text-[#FEFAF7] flex items-center justify-center text-xs font-bold font-mono-tech">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs font-mono-tech leading-tight">
                <span className="font-bold text-[#2A2826] block">{user.name}</span>
                <span className="text-[11px] text-[#124E59] font-bold uppercase">{user.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6675]" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E5DFD9] bg-white shadow-xl py-2 z-50 text-xs font-mono-tech">
                <div className="px-4 py-2.5 border-b border-[#E5DFD9]">
                  <p className="font-bold text-sm text-[#2A2826]">{user.name}</p>
                  <p className="text-xs text-[#5F6675] truncate">{user.email}</p>
                  <p className="text-xs text-[#124E59] font-bold mt-1">{user.department}</p>
                </div>

                <div className="px-4 py-2 text-xs text-[#5F6675] uppercase tracking-wider font-bold">
                  Switch Active Role (RBAC)
                </div>

                {(['OFFICER', 'EVALUATOR', 'ADMIN', 'AUDITOR'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onSwitchRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between cursor-pointer ${
                      user.role === r
                        ? 'bg-[#124E59]/10 text-[#124E59] font-bold'
                        : 'text-[#2A2826] hover:bg-[#FBF9F6]'
                    }`}
                  >
                    <span>{r}</span>
                    {user.role === r && <span className="text-xs text-[#124E59] font-bold">&bull; Active</span>}
                  </button>
                ))}

                <div className="border-t border-[#E5DFD9] mt-2 pt-2 space-y-1">
                  <button
                    onClick={async () => {
                      if (window.confirm('Reset all synthetic bidder datasets, officer decisions, and audit chain to clean baseline?')) {
                        await fetch('/api/admin/reset-demo', { method: 'POST' });
                        window.location.reload();
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-bold rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Reset Demo Baseline</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-[#2A2826] hover:bg-[#F4EFEB] flex items-center gap-2 cursor-pointer font-bold rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[#5F6675]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-60 border-r border-[#E5DFD9] bg-white/80 backdrop-blur-md p-4 flex flex-col justify-between shrink-0 shadow-2xs">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#124E59] text-[#FEFAF7] font-bold shadow-xs'
                      : 'text-[#2A2826] hover:bg-[#F4EFEB] hover:text-[#124E59]'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#FEFAF7]' : 'text-[#5F6675]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Authority Box */}
          <div className="p-3.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9] text-xs font-mono-tech text-[#5F6675] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#124E59] font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Core Principle</span>
            </div>
            <p className="leading-snug text-[#2A2826]">
              AI reads and advises. Deterministic rules verify. <strong className="text-[#124E59]">The officer decides.</strong>
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Breadcrumb Bar */}
          {breadcrumb.length > 0 && (
            <div className="px-6 py-3 border-b border-[#E5DFD9] bg-white/50 backdrop-blur-xs flex items-center gap-2 text-xs font-mono-tech">
              {breadcrumb.map((bc, idx) => (
                <Fragment key={idx}>
                  {idx > 0 && <span className="text-[#B7A08B] font-bold">/</span>}
                  {bc.view ? (
                    <button
                      onClick={() => onNavigate(bc.view!)}
                      className="text-[#5F6675] hover:text-[#124E59] font-medium cursor-pointer"
                    >
                      {bc.label}
                    </button>
                  ) : (
                    <span className="text-[#2A2826] font-bold">{bc.label}</span>
                  )}
                </Fragment>
              ))}
            </div>
          )}

          <div className="flex-1 p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
