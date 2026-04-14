import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { OrchestratorDashboard } from "@/components/dashboard/OrchestratorDashboard";
import { AgentCommunicationPlayground } from "@/components/agents/AgentCommunicationPlayground";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { QuotationList } from "@/components/documents/QuotationList";
import { InvoiceList } from "@/components/documents/InvoiceList";
import { QualityList } from "@/components/documents/QualityList";
import { ProductionList } from "@/components/documents/ProductionList";
import { RnDList } from "@/components/documents/RnDList";
import { AIChatWorkspace } from "@/components/chat/AIChatWorkspace";
import { EmployeeManagement } from "@/components/hr/EmployeeManagement";
import { ShiftManagement } from "@/components/hr/ShiftManagement";
import { SalaryManagement } from "@/components/hr/SalaryManagement";
import { CustomerManagement } from "@/components/crm/CustomerManagement";
import { ERPDashboard } from "@/components/erp/ERPDashboard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { fetchDocuments, syncFromGoogleSheets } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, ProductionOrder, QualityInspection, Quotation, RnDFormulation } from "@/types/documents";

type WithId<T> = Partial<T> & { id: string };

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  );
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => fetchDocuments(),
    staleTime: 10_000,
    retry: 1,
  });

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncFromGoogleSheets();
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
        const total = Object.values(result.synced || {}).reduce((a, b) => a + (b > 0 ? b : 0), 0);
        toast({ title: "Data Synced", description: `${total} records synced from Google Sheets.` });
      } else {
        toast({ title: "Sync Failed", description: result.error || "Could not sync data.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Sync Error", description: "Failed to connect to sync service.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }, [queryClient, toast]);

  const { quotations, invoices, qualityReports, productionOrders, rndFormulations, badgeCounts } = useMemo(() => {
    const q: Array<WithId<Quotation>> = [];
    const i: Array<WithId<Invoice>> = [];
    const qc: Array<WithId<QualityInspection>> = [];
    const p: Array<WithId<ProductionOrder>> = [];
    const r: Array<WithId<RnDFormulation>> = [];

    for (const doc of documents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = { id: doc.id, ...(doc.data as object) } as any;
      if (doc.type === "quotation") q.push(payload);
      if (doc.type === "invoice") i.push(payload);
      if (doc.type === "quality") qc.push(payload);
      if (doc.type === "production") p.push(payload);
      if (doc.type === "rnd") r.push(payload);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qualityIssues = qc.filter((item: any) => item.decision === "REJECT" || item.decision === "CONDITIONAL_ACCEPT" || item.Decision === "REJECTED" || item.Decision === "CONDITIONAL ACCEPT").length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productionDelays = p.filter((item: any) => item.decision === "DELAY" || item.Decision === "DELAY").length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rndPending = r.filter((item: any) => {
      const rec = (item.recommendation ?? item.Recommendation ?? "") as string;
      return rec.includes("CAUTION") || rec.includes("LABORATORY TESTING");
    }).length;

    return {
      quotations: q, invoices: i, qualityReports: qc, productionOrders: p, rndFormulations: r,
      badgeCounts: { quality: qualityIssues, production: productionDelays, rnd: rndPending },
    };
  }, [documents]);

  const renderContent = () => {
    if (isLoading && activeTab === "dashboard") return <LoadingSkeleton />;

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            quotations={quotations} invoices={invoices} qualityReports={qualityReports}
            productionOrders={productionOrders} rndFormulations={rndFormulations} onNavigate={setActiveTab}
          />
        );
      case "chat":
        return (
          <AIChatWorkspace
            contextData={{
              quotationsCount: quotations.length, invoicesCount: invoices.length,
              qualityCount: qualityReports.length, productionCount: productionOrders.length,
              rndCount: rndFormulations.length,
              documents: documents.slice(0, 50).map((d) => ({
                id: d.id, type: d.type, external_id: d.external_id,
                customer: d.customer, status: d.status, total: d.total, created_at: d.created_at ?? "",
              })),
            }}
          />
        );
      case "orchestrators": return <OrchestratorDashboard />;
      case "agent-comm": return <AgentCommunicationPlayground />;
      case "analytics": return <AnalyticsDashboard />;
      case "quotations": return <QuotationList quotations={quotations} />;
      case "invoices": return <InvoiceList invoices={invoices} />;
      case "quality": return <QualityList reports={qualityReports} />;
      case "production": return <ProductionList orders={productionOrders} />;
      case "rnd": return <RnDList formulations={rndFormulations} />;
      case "employees": return <EmployeeManagement />;
      case "shifts": return <ShiftManagement />;
      case "salary": return <SalaryManagement />;
      case "crm": return <CustomerManagement />;
      case "erp": return <ERPDashboard />;
      case "admin": return <AdminPanel />;
      default:
        return (
          <DashboardOverview
            quotations={quotations} invoices={invoices} qualityReports={qualityReports}
            productionOrders={productionOrders} rndFormulations={rndFormulations} onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onSync={handleSync} syncing={syncing} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} badgeCounts={badgeCounts} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 sm:pb-4 md:pb-6 overflow-y-auto h-[calc(100vh-49px)]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Index;
