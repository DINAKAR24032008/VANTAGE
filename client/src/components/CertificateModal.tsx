import React from 'react';
import { Certificate } from '../types';
import { Award, CheckCircle, Download, Printer, X, ShieldCheck } from 'lucide-react';

interface Props {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<Props> = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full border border-surfaceBorder overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-textSecondary hover:text-accent rounded-lg hover:bg-surfaceBorder/40 transition z-10 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Frame Container */}
        <div className="p-8 sm:p-12 text-center bg-background border-4 border-double border-accent/40 m-3 rounded-xl shadow-inner">
          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-3 border border-accent/30">
              <Award className="w-8 h-8 text-accent" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-textSecondary font-mono">
              Government of India • Ministry of Earth Sciences
            </span>
            <h2 className="text-2xl sm:text-3xl font-display italic font-bold text-accent mt-2">
              Certificate of Competency
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent my-3" />
          </div>

          {/* Certificate Body */}
          <p className="text-xs text-textSecondary italic mt-2">This is to officially certify that</p>
          <h3 className="text-xl sm:text-2xl font-bold text-textPrimary mt-1 border-b border-surfaceBorder pb-2 inline-block">
            {certificate.user?.name || 'Officer / Scientist'}
          </h3>
          <p className="text-xs text-textSecondary mt-1">
            Department: <span className="font-semibold text-textPrimary">{certificate.user?.department || 'Ministry of Earth Sciences'}</span>
          </p>

          <p className="text-xs text-textSecondary mt-5 leading-relaxed max-w-md mx-auto">
            has successfully fulfilled all instructional modules, practical assignments, and rigorous competency assessments in
          </p>

          <div className="my-4 p-4 bg-surface rounded-xl border border-surfaceBorder inline-block max-w-lg">
            <h4 className="text-base sm:text-lg font-extrabold text-accent">
              {certificate.course?.title || 'Advanced Earth Sciences Specialization'}
            </h4>
          </div>

          {/* Verification Footnotes */}
          <div className="grid grid-cols-2 gap-4 text-left border-t border-surfaceBorder pt-6 mt-6">
            <div>
              <p className="text-[10px] text-textSecondary font-mono uppercase">Certificate ID</p>
              <p className="text-xs font-mono font-bold text-textPrimary">{certificate.certificateNumber}</p>
              <p className="text-[10px] text-textSecondary font-mono mt-1">
                Date Issued: {new Date(certificate.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] text-accent font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Digitally Verified
              </div>
              <p className="text-[9px] font-mono text-textSecondary truncate max-w-[200px] ml-auto" title={certificate.verificationHash}>
                Hash: {certificate.verificationHash.slice(0, 24)}...
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-surface px-8 py-4 flex items-center justify-between border-t border-surfaceBorder print:hidden">
          <span className="text-xs text-textSecondary flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-accent" />
            Accredited by Vantage • Digital Learning Directorate
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-background text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow shadow-accent/20"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surfaceBorder/40 hover:bg-surfaceBorder text-textSecondary hover:text-textPrimary text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
