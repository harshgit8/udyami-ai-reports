import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { QualityInspection } from "@/types/documents";

type WithId<T> = Partial<T> & { id: string };
const PAGE_SIZE = 20;

interface QualityListProps {
  reports: Array<WithId<QualityInspection>>;
}

export function QualityList({ reports }: QualityListProps) {
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<WithId<QualityInspection> | null>(null);
  const [page, setPage] = useState(1);

  const products = useMemo(() => {
    const unique = [...new Set(reports.map(r => r.productType))];
    return unique.map(p => ({ label: p, value: p }));
  }, [reports]);

  const filteredReports = useMemo(() => {
    setPage(1);
    return reports.filter(r => {
      const matchesSearch = !search || 
        r.inspectionId?.toLowerCase().includes(search.toLowerCase()) ||
        r.batchId?.toLowerCase().includes(search.toLowerCase()) ||
        r.productType?.toLowerCase().includes(search.toLowerCase());
      const matchesDecision = !decisionFilter || r.decision === decisionFilter;
      const matchesProduct = !productFilter || r.productType === productFilter;
      return matchesSearch && matchesDecision && matchesProduct;
    });
  }, [reports, search, decisionFilter, productFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const paged = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Quality Inspection</h1>
        <p className="text-muted-foreground mt-2">Review quality inspection reports and defect analysis</p>
      </motion.div>

      <FilterBar
        search={search} onSearchChange={setSearch}
        totalCount={reports.length} filteredCount={filteredReports.length}
        filters={[
          { label: 'Decision', value: decisionFilter, options: [{ label: 'Accept', value: 'ACCEPT' }, { label: 'Conditional', value: 'CONDITIONAL_ACCEPT' }, { label: 'Reject', value: 'REJECT' }], onChange: setDecisionFilter },
          { label: 'Product', value: productFilter, options: products, onChange: setProductFilter },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paged.map((report, index) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <DocumentCard
              title={report.inspectionId} subtitle={`Batch: ${report.batchId}`} value={`${report.defectRate}% defects`}
              status={report.decision === 'ACCEPT' ? 'success' : report.decision === 'REJECT' ? 'error' : 'warning'}
              statusLabel={report.decision?.replace('_', ' ')}
              metadata={[
                { label: 'Product', value: report.productType || 'N/A' },
                { label: 'Quantity', value: `${report.quantity}` },
                { label: 'Severity', value: report.severityLevel || 'N/A' },
                { label: 'Defect Rate', value: `${report.defectRate}%` },
              ]}
              onView={() => setSelectedDoc(report)} onDownload={() => setSelectedDoc(report)}
            />
          </motion.div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No quality reports found matching your criteria.</div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <PDFPreview isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={`Quality Report - ${selectedDoc?.inspectionId || ''}`} filename={`quality-${selectedDoc?.inspectionId || 'document'}`}>
        {selectedDoc && <PDFContent type="quality" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}