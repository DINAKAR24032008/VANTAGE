import React from 'react';
import { Certificate } from '../types';
import { Award, CheckCircle, Download, Printer, X, ShieldCheck } from 'lucide-react';
import { HeadingEmoji } from './HeadingEmoji';
import { Avatar } from './Avatar';

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
    <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-paper-lg max-w-2xl w-full border border-border overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-textSecondary hover:text-primary rounded-lg hover:bg-border/40 transition z-10 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Frame Container - Fixed Cream Paper for Authentic Look & Printing */}
        <div className="p-8 sm:p-12 text-center bg-[#FAF7F2] text-[#1C1917] border-4 border-double border-[#D6CBB9] m-3 rounded-xl shadow-inner">
          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-[#E7F1EA] rounded-full flex items-center justify-center mb-3 border border-[#166534]/30">
              <Award className="w-8 h-8 text-[#166534]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#78716C]">
              Vantage Learning Platform
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#166534] mt-2">
              <HeadingEmoji emoji="🏆" />Certificate of Completion
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#166534] to-transparent my-3" />
          </div>

          {/* Certificate Body */}
          <p className="text-xs text-[#78716C] mt-2">This is to officially certify that</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <Avatar
              user={{
                id: certificate.userId,
                name: certificate.user?.name || 'Enrolled Learner',
                email: '',
                role: 'learner',
                department: certificate.user?.department || '',
                jobRole: certificate.user?.jobRole || '',
              }}
              size="md"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-[#1C1917] border-b border-[#E8E0D4] pb-1">
              {certificate.user?.name || 'Enrolled Learner'}
            </h3>
          </div>

          <p className="text-xs text-[#78716C] mt-5 leading-relaxed max-w-md mx-auto">
            has successfully completed all video modules, practical coursework, and verified module assessments in
          </p>

          <div className="my-4 p-4 bg-white rounded-xl border border-[#E8E0D4] inline-block max-w-lg">
            <h4 className="text-base sm:text-lg font-extrabold text-[#166534]">
              {certificate.course?.title || 'Introduction to Python'}
            </h4>
          </div>

          {/* Verification Footnotes */}
          <div className="grid grid-cols-2 gap-4 text-left border-t border-[#E8E0D4] pt-6 mt-6">
            <div>
              <p className="text-[10px] text-[#78716C] uppercase">Certificate ID</p>
              <p className="text-xs font-bold text-[#1C1917]">{certificate.certificateNumber}</p>
              <p className="text-[10px] text-[#78716C] mt-1">
                Date Issued: {new Date(certificate.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] text-[#166534] font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" /> Digitally Verified
              </div>
              <p className="text-[9px] text-[#78716C] truncate max-w-[200px] ml-auto" title={certificate.verificationHash}>
                Hash: {certificate.verificationHash.slice(0, 24)}...
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-surface px-8 py-4 flex items-center justify-between border-t border-border print:hidden">
          <span className="text-xs text-textSecondary flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-primary" />
            Verified by Vantage • Learning & Certification Platform
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-paper-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface2 hover:bg-border text-textSecondary hover:text-textPrimary text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
