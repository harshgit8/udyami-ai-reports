import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import type { QualityInspection } from "@/types/documents";
import { globalSearch } from "@/lib/search";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

type WithId<T> = Partial<T> & { id: string };

interface QualityListProps {
  reports: Array<WithId<QualityInspection>>;
}

export function QualityList({ reports }: QualityListProps) {
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<WithId<QualityInspection> | null>(null);

  const products = useMemo(() => {
    const unique = [...new Set(reports.map(r => r.productType).filter(Boolean))];
    return unique.map(p => ({ label: p as string, value: p as string }));
  }, [reports]);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (decisionFilter) {
      filtered = filtered.filter(r => r.decision === decisionFilter);
    }

    if (productFilter) {
      filtered = filtered.filter(r => r.productType === productFilter);
    }

    if (search) {
      filtered = globalSearch(filtered, search);
    }
      
    return filtered;
  }, [reports, search, decisionFilter, productFilter]);

  const {
    currentItems: paginatedReports,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    changePage
  } = usePagination(filteredReports, 20);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Quality Inspection</h1>
        <p className="text-muted-foreground mt-2">
          Review quality inspection reports and defect analysis
        </p>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        totalCount={reports.length}
        filteredCount={filteredReports.length}
        filters={[
          {
            label: 'Decision',
            value: decisionFilter,
            options: [
              { label: 'Accept', value: 'ACCEPT' },
              { label: 'Conditional', value: 'CONDITIONAL_ACCEPT' },
              { label: 'Reject', value: 'REJECT' },
            ],
            onChange: setDecisionFilter,
          },
          {
            label: 'Product',
            value: productFilter,
            options: products,
            onChange: setProductFilter,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {paginatedReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              title={report.inspectionId || 'N/A'}
              subtitle={`Batch: ${report.batchId || 'N/A'}`}
              value={`${report.defectRate || 0}% defects`}
              status={
                report.decision === 'ACCEPT' ? 'success' :
                report.decision === 'REJECT' ? 'error' : 'warning'
              }
              statusLabel={report.decision?.replace('_', ' ') || 'N/A'}
              metadata={[
                { label: 'Product', value: report.productType || 'N/A' },
                { label: 'Quantity', value: `${report.quantity || 0}` },
                { label: 'Severity', value: report.severityLevel || 'N/A' },
                { label: 'Defect Rate', value: `${report.defectRate || 0}%` },
              ]}
              onView={() => setSelectedDoc(report)}
              onDownload={() => setSelectedDoc(report)}
            />
          </motion.div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No quality reports found matching your criteria.
        </div>
      )}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={goToNextPage}
        onPrevPage={goToPreviousPage}
        onPageChange={changePage}
      />

      <PDFPreview
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={`Quality Report - ${selectedDoc?.inspectionId || ''}`}
        filename={`quality-${selectedDoc?.inspectionId || 'document'}`}
      >
        {selectedDoc && <PDFContent type="quality" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}
