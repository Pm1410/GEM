import crypto from 'crypto';
import { AuditRecord } from './domain';

// Genesis Hash for TenderGuard Audit Chain
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class AuditService {
  private chain: AuditRecord[] = [];
  private nextId = 1;

  constructor() {
    this.seedInitialChain();
  }

  private canonicalize(payload: Record<string, any>): string {
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  public computeHash(previousHash: string, payload: Record<string, any>): string {
    const canonicalString = this.canonicalize(payload);
    return crypto
      .createHash('sha256')
      .update(previousHash + canonicalString)
      .digest('hex');
  }

  public appendEvent(
    data: Omit<AuditRecord, 'id' | 'previousHash' | 'hash'>
  ): AuditRecord {
    const previousHash =
      this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : GENESIS_HASH;

    const payload = {
      timestamp: data.timestamp,
      tenderId: data.tenderId,
      tenderVersion: data.tenderVersion,
      ruleSetVersion: data.ruleSetVersion,
      bidId: data.bidId,
      bidderName: data.bidderName,
      eventType: data.eventType,
      actor: data.actor,
      details: data.details,
      requirementCode: data.requirementCode,
      systemState: data.systemState,
      score: data.score,
      risk: data.risk,
      officerDisposition: data.officerDisposition,
      justification: data.justification,
    };

    const hash = this.computeHash(previousHash, payload);

    const record: AuditRecord = {
      id: this.nextId++,
      ...data,
      previousHash,
      hash,
    };

    this.chain.push(record);
    return record;
  }

  public getChain(): AuditRecord[] {
    return [...this.chain];
  }

  public verifyIntegrity(): {
    valid: boolean;
    verifiedRecords: number;
    firstBrokenRecord?: number;
    expectedHash?: string;
    computedHash?: string;
    details?: string;
  } {
    let currentExpectedPrev = GENESIS_HASH;

    for (let i = 0; i < this.chain.length; i++) {
      const record = this.chain[i];

      // Check previous hash link
      if (record.previousHash !== currentExpectedPrev) {
        return {
          valid: false,
          verifiedRecords: i,
          firstBrokenRecord: record.id,
          expectedHash: currentExpectedPrev,
          computedHash: record.previousHash,
          details: `Broken link at record #${record.id}: previousHash does not match parent block hash.`,
        };
      }

      // Recompute payload hash
      const payload = {
        timestamp: record.timestamp,
        tenderId: record.tenderId,
        tenderVersion: record.tenderVersion,
        ruleSetVersion: record.ruleSetVersion,
        bidId: record.bidId,
        bidderName: record.bidderName,
        eventType: record.eventType,
        actor: record.actor,
        details: record.details,
        requirementCode: record.requirementCode,
        systemState: record.systemState,
        score: record.score,
        risk: record.risk,
        officerDisposition: record.officerDisposition,
        justification: record.justification,
      };

      const computed = this.computeHash(record.previousHash, payload);
      if (computed !== record.hash) {
        return {
          valid: false,
          verifiedRecords: i,
          firstBrokenRecord: record.id,
          expectedHash: record.hash,
          computedHash: computed,
          details: `Cryptographic payload tampering detected in record #${record.id}! Content was altered after signing.`,
        };
      }

      currentExpectedPrev = record.hash;
    }

    return {
      valid: true,
      verifiedRecords: this.chain.length,
    };
  }

  /**
   * Tamper with a record deliberately to demonstrate the integrity verification tool (Mandatory Demo Case H)
   */
  public tamperWithRecord(recordId: number, fakeJustification: string): boolean {
    const record = this.chain.find((r) => r.id === recordId);
    if (!record) return false;
    record.justification = fakeJustification;
    record.details = `[TAMPERED CONTENT] ${record.details}`;
    record.isTampered = true;
    return true;
  }

  /**
   * Reset / re-seed audit records to initial valid state
   */
  public resetToValidState(): void {
    this.chain = [];
    this.nextId = 1;
    this.seedInitialChain();
  }

  private seedInitialChain() {
    this.appendEvent({
      timestamp: '2026-09-28T09:15:00.000Z',
      tenderId: 'TND-GEM-2025-0012',
      tenderVersion: 2,
      ruleSetVersion: '1.3',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      eventType: 'BID_SUBMITTED',
      actor: { name: 'CPCL Portal Service', role: 'SYSTEM', email: 'gem-ingest@cpcl.gov.in' },
      details: 'Bid submitted with 6 mandatory statutory certificates and tender documents.',
    });

    this.appendEvent({
      timestamp: '2026-09-28T09:16:30.000Z',
      tenderId: 'TND-GEM-2025-0012',
      tenderVersion: 2,
      ruleSetVersion: '1.3',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      eventType: 'DOCUMENT_EXTRACTED',
      actor: { name: 'TenderGuard OCR Pipeline', role: 'SYSTEM', email: 'ocr-engine@tenderguard.local' },
      details: '6 documents parsed. Extracted GSTIN, PAN, CIN facts with bounding boxes.',
    });

    this.appendEvent({
      timestamp: '2026-09-28T09:18:10.000Z',
      tenderId: 'TND-GEM-2025-0012',
      tenderVersion: 2,
      ruleSetVersion: '1.3',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      eventType: 'REQUIREMENT_VERIFIED',
      actor: { name: 'Deterministic Rule Engine', role: 'SYSTEM', email: 'rules@tenderguard.local' },
      details: 'Statutory verification completed. 18 requirements evaluated.',
      score: 72,
      risk: 'HIGH',
      systemState: 'FAIL',
    });

    this.appendEvent({
      timestamp: '2026-09-28T10:45:00.000Z',
      tenderId: 'TND-GEM-2025-0012',
      tenderVersion: 2,
      ruleSetVersion: '1.3',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      eventType: 'OFFICER_DECISION',
      actor: { name: 'P. Sengupta', role: 'OFFICER', email: 'officer@cpcl.gov.in' },
      details: 'Officer requested clarification on CIN discrepancy and overdue return filing.',
      requirementCode: 'CIN_001',
      systemState: 'FAIL',
      officerDisposition: 'REQUEST_CLARIFICATION',
      justification: 'Bidder is granted 5 working days to provide certified RoC extract for CIN verification.',
    });
  }
}

export const auditService = new AuditService();
