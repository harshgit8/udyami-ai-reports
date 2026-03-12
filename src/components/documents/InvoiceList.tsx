import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import type { Invoice } from "@/types/documents";
import { globalSearch } from "@/lib/search";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

type WithId<T> = Partial<T> & { id: string };

interface InvoiceListProps {
  invoices: Array<WithId<Invoice>>;
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<WithId<Invoice> | null>(null);

  const customers = useMemo(() => {
    const unique = [...new Set(invoices.map(i => i.customer).filter(Boolean))];
    return unique.map(c => ({ label: c as string, value: c as string }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (riskFilter) {
      filtered = filtered.filter(i => i.paymentRisk === riskFilter);
    }

    if (customerFilter) {
      filtered = filtered.filter(i => i.customer === customerFilter);
    }

    if (search) {
      filtered = globalSearch(filtered, search);
    }
      
    return filtered;
  }, [invoices, search, riskFilter, customerFilter]);

  const {
    currentItems: paginatedInvoices,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    changePage
  } = usePagination(filteredInvoices, 20);

  const formatCurrency = (value?: number) => `₹${value?.toLocaleString('en-IN') || '0'}`;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Track invoices and payment status
        </p>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        totalCount={invoices.length}
        filteredCount={filteredInvoices.length}
        filters={[
          {
            label: 'Payment Risk',
            value: riskFilter,
            options: [
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
            ],
            onChange: setRiskFilter,
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
        {paginatedInvoices.map((invoice, index) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              title={invoice.invoiceNumber || 'N/A'}
              subtitle={invoice.customer || 'N/A'}
              value={formatCurrency(invoice.grandTotal)}
              status={
                invoice.paymentRisk === 'LOW' ? 'success' :
                invoice.paymentRisk === 'HIGH' ? 'error' : 'warning'
              }
              statusLabel={invoice.paymentRisk ? `${invoice.paymentRisk} RISK` : 'N/A'}
              metadata={[
                { label: 'Date', value: invoice.invoiceDate || 'N/A' },
                { label: 'Due', value: invoice.dueDate || 'N/A' },
                { label: 'Balance', value: formatCurrency(invoice.balanceDue) },
                { label: 'Total', value: formatCurrency(invoice.grandTotal) },
              ]}
              onView={() => setSelectedDoc(invoice)}
              onDownload={() => setSelectedDoc(invoice)}
            />
          </motion.div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No invoices found matching your criteria.
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
        title={`Invoice - ${selectedDoc?.invoiceNumber || ''}`}
        filename={`invoice-${selectedDoc?.invoiceNumber || 'document'}`}
      >
        {selectedDoc && <PDFContent type="invoice" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}
