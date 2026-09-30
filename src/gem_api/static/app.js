/**
 * GeM Bid Eligibility Verification Platform — Officer Dashboard Client
 * 30 / 70 Vertical Split Screen with Apple-Inspired Precision Design.
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentTenderId = 'TNDR-GOODS-001';
  let currentBidderId = null;
  let currentRole = 'officer';
  let selectedAction = 'APPROVE';
  let loadedBidders = [];

  // DOM Elements
  const tenderSelect = document.getElementById('tender-select');
  const roleSelect = document.getElementById('role-select');
  const biddersTableBody = document.getElementById('bidders-table-body');
  const biddersCountBadge = document.getElementById('bidders-count-badge');
  const bidderSearchInput = document.getElementById('bidder-search-input');
  
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
      actionFeedback.style.color = '#B45309';
      actionFeedback.textContent = 'Auditor role is read-only (OFCR-05). Statutory decisions are disabled.';
    } else {
      actionFeedback.style.display = 'none';
    }
  }

  // Tender switching
  tenderSelect.addEventListener('change', (e) => {
    currentTenderId = e.target.value;
    loadBidders(currentTenderId);
  });

  // Filter input
  if (bidderSearchInput) {
    bidderSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = loadedBidders.filter(b => 
        b.legal_name.toLowerCase().includes(q) ||
        b.bidder_id.toLowerCase().includes(q) ||
        b.overall_state.toLowerCase().includes(q) ||
        b.risk_level.toLowerCase().includes(q)
      );
      renderBiddersTable(filtered);
    });
  }

  // Action selection
  function setAction(action) {
    selectedAction = action;
    actionBtns.forEach(b => {
      if (b.dataset.action === action) {
        b.classList.add('active-action');
      } else {
        b.classList.remove('active-action');
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
      charCounter.style.color = 'var(--state-pass)';
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
    actionFeedback.style.color = 'var(--apple-blue)';
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
      actionFeedback.style.color = 'var(--state-pass)';
      actionFeedback.innerHTML = `✓ Statutory Determination recorded! Audit Block Hash: <span style="font-family: var(--font-mono); font-weight: 600;">${data.record_hash.substring(0, 16)}...</span>`;
      justificationInput.value = '';
      charCounter.textContent = '0 / 10 characters minimum';
      loadAuditChain();
    } catch (err) {
      actionFeedback.style.color = 'var(--state-fail)';
      actionFeedback.textContent = `Error: ${err.message}`;
    } finally {
      if (currentRole !== 'auditor') actionSubmitBtn.disabled = false;
    }
  });

  // Helper: Get Entity Initials for Avatar
  function getInitials(name) {
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Fetch Bidders List
  async function loadBidders(tenderId) {
    biddersCountBadge.textContent = 'Fetching...';
    try {
      const res = await fetch(`/api/tenders/${tenderId}/bidders`);
      const data = await res.json();
      loadedBidders = data.bidders || [];

      biddersCountBadge.textContent = `${loadedBidders.length} Packets`;
      renderMetrics(loadedBidders);
      renderBiddersTable(loadedBidders);

      if (loadedBidders.length > 0) {
        selectBidder(loadedBidders[0].bidder_id);
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

  // Render Bidders Table in 30% Pane (Apple Card List Style)
  function renderBiddersTable(bidders) {
    biddersTableBody.innerHTML = '';
    bidders.forEach(b => {
      const tr = document.createElement('tr');
      tr.className = 'clickable-row';
      tr.id = `row-${b.bidder_id}`;

      const stateBadgeClass = `badge-${b.overall_state.toLowerCase()}`;
      const riskBadgeClass = `badge-risk-${b.risk_level.toLowerCase()}`;
      const initials = getInitials(b.legal_name);

      tr.innerHTML = `
        <td style="width: 100%; border: none;">
          <div class="bidder-card-main">
            <div class="bidder-card-avatar">${initials}</div>
            <div class="bidder-card-meta">
              <div class="bidder-card-name" title="${b.legal_name}">${b.legal_name}</div>
              <div class="bidder-card-sub">
                <span>${b.bidder_id}</span>
                <span>·</span>
                <span class="badge ${riskBadgeClass}">${b.risk_level}</span>
              </div>
            </div>
          </div>
        </td>
        <td style="border: none; text-align: right; flex-shrink: 0;">
          <div class="bidder-card-stats">
            <div class="bidder-card-score">${b.compliance_score.toFixed(0)}%</div>
            <span class="badge ${stateBadgeClass}">${b.overall_state}</span>
          </div>
        </td>
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

  // Render Requirements Matrix in 70% Pane
  function renderRequirementsTable(reqs) {
    requirementsTableBody.innerHTML = '';
    reqs.forEach(req => {
      const checksText = req.check_results.map(c => `• ${c.check_id}: ${c.message}`).join('<br>');
      const badgeClass = `badge-${req.state.toLowerCase()}`;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="req-id-tag">${req.requirement_id}</td>
        <td style="color: var(--text-secondary); line-height: 1.5;">${checksText}</td>
        <td><span class="badge ${badgeClass}">${req.state}</span></td>
        <td><span class="simulated-pill">SIMULATED</span></td>
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
        auditBlocks.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; padding: 1rem 0;">No decisions recorded yet. Decisions made by officers will form a tamper-evident hash chain here.</div>';
        return;
      }

      auditBlocks.innerHTML = '';
      records.forEach((rec, idx) => {
        const payload = rec.payload;
        const block = document.createElement('div');
        block.className = 'audit-block';
        block.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-weight: 700; align-items: center;">
            <span style="color: var(--text-primary); font-size: 0.84rem;">Block #${idx + 1} — ${payload.officer_action}</span>
            <span style="color: var(--text-muted); font-size: 0.71rem; font-family: var(--font-mono);">${payload.timestamp}</span>
          </div>
          <div style="color: var(--text-secondary); font-size: 0.78rem;">
            <strong>Bidder:</strong> ${payload.bidder_id} &nbsp;|&nbsp; 
            <strong>Score:</strong> ${payload.compliance_score.toFixed(1)}% &nbsp;|&nbsp; 
            <strong>Risk:</strong> ${payload.risk_level}
          </div>
          <div style="color: var(--text-secondary); font-size: 0.76rem; background: var(--apple-subtle); padding: 0.4rem 0.65rem; border-radius: var(--radius-xs);">
            <strong>Justification:</strong> "${payload.officer_justification}"
          </div>
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

  // Limitations Modal
  const btnOpenLimitations = document.getElementById('btn-open-limitations');
  const limitationsModal = document.getElementById('limitations-modal');
  const closeLimitationsBtn = document.getElementById('close-limitations-btn');

  if (btnOpenLimitations && limitationsModal) {
    btnOpenLimitations.addEventListener('click', () => {
      limitationsModal.style.display = 'flex';
    });
  }
  if (closeLimitationsBtn && limitationsModal) {
    closeLimitationsBtn.addEventListener('click', () => {
      limitationsModal.style.display = 'none';
    });
  }

  // Demo Walkthrough Modal
  const btnStartDemo = document.getElementById('btn-start-demo');
  const demoModal = document.getElementById('demo-modal');
  const closeDemoBtn = document.getElementById('close-demo-btn');

  if (btnStartDemo && demoModal) {
    btnStartDemo.addEventListener('click', () => {
      demoModal.style.display = 'flex';
    });
  }
  if (closeDemoBtn && demoModal) {
    closeDemoBtn.addEventListener('click', () => {
      demoModal.style.display = 'none';
    });
  }

  // Simulate Tamper Button
  const auditTamperBtn = document.getElementById('audit-tamper-btn');
  if (auditTamperBtn) {
    auditTamperBtn.addEventListener('click', () => {
      auditStatusBadge.style.display = 'inline-flex';
      auditStatusBadge.className = 'badge badge-fail';
      auditStatusBadge.textContent = '✗ Cryptographic Breach Detected: Expected SHA-256 mismatch at Block #1! Hash chain broken.';
      alert('SIMULATION: Audit Block #1 record secretly modified in database. Re-computing hash chain reveals immediate cryptographic tampering violation (AUDT-03)!');
    });
  }

  // Initial Load
  loadBidders(currentTenderId);
  loadAuditChain();
  updateRBACState();
});
