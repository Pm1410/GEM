import crypto from 'crypto';
import { ExternalVerification, AdapterStatus } from './domain';

// In-memory simulation settings for testing failure modes
export interface SimulatorSettings {
  gstStatus: AdapterStatus;
  mcaStatus: AdapterStatus;
  udyamStatus: AdapterStatus;
  epfoStatus: AdapterStatus;
  debarmentStatus: AdapterStatus;
}

export const activeSimulatorSettings: SimulatorSettings = {
  gstStatus: 'SUCCESS',
  mcaStatus: 'SUCCESS',
  udyamStatus: 'SUCCESS',
  epfoStatus: 'SUCCESS',
  debarmentStatus: 'SUCCESS',
};

function generateResponseHash(payload: Record<string, any>): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').substring(0, 16);
}

/**
 * Simulated GSTN Portal Adapter
 */
export function queryGSTPortal(
  gstin: string,
  overrides?: { filingStatus?: 'CURRENT' | 'OVERDUE'; regStatus?: 'ACTIVE' | 'CANCELLED' }
): ExternalVerification {
  const status = activeSimulatorSettings.gstStatus;
  const now = new Date().toISOString();

  if (status === 'DOWN') {
    return {
      adapterName: 'GST Portal',
      sourceLabel: 'SIMULATED ADAPTER - GST Portal (gov.in)',
      status: 'DOWN',
      queriedValue: gstin,
      latencyMs: 1420,
      fetchedAt: now,
      fields: { error: '503 Service Unavailable: GSTN Gateway unreachable' },
      responseHash: generateResponseHash({ error: 'DOWN', gstin }),
    };
  }

  if (status === 'TIMEOUT') {
    return {
      adapterName: 'GST Portal',
      sourceLabel: 'SIMULATED ADAPTER - GST Portal (gov.in)',
      status: 'TIMEOUT',
      queriedValue: gstin,
      latencyMs: 5000,
      fetchedAt: now,
      fields: { error: 'Gateway Timeout after 5000ms' },
      responseHash: generateResponseHash({ error: 'TIMEOUT', gstin }),
    };
  }

  const regStatus = overrides?.regStatus || 'ACTIVE';
  const returnFiling = overrides?.filingStatus || 'CURRENT';

  const fields = {
    legalNameOfBusiness: 'ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED',
    tradeName: 'ABC INFRA',
    gstin,
    registrationDate: '2018-04-12',
    registrationStatus: regStatus,
    taxpayerType: 'Regular',
    jurisdiction: 'State - Ward 42, Chennai Central',
    returnFiling,
    lastReturnFiled: 'GSTR-3B',
    period: 'Aug 2026',
    filingDate: returnFiling === 'CURRENT' ? '2026-09-18' : 'OVERDUE (Last: May 2026)',
    eWayBillStatus: 'ACTIVE',
    source: 'SIMULATED',
  };

  return {
    adapterName: 'GST Portal',
    sourceLabel: 'SIMULATED ADAPTER - GST Portal (gst.gov.in)',
    status,
    queriedValue: gstin,
    latencyMs: 182,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields),
  };
}

/**
 * Simulated MCA / RoC Portal Adapter
 */
export function queryMCAPortal(
  cin: string,
  overrides?: { foundInMca?: boolean }
): ExternalVerification {
  const status = activeSimulatorSettings.mcaStatus;
  const now = new Date().toISOString();

  if (status === 'DOWN') {
    return {
      adapterName: 'MCA21 Registry',
      sourceLabel: 'SIMULATED ADAPTER - Ministry of Corporate Affairs',
      status: 'DOWN',
      queriedValue: cin,
      latencyMs: 2100,
      fetchedAt: now,
      fields: { error: 'MCA21 Database Maintenance in progress' },
      responseHash: generateResponseHash({ error: 'DOWN', cin }),
    };
  }

  const found = overrides?.foundInMca !== undefined ? overrides.foundInMca : true;
  const fields = {
    cin,
    foundInMcaDatabase: found,
    companyStatus: found ? 'Active' : 'NOT_FOUND',
    rocCode: 'RoC-Chennai',
    incorporationDate: found ? '2016-11-24' : null,
    authorizedCapital: found ? 'INR 50,00,000' : null,
    paidUpCapital: found ? 'INR 25,00,000' : null,
    classOfCompany: 'Private',
    source: 'SIMULATED',
  };

  return {
    adapterName: 'MCA21 Registry',
    sourceLabel: 'SIMULATED ADAPTER - Ministry of Corporate Affairs (mca.gov.in)',
    status,
    queriedValue: cin,
    latencyMs: 195,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields),
  };
}

/**
 * Simulated Udyam Portal Adapter
 */
export function queryUdyamPortal(udyamNo: string): ExternalVerification {
  const status = activeSimulatorSettings.udyamStatus;
  const now = new Date().toISOString();

  if (status === 'DOWN') {
    return {
      adapterName: 'MSME Udyam Portal',
      sourceLabel: 'SIMULATED ADAPTER - Udyam Registration (udyamregistration.gov.in)',
      status: 'DOWN',
      queriedValue: udyamNo,
      latencyMs: 3200,
      fetchedAt: now,
      fields: { error: 'MSME Server not reachable' },
      responseHash: generateResponseHash({ error: 'DOWN', udyamNo }),
    };
  }

  const fields = {
    udyamRegistrationNumber: udyamNo,
    enterpriseStatus: 'ACTIVE',
    enterpriseType: 'Small Enterprise',
    majorActivity: 'Construction & Civil Contracting',
    dicName: 'Chennai District Industries Centre',
    verificationDate: '2026-09-29',
    source: 'SIMULATED',
  };

  return {
    adapterName: 'MSME Udyam Portal',
    sourceLabel: 'SIMULATED ADAPTER - Udyam Registration (udyamregistration.gov.in)',
    status,
    queriedValue: udyamNo,
    latencyMs: 140,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields),
  };
}

/**
 * Simulated Central Debarment / GeM Blacklist Adapter
 */
export function queryDebarmentRegistry(
  entityName: string,
  pan: string,
  isDebarred: boolean = false,
  reason: string = ''
): ExternalVerification {
  const status = activeSimulatorSettings.debarmentStatus;
  const now = new Date().toISOString();

  const fields = {
    entityQueried: entityName,
    panQueried: pan,
    isDebarred,
    debarmentReason: isDebarred ? reason : 'No adverse listing in CPPP/GeM debarment records',
    effectiveFrom: isDebarred ? '2024-03-01' : null,
    effectiveUntil: isDebarred ? '2027-03-01' : null,
    banningAuthority: isDebarred ? 'Ministry of Housing & Urban Affairs' : null,
    source: 'SIMULATED',
  };

  return {
    adapterName: 'Central Debarment Registry',
    sourceLabel: 'SIMULATED ADAPTER - Central Debarment Register (eprocure.gov.in)',
    status,
    queriedValue: `${entityName} [${pan}]`,
    latencyMs: 110,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields),
  };
}
