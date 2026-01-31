import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DocumentCard } from "./DocumentCard";
import { FilterBar } from "./FilterBar";
import { PDFPreview } from "./PDFPreview";
import { PDFContent } from "./PDFContent";

interface ProductionListProps {
  orders: any[];
}

export function ProductionList({ orders }: ProductionListProps) {
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const machines = useMemo(() => {
    const unique = [...new Set(orders.map(o => o.machine).filter(Boolean))];
    return unique.map(m => ({ label: m, value: m }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = !search || 
        o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
        o.machine?.toLowerCase().includes(search.toLowerCase());
      
      const matchesDecision = !decisionFilter || o.decision === decisionFilter;
      const matchesMachine = !machineFilter || o.machine === machineFilter;
      
      return matchesSearch && matchesDecision && matchesMachine;
    });
  }, [orders, search, decisionFilter, machineFilter]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Production Schedule</h1>
        <p className="text-muted-foreground mt-2">
          View production orders and scheduling decisions
        </p>
      </motion.div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        totalCount={orders.length}
        filteredCount={filteredOrders.length}
        filters={[
          {
            label: 'Decision',
            value: decisionFilter,
            options: [
              { label: 'Proceed', value: 'PROCEED' },
              { label: 'Delay', value: 'DELAY' },
              { label: 'Reject', value: 'REJECT' },
            ],
            onChange: setDecisionFilter,
          },
          {
            label: 'Machine',
            value: machineFilter,
            options: machines,
            onChange: setMachineFilter,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              title={order.orderId}
              subtitle={`Machine: ${order.machine || 'N/A'}`}
              value={`Risk: ${order.riskScore}/10`}
              status={
                order.decision === 'PROCEED' ? 'success' :
                order.decision === 'REJECT' ? 'error' : 'warning'
              }
              statusLabel={order.decision}
              metadata={[
                { label: 'Start', value: order.startTime?.split('T')[0] || 'N/A' },
                { label: 'End', value: order.endTime?.split('T')[0] || 'N/A' },
                { label: 'Risk', value: `${order.riskScore}/10` },
                { label: 'Reason', value: order.reason?.slice(0, 20) || 'N/A' },
              ]}
              onView={() => setSelectedDoc(order)}
              onDownload={() => setSelectedDoc(order)}
            />
          </motion.div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No production orders found matching your criteria.
        </div>
      )}

      <PDFPreview
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={`Production Order - ${selectedDoc?.orderId || ''}`}
        filename={`production-${selectedDoc?.orderId || 'document'}`}
      >
        {selectedDoc && <PDFContent type="production" data={selectedDoc} />}
      </PDFPreview>
    </div>
  );
}
