import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { QuotationList } from "@/components/documents/QuotationList";
import { InvoiceList } from "@/components/documents/InvoiceList";
import { QualityList } from "@/components/documents/QualityList";
import { ProductionList } from "@/components/documents/ProductionList";
import { RnDList } from "@/components/documents/RnDList";
import { AIChatWorkspace } from "@/components/chat/AIChatWorkspace";
import { fetchDocuments } from "@/lib/documents";
import type { Invoice, ProductionOrder, QualityInspection, Quotation, RnDFormulation } from "@/types/documents";

type WithId<T> = Partial<T> & { id: string };

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const {
    data: documents = [],
  } = useQuery({
    queryKey: ["documents"],
    queryFn: () => fetchDocuments(),
    staleTime: 10_000,
    retry: 1,
  });

  const { quotations, invoices, qualityReports, productionOrders, rndFormulations } = useMemo(() => {
    const q: Array<WithId<Quotation>> = [];
    const i: Array<WithId<Invoice>> = [];
    const qc: Array<WithId<QualityInspection>> = [];
    const p: Array<WithId<ProductionOrder>> = [];
    const r: Array<WithId<RnDFormulation>> = [];

    for (const doc of documents) {
      const payload = { id: doc.id, ...(doc.data as object) } as WithId<
        Quotation | Invoice | QualityInspection | ProductionOrder | RnDFormulation
      >;
      if (doc.type === "quotation") q.push(payload);
      if (doc.type === "invoice") i.push(payload);
      if (doc.type === "quality") qc.push(payload);
      if (doc.type === "production") p.push(payload);
      if (doc.type === "rnd") r.push(payload);
    }

    return {
      quotations: q,
      invoices: i,
      qualityReports: qc,
      productionOrders: p,
      rndFormulations: r,
    };
  }, [documents]);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <AIChatWorkspace
            contextData={{
              quotationsCount: quotations.length,
              invoicesCount: invoices.length,
              qualityCount: qualityReports.length,
              productionCount: productionOrders.length,
              rndCount: rndFormulations.length,
              documents: documents.slice(0, 50).map((d) => ({
                id: d.id,
                type: d.type,
                external_id: d.external_id,
                customer: d.customer,
                status: d.status,
                total: d.total,
                created_at: d.created_at,
              })),
            }}
          />
        );
      case 'dashboard':
        return (
          <DashboardOverview
            quotations={quotations}
            invoices={invoices}
            qualityReports={qualityReports}
            productionOrders={productionOrders}
            rndFormulations={rndFormulations}
            onNavigate={setActiveTab}
          />
        );
      case 'quotations':
        return <QuotationList quotations={quotations} />;
      case 'invoices':
        return <InvoiceList invoices={invoices} />;
      case 'quality':
        return <QualityList reports={qualityReports} />;
      case 'production':
        return <ProductionList orders={productionOrders} />;
      case 'rnd':
        return <RnDList formulations={rndFormulations} />;
      default:
        return <DashboardOverview
          quotations={quotations}
          invoices={invoices}
          qualityReports={qualityReports}
          productionOrders={productionOrders}
          rndFormulations={rndFormulations}
          onNavigate={setActiveTab}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
