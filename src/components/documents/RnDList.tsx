import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RnDFormulation } from "@/types/documents";

type WithId<T> = Partial<T> & { id: string };
const PAGE_SIZE = 20;

interface RnDListProps {
  formulations: Array<WithId<RnDFormulation>>;
}

export function RnDList({ formulations }: RnDListProps) {
  const [search, setSearch] = useState("");
  const [readinessFilter, setReadinessFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<WithId<RnDFormulation> | null>(null);
  const [page, setPage] = useState(1);

  const applications = useMemo(() => {
    const unique = [...new Set(formulations.map(f => f.application))];
    return unique.map(a => ({ label: a, value: a }));
  }, [formulations]);

  const filteredFormulations = useMemo(() => {
    setPage(1);
    return formulations.filter(f => {
      const matchesSearch = !search || 
        f.formulationId?.toLowerCase().includes(search.toLowerCase()) ||
        f.application?.toLowerCase().includes(search.toLowerCase()) ||
        f.standards?.toLowerCase().includes(search.toLowerCase());
      const matchesReadiness = !readinessFilter || f.productionReadiness === readinessFilter;
      const matchesApplication = !applicationFilter || f.application === applicationFilter;
      return matchesSearch && matchesReadiness && matchesApplication;
    });
  }, [formulations, search, readinessFilter, applicationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFormulations.length / PAGE_SIZE));
  const paged = filteredFormulations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">R&D Formulations</h1>
        <p className="text-muted-foreground mt-2">Explore R&D formulations and compliance data</p>
      </motion.div>

      <FilterBar
        search={search} onSearchChange={setSearch}
        totalCount={formulations.length} filteredCount={filteredFormulations.length}
        filters={[
          { label: 'Readiness', value: readinessFilter, options: [{ label: 'Pilot Test', value: 'PILOT_TEST' }, { label: 'Needs Work', value: 'NEEDS_WORK' }, { label: 'Production Ready', value: 'PRODUCTION_READY' }], onChange: setReadinessFilter },
          { label: 'Application', value: applicationFilter, options: applications, onChange: setApplicationFilter },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paged.map((formulation, index) => (
          <motion.div key={formulation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <DocumentCard
              title={formulation.formulationId} subtitle={formulation.application} value={`₹${formulation.totalCost}/kg`}
              status={formulation.productionReadiness === 'PRODUCTION_READY' ? 'success' : formulation.productionReadiness === 'NEEDS_WORK' ? 'error' : 'warning'}
              statusLabel={formulation.productionReadiness?.replace('_', ' ')}
              metadata={[
                { label: 'Standards', value: formulation.standards || 'N/A' },
                { label: 'Rating', value: formulation.ul94Rating || 'N/A' },
                { label: 'Target Cost', value: `₹${formulation.costTarget}/kg` },
                { label: 'Actual Cost', value: `₹${formulation.totalCost}/kg` },
              ]}
              onView={() => setSelectedDoc(formulation)} onDownload={() => setSelectedDoc(formulation)}
            />
          </motion.div>
        ))}
      </div>

      {filteredFormulations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No formulations found matching your criteria.</div>
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

      <PDFPreview isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={`R&D Formulation - ${selectedDoc?.formulationId || ''}`} filename={`rnd-${selectedDoc?.formulationId || 'document'}`}>
        {selectedDoc && <PDFContent type="rnd" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}