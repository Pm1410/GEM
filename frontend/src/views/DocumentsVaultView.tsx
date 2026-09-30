import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Eye,
  Copy,
  Check,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DocumentInfo } from '../types';

interface DocumentsVaultViewProps {
  onNavigateVerification: (bidId: string) => void;
}

export const DocumentsVaultView: React.FC<DocumentsVaultViewProps> = ({
  onNavigateVerification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<(DocumentInfo & { bidderName: string; tenderRef: string }) | null>(null);

  // Central document catalog
  const documents: (DocumentInfo & { bidderName: string; tenderRef: string })[] = [
    {
      id: 'doc-abc-gst',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      tenderRef: 'GEM/2025/0012',
      filename: 'GST_Certificate.pdf',
      documentType: 'TAX_REGISTRATION',
      mimeType: 'application/pdf',
      pageCount: 3,
      sizeBytes: 842100,
      sha256: '9f83a42cbe812d3345eaf17b0198c21a441e86a1bb942b03912dae80a5521b4a',
      uploadedAt: '2026-09-28T09:12:00Z',
      status: 'EXTRACTED',
      previewPages: [
        {
          pageNumber: 1,
          title: 'Form GST REG-06: Registration Certificate',
          textSnippet: 'GOVERNMENT OF INDIA\nREGISTRATION CERTIFICATE\nRegistration Number: 22AAAAA0000A1Z5\nLegal Name: ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED',
          regions: [
            { label: 'GSTIN', value: '22AAAAA0000A1Z5', box: { x: 26, y: 34, width: 44, height: 7 } },
          ],
        },
      ],
    },
    {
      id: 'doc-abc-cin',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      tenderRef: 'GEM/2025/0012',
      filename: 'Certificate_of_Incorporation.pdf',
      documentType: 'INCORPORATION_PROOF',
      mimeType: 'application/pdf',
      pageCount: 3,
      sizeBytes: 1245000,
      sha256: '38a12df08b49e19d774ba2780c102a9914ecbd098319f0525da445f1b62cc8d1',
      uploadedAt: '2026-09-28T09:13:00Z',
      status: 'FLAGGED',
      previewPages: [
        {
          pageNumber: 1,
          title: 'Ministry of Corporate Affairs - Certificate of Incorporation',
          textSnippet: 'GOVERNMENT OF INDIA\nMINISTRY OF CORPORATE AFFAIRS\nThe Corporate Identity Number of the company is U45201TN2016PTC112345.',
          regions: [
            { label: 'CIN', value: 'U45201TN2016PTC112345', box: { x: 8, y: 60, width: 84, height: 7 } },
          ],
        },
      ],
    },
    {
      id: 'doc-abc-pan',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      tenderRef: 'GEM/2025/0012',
      filename: 'PAN_Card.pdf',
      documentType: 'IDENTITY_PROOF',
      mimeType: 'application/pdf',
      pageCount: 1,
      sizeBytes: 420000,
      sha256: 'e519c72e411082abdfa87263b65287f4c391bc448e02d334511d782199b1a03e',
      uploadedAt: '2026-09-28T09:12:30Z',
      status: 'EXTRACTED',
      previewPages: [
        {
          pageNumber: 1,
          title: 'INCOME TAX DEPARTMENT - GOVT. OF INDIA - PAN CARD',
          textSnippet: 'ABC INFRASTRUCTURE SOLUTIONS PVT LTD\nPermanent Account Number: AAAAA0000A',
          regions: [
            { label: 'PAN', value: 'AAAAA0000A', box: { x: 24, y: 58, width: 48, height: 12 } },
          ],
        },
      ],
    },
    {
      id: 'doc-abc-udyam',
      bidId: 'BID-001',
      bidderName: 'ABC Infra Solutions',
      tenderRef: 'GEM/2025/0012',
      filename: 'Udyam_Registration.pdf',
      documentType: 'MSME_CERTIFICATE',
      mimeType: 'application/pdf',
      pageCount: 2,
      sizeBytes: 520000,
      sha256: 'c37a6b29d44811aef71092834b6e5118742918bbca33902187654321fedcba98',
      uploadedAt: '2026-09-28T09:14:00Z',
      status: 'EXTRACTED',
      previewPages: [
        {
          pageNumber: 1,
          title: 'UDYAM REGISTRATION CERTIFICATE',
          textSnippet: 'MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES\nUDYAM REGISTRATION NUMBER: UDYAM-TN-02-0012345',
          regions: [
            { label: 'UDYAM', value: 'UDYAM-TN-02-0012345', box: { x: 22, y: 32, width: 56, height: 8 } },
          ],
        },
      ],
    },
    {
      id: 'doc-shree-pack',
      bidId: 'BID-002',
      bidderName: 'Shree Tech Pvt Ltd',
      tenderRef: 'GEM/2025/0012',
      filename: 'ShreeTech_Certified_BidPack.pdf',
      documentType: 'INCORPORATION_PROOF',
      mimeType: 'application/pdf',
      pageCount: 12,
      sizeBytes: 3120000,
      sha256: '772b8912ef09a82c441b09214489da1029148bc',
      uploadedAt: '2026-09-28T10:05:00Z',
      status: 'EXTRACTED',
      previewPages: [
        {
          pageNumber: 1,
          title: 'Shree Tech Pvt Ltd - Statutory Submissions',
          textSnippet: 'Comprehensive technical and statutory bid pack for CPCL Tender GEM/2025/0012.',
          regions: [],
        },
      ],
    },
    {
      id: 'doc-delta-docs',
      bidId: 'BID-005',
      bidderName: 'Delta Constructions',
      tenderRef: 'GEM/2025/0012',
      filename: 'Delta_Construction_Documents.pdf',
      documentType: 'FINANCIAL_AUDIT',
      mimeType: 'application/pdf',
      pageCount: 8,
      sizeBytes: 2450000,
      sha256: '994bd012a912bb0124cae812d4a',
      uploadedAt: '2026-09-28T14:00:00Z',
      status: 'FLAGGED',
      previewPages: [
        {
          pageNumber: 1,
          title: 'Delta Constructions - Financial Undertakings',
          textSnippet: 'Declaration of turnover and non-debarment affidavit.',
          regions: [],
        },
      ],
    },
  ];

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2500);
  };

  const filtered = documents.filter((doc) => {
    if (filterType !== 'ALL' && doc.documentType !== filterType) return false;
    if (
      searchQuery &&
      !doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.bidderName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.sha256.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD9]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A2826]">
            Procurement Documents & Extraction Vault
          </h1>
          <p className="text-sm text-[#5F6675] font-medium mt-1">
            Certified document packs, cryptographic SHA-256 signatures, and extracted coordinates
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono-tech text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#E5DFD9] shadow-2xs">
            <span className="text-[11px] uppercase font-bold text-[#5F6675] block">TOTAL VAULT FILES</span>
            <span className="text-lg font-black text-[#124E59] block">{documents.length} Encrypted PDFs</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5DFD9] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5F6675]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename, bidder, or SHA-256 hash..."
            className="w-full bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl px-3.5 py-2 text-xs font-mono-tech text-[#2A2826] focus:outline-hidden focus:border-[#124E59]"
          />
        </div>

        <div className="flex items-center gap-2 font-mono-tech text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-medium text-[#2A2826]"
          >
            <option value="ALL">All Document Types</option>
            <option value="TAX_REGISTRATION">Tax Registration</option>
            <option value="INCORPORATION_PROOF">Incorporation Proof</option>
            <option value="IDENTITY_PROOF">Identity Proof</option>
            <option value="MSME_CERTIFICATE">MSME Certificate</option>
            <option value="FINANCIAL_AUDIT">Financial Audit</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-tech">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Document Type Badge & Status */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#124E59]/10 text-[#124E59]">
                  {doc.documentType.replace(/_/g, ' ')}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    doc.status === 'FLAGGED'
                      ? 'bg-[#2A2826]/10 text-[#2A2826] border border-[#2A2826]/30'
                      : 'bg-[#124E59]/10 text-[#124E59] border border-[#124E59]/25'
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              {/* Main Filename */}
              <div>
                <h3 className="text-base font-extrabold text-[#2A2826] truncate" title={doc.filename}>
                  {doc.filename}
                </h3>
                <p className="text-xs text-[#5F6675] mt-0.5">
                  Bidder: <strong>{doc.bidderName}</strong> &bull; {doc.tenderRef}
                </p>
              </div>

              {/* SHA-256 Box with Copy */}
              <div className="p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9] flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-[#5F6675] uppercase font-bold block">
                    CRYPTOGRAPHIC HASH (SHA-256)
                  </span>
                  <span className="text-xs text-[#2A2826] font-mono-tech truncate block">
                    {doc.sha256}
                  </span>
                </div>
                <button
                  onClick={() => handleCopySha(doc.sha256)}
                  className="p-1.5 rounded-lg bg-white border border-[#E5DFD9] text-[#5F6675] hover:text-[#124E59] transition-colors cursor-pointer shrink-0"
                  title="Copy SHA-256 Hash"
                >
                  {copiedSha === doc.sha256 ? (
                    <Check className="w-3.5 h-3.5 text-[#124E59]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#5F6675] pt-1">
                <span>{doc.pageCount} Pages ({Math.round(doc.sizeBytes / 1024)} KB)</span>
                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5DFD9] flex items-center justify-between">
              <button
                onClick={() => setPreviewDoc(doc)}
                className="inline-flex items-center gap-1.5 text-xs text-[#5F6675] hover:text-[#2A2826] font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Quick Preview</span>
              </button>

              <button
                onClick={() => onNavigateVerification(doc.bidId)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#124E59] text-[#FEFAF7] text-xs font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-2xs"
              >
                <span>Inspect in Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Document Reader Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-mono-tech">
          <div className="bg-white rounded-3xl border border-[#E5DFD9] shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#124E59]" />
                <div>
                  <h3 className="text-base font-bold text-[#2A2826]">{previewDoc.filename}</h3>
                  <span className="text-xs text-[#5F6675]">{previewDoc.bidderName}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 rounded-xl border border-[#E5DFD9] text-xs font-bold text-[#5F6675] hover:bg-[#F4EFEB] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 bg-[#FBF9F6] rounded-2xl border border-[#E5DFD9] space-y-3 text-xs">
              <div className="text-center pb-3 border-b border-[#E5DFD9]">
                <p className="font-extrabold text-[#2A2826] uppercase">GOVERNMENT OF INDIA</p>
                <p className="text-xs text-[#5F6675]">CERTIFIED TENDER DOCUMENT VAULT ARCHIVE</p>
              </div>

              <div className="space-y-2 leading-relaxed text-[#2A2826]">
                {previewDoc.previewPages[0]?.textSnippet.split('\n').map((line, idx) => (
                  <p key={idx} className={idx === 1 ? 'font-extrabold text-[#124E59]' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-[#5F6675]">SHA-256 Lineage Verified</span>
              <button
                onClick={() => {
                  onNavigateVerification(previewDoc.bidId);
                  setPreviewDoc(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] font-bold hover:bg-[#0A323A] transition-colors cursor-pointer"
              >
                Open in Full 3-Pane Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
