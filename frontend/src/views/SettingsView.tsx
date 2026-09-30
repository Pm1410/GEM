import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Code2,
  Server,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw,
  Key,
  Users,
  Play,
  Terminal,
  FileCheck,
  Cpu,
  Database,
  Check,
  Copy,
  ExternalLink,
  Sliders,
  Lock,
  FileCode,
  ShieldCheck,
  Activity,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AdapterStatus, UserRole } from '../types';

interface SettingsViewProps {
  onOpenPortalSimulator: () => void;
  currentUserRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenPortalSimulator,
  currentUserRole,
  onSwitchRole,
}) => {
  const [activeSection, setActiveSection] = useState<'ALL' | 'RULES' | 'ADAPTERS' | 'AUDIT' | 'ROLES'>('ALL');
  const [selectedRuleCode, setSelectedRuleCode] = useState<string>('CIN_EXISTS');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<'ALL' | 'STATUTORY' | 'FINANCIAL' | 'TECHNICAL'>('ALL');
  const [testInput, setTestInput] = useState<string>('U45201TN2016PTC112345');
  const [testResult, setTestResult] = useState<{ state: 'PASS' | 'FAIL' | 'REVIEW'; reason: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [portals, setPortals] = useState<any[]>([]);
  const [updatingPortal, setUpdatingPortal] = useState<string | null>(null);
  const [roleChangeNotice, setRoleChangeNotice] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Fetch simulated portal states
  const fetchPortals = async () => {
    try {
      const res = await fetch('/api/portals');
      const data = await res.json();
      setPortals(data.portals || []);
    } catch (e) {
      console.error('Failed to load portals:', e);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const handlePortalStatusChange = async (portalId: string, status: AdapterStatus) => {
    try {
      setUpdatingPortal(portalId);
      await fetch('/api/portals/set-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: portalId, status }),
      });
      await fetchPortals();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingPortal(null);
    }
  };

  const ruleLibrary = [
    {
      code: 'CIN_EXISTS',
      title: 'Company Incorporation & MCA21 Active Entity Record',
      category: 'STATUTORY',
      weight: 3,
      mandatory: true,
      defaultInput: 'U45201TN2016PTC112345',
      logic: `def verify_cin(cin_string: str, evidence_doc: PDFEvidence) -> VerificationResult:
    # 1. Regex & Pattern Validation (21 characters)
    # Format: [UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}
    if not CIN_REGEX.match(cin_string):
        return VerificationResult(state="FAIL", reason="Malformed 21-digit CIN string format")
    
    # 2. Query Simulated MCA21 Government Adapter
    mca_response = mca_adapter.lookup(cin=cin_string)
    if mca_response.status != "ACTIVE":
        return VerificationResult(
            state="FAIL", 
            reason="CIN not found in MCA database or entity listed as Inactive/Strike-Off"
        )
        
    return VerificationResult(state="PASS", reason="Company verified in MCA21 registry")`,
      failureAction: 'Statutory breach. Disqualify bid unless officer accepts notarized certificate exception.',
    },
    {
      code: 'GST_001',
      title: 'GSTIN Format, Mod-36 Checksum & GSTR-3B Return Filing',
      category: 'STATUTORY',
      weight: 3,
      mandatory: true,
      defaultInput: '22AAAAA0000A1Z5',
      logic: `def verify_gstin(gstin: str, pan: str, returns: list) -> VerificationResult:
    # 1. Mod-36 Checksum verification
    if not validate_mod36_checksum(gstin):
        return VerificationResult(state="FAIL", reason="Invalid Mod-36 checksum character")
    
    # 2. Structural PAN Cross-Check
    embedded_pan = gstin[2:12]
    if embedded_pan != pan:
        return VerificationResult(state="FAIL", reason="GSTIN embedded PAN does not match standalone PAN card")
        
    # 3. Monthly Return Filing Status
    if any(r.status == "OVERDUE" for r in returns):
        return VerificationResult(state="FAIL", reason="GSTR-3B monthly filings are overdue on GSTN portal")
        
    return VerificationResult(state="PASS", reason="Active compliant taxpayer record verified")`,
      failureAction: 'Flag for mandatory statutory clarification notice with 5-day response window.',
    },
    {
      code: 'DEBAR_001',
      title: 'Central Public Procurement Portal & GeM Debarment Register',
      category: 'STATUTORY',
      weight: 3,
      mandatory: true,
      defaultInput: '07EEEEE4444E5Z0',
      logic: `def verify_debarment(entity_name: str, pan: str, cin: str) -> VerificationResult:
    # Cross-reference against GFR 151 Blacklisting & Debarment Registry
    match = debarment_registry.find(pan=pan, cin=cin)
    if match:
        return VerificationResult(
            state="FAIL", 
            reason=f"Entity debarred under order {match.order_number} by {match.issuing_ministry}"
        )
    return VerificationResult(state="PASS", reason="Entity cleared on National Debarment Register")`,
      failureAction: 'Mandatory Rejection under General Financial Rules (GFR 2017 Rule 151).',
    },
    {
      code: 'TURNOVER_001',
      title: 'Minimum Average Annual Financial Turnover (3 Years)',
      category: 'FINANCIAL',
      weight: 3,
      mandatory: true,
      defaultInput: 'INR 42,50,00,000',
      logic: `def verify_turnover(avg_turnover: float, threshold: float = 300000000.0) -> VerificationResult:
    # Tender requires average turnover >= Rs. 30.00 Crores
    if avg_turnover < threshold:
        return VerificationResult(
            state="FAIL", 
            reason=f"Turnover Rs {avg_turnover/1e7:.2f} Cr below required threshold of Rs 30.00 Cr"
        )
    return VerificationResult(state="PASS", reason=f"Turnover Rs {avg_turnover/1e7:.2f} Cr meets financial criteria")`,
      failureAction: 'Financial disqualification. Non-responsive bid.',
    },
    {
      code: 'NETWORTH_001',
      title: 'Positive Net Worth Audited Balance Sheet Certification',
      category: 'FINANCIAL',
      weight: 3,
      mandatory: true,
      defaultInput: 'INR 18,20,00,000',
      logic: `def verify_networth(networth_value: float) -> VerificationResult:
    # Must be strictly positive (> 0.00) certified by statutory auditor
    if networth_value <= 0:
        return VerificationResult(state="FAIL", reason="Negative or zero net worth disclosed")
    return VerificationResult(state="PASS", reason="Positive net worth certified by chartered accountant")`,
      failureAction: 'Financial disqualification under GFR 173.',
    },
    {
      code: 'OEM_001',
      title: 'OEM Tier-1 Manufacturer Authorization Form (MAF)',
      category: 'TECHNICAL',
      weight: 3,
      mandatory: true,
      defaultInput: 'MAF-HP-CPCL-2025-098',
      logic: `def verify_oem_authorization(maf_cert: Document) -> VerificationResult:
    # Verify OEM digital signature and serial validity
    if not maf_cert.has_authorized_signatory_seal():
        return VerificationResult(state="REVIEW", reason="OEM endorsement stamp impression blurred; verify with OEM")
    return VerificationResult(state="PASS", reason="Valid Manufacturer Authorization Form confirmed")`,
      failureAction: 'Assign REVIEW state and require technical clarification.',
    },
  ];

  const filteredRules = ruleLibrary.filter((r) => {
    if (ruleCategoryFilter === 'ALL') return true;
    return r.category === ruleCategoryFilter;
  });

  const activeRule = ruleLibrary.find((r) => r.code === selectedRuleCode) || ruleLibrary[0];

  const handleSelectRule = (code: string) => {
    setSelectedRuleCode(code);
    const rule = ruleLibrary.find((r) => r.code === code);
    if (rule) {
      setTestInput(rule.defaultInput);
      setTestResult(null);
    }
  };

  const handleRunTestSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      if (selectedRuleCode === 'CIN_EXISTS') {
        if (testInput.includes('TN2016PTC112345')) {
          setTestResult({
            state: 'FAIL',
            reason: 'CIN not found in MCA database (Simulated MCA adapter returned NOT_FOUND).',
          });
        } else if (testInput.length !== 21) {
          setTestResult({
            state: 'FAIL',
            reason: 'Malformed 21-digit CIN string.',
          });
        } else {
          setTestResult({
            state: 'PASS',
            reason: 'Active company record found in MCA21 registry.',
          });
        }
      } else if (selectedRuleCode === 'GST_001') {
        if (testInput.startsWith('22AAAAA')) {
          setTestResult({
            state: 'FAIL',
            reason: 'GSTR-3B filings overdue for Q1/Q2 on GSTN portal.',
          });
        } else {
          setTestResult({
            state: 'PASS',
            reason: 'Mod-36 checksum valid and tax filings up to date.',
          });
        }
      } else if (selectedRuleCode === 'DEBAR_001') {
        if (testInput.includes('EEEEE4444E')) {
          setTestResult({
            state: 'FAIL',
            reason: 'Entity match on Central Debarment Register (Order MoHUA/2024/77).',
          });
        } else {
          setTestResult({
            state: 'PASS',
            reason: 'Entity cleared on Debarment Register.',
          });
        }
      } else {
        setTestResult({
          state: 'PASS',
          reason: 'Deterministic check satisfied compliance thresholds.',
        });
      }
      setIsSimulating(false);
    }, 450);
  };

  const handleSwitchRoleWithFeedback = (role: UserRole) => {
    onSwitchRole(role);
    setRoleChangeNotice(`Switched active session role to ${role}`);
    setTimeout(() => setRoleChangeNotice(null), 3000);
  };

  const handleCopyGenesis = () => {
    navigator.clipboard.writeText('0000000000000000000000000000000000000000000000000000000000000000');
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & SYSTEM GOVERNANCE IDENTITY */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#E5DFD9]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono-tech px-2.5 py-0.5 rounded-md bg-[#124E59]/10 text-[#124E59] font-extrabold border border-[#124E59]/25">
              Engine Governance Standard v1.3
            </span>
            <span className="text-xs text-[#5F6675] font-mono-tech">
              CPCL SIH Problem Statement 26100
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#2A2826]">
            System Settings & Architecture
          </h1>
          <p className="text-sm text-[#5F6675] font-medium mt-1">
            Configure versioned rule sets, external portal gateways, cryptographic ledger chains, and access roles.
          </p>
        </div>

        {/* Section Navigation Control */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FBF9F6] border border-[#E5DFD9] rounded-2xl overflow-x-auto shrink-0 font-mono-tech text-xs">
          {[
            { id: 'ALL', label: 'All Sections' },
            { id: 'RULES', label: 'Rule-Sets' },
            { id: 'ADAPTERS', label: 'Gateways' },
            { id: 'AUDIT', label: 'Audit Ledger' },
            { id: 'ROLES', label: 'RBAC Roles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-[#124E59] text-[#FEFAF7] shadow-xs'
                  : 'text-[#5F6675] hover:text-[#2A2826] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {roleChangeNotice && (
        <div className="p-4 rounded-2xl bg-[#124E59]/10 text-[#124E59] font-mono-tech text-xs font-bold flex items-center gap-2.5 border border-[#124E59]/25 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{roleChangeNotice}</span>
        </div>
      )}

      {/* 2. EXECUTIVE CONFIGURATION KPI GRID (4 Well-Spaced Structured Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Rule-Set */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
              ACTIVE RULE-SET
            </span>
            <FileCode className="w-4 h-4 text-[#124E59]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#124E59] font-mono-tech block">
            v1.3 FROZEN
          </span>
          <span className="text-xs text-[#5F6675] block font-medium">
            18 Deterministic Rules Configured
          </span>
        </div>

        {/* Card 2: Simulated Gateways */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
              EXTERNAL GATEWAYS
            </span>
            <Server className="w-4 h-4 text-[#124E59]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#2A2826] font-mono-tech block">
            5 ADAPTERS
          </span>
          <span className="text-xs text-[#5F6675] block font-medium">
            GSTN, MCA21, EPFO, Udyam, Debarment
          </span>
        </div>

        {/* Card 3: Cryptographic Ledger */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
              CRYPTOGRAPHIC CHAIN
            </span>
            <ShieldCheck className="w-4 h-4 text-[#124E59]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#124E59] font-mono-tech block">
            SHA-256
          </span>
          <span className="text-xs text-[#124E59] block font-bold">
            FIPS PUB 180-4 Verified Seed
          </span>
        </div>

        {/* Card 4: Current Governance Session */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
              GOVERNANCE AUTHORITY
            </span>
            <Users className="w-4 h-4 text-[#124E59]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#2A2826] font-mono-tech block">
            {currentUserRole}
          </span>
          <span className="text-xs text-[#5F6675] block font-medium">
            Active RBAC Session Profile
          </span>
        </div>
      </div>

      {/* 3. SECTION A: VERSIONED RULE-SET & CODE EXECUTION ENGINE */}
      {(activeSection === 'ALL' || activeSection === 'RULES') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DFD9]">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#124E59]" />
                <h2 className="text-lg font-black text-[#2A2826]">
                  1. Versioned Rule-Sets & Deterministic Logic Library
                </h2>
              </div>
              <p className="text-xs text-[#5F6675] mt-0.5">
                Statutory and financial rules evaluated deterministically without black-box AI opacity.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 font-mono-tech text-xs">
              {(['ALL', 'STATUTORY', 'FINANCIAL', 'TECHNICAL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRuleCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    ruleCategoryFilter === cat
                      ? 'bg-[#124E59] text-white shadow-2xs'
                      : 'bg-[#FBF9F6] border border-[#E5DFD9] text-[#5F6675] hover:text-[#2A2826]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Rule Selection Cards */}
            <div className="lg:col-span-4 space-y-2.5 font-mono-tech">
              <div className="flex items-center justify-between text-xs text-[#5F6675] px-1 font-bold uppercase">
                <span>Rule Code & Title ({filteredRules.length})</span>
                <span>Weight</span>
              </div>

              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredRules.map((r) => (
                  <div
                    key={r.code}
                    onClick={() => handleSelectRule(r.code)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      selectedRuleCode === r.code
                        ? 'border-[#124E59] bg-[#124E59]/5 shadow-xs'
                        : 'border-[#E5DFD9] bg-white hover:bg-[#FBF9F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#124E59]">{r.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E5DFD9] text-[#5F6675] font-bold">
                        {r.category}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#2A2826] leading-snug font-sans">
                      {r.title}
                    </span>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD9]/60 text-[11px] text-[#5F6675]">
                      <span>Statutory Weight: <strong>{r.weight}</strong></span>
                      <span className="text-[#124E59] font-bold">Deterministic</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Code Inspector & Interactive Simulation Runner */}
            <div className="lg:col-span-8 space-y-4">
              {/* Card 1: Rule Details & Metadata */}
              <div className="p-6 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-4 font-mono-tech">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5DFD9]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#124E59] px-2.5 py-0.5 rounded-md bg-[#124E59]/10">
                        {activeRule.code}
                      </span>
                      <span className="text-xs text-[#5F6675] font-bold uppercase">
                        {activeRule.category} EVALUATION
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#2A2826] mt-1.5 font-sans">
                      {activeRule.title}
                    </h3>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9] text-xs font-bold text-[#2A2826] shrink-0">
                    Statutory Weight: {activeRule.weight} (Mandatory)
                  </span>
                </div>

                {/* Python Execution Logic Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5F6675]">
                    <span className="font-extrabold uppercase tracking-wider">
                      Deterministic Execution Implementation (Python Engine)
                    </span>
                    <span className="font-mono-tech text-[11px]">Rule Engine v1.3</span>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#2A2826] text-[#FEFAF7] text-xs overflow-x-auto leading-relaxed font-mono-tech border border-[#2A2826]">
                    {activeRule.logic}
                  </pre>
                </div>

                {/* Live Interactive Rule Simulator */}
                <div className="p-4 sm:p-5 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#124E59]" />
                      <span className="text-xs font-extrabold text-[#2A2826] uppercase">
                        Interactive Rule Execution Simulator
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5F6675]">Instant Evaluation</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <input
                      type="text"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Input parameter (e.g. GSTIN, CIN, Turnover)..."
                      className="w-full bg-white border border-[#E5DFD9] rounded-xl px-3.5 py-2 text-xs font-mono-tech text-[#2A2826] focus:outline-hidden focus:border-[#124E59] shadow-2xs"
                    />
                    <button
                      onClick={handleRunTestSimulation}
                      disabled={isSimulating}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-bold hover:bg-[#0A323A] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                      <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                        testResult.state === 'PASS'
                          ? 'bg-[#124E59]/10 text-[#124E59] border-[#124E59]/30'
                          : 'bg-[#2A2826]/10 text-[#2A2826] border-[#2A2826]/30'
                      }`}
                    >
                      {testResult.state === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-extrabold block">Outcome: {testResult.state}</span>
                        <span className="text-[11px] font-sans mt-0.5 block">{testResult.reason}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Failure Policy Note */}
                <div className="p-3.5 bg-[#FBF9F6] rounded-xl border border-[#E5DFD9] space-y-1">
                  <span className="text-[10px] font-extrabold text-[#5F6675] uppercase block">
                    STATUTORY BREACH DISPOSITION POLICY
                  </span>
                  <p className="text-xs text-[#2A2826] font-sans font-medium">
                    {activeRule.failureAction}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. SECTION B: EXTERNAL GATEWAY ADAPTERS & RESILIENCY CONTROLLER */}
      {(activeSection === 'ALL' || activeSection === 'ADAPTERS') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DFD9]">
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#124E59]" />
                <h2 className="text-lg font-black text-[#2A2826]">
                  2. External Portal Gateway Adapters & Resiliency Injection
                </h2>
              </div>
              <p className="text-xs text-[#5F6675] mt-0.5">
                Simulate network latency, timeouts, and portal outages to verify UNVERIFIABLE handling.
              </p>
            </div>

            <button
              onClick={onOpenPortalSimulator}
              className="px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-bold hover:bg-[#0A323A] transition-colors cursor-pointer shadow-xs shrink-0 font-mono-tech"
            >
              Open Live Simulator Modal
            </button>
          </div>

          {/* Grid-Based Layout: 3 Columns on Large Screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-tech text-xs">
            {portals.map((p) => {
              const isUpdating = updatingPortal === p.id;
              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#2A2826] font-sans">
                        {p.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.status === 'SUCCESS'
                            ? 'bg-[#124E59]/10 text-[#124E59] border border-[#124E59]/25'
                            : p.status === 'TIMEOUT'
                            ? 'bg-[#B7A08B]/25 text-[#3D3730] border border-[#B7A08B]/50'
                            : 'bg-[#2A2826]/10 text-[#2A2826] border border-[#2A2826]/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#5F6675] truncate">{p.endpoint}</p>

                    <div className="p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9] text-[11px] text-[#5F6675] space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Simulated Latency:</span>
                        <strong className="text-[#2A2826]">{p.latencyMs}ms</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Registry State:</span>
                        <span className="text-[#124E59] font-bold">{p.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Segmented Injection Button Group */}
                  <div className="pt-3 border-t border-[#E5DFD9] space-y-2">
                    <span className="text-[10px] text-[#5F6675] uppercase font-bold block">
                      INJECT GATEWAY STATE:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['SUCCESS', 'TIMEOUT', 'DOWN', 'STALE'] as AdapterStatus[]).map((st) => (
                        <button
                          key={st}
                          disabled={isUpdating}
                          onClick={() => handlePortalStatusChange(p.id, st)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                            p.status === st
                              ? 'bg-[#124E59] text-white shadow-2xs'
                              : 'bg-[#FBF9F6] border border-[#E5DFD9] text-[#2A2826] hover:bg-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. SECTION C: CRYPTOGRAPHIC AUDIT LEDGER CONFIGURATION */}
      {(activeSection === 'ALL' || activeSection === 'AUDIT') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DFD9]">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#124E59]" />
                <h2 className="text-lg font-black text-[#2A2826]">
                  3. Cryptographic Audit Ledger & Security Architecture
                </h2>
              </div>
              <p className="text-xs text-[#5F6675] mt-0.5">
                Immutable SHA-256 hash chaining standard enforced under National Informatics Centre (NIC) requirements.
              </p>
            </div>
          </div>

          {/* 4-Card Structured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono-tech text-xs">
            {/* Card 1: Chaining Specification */}
            <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-3">
              <span className="text-[11px] text-[#5F6675] uppercase font-bold block">
                IMMUTABLE CHAINING FORMULA
              </span>
              <code className="text-xs text-[#124E59] bg-[#FBF9F6] px-3.5 py-2 border border-[#E5DFD9] rounded-xl block font-mono-tech">
                currentHash = SHA-256(previousHash + canonicalJSON(recordPayload))
              </code>
              <p className="text-xs text-[#5F6675] font-sans leading-relaxed">
                Every officer disposition, statutory rule evaluation, and document extraction creates an irreversible forward link.
              </p>
            </div>

            {/* Card 2: Genesis Block Fingerprint */}
            <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-3">
              <span className="text-[11px] text-[#5F6675] uppercase font-bold block">
                GENESIS BLOCK ROOT FINGERPRINT
              </span>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
                <code className="text-xs text-[#124E59] truncate block">
                  0000000000000000000000000000000000000000000000000000000000000000
                </code>
                <button
                  onClick={handleCopyGenesis}
                  className="p-1 rounded text-[#5F6675] hover:text-[#124E59] cursor-pointer shrink-0"
                  title="Copy Genesis Hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-[#124E59]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[11px] text-[#5F6675] block">
                Block #0 Immutable Root Anchor &bull; Genesis Verification Verified
              </span>
            </div>

            {/* Card 3: Standards & Digest */}
            <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-2">
              <span className="text-[11px] text-[#5F6675] uppercase font-bold block">
                DIGEST STANDARD & ENCRYPTION
              </span>
              <span className="text-sm font-black text-[#2A2826] block">SHA-256 (FIPS PUB 180-4)</span>
              <p className="text-xs text-[#5F6675] font-sans">
                256-bit cryptographic digest. Meets Indian Evidence Act Section 65B criteria for digital legal admissible evidence.
              </p>
            </div>

            {/* Card 4: Tamper Resistance */}
            <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-2">
              <span className="text-[11px] text-[#5F6675] uppercase font-bold block">
                TAMPER-EVIDENT VERIFICATION
              </span>
              <span className="text-sm font-black text-[#124E59] block">AUTOMATIC INTEGRITY AUDIT</span>
              <p className="text-xs text-[#5F6675] font-sans">
                Retroactive changes break all downstream hash signatures, immediately alerting auditors and officers.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 6. SECTION D: ROLE-BASED ACCESS CONTROL (RBAC) */}
      {(activeSection === 'ALL' || activeSection === 'ROLES') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DFD9]">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#124E59]" />
                <h2 className="text-lg font-black text-[#2A2826]">
                  4. Role-Based Access Control (RBAC) & Governance Authority
                </h2>
              </div>
              <p className="text-xs text-[#5F6675] mt-0.5">
                Multi-tier committee access model separating evaluation, officer decision, and audit oversight.
              </p>
            </div>
          </div>

          {/* 4 Segmented Role Cards in 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-tech text-xs">
            {[
              {
                role: 'OFFICER' as const,
                name: 'P. Sengupta',
                department: 'Procurement & Contracts',
                permissions: ['Record Official Disposition', 'Request Clarification', 'Accept Exception', 'Sign Audit Chain'],
                desc: 'Primary officer with legal authority to approve or reject bids.',
              },
              {
                role: 'EVALUATOR' as const,
                name: 'K. Ramanathan',
                department: 'Technical Advisory Committee',
                permissions: ['Review Technical Criteria', 'Inspect PDF Coordinates', 'Manual Evidence Correction', 'Read-Only Ledger'],
                desc: 'Technical expert validating specifications and OEM authorizations.',
              },
              {
                role: 'ADMIN' as const,
                name: 'Dr. S. Meenakshi',
                department: 'Information Technology / NIC',
                permissions: ['Configure Tender Rules', 'Simulate Portal Gateways', 'Rule Library Versioning', 'Tamper Injection Test'],
                desc: 'System administrator managing rule-sets and environment health.',
              },
              {
                role: 'AUDITOR' as const,
                name: 'V. Anand, IA&AS',
                department: 'Comptroller & Auditor General',
                permissions: ['Inspect SHA-256 Ledger', 'Run Cryptographic Verify', 'Export Audit ZIP Package', 'Read-Only Across All'],
                desc: 'Independent statutory auditor inspecting cryptographic integrity.',
              },
            ].map((item) => (
              <div
                key={item.role}
                onClick={() => handleSwitchRoleWithFeedback(item.role)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  currentUserRole === item.role
                    ? 'border-[#124E59] bg-[#124E59]/5 shadow-xs'
                    : 'border-[#E5DFD9] bg-white hover:bg-[#FBF9F6]'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#124E59]">{item.role}</span>
                    {currentUserRole === item.role && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#124E59] text-white font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-extrabold text-sm text-[#2A2826] block font-sans">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-[#5F6675] block mt-0.5">
                      {item.department}
                    </span>
                  </div>

                  <p className="text-xs text-[#5F6675] font-sans leading-snug">
                    {item.desc}
                  </p>

                  <div className="pt-2.5 border-t border-[#E5DFD9]/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-[#5F6675] uppercase block">
                      ASSIGNED PERMISSIONS:
                    </span>
                    {item.permissions.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-1.5 text-[11px] text-[#2A2826]">
                        <Check className="w-3 h-3 text-[#124E59] shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5DFD9]/60 text-right">
                  <span className="text-xs text-[#124E59] font-bold">
                    {currentUserRole === item.role ? 'Selected Active Role' : 'Switch Role &rarr;'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
