import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Upload, FileText, CheckCircle2, Loader2, Save, Mail, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatWorkspace } from "@/components/chat/AIChatWorkspace";

interface InvoiceRecord {
  id: string;
  customer: string;
  amount: string;
  tax: string;
  status: string;
  date: string;
}

const initialInvoices: InvoiceRecord[] = [
  { id: "INV-2026-089", customer: "Techno Mfg", amount: "₹3,45,000", tax: "₹62,100", status: "paid", date: "Mar 05" },
  { id: "INV-2026-088", customer: "Apex Industries", amount: "₹8,94,000", tax: "₹1,60,920", status: "overdue", date: "Mar 02" },
  { id: "INV-2026-087", customer: "Global Parts", amount: "₹2,10,000", tax: "₹37,800", status: "paid", date: "Feb 28" },
];

export function InvoiceGenerationDetail() {
  const [viewState, setViewState] = useState<"prompts" | "processing" | "result" | "chat">("prompts");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const prompts = [
    "Generate invoice for Techno Mfg based on latest order",
    "Draft recurring invoice for Prime Corp",
    "Calculate tax breakdown for Q3 export orders",
  ];

  const handlePromptClick = (prompt: string) => {
    setActivePrompt(prompt);
    setViewState("processing");
    setProcessingStep(0);
  };

  useEffect(() => {
    const processingSteps = [
      { label: "Connecting to CRM data...", log: "Targeting agent: DataGatherer - Fetching CRM data..." },
      { label: "Validating GST compliance...", log: "Targeting agent: ComplianceChecker - Validating GST..." },
      { label: "Generating PDF layout...", log: "Targeting agent: DocumentCrafter - Crafting PDF layout..." },
    ];

    if (viewState === "processing") {
      let currentStep = 0;
      let timer: NodeJS.Timeout;

      const processNextStep = () => {
        if (currentStep < processingSteps.length) {
          console.log(processingSteps[currentStep].log);
          setProcessingStep(currentStep);
          currentStep++;
          timer = setTimeout(processNextStep, 1500); // 1.5s per step for realistic feel
        } else {
          setViewState("result");
        }
      };

      timer = setTimeout(processNextStep, 500);
      return () => clearTimeout(timer);
    }
  }, [viewState]);

  const handleAction = (action: "save" | "email" | "discard") => {
    if (action === "save" || action === "email") {
      const newInvoice: InvoiceRecord = {
        id: `INV-2026-0${90 + invoices.length}`,
        customer: activePrompt?.includes("Techno") ? "Techno Mfg" : activePrompt?.includes("Prime") ? "Prime Corp" : "Global Parts",
        amount: "₹4,50,000",
        tax: "₹81,000",
        status: action === "email" ? "sent" : "pending",
        date: "Today",
      };
      setInvoices((prev) => [newInvoice, ...prev]);
    }
    setViewState("prompts");
    setActivePrompt(null);
  };

  return (
    <div className="space-y-8 pb-6">
      {/* Top Bar */}
      {(viewState === "prompts" || viewState === "chat") && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button
              variant={viewState === "chat" ? "default" : "outline"}
              size="sm"
              className="h-9 rounded-xl mr-2"
              onClick={() => setViewState(viewState === "chat" ? "prompts" : "chat")}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> AI Assistant
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="h-9 rounded-xl">
              <Upload className="w-4 h-4 mr-2" /> Upload Data
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl">
              <FileText className="w-4 h-4 mr-2" /> Export All
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewState === "prompts" && (
          <motion.div
            key="prompts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center"
          >
            {/* Header section matching the R&D Lab screenshot */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-1">Invoice Generation AI</h2>
              <p className="text-sm text-muted-foreground">GST-compliant invoices with automatic calculations</p>
            </div>

            {/* Prompts list */}
            <div className="w-full max-w-2xl space-y-3 mb-12">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-sm text-foreground/80 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Previous Invoices section */}
            <div className="w-full">
              <h3 className="text-sm font-semibold mb-4">Previous Generated Invoices</h3>
              <div className="rounded-xl border border-border overflow-hidden bg-background">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {["Invoice", "Customer", "Amount", "Tax", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left p-3 font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{inv.id}</td>
                        <td className="p-3">{inv.customer}</td>
                        <td className="p-3 font-medium">{inv.amount}</td>
                        <td className="p-3 text-muted-foreground">{inv.tax}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            inv.status === "paid" ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]"
                            : inv.status === "overdue" ? "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]"
                            : inv.status === "sent" ? "bg-blue-500/10 text-blue-500"
                            : "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{inv.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {viewState === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 relative">
              <Loader2 className="w-8 h-8 text-foreground animate-spin" />
            </div>
            <h3 className="text-lg font-medium mb-8">Processing Request</h3>

            <div className="w-full max-w-sm space-y-4">
              {[
                "Connecting to CRM data...",
                "Validating GST compliance...",
                "Generating PDF layout..."
              ].map((label, i) => {
                const isActive = i === processingStep;
                const isPast = i < processingStep;

                return (
                  <div key={i} className={`flex items-center gap-3 ${isPast ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewState === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex flex-col h-[70vh] min-h-[500px]"
          >
            <div className="flex-1 rounded-xl border border-border overflow-hidden bg-background">
              <AIChatWorkspace
                contextData={{
                  quotationsCount: 0,
                  invoicesCount: invoices.length,
                  qualityCount: 0,
                  productionCount: 0,
                  rndCount: 0,
                  documents: invoices.map(i => ({
                    id: i.id,
                    type: "invoice",
                    external_id: i.id,
                    customer: i.customer,
                    status: i.status,
                    total: parseInt(i.amount.replace(/[^0-9.-]+/g,"")),
                    created_at: i.date
                  }))
                }}
              />
            </div>
          </motion.div>
        )}

        {viewState === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center max-w-2xl mx-auto w-full"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-1">Invoice Generated Successfully</h2>
            <p className="text-sm text-muted-foreground mb-8">Flawless invoice ready for review</p>

            {/* Mock Invoice Preview */}
            <div className="w-full p-6 rounded-xl border border-border bg-background mb-8 shadow-sm">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold">INVOICE</h3>
                  <p className="text-sm text-muted-foreground">INV-2026-090</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Udyami Mfg Corp</p>
                  <p className="text-xs text-muted-foreground">GSTIN: 27AADCB2230M1Z2</p>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Billed To:</p>
                  <p className="text-sm font-medium">{activePrompt?.includes("Techno") ? "Techno Mfg" : activePrompt?.includes("Prime") ? "Prime Corp" : "Global Parts"}</p>
                  <p className="text-xs text-muted-foreground">Industrial Estate, Phase 1</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Date:</p>
                  <p className="text-sm font-medium">Today</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 w-full">
                <div className="flex justify-between text-sm py-2 border-b border-border font-medium">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span>Widget Components (500 units)</span>
                  <span>₹4,50,000</span>
                </div>
                <div className="flex justify-between text-sm py-1 text-muted-foreground">
                  <span>CGST (9%)</span>
                  <span>₹40,500</span>
                </div>
                <div className="flex justify-between text-sm py-1 text-muted-foreground">
                  <span>SGST (9%)</span>
                  <span>₹40,500</span>
                </div>
                <div className="flex justify-between text-base py-3 border-t border-border font-bold mt-4">
                  <span>Total Amount</span>
                  <span>₹5,31,000</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => handleAction("save")}
                className="flex-1 h-12 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" /> Save Invoice
              </Button>
              <Button
                onClick={() => handleAction("email")}
                className="flex-1 h-12 rounded-xl"
                variant="secondary"
              >
                <Mail className="w-4 h-4 mr-2" /> Email to anuppatil.asp29@gmail.com
              </Button>
              <Button
                onClick={() => handleAction("discard")}
                variant="destructive"
                className="h-12 px-6 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Discard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
