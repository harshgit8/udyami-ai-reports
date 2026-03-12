import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import type { RnDFormulation } from "@/types/documents";
import { globalSearch } from "@/lib/search";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

type WithId<T> = Partial<T> & { id: string };

interface RnDListProps {
  formulations: Array<WithId<RnDFormulation>>;
}

export function RnDList({ formulations }: RnDListProps) {
  const [search, setSearch] = useState("");
  const [readinessFilter, setReadinessFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<WithId<RnDFormulation> | null>(null);

  const applications = useMemo(() => {
    const unique = [...new Set(formulations.map(f => f.application).filter(Boolean))];
    return unique.map(a => ({ label: a as string, value: a as string }));
  }, [formulations]);

  const filteredFormulations = useMemo(() => {
    let filtered = formulations;

    if (readinessFilter) {
      filtered = filtered.filter(f => f.productionReadiness === readinessFilter);
    }

    if (applicationFilter) {
      filtered = filtered.filter(f => f.application === applicationFilter);
    }

    if (search) {
      filtered = globalSearch(filtered, search);
    }

    return filtered;
  }, [formulations, search, readinessFilter, applicationFilter]);

  const {
    currentItems: paginatedFormulations,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    changePage
  } = usePagination(filteredFormulations, 20);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">R&D Formulations</h1>
        <p className="text-muted-foreground mt-2">
          Explore R&D formulations and compliance data
        </p>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        totalCount={formulations.length}
        filteredCount={filteredFormulations.length}
        filters={[
          {
            label: 'Readiness',
            value: readinessFilter,
            options: [
              { label: 'Pilot Test', value: 'PILOT_TEST' },
              { label: 'Needs Work', value: 'NEEDS_WORK' },
              { label: 'Production Ready', value: 'PRODUCTION_READY' },
            ],
            onChange: setReadinessFilter,
          },
          {
            label: 'Application',
            value: applicationFilter,
            options: applications,
            onChange: setApplicationFilter,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {paginatedFormulations.map((formulation, index) => (
          <motion.div
            key={formulation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              title={formulation.formulationId || 'N/A'}
              subtitle={formulation.application || 'N/A'}
              value={`₹${formulation.totalCost || 0}/kg`}
              status={
                formulation.productionReadiness === 'PRODUCTION_READY' ? 'success' :
                formulation.productionReadiness === 'NEEDS_WORK' ? 'error' : 'warning'
              }
              statusLabel={formulation.productionReadiness?.replace('_', ' ') || 'N/A'}
              metadata={[
                { label: 'Standards', value: formulation.standards || 'N/A' },
                { label: 'Rating', value: formulation.ul94Rating || 'N/A' },
                { label: 'Target Cost', value: `₹${formulation.costTarget || 0}/kg` },
                { label: 'Actual Cost', value: `₹${formulation.totalCost || 0}/kg` },
              ]}
              onView={() => setSelectedDoc(formulation)}
              onDownload={() => setSelectedDoc(formulation)}
            />
          </motion.div>
        ))}
      </div>

      {filteredFormulations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No formulations found matching your criteria.
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
        title={`R&D Formulation - ${selectedDoc?.formulationId || ''}`}
        filename={`rnd-${selectedDoc?.formulationId || 'document'}`}
      >
        {selectedDoc && <PDFContent type="rnd" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}
