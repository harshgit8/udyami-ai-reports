import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Printer } from "lucide-react";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PDFPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  filename?: string;
}

export function PDFPreview({ isOpen, onClose, title, children, filename = 'document' }: PDFPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-background border border-border shadow-2xl w-full sm:max-w-4xl h-[95dvh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-sm sm:text-base truncate min-w-0 flex-1">{title}</h2>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="p-2 hover:bg-muted transition-colors rounded"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2 sm:px-4 py-2 bg-foreground text-background text-xs sm:text-sm font-medium hover:bg-foreground/90 transition-colors rounded"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted transition-colors rounded shrink-0"
                  title="Close"
                  aria-label="Close PDF preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-3 sm:p-8 bg-muted/30">
              <div className="overflow-x-auto">
                <div 
                  ref={contentRef}
                  className="pdf-preview bg-background mx-auto p-6 sm:p-12 min-h-[297mm]"
                  style={{ width: '210mm' }}
                >
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
