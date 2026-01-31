import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { MainChatInterface } from "@/components/chat/MainChatInterface";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { QuotationList } from "@/components/documents/QuotationList";
import { InvoiceList } from "@/components/documents/InvoiceList";
import { QualityList } from "@/components/documents/QualityList";
import { ProductionList } from "@/components/documents/ProductionList";
import { RnDList } from "@/components/documents/RnDList";
import { LoginPage } from "@/components/auth/LoginPage";
import { 
  parseQuotationMarkdown, 
  parseInvoiceMarkdown, 
  parseQualityMarkdown,
  parseProductionMarkdown,
  parseRnDMarkdown 
} from "@/lib/googleSheets";

// Sample data parsed from the markdown files
const sampleQuotationsMarkdown = `
# Quotation Batch Report

**Generated:** 2026-01-31 09:30:22
**Total Quotations:** 50

**Total Quoted Value:** 5633961.97

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092547
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** PowerCable Co
- **Request ID:** QR001
- **Product:** widget_e
- **Quantity:** 300 units

## Pricing
- **Unit Price:** 387.8 per unit
- **Lead Time:** 9 days
- **GRAND TOTAL:** 116340.73

## AI Insights
- **Win Probability:** HIGH

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092558
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** Apex Plastics
- **Request ID:** QR002
- **Product:** widget_a
- **Quantity:** 100 units

## Pricing
- **Unit Price:** 442.55 per unit
- **Lead Time:** 7 days
- **GRAND TOTAL:** 44255.37

## AI Insights
- **Win Probability:** MEDIUM

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092610
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** FastTrack Ltd
- **Request ID:** QR003
- **Product:** widget_c
- **Quantity:** 200 units

## Pricing
- **Unit Price:** 421.76 per unit
- **Lead Time:** 8 days
- **GRAND TOTAL:** 84351.03

## AI Insights
- **Win Probability:** MEDIUM

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092620
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** Universal Components
- **Request ID:** QR004
- **Product:** widget_d
- **Quantity:** 750 units

## Pricing
- **Unit Price:** 502.2 per unit
- **Lead Time:** 12 days
- **GRAND TOTAL:** 376649.51

## AI Insights
- **Win Probability:** LOW

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092634
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** SmartWire Ltd
- **Request ID:** QR005
- **Product:** widget_d
- **Quantity:** 200 units

## Pricing
- **Unit Price:** 264.59 per unit
- **Lead Time:** 7 days
- **GRAND TOTAL:** 52918.73

## AI Insights
- **Win Probability:** MEDIUM

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092646
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** ProTech Systems
- **Request ID:** QR006
- **Product:** widget_b
- **Quantity:** 500 units

## Pricing
- **Unit Price:** 380.25 per unit
- **Lead Time:** 10 days
- **GRAND TOTAL:** 190125.00

## AI Insights
- **Win Probability:** HIGH

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092657
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** BuildCo
- **Request ID:** QR007
- **Product:** widget_a
- **Quantity:** 150 units

## Pricing
- **Unit Price:** 451.34 per unit
- **Lead Time:** 7 days
- **GRAND TOTAL:** 67700.49

## AI Insights
- **Win Probability:** MEDIUM

================================================================================

# QUOTATION

**Quote ID:** QT_20260131_092708
**Date:** 2026-01-31
**Valid Until:** 2026-03-02

## Customer Information
- **Customer:** SafetyFirst Manufacturing
- **Request ID:** QR008
- **Product:** widget_c
- **Quantity:** 300 units

## Pricing
- **Unit Price:** 395.50 per unit
- **Lead Time:** 9 days
- **GRAND TOTAL:** 118650.00

## AI Insights
- **Win Probability:** HIGH
`;

const sampleInvoicesMarkdown = `
# Invoice Batch Report

**Generated:** 2026-01-31 07:17:19
**Total Invoices:** 50

================================================================================

# TAX INVOICE

**Invoice Number:** INV-2026-01-31-071426
**Invoice Date:** 2026-01-31
**Due Date:** 2026-01-31

## Customer Details
**Quantum Materials**

## Invoice Summary
- **GRAND TOTAL:** 45008.74
- **BALANCE DUE:** 24128.74

## AI Insights
- **Payment Risk:** LOW

================================================================================

# TAX INVOICE

**Invoice Number:** INV-2026-01-31-071430
**Invoice Date:** 2026-01-31
**Due Date:** 2026-03-02

## Customer Details
**PowerCable Co**

## Invoice Summary
- **GRAND TOTAL:** 422631.16
- **BALANCE DUE:** 236131.16

## AI Insights
- **Payment Risk:** MEDIUM

================================================================================

# TAX INVOICE

**Invoice Number:** INV-2026-01-31-071434
**Invoice Date:** 2026-01-31
**Due Date:** 2026-02-15

## Customer Details
**Apex Plastics**

## Invoice Summary
- **GRAND TOTAL:** 83466.12
- **BALANCE DUE:** 50466.12

## AI Insights
- **Payment Risk:** MEDIUM

================================================================================

# TAX INVOICE

**Invoice Number:** INV-2026-01-31-071438
**Invoice Date:** 2026-01-31
**Due Date:** 2026-03-02

## Customer Details
**BuildCo**

## Invoice Summary
- **GRAND TOTAL:** 184275.88
- **BALANCE DUE:** 97155.88

## AI Insights
- **Payment Risk:** MEDIUM

================================================================================

# TAX INVOICE

**Invoice Number:** INV-2026-01-31-071443
**Invoice Date:** 2026-01-31
**Due Date:** 2026-01-31

## Customer Details
**SafetyFirst Manufacturing**

## Invoice Summary
- **GRAND TOTAL:** 149989.80
- **BALANCE DUE:** 94369.80

## AI Insights
- **Payment Risk:** MEDIUM
`;

