import React, { useState } from 'react';
import { X, Crosshair, Check, ShieldAlert } from 'lucide-react';
import { DocumentInfo, EvidenceItem, BoundingBox } from '../../types';

interface ManualEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentInfo;
  currentEvidence?: EvidenceItem;
  onSaveMapping: (newEvidence: Partial<EvidenceItem>) => void;
}

export const ManualEvidenceModal: React.FC<ManualEvidenceModalProps> = ({
  isOpen,
  onClose,
  document,
  currentEvidence,
  onSaveMapping,
}) => {
  const [fieldName, setFieldName] = useState(currentEvidence?.fieldName || 'CIN');
  const [correctedValue, setCorrectedValue] = useState(currentEvidence?.extractedValue || '');
  const [selectedPage, setSelectedPage] = useState(currentEvidence?.pageNumber || 1);
  const [boxCoords, setBoxCoords] = useState<BoundingBox>(
    currentEvidence?.boundingBox || { x: 22, y: 52, width: 56, height: 9 }
  );
  const [officerNote, setOfficerNote] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!correctedValue.trim()) return;
    onSaveMapping({
      fieldName,
      extractedValue: correctedValue.trim(),
      pageNumber: selectedPage,
      boundingBox: boxCoords,
      extractionMethod: 'OFFICER_CORRECTED',
      confidence: 1.0,
      grounded: true,
      sourceText: `[Officer Verified & Mapped] ${correctedValue.trim()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl border border-[#B1A6A4] shadow-2xl max-w-xl w-full p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8CFD0]">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#154D57]" />
            <h3 className="text-base font-bold text-[#413F3D]">
              Manual Evidence Mapping & Correction
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#697184] hover:text-[#413F3D] rounded hover:bg-[#F2F1EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs font-mono-tech">
          <div className="p-3 bg-[#FEFAF7] border border-[#D8CFD0] rounded-lg">
            <p className="text-[#697184]">TARGET DOCUMENT</p>
            <p className="text-sm font-bold text-[#413F3D] mt-0.5">{document.filename}</p>
            <p className="text-[11px] text-[#697184] mt-1">SHA-256: {document.sha256}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#697184] mb-1">FIELD IDENTIFIER</label>
              <select
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D8CFD0] rounded-md text-[#413F3D] focus:outline-hidden focus:border-[#154D57]"
              >
                <option value="CIN">CIN (Corporate Identification Number)</option>
                <option value="GSTIN">GSTIN (15-digit Tax Identifier)</option>
                <option value="PAN">PAN (Permanent Account Number)</option>
                <option value="UDYAM_NO">Udyam MSME Number</option>
                <option value="CA_UDIN">CA UDIN Stamp</option>
              </select>
            </div>

            <div>
              <label className="block text-[#697184] mb-1">PAGE NUMBER</label>
              <input
                type="number"
                min="1"
                max={document.pageCount}
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#D8CFD0] rounded-md text-[#413F3D] focus:outline-hidden focus:border-[#154D57]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#697184] mb-1">VERIFIED / EXTRACTED VALUE</label>
            <input
              type="text"
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              placeholder="e.g. U45201TN2016PTC112345"
              className="w-full px-3 py-2 bg-white border border-[#D8CFD0] rounded-md text-sm font-bold text-[#413F3D] focus:outline-hidden focus:border-[#154D57]"
            />
          </div>

          <div className="p-3 bg-[#154D57]/5 border border-[#154D57]/20 rounded-md">
            <div className="flex items-center gap-1.5 text-[#154D57] font-bold text-xs mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Immutable Traceability Notice</span>
            </div>
            <p className="text-[11px] text-[#413F3D] leading-relaxed">
              This manual mapping will be tagged as <code className="bg-white px-1 border border-[#D8CFD0]">OFFICER-ENTERED</code> and appended to the cryptographic audit chain with your officer identity and timestamp.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D8CFD0]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-[#697184] hover:bg-[#F2F1EF] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!correctedValue.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[#154D57] text-[#FEFAF7] hover:bg-[#154D57]/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save & Re-verify</span>
          </button>
        </div>
      </div>
    </div>
  );
};
