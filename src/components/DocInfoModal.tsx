import React from 'react';
import { X, FileText, Calendar, User, HardDrive, Layers, ShieldCheck } from 'lucide-react';
import { ThemeMode, PDFMetadata } from '../types';

interface DocInfoModalProps {
  theme: ThemeMode;
  metadata: PDFMetadata | null;
  onClose: () => void;
}

export const DocInfoModal: React.FC<DocInfoModalProps> = ({ theme, metadata, onClose }) => {
  if (!metadata) return null;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return 'Not specified';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return String(date);
    }
  };

  const details = [
    { label: 'File Name', value: metadata.fileName, icon: FileText },
    { label: 'Title', value: metadata.title || 'Untitled Document', icon: FileText },
    { label: 'Author', value: metadata.author || 'Not specified', icon: User },
    { label: 'Subject', value: metadata.subject || 'Not specified', icon: FileText },
    { label: 'Total Pages', value: `${metadata.pageCount} pages`, icon: Layers },
    { label: 'File Size', value: formatFileSize(metadata.fileSize), icon: HardDrive },
    { label: 'PDF Format', value: metadata.pdfFormatVersion || 'PDF 1.4 - 2.0', icon: ShieldCheck },
    { label: 'Producer', value: metadata.producer || metadata.creator || 'Standard PDF Engine', icon: User },
    { label: 'Created Date', value: formatDate(metadata.creationDate), icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'bg-[#181716] border-[#2E2C2A] text-[#F4F2EE]'
            : 'bg-[#FDFCFB] border-[#E5E2DE] text-[#1A1A1A]'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2DE] dark:border-[#2E2C2A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#FDFCFB] dark:bg-[#F4F2EE] dark:text-[#1A1A1A] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-semibold">Document Monograph</h2>
              <p className="text-xs font-sans text-[#A5A29E]">
                Bibliographic metadata &amp; archival properties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 text-[#A5A29E] hover:text-[#1A1A1A] dark:hover:text-[#F4F2EE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
          {details.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
                  theme === 'dark'
                    ? 'bg-[#1C1B1A]/80 border-[#2E2C2A]'
                    : 'bg-white border-[#E5E2DE]'
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 text-[#A5A29E] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-sans font-bold text-[#A5A29E] uppercase tracking-[0.15em]">
                    {item.label}
                  </div>
                  <div className="text-xs font-serif mt-0.5 break-words text-[#1A1A1A] dark:text-[#F4F2EE]">
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333333] dark:bg-[#F4F2EE] dark:text-[#1A1A1A] dark:hover:bg-white text-white text-xs font-sans font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors"
          >
            Close Properties
          </button>
        </div>
      </div>
    </div>
  );
};