const sampleQualityMarkdown = `
# Quality Inspection Batch Report

**Generated:** 2026-01-31 07:09:56
**Total Inspections:** 50

================================================================================

# Quality Inspection Report

**Inspection ID:** QC_20260131_070635
**Batch ID:** BATCH001
**Timestamp:** 2026-01-31T07:06:35

## Batch Information
- **Product Type:** widget_b
- **Quantity:** 400
- **Defect Rate:** 1.75%

## Severity Assessment
- **Severity Level:** ACCEPTABLE

## Final Decision
**REJECT**

================================================================================

# Quality Inspection Report

**Inspection ID:** QC_20260131_070639
**Batch ID:** BATCH002
**Timestamp:** 2026-01-31T07:06:39

## Batch Information
- **Product Type:** widget_c
- **Quantity:** 500
- **Defect Rate:** 0.0%

## Severity Assessment
- **Severity Level:** EXCELLENT

## Final Decision
**CONDITIONAL_ACCEPT**

================================================================================

# Quality Inspection Report

**Inspection ID:** QC_20260131_070647
**Batch ID:** BATCH004
**Timestamp:** 2026-01-31T07:06:47

## Batch Information
- **Product Type:** widget_b
- **Quantity:** 500
- **Defect Rate:** 0.4%

## Severity Assessment
- **Severity Level:** GOOD

## Final Decision
**ACCEPT**

================================================================================

# Quality Inspection Report

**Inspection ID:** QC_20260131_070655
**Batch ID:** BATCH006
**Timestamp:** 2026-01-31T07:06:55

## Batch Information
- **Product Type:** widget_c
- **Quantity:** 750
- **Defect Rate:** 0.53%

## Severity Assessment
- **Severity Level:** GOOD

## Final Decision
**ACCEPT**

================================================================================

# Quality Inspection Report

**Inspection ID:** QC_20260131_070700
**Batch ID:** BATCH007
**Timestamp:** 2026-01-31T07:07:00

## Batch Information
- **Product Type:** widget_a
- **Quantity:** 800
- **Defect Rate:** 0.88%

## Severity Assessment
- **Severity Level:** MARGINAL

## Final Decision
**REJECT**
`;

const sampleProductionMarkdown = `
# AI Production Schedule Report

Generated: 2026-01-31 01:04:01

## Executive Summary
- **Total Orders Analyzed:** 1208
- **Scheduled for Production:** 958
- **Delayed:** 250

### Order ORD-001
- **Decision:** PROCEED
- **Risk Score:** 0/10
- **Reason:** All constraints satisfied
- **Machine:** M1
- **Start Time:** 2026-03-22T01:25:56
- **End Time:** 2026-03-22T07:55:56

### Order ORD-002
- **Decision:** PROCEED
- **Risk Score:** 0/10
- **Reason:** All constraints satisfied
- **Machine:** M1
- **Start Time:** 2026-03-30T18:36:08
- **End Time:** 2026-03-30T23:36:08

### Order ORD-003
- **Decision:** PROCEED
- **Risk Score:** 0/10
- **Reason:** All constraints satisfied
- **Machine:** M3
- **Start Time:** 2026-03-15T11:36:08
- **End Time:** 2026-03-15T18:51:08

### Order ORD-014
- **Decision:** DELAY
- **Risk Score:** 7/10
- **Reason:** Material shortages: aluminum
- **Machine:** M2
- **Start Time:** N/A
- **End Time:** N/A

### Order ORD-017
- **Decision:** DELAY
- **Risk Score:** 8/10
- **Reason:** Insufficient time to meet deadline (slack: -25.1 days)
- **Machine:** M1
- **Start Time:** N/A
- **End Time:** N/A

### Order ORD-018
- **Decision:** PROCEED
- **Risk Score:** 0/10
- **Reason:** All constraints satisfied
- **Machine:** M1
- **Start Time:** 2026-09-03T00:08:32
- **End Time:** 2026-09-03T08:08:32
`;

