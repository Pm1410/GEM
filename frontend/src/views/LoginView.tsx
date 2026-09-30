import React, { useState } from 'react';
import { ShieldCheck, FileSpreadsheet, CheckCircle2, UserCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { UserRole } from '../types';

interface LoginViewProps {
  onLogin: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('officer@cpcl.gov.in');
  const [password, setPassword] = useState('••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email);
  };

  const handleQuickDemo = (roleEmail: string) => {
    setEmail(roleEmail);
    onLogin(roleEmail);
  };

  return (
    <div className="min-h-screen bg-ambient-grain flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Branding Area (Matches Panel 01) */}
        <div className="md:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#124E59]/10 text-[#124E59] text-xs font-bold font-mono-tech border border-[#124E59]/25 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
            <span>SIH Problem Statement 26100</span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#2A2826] leading-tight">
              TenderGuard
            </h1>
            <p className="text-base sm:text-lg text-[#5F6675] font-semibold mt-2">
              AI-Assisted Bid Compliance Verification Platform for Transparent Procurement
            </p>
          </div>

          {/* 4 Core Workflow Pillars */}
          <div className="space-y-3 pt-2">
            {[
              {
                icon: FileSpreadsheet,
                title: 'Tender Configuration',
                desc: 'Upload & configure tender requirements with versioned rule sets.',
              },
              {
                icon: ShieldCheck,
                title: 'Grounded Evidence',
                desc: 'Extract verifiable facts linked to exact page coordinates.',
              },
              {
                icon: CheckCircle2,
                title: 'Deterministic Rules',
                desc: 'Statutory verification with Mod-36 checksums & cross-checks.',
              },
              {
                icon: UserCheck,
                title: 'Officer Authority',
                desc: 'AI reads and advises. Rules verify. The officer decides.',
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3 rounded-xl bg-white/80 border border-[#E5DFD9] shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#124E59]/10 text-[#124E59] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#2A2826]">
                      {step.title}
                    </h4>
                    <p className="text-xs text-[#5F6675] leading-snug mt-0.5 font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#E5DFD9] flex items-center gap-3 text-xs font-mono-tech text-[#5F6675]">
            <div className="w-9 h-9 rounded-xl bg-[#124E59]/10 flex items-center justify-center text-sm font-bold text-[#124E59]">
              🏛️
            </div>
            <div>
              <p className="font-extrabold text-[#2A2826] text-xs">Government of India</p>
              <p className="text-[11px] text-[#5F6675]">Ministry of Petroleum & Natural Gas &bull; CPCL</p>
            </div>
          </div>
        </div>

        {/* Right Frosted Login Window (Matches Panel 01) */}
        <div className="md:col-span-6">
          <div className="bg-white rounded-3xl p-8 max-w-md mx-auto shadow-xl border border-[#E5DFD9]">
            <h2 className="text-2xl font-extrabold text-[#2A2826] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-[#5F6675] font-mono-tech mt-1">
              Sign in to continue to TenderGuard Procurement Workspace
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2A2826] font-mono-tech uppercase tracking-wider mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5F6675] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-mono-tech text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A2826] font-mono-tech uppercase tracking-wider mb-1.5">
                  Password / GovPass Token
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5F6675] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-mono-tech text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono-tech text-[#5F6675]">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input type="checkbox" defaultChecked className="rounded text-[#124E59]" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="hover:underline text-[#124E59] font-bold">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-bold font-mono-tech hover:bg-[#0A323A] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#E5DFD9] w-full" />
                <span className="bg-white px-3 text-xs text-[#5F6675] font-mono-tech uppercase font-bold">
                  or quick demo role login
                </span>
                <div className="border-t border-[#E5DFD9] w-full" />
              </div>

              {/* Demo Role Logins */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-tech">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('officer@cpcl.gov.in')}
                  className="p-2.5 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] text-left cursor-pointer transition-all shadow-2xs"
                >
                  <span className="font-bold text-[#124E59] block">Procurement Officer</span>
                  <span className="text-[11px] text-[#5F6675]">P. Sengupta</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('evaluator@cpcl.gov.in')}
                  className="p-2.5 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] text-left cursor-pointer transition-all shadow-2xs"
                >
                  <span className="font-bold text-[#2A2826] block">Technical Evaluator</span>
                  <span className="text-[11px] text-[#5F6675]">K. Ramanathan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin@tenderguard.gov.in')}
                  className="p-2.5 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] text-left cursor-pointer transition-all shadow-2xs"
                >
                  <span className="font-bold text-[#2A2826] block">System Admin</span>
                  <span className="text-[11px] text-[#5F6675]">Dr. S. Meenakshi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('auditor@cag.gov.in')}
                  className="p-2.5 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] text-left cursor-pointer transition-all shadow-2xs"
                >
                  <span className="font-bold text-[#2A2826] block">CAG Auditor</span>
                  <span className="text-[11px] text-[#5F6675]">V. Anand, IA&AS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
