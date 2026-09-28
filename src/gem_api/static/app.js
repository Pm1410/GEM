/**
 * GeM Bid Eligibility Verification Platform — Officer Dashboard Client
 * Handles real-time API integrations, evidence viewer highlights, RBAC, and audit verification.
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentTenderId = 'TNDR-GOODS-001';
  let currentBidderId = null;
  let currentRole = 'officer';
  let selectedAction = 'APPROVE';

  // DOM Elements
  const tenderSelect = document.getElementById('tender-select');
  const roleSelect = document.getElementById('role-select');
  const biddersTableBody = document.getElementById('bidders-table-body');
  const biddersCountBadge = document.getElementById('bidders-count-badge');
  
  // Metric elements
  const metricTotal = document.getElementById('metric-total-bidders');
  const metricCompliant = document.getElementById('metric-compliant-count');
  const metricAvgScore = document.getElementById('metric-avg-score');
  const metricCriticalRisk = document.getElementById('metric-critical-risk');

  // Detail panel elements
  const selectedBidderTitle = document.getElementById('selected-bidder-title');
  const selectedBidderBadge = document.getElementById('selected-bidder-badge');
  const requirementsTableBody = document.getElementById('requirements-table-body');
  const evidenceFilename = document.getElementById('evidence-filename');
  const evidenceText = document.getElementById('evidence-text');
  const advisoryContent = document.getElementById('advisory-content');
  const justificationInput = document.getElementById('justification-input');
  const charCounter = document.getElementById('char-counter');
  const actionSubmitBtn = document.getElementById('action-submit');
  const actionFeedback = document.getElementById('action-feedback');
  const auditVerifyBtn = document.getElementById('audit-verify-btn');
  const auditStatusBadge = document.getElementById('audit-status-badge');
  const auditBlocks = document.getElementById('audit-blocks');

  // Action buttons
  const btnApprove = document.getElementById('action-approve');
  const btnReject = document.getElementById('action-reject');
  const btnClarify = document.getElementById('action-clarify');
  const actionBtns = [btnApprove, btnReject, btnClarify];

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Role switching
  roleSelect.addEventListener('change', (e) => {
    currentRole = e.target.value;
    updateRBACState();
  });

  function updateRBACState() {
    const isAuditor = currentRole === 'auditor';
    actionBtns.forEach(b => b.disabled = isAuditor);
    justificationInput.disabled = isAuditor;
    actionSubmitBtn.disabled = isAuditor || justificationInput.value.trim().length < 10;
    
    if (isAuditor) {
      actionFeedback.style.display = 'block';
      actionFeedback.style.color = '#F59E0B';
      actionFeedback.textContent = 'Auditor role is read-only (OFCR-05). Actions are disabled.';
    } else {
      actionFeedback.style.display = 'none';
    }
  }

  // Tender switching
  tenderSelect.addEventListener('change', (e) => {
    currentTenderId = e.target.value;
    loadBidders(currentTenderId);
  });

  // Action selection
  function setAction(action) {
    selectedAction = action;
    actionBtns.forEach(b => {
      if (b.dataset.action === action) {
        b.style.transform = 'scale(1.03)';
        b.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
      } else {
        b.style.transform = 'none';
        b.style.boxShadow = 'none';
      }
    });
  }

  btnApprove.addEventListener('click', () => setAction('APPROVE'));
  btnReject.addEventListener('click', () => setAction('REJECT'));
  btnClarify.addEventListener('click', () => setAction('REQUEST_CLARIFICATION'));
  setAction('APPROVE');

  // Justification input validation
  justificationInput.addEventListener('input', (e) => {
    const len = e.target.value.trim().length;
    charCounter.textContent = `${len} / 10 characters minimum`;
    if (len >= 10) {
      charCounter.style.color = '#10B981';
      if (currentRole !== 'auditor') actionSubmitBtn.disabled = false;
    } else {
      charCounter.style.color = 'var(--text-muted)';
      actionSubmitBtn.disabled = true;
    }
  });

  // Submit Officer Action
  actionSubmitBtn.addEventListener('click', async () => {
    if (!currentBidderId) return;
    const justification = justificationInput.value.trim();
    if (justification.length < 10) return;

    actionSubmitBtn.disabled = true;
    actionFeedback.style.display = 'block';
    actionFeedback.style.color = '#38BDF8';
    actionFeedback.textContent = 'Submitting determination to cryptographic audit chain...';

    try {
      const res = await fetch(`/api/bidders/${currentBidderId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentRole,
          'X-User-Id': `officer-${currentRole}-01`,
        },
        body: JSON.stringify({
          action: selectedAction,
          justification: justification,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Action failed');
      }

      const data = await res.json();
      actionFeedback.style.color = '#10B981';
      actionFeedback.innerHTML = `✓ Determination recorded! Audit Block Hash: <span style="font-family: monospace;">${data.record_hash.substring(0, 16)}...</span>`;
      justificationInput.value = '';
      charCounter.textContent = '0 / 10 characters minimum';
      loadAuditChain();
    } catch (err) {
      actionFeedback.style.color = '#EF4444';
      actionFeedback.textContent = `Error: ${err.message}`;
    } finally {
      if (currentRole !== 'auditor') actionSubmitBtn.disabled = false;
    }
  });

  // Fetch Bidders List
  async function loadBidders(tenderId) {
    biddersCountBadge.textContent = 'Fetching...';
    try {
      const res = await fetch(`/api/tenders/${tenderId}/bidders`);
      const data = await res.json();
      const bidders = data.bidders || [];

      biddersCountBadge.textContent = `${bidders.length} Packets`;
      renderMetrics(bidders);
      renderBiddersTable(bidders);

      if (bidders.length > 0) {
        selectBidder(bidders[0].bidder_id);
      }
    } catch (err) {
      console.error('Failed to load bidders:', err);
      biddersCountBadge.textContent = 'Error';
    }
  }

  // Render Metric Cards
  function renderMetrics(bidders) {
    metricTotal.textContent = bidders.length;
    const compliant = bidders.filter(b => b.overall_state === 'PASS').length;
    metricCompliant.textContent = compliant;
    const avg = bidders.length > 0 
      ? (bidders.reduce((acc, b) => acc + b.compliance_score, 0) / bidders.length).toFixed(1)
      : '0.0';
    metricAvgScore.textContent = `${avg}%`;
    const critical = bidders.filter(b => b.risk_level === 'CRITICAL' || b.risk_level === 'HIGH').length;
    metricCriticalRisk.textContent = critical;
  }

  // Render Bidders Table
  function renderBiddersTable(bidders) {
    biddersTableBody.innerHTML = '';
    bidders.forEach(b => {
      const tr = document.createElement('tr');
      tr.className = 'clickable-row';
      tr.id = `row-${b.bidder_id}`;

      const stateBadgeClass = `badge-${b.overall_state.toLowerCase()}`;
      const riskBadgeClass = `badge-risk-${b.risk_level.toLowerCase()}`;

      tr.innerHTML = `
        <td>
          <div style="font-weight: 600;">${b.legal_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${b.bidder_id}</div>
        </td>
        <td>
          <div style="font-weight: 700;">${b.compliance_score.toFixed(1)}%</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Coverage: ${b.verifiable_coverage_pct.toFixed(0)}%</div>
        </td>
        <td><span class="badge ${riskBadgeClass}">${b.risk_level}</span></td>
        <td><span class="badge ${stateBadgeClass}">${b.overall_state}</span></td>
        <td><button class="btn-action" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #93C5FD; border-color: rgba(59, 130, 246, 0.3);">Inspect</button></td>
      `;

      tr.addEventListener('click', () => selectBidder(b.bidder_id));
      biddersTableBody.appendChild(tr);
    });
  }

  // Select and Inspect Single Bidder
  async function selectBidder(bidderId) {
    currentBidderId = bidderId;
    document.querySelectorAll('.clickable-row').forEach(r => r.classList.remove('selected-row'));
    const selectedRow = document.getElementById(`row-${bidderId}`);
    if (selectedRow) selectedRow.classList.add('selected-row');

    try {
      const res = await fetch(`/api/bidders/${bidderId}/evaluation`);
      const data = await res.json();

      selectedBidderTitle.textContent = data.legal_name;
      selectedBidderBadge.className = `badge badge-${data.overall_state.toLowerCase()}`;
      selectedBidderBadge.textContent = data.overall_state;

      renderRequirementsTable(data.requirements || []);
      renderEvidence(data.evidence_doc || {});
      renderAdvisory(data.advisory || {});
    } catch (err) {
      console.error('Failed to load evaluation details:', err);
    }
  }

  // Render Requirements Matrix
  function renderRequirementsTable(reqs) {
    requirementsTableBody.innerHTML = '';
    reqs.forEach(req => {
      const checksText = req.check_results.map(c => `• ${c.check_id}: ${c.message}`).join('<br>');
      const badgeClass = `badge-${req.state.toLowerCase()}`;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; color: #38BDF8;">${req.requirement_id}</td>
        <td>${checksText}</td>
        <td><span class="badge ${badgeClass}">${req.state}</span></td>
        <td><span class="simulated-pill" style="font-size: 0.65rem;">SIMULATED</span></td>
      `;
      requirementsTableBody.appendChild(tr);
    });
  }

  // Render Evidence Viewer with Highlights
  function renderEvidence(doc) {
    evidenceFilename.textContent = doc.filename || 'Submitted Document';
    let text = doc.extracted_text || 'No text extracted.';

    // Apply highlight wraps for extracted coordinates/values
    if (doc.highlights && doc.highlights.length > 0) {
      doc.highlights.forEach(h => {
        const regex = new RegExp(`(${h.value})`, 'gi');
        text = text.replace(regex, `<mark class="highlight-box" title="Extracted Field: ${h.field}">$1</mark>`);
      });
    }

    evidenceText.innerHTML = text;
  }

  // Render Advisory Panel
  function renderAdvisory(adv) {
    advisoryContent.textContent = adv.summary_text || 'No advisory available.';
    if (adv.recommended_action) {
      setAction(adv.recommended_action);
    }
  }

  // Load and Render Audit Chain
  async function loadAuditChain() {
    try {
      const res = await fetch('/api/audit/records');
      const data = await res.json();
      const records = data.records || [];

      if (records.length === 0) {
        auditBlocks.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No decisions recorded yet. Decisions made by officers will form a tamper-evident hash chain here.</div>';
        return;
      }

      auditBlocks.innerHTML = '';
      records.forEach((rec, idx) => {
        const payload = rec.payload;
        const block = document.createElement('div');
        block.className = 'audit-block';
        block.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span style="color: #38BDF8;">Block #${idx + 1} — ${payload.officer_action}</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">${payload.timestamp}</span>
          </div>
          <div><strong>Bidder:</strong> ${payload.bidder_id} | <strong>Score:</strong> ${payload.compliance_score.toFixed(1)}% | <strong>Risk:</strong> ${payload.risk_level}</div>
          <div style="color: var(--text-secondary); font-size: 0.75rem;"><strong>Justification:</strong> "${payload.officer_justification}"</div>
          <div class="audit-hash"><strong>Prev:</strong> ${rec.prev_hash}</div>
          <div class="audit-hash"><strong>Hash:</strong> ${rec.record_hash}</div>
        `;
        auditBlocks.appendChild(block);
      });
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
  }

  // Audit Verify Button
  auditVerifyBtn.addEventListener('click', async () => {
    auditStatusBadge.style.display = 'inline-flex';
    auditStatusBadge.textContent = 'Verifying SHA-256 chain...';
    try {
      const res = await fetch('/api/audit/verify');
      const data = await res.json();

      if (data.is_valid) {
        auditStatusBadge.className = 'badge badge-pass';
        auditStatusBadge.textContent = `✓ Chain Verified: ${data.total_records} Records Cryptographically Intact`;
      } else {
        auditStatusBadge.className = 'badge badge-fail';
        auditStatusBadge.textContent = `✗ Tamper Detected at Block #${data.broken_index + 1}!`;
      }
    } catch (err) {
      auditStatusBadge.className = 'badge badge-fail';
      auditStatusBadge.textContent = 'Verification error';
    }
  });

  // Initial Load
  loadBidders(currentTenderId);
  loadAuditChain();
  updateRBACState();
});