const sampleRnDMarkdown = `
# R&D Formulation Batch Report

**Generated:** 2026-01-31 07:12:56
**Total Requests:** 29

================================================================================

# R&D Formulation Report

**Formulation ID:** FORM_20260131_071105
**Generated:** 2026-01-31T07:11:05

## Requirement Summary
- **Application:** charger_housing
- **Standards:** UL94 HB
- **Cost Target:** 55.0/kg

**Total Cost:** 58/kg

## Predicted Properties
- **UL94 Rating:** HB

## Final Recommendation
**PROCEED WITH CAUTION - Review compliance restrictions**

## AI Analysis
- **Production Readiness:** PILOT_TEST

================================================================================

# R&D Formulation Report

**Formulation ID:** FORM_20260131_071117
**Generated:** 2026-01-31T07:11:17

## Requirement Summary
- **Application:** industrial_plug
- **Standards:** UL94 V-1
- **Cost Target:** 61.0/kg

**Total Cost:** 76/kg

## Predicted Properties
- **UL94 Rating:** V-1

## Final Recommendation
**PROCEED TO PILOT BATCH - Formulation meets requirements**

## AI Analysis
- **Production Readiness:** PILOT_TEST

================================================================================

# R&D Formulation Report

**Formulation ID:** FORM_20260131_071121
**Generated:** 2026-01-31T07:11:21

## Requirement Summary
- **Application:** switch_cover
- **Standards:** UL94 V-0
- **Cost Target:** 74.0/kg

**Total Cost:** 82/kg

## Predicted Properties
- **UL94 Rating:** V-0

## Final Recommendation
**PROCEED TO PILOT BATCH - Formulation meets requirements**

## AI Analysis
- **Production Readiness:** PILOT_TEST

================================================================================

# R&D Formulation Report

**Formulation ID:** FORM_20260131_071113
**Generated:** 2026-01-31T07:11:13

## Requirement Summary
- **Application:** electronics_housing
- **Standards:** UL94 V-2
- **Cost Target:** 119.0/kg

**Total Cost:** 58/kg

## Predicted Properties
- **UL94 Rating:** HB

## Final Recommendation
**PROCEED WITH CAUTION - Review compliance restrictions**

## AI Analysis
- **Production Readiness:** NEEDS_WORK
`;

interface User {
  name: string;
  role: "admin" | "manager" | "staff";
}

const Index = () => {
  const [activeView, setActiveView] = useState("chat");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [qualityReports, setQualityReports] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [rndFormulations, setRndFormulations] = useState<any[]>([]);

  useEffect(() => {
    // Parse sample data on load
    setQuotations(parseQuotationMarkdown(sampleQuotationsMarkdown));
    setInvoices(parseInvoiceMarkdown(sampleInvoicesMarkdown));
    setQualityReports(parseQualityMarkdown(sampleQualityMarkdown));
    setProductionOrders(parseProductionMarkdown(sampleProductionMarkdown));
    setRndFormulations(parseRnDMarkdown(sampleRnDMarkdown));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveView("chat");
  };

  const contextData = {
    quotationsCount: quotations.length,
    invoicesCount: invoices.length,
    qualityCount: qualityReports.length,
    productionCount: productionOrders.length,
    rndCount: rndFormulations.length,
  };

  const renderContent = () => {
    switch (activeView) {
      case 'chat':
        return (
          <MainChatInterface 
            contextData={contextData}
            onNavigate={setActiveView}
          />
        );
      case 'dashboard':
        return (
          <div className="p-8 overflow-auto h-full">
            <DashboardOverview
              quotations={quotations}
              invoices={invoices}
              qualityReports={qualityReports}
              productionOrders={productionOrders}
              rndFormulations={rndFormulations}
              onNavigate={setActiveView}
            />
          </div>
        );
      case 'quotations':
        return (
          <div className="p-8 overflow-auto h-full">
            <QuotationList quotations={quotations} />
          </div>
        );
      case 'invoices':
        return (
          <div className="p-8 overflow-auto h-full">
            <InvoiceList invoices={invoices} />
          </div>
        );
      case 'quality':
        return (
          <div className="p-8 overflow-auto h-full">
            <QualityList reports={qualityReports} />
          </div>
        );
      case 'production':
        return (
          <div className="p-8 overflow-auto h-full">
            <ProductionList orders={productionOrders} />
          </div>
        );
      case 'rnd':
        return (
          <div className="p-8 overflow-auto h-full">
            <RnDList formulations={rndFormulations} />
          </div>
        );
      default:
        return (
          <MainChatInterface 
            contextData={contextData}
            onNavigate={setActiveView}
          />
        );
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <ChatSidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        onLogout={handleLogout}
        userRole={currentUser?.role === "admin" ? "Admin" : currentUser?.role === "manager" ? "Manager" : "Staff"}
        userName={currentUser?.name || "User"}
      />
      <main className="flex-1 h-screen overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
