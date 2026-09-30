import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Crosshair,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DocumentInfo, EvidenceItem, BoundingBox } from '../../types';

interface DocumentEvidenceViewerProps {
  documents: DocumentInfo[];
  selectedEvidence?: EvidenceItem;
  currentDocumentId?: string;
  onManualMap?: () => void;
}

export const DocumentEvidenceViewer: React.FC<DocumentEvidenceViewerProps> = ({
  documents,
  selectedEvidence,
  currentDocumentId,
  onManualMap,
}) => {
  // Find current document or default to first document
  const activeDoc =
    documents.find((d) => d.id === currentDocumentId) ||
    documents.find((d) => d.filename === selectedEvidence?.documentName) ||
    documents[0];

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Automatically jump to page when selected requirement evidence changes!
  useEffect(() => {
    if (selectedEvidence && selectedEvidence.pageNumber) {
      setCurrentPage(selectedEvidence.pageNumber);
    }
  }, [selectedEvidence]);

  const totalPages = activeDoc?.pageCount || 1;
  const activePageData = activeDoc?.previewPages?.find((p) => p.pageNumber === currentPage);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(180, Math.max(70, prev + delta)));
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-[#D8CFD0] bg-[#FEFAF7] shadow-sm overflow-hidden select-none">
      {/* Top Document Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#D8CFD0] bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[#154D57] shrink-0" />
          <span className="text-xs font-semibold text-[#413F3D] truncate font-mono-tech">
            {activeDoc ? activeDoc.filename : 'No Document Selected'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2F1EF] text-[#697184] font-mono-tech border border-[#D8CFD0]">
            SHA-256: {activeDoc ? activeDoc.sha256.substring(0, 10) + '...' : 'none'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Toggle Page Thumbnails"
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              showThumbnails
                ? 'bg-[#154D57]/15 text-[#154D57]'
                : 'text-[#697184] hover:bg-[#F2F1EF]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {onManualMap && (
            <button
              onClick={onManualMap}
              title="Manual Evidence Mapping"
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono-tech bg-white border border-[#D8CFD0] text-[#154D57] hover:bg-[#F2F1EF] transition-colors cursor-pointer"
            >
              <Crosshair className="w-3 h-3 text-[#154D57]" />
              <span>Map Evidence</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewer Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails Strip */}
        {showThumbnails && (
          <div className="w-20 border-r border-[#D8CFD0] bg-[#F2F1EF]/70 p-2 flex flex-col gap-2 overflow-y-auto shrink-0">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = pageNum === currentPage;
              const hasEvidence = selectedEvidence && selectedEvidence.pageNumber === pageNum;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex flex-col items-center gap-1 p-1 rounded-md transition-all cursor-pointer text-left border ${
                    isSelected
                      ? 'border-[#154D57] bg-white shadow-xs'
                      : 'border-[#D8CFD0] bg-white/60 hover:bg-white'
                  }`}
                >
                  <div className="w-14 h-18 rounded bg-[#FEFAF7] border border-[#D8CFD0] flex flex-col p-1 overflow-hidden relative">
                    <div className="w-full h-1 bg-[#B1A6A4]/40 rounded-xs mb-1" />
                    <div className="w-3/4 h-1 bg-[#B1A6A4]/30 rounded-xs mb-1" />
                    <div className="w-1/2 h-1 bg-[#B1A6A4]/30 rounded-xs mb-1" />
                    <div className="w-4/5 h-1 bg-[#B1A6A4]/30 rounded-xs mb-1" />
                    {hasEvidence && (
                      <div className="absolute inset-1.5 border border-[#154D57] bg-[#154D57]/20 rounded-xs pointer-events-none" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono-tech text-[#697184]">
                    p. {pageNum}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Center High-Fidelity Canvas View */}
        <div className="flex-1 bg-[#E8E6E3] overflow-auto p-4 flex items-center justify-center relative">
          <div
            className="bg-white rounded-lg shadow-md border border-[#D8CFD0] p-6 relative transition-transform duration-200"
            style={{
              width: `${(520 * zoomLevel) / 100}px`,
              minHeight: `${(700 * zoomLevel) / 100}px`,
            }}
          >
            {/* Government Emblem / Header Mockup */}
            <div className="flex flex-col items-center border-b border-[#D8CFD0] pb-4 mb-4 text-center">
              <div className="w-9 h-9 rounded-full bg-[#F2F1EF] border border-[#B1A6A4] flex items-center justify-center text-[#154D57] mb-1 font-bold text-xs">
                🏛️
              </div>
              <span className="text-[10px] tracking-widest uppercase font-mono-tech text-[#697184]">
                GOVERNMENT OF INDIA
              </span>
              <span className="text-xs font-bold text-[#413F3D] mt-0.5">
                {activeDoc?.filename.includes('GST')
                  ? 'CENTRAL BOARD OF INDIRECT TAXES & CUSTOMS'
                  : activeDoc?.filename.includes('Incorporation')
                  ? 'MINISTRY OF CORPORATE AFFAIRS'
                  : activeDoc?.filename.includes('PAN')
                  ? 'INCOME TAX DEPARTMENT'
                  : 'MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES'}
              </span>
              <span className="text-[11px] font-medium text-[#154D57] mt-0.5">
                {activePageData?.title || `Document Page ${currentPage}`}
              </span>
            </div>

            {/* Document Body Text Representation */}
            <div className="space-y-3 text-xs leading-relaxed text-[#413F3D]/90 font-mono-tech">
              {activePageData ? (
                activePageData.textSnippet.split('\n').map((line, idx) => (
                  <p
                    key={idx}
                    className={
                      line.includes('Registration') || line.includes('CERTIFICATE') || line.includes('Number')
                        ? 'font-bold text-[#413F3D]'
                        : 'text-[#413F3D]/80'
                    }
                  >
                    {line}
                  </p>
                ))
              ) : (
                <div className="text-center py-12 text-[#697184]">
                  <p>Certified Document Page {currentPage}</p>
                  <p className="text-[11px] mt-2">Verification signature & security watermark valid.</p>
                </div>
              )}
            </div>

            {/* Simulated Watermark & Security Seal */}
            <div className="absolute bottom-6 right-6 flex flex-col items-center opacity-70 pointer-events-none">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#154D57] flex items-center justify-center text-[9px] text-[#154D57] font-bold text-center leading-tight">
                DIGITALLY<br />VERIFIED<br />STAMP
              </div>
            </div>

            {/* HIGHLIGHTED EVIDENCE BOUNDING BOX OVERLAY */}
            {selectedEvidence &&
              selectedEvidence.pageNumber === currentPage &&
              selectedEvidence.boundingBox && (
                <div
                  className="absolute pointer-events-none border-2 rounded-xs transition-all duration-300 animate-pulse"
                  style={{
                    left: `${selectedEvidence.boundingBox.x}%`,
                    top: `${selectedEvidence.boundingBox.y}%`,
                    width: `${selectedEvidence.boundingBox.width}%`,
                    height: `${selectedEvidence.boundingBox.height}%`,
                    borderColor:
                      selectedEvidence.fieldName === 'CIN' && selectedEvidence.extractedValue.includes('not found')
                        ? '#413F3D'
                        : '#154D57',
                    backgroundColor: 'rgba(21, 77, 87, 0.12)',
                  }}
                >
                  <div
                    className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold font-mono-tech tracking-wide whitespace-nowrap shadow-xs"
                    style={{
                      backgroundColor: '#154D57',
                      color: '#FEFAF7',
                    }}
                  >
                    {selectedEvidence.fieldName}: {selectedEvidence.extractedValue}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Zoom & Pagination Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/90 backdrop-blur-md border-t border-[#D8CFD0] text-xs font-mono-tech">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded text-[#413F3D] hover:bg-[#F2F1EF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-[11px] text-[#413F3D]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded text-[#413F3D] hover:bg-[#F2F1EF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#697184]">{zoomLevel}%</span>
          <button
            onClick={() => handleZoom(-15)}
            className="p-1 rounded hover:bg-[#F2F1EF] text-[#413F3D] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(15)}
            className="p-1 rounded hover:bg-[#F2F1EF] text-[#413F3D] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1 rounded hover:bg-[#F2F1EF] text-[#413F3D] cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
