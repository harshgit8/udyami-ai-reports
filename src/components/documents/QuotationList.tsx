import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import type { Quotation } from "@/types/documents";
import { globalSearch } from "@/lib/search";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

type WithId<T> = Partial<T> & { id: string };

interface QuotationListProps {
  quotations: Array<WithId<Quotation>>;
}

export function QuotationList({ quotations }: QuotationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<WithId<Quotation> | null>(null);

  const customers = useMemo(() => {
    const unique = [...new Set(quotations.map(q => q.customer).filter(Boolean))];
    return unique.map(c => ({ label: c as string, value: c as string }));
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    let filtered = quotations;

    if (statusFilter) {
      filtered = filtered.filter(q => q.winProbability === statusFilter);
    }

    if (customerFilter) {
      filtered = filtered.filter(q => q.customer === customerFilter);
    }

    if (search) {
      filtered = globalSearch(filtered, search);
    }
      
    return filtered;
  }, [quotations, search, statusFilter, customerFilter]);

  const {
    currentItems: paginatedQuotations,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    changePage
  } = usePagination(filteredQuotations, 20);

  const formatCurrency = (value?: number) => `₹${value?.toLocaleString('en-IN') || '0'}`;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-muted-foreground mt-2">
          Manage customer quotations and pricing
        </p>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        totalCount={quotations.length}
        filteredCount={filteredQuotations.length}
        filters={[
          {
            label: 'Win Probability',
            value: statusFilter,
            options: [
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ],
            onChange: setStatusFilter,
          },
          {
            label: 'Customer',
            value: customerFilter,
            options: customers,
            onChange: setCustomerFilter,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {paginatedQuotations.map((quotation, index) => (
          <motion.div
            key={quotation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              title={quotation.quoteId || 'N/A'}
              subtitle={quotation.customer || 'N/A'}
              value={formatCurrency(quotation.grandTotal)}
              status={
                quotation.winProbability === 'HIGH' ? 'success' :
                quotation.winProbability === 'LOW' ? 'error' : 'warning'
              }
              statusLabel={quotation.winProbability || 'N/A'}
              metadata={[
                { label: 'Product', value: quotation.product || 'N/A' },
                { label: 'Quantity', value: `${quotation.quantity || 0} units` },
                { label: 'Unit Price', value: formatCurrency(quotation.unitPrice) },
                { label: 'Valid Until', value: quotation.validUntil || 'N/A' },
              ]}
              onView={() => setSelectedDoc(quotation)}
              onDownload={() => setSelectedDoc(quotation)}
            />
          </motion.div>
        ))}
      </div>

      {filteredQuotations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No quotations found matching your criteria.
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
        title={`Quotation - ${selectedDoc?.quoteId || ''}`}
        filename={`quotation-${selectedDoc?.quoteId || 'document'}`}
      >
        {selectedDoc && <PDFContent type="quotation" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}
