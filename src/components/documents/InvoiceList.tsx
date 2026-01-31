import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";
import type { Invoice } from "@/types/documents";

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
    const unique = [...new Set(invoices.map(i => i.customer))];
    return unique.map(c => ({ label: c, value: c }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const matchesSearch = !search || 
        i.customer?.toLowerCase().includes(search.toLowerCase()) ||
        i.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRisk = !riskFilter || i.paymentRisk === riskFilter;
      const matchesCustomer = !customerFilter || i.customer === customerFilter;
      
      return matchesSearch && matchesRisk && matchesCustomer;
    });
  }, [invoices, search, riskFilter, customerFilter]);

  const formatCurrency = (value: number) => `₹${value?.toLocaleString('en-IN') || '0'}`;

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvoices.map((invoice, index) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              title={invoice.invoiceNumber}
              subtitle={invoice.customer}
              value={formatCurrency(invoice.grandTotal)}
              status={
                invoice.paymentRisk === 'LOW' ? 'success' :
                invoice.paymentRisk === 'HIGH' ? 'error' : 'warning'
              }
              statusLabel={`${invoice.paymentRisk} RISK`}
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
