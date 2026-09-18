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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition z-10 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Frame Container */}
        <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/40 via-white to-amber-50/30 border-8 border-double border-amber-600/30 m-3 rounded-xl shadow-inner">
          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-3 border border-amber-500/30">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">
              Government of India • Ministry of Earth Sciences
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mt-2">
              Certificate of Competency
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-3" />
          </div>

          {/* Certificate Body */}
          <p className="text-xs text-slate-500 italic mt-2">This is to officially certify that</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 border-b border-slate-200 pb-2 inline-block">
            {certificate.user?.name || 'Officer / Scientist'}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Department: <span className="font-semibold">{certificate.user?.department || 'Ministry of Earth Sciences'}</span>
          </p>

          <p className="text-xs text-slate-500 mt-5 leading-relaxed max-w-md mx-auto">
            has successfully fulfilled all instructional modules, practical assignments, and rigorous competency assessments in
          </p>

          <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 inline-block max-w-lg">
            <h4 className="text-base sm:text-lg font-extrabold text-emerald-800">
              {certificate.course?.title || 'Advanced Earth Sciences Specialization'}
            </h4>
          </div>

          {/* Verification Footnotes */}
          <div className="grid grid-cols-2 gap-4 text-left border-t border-slate-200 pt-6 mt-6">
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase">Certificate ID</p>
              <p className="text-xs font-mono font-bold text-slate-800">{certificate.certificateNumber}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Date Issued: {new Date(certificate.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Digitally Verified
              </div>
              <p className="text-[9px] font-mono text-slate-400 truncate max-w-[200px] ml-auto" title={certificate.verificationHash}>
                Hash: {certificate.verificationHash.slice(0, 24)}...
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-8 py-4 flex items-center justify-between border-t border-slate-200 print:hidden">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Accredited by Vantage • Digital Learning Directorate
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
