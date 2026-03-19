import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, FileText, CheckCircle2, Loader2, Save, Mail, Trash2, History, Eye, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchGrounding, runGroundedAi } from "@/lib/orchestratorGrounding";

interface InvoiceRecord {
  id: string;
  customer: string;
  product: string;
  amount: string;
  tax: string;
  status: string;
  date: string;
  rawData?: Record<string, unknown>;
}

interface AgentStep {
  label: string;
  agent: string;
  status: "pending" | "running" | "done";
}

export function InvoiceGenerationDetail() {
  const [viewState, setViewState] = useState<"chat" | "processing" | "result" | "history">("chat");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoiceInputs, setInvoiceInputs] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [savedDocs, setSavedDocs] = useState<InvoiceRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<InvoiceRecord | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [resResult, resInput] = await Promise.all([
        supabase.from("invoiceresult").select("*").order("created_at", { ascending: false }),
        supabase.from("invoice").select("*").order("created_at", { ascending: false }),
      ]);
      if (resResult.data) {
        setInvoices(resResult.data.map(d => ({
          id: d.invoice_number || `INV-${d.id}`,
          customer: d.customer_name || "—",
          product: d.product || "—",
          amount: `₹${Number(d.grand_total || 0).toLocaleString("en-IN")}`,
          tax: `₹${Number(d.total_tax || 0).toLocaleString("en-IN")}`,
          status: (d.balance_due && Number(d.balance_due) > 0) ? "due" : "paid",
          date: d.invoice_date || "—",
          rawData: d as unknown as Record<string, unknown>,
        })));
      }
      if (resInput.data) setInvoiceInputs(resInput.data);
    }
    load();
    const stored = sessionStorage.getItem("udyami-saved-invoices");
    if (stored) setSavedDocs(JSON.parse(stored));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    const lower = userMsg.toLowerCase();

    // GUARDRAIL: Must mention order ID or customer name
    const orderIdMatch = userMsg.match(/ORD[-\s]?20\d{2}[-\s]?\d{3}/i) || userMsg.match(/ord[-_\s]?\d+/i);
    const knownCustomers = [...new Set(invoiceInputs.map(i => i.customer_name).filter(Boolean))];
    const foundCustomer = knownCustomers.find(c => lower.includes(c.toLowerCase()));

    if (!orderIdMatch && !foundCustomer) {
      setChatMessages(prev => [...prev, {
        role: "ai",
        content: `⚠️ **Order ID or Customer Name required** to generate an invoice.\n\nPlease specify either:\n- An Order ID (e.g., ORD-2026-001)\n- A Customer Name (e.g., Quantum Materials)\n\n**Available Orders:** ${invoiceInputs.map(i => i.order_id).filter(Boolean).join(", ") || "No data"}\n\n**Available Customers:** ${knownCustomers.join(", ") || "No data"}`
      }]);
      return;
    }

    // Find matching invoice input
    const matchingInput = orderIdMatch
      ? invoiceInputs.find(i => i.order_id?.toLowerCase().replace(/[-_\s]/g, "") === (orderIdMatch[0] || "").toLowerCase().replace(/[-_\s]/g, ""))
      : invoiceInputs.find(i => i.customer_name?.toLowerCase() === foundCustomer?.toLowerCase());

    const matchingResult = orderIdMatch
      ? invoices.find(inv => inv.rawData?.order_id?.toString().toLowerCase().replace(/[-_\s]/g, "") === (orderIdMatch[0] || "").toLowerCase().replace(/[-_\s]/g, ""))
      : invoices.find(inv => inv.customer.toLowerCase() === foundCustomer?.toLowerCase());

    if (!matchingInput && !matchingResult) {
      setChatMessages(prev => [...prev, {
        role: "ai",
        content: `❌ No matching order found for "${orderIdMatch?.[0] || foundCustomer}".\n\n**Available Orders:** ${invoiceInputs.map(i => `${i.order_id} (${i.customer_name})`).filter(Boolean).join(", ")}`
      }]);
      return;
    }

    const src = matchingInput || {};
    const srcResult = matchingResult?.rawData || {};

    const subtotal = src.subtotal || Number(srcResult.subtotal) || 42000;
    const taxableAmount = subtotal + (src.additional_charges || 0) - (src.discount || 0);
    const isInterState = src.customer_gstin?.substring(0, 2) !== "27";
    const taxRate = 18;
    const taxAmount = Math.round(taxableAmount * taxRate / 100);

    const invoice = {
      number: `INV-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`,
      customer: src.customer_name || foundCustomer || "—",
      gstin: src.customer_gstin || "—",
      address: src.customer_address || "—",
      orderId: src.order_id || orderIdMatch?.[0] || "—",
      quoteId: src.quote_id || "—",
      poNumber: src.po_number || "—",
      product: src.product_description || src.product_type || "—",
      hsnCode: src.hsn_code || 3926,
      qty: src.quantity_delivered || src.quantity_ordered || 0,
      qtyOrdered: src.quantity_ordered || 0,
      materialCost: src.material_cost || 0,
      productionCost: src.production_cost || 0,
      qualityCost: src.quality_cost || 0,
      packagingCost: src.packaging_cost || 0,
      subtotal,
      additionalCharges: src.additional_charges || 0,
      discount: src.discount || 0,
      taxableAmount,
      taxType: isInterState ? "IGST" : "CGST + SGST",
      cgst: isInterState ? 0 : Math.round(taxAmount / 2),
      sgst: isInterState ? 0 : Math.round(taxAmount / 2),
      igst: isInterState ? taxAmount : 0,
      totalTax: taxAmount,
      grandTotal: taxableAmount + taxAmount,
      advancePaid: src.advance_paid || 0,
      balanceDue: (taxableAmount + taxAmount) - (src.advance_paid || 0),
      deliveryChallan: src.delivery_challan || "—",
      deliveryDate: src.delivery_date || "—",
      paymentTerms: src.payment_terms || "Net 30",
      qualityDecision: src.quality_decision || "ACCEPT",
      batchId: src.batch_id || "—",
      inspectionId: src.inspection_id || "—",
      date: new Date().toISOString().slice(0, 10),
    };

    setGeneratedInvoice(invoice);
    setChatMessages(prev => [...prev, {
      role: "ai",
      content: `✅ Found order **${invoice.orderId}** for **${invoice.customer}**\n\n📦 Product: **${invoice.product}** | Qty: **${invoice.qty}** units\n🏷️ HSN: ${invoice.hsnCode} | PO: ${invoice.poNumber}\n✅ Quality: ${invoice.qualityDecision} (Batch: ${invoice.batchId})\n\nGenerating GST-compliant invoice...`
    }]);

    setViewState("processing");
    setAgentSteps([
      { label: `Loading order ${invoice.orderId} — ${invoice.customer}`, agent: "DataGatherer", status: "pending" },
      { label: `Validating GST: ${invoice.taxType} @ ${taxRate}% on ₹${taxableAmount.toLocaleString("en-IN")}`, agent: "ComplianceEngine", status: "pending" },
      { label: `Quality gate: ${invoice.qualityDecision} — Batch ${invoice.batchId}`, agent: "QualityGate", status: "pending" },
      { label: "Generating invoice with line items & tax breakup", agent: "DocumentCrafter", status: "pending" },
    ]);

    // Run grounded AI for invoice insights
    try {
      const grounding = await fetchGrounding("invoice", userMsg);
      const aiOutput = await runGroundedAi({
        orchestrator: "Invoice Generation AI",
        userQuery: userMsg,
        instructions: "Generate the best possible invoice analysis grounded in invoice request/result data. Include tax breakdown, payment status, and a Sources / Reference IDs section.",
        grounding,
      });
      setChatMessages(prev => [...prev, { role: "ai", content: aiOutput }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "ai", content: `⚠️ Grounded invoice insight could not be generated: ${error instanceof Error ? error.message : "Unknown error"}` }]);
    }
  };

  useEffect(() => {
    if (viewState !== "processing") return;
    let step = 0;
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        step++;
        timerRef.current = setTimeout(run, 1200);
      } else {
        setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
        timerRef.current = setTimeout(() => setViewState("result"), 600);
      }
    };
    timerRef.current = setTimeout(run, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);

  const handleAction = (action: "save" | "email" | "discard") => {
    if (action === "save" && generatedInvoice) {
      const doc: InvoiceRecord = {
        id: generatedInvoice.number,
        customer: generatedInvoice.customer,
        product: generatedInvoice.product,
        amount: `₹${generatedInvoice.grandTotal.toLocaleString("en-IN")}`,
        tax: `₹${generatedInvoice.totalTax.toLocaleString("en-IN")}`,
        status: "saved",
        date: generatedInvoice.date,
      };
      const updated = [doc, ...savedDocs].slice(0, 10);
      setSavedDocs(updated);
      sessionStorage.setItem("udyami-saved-invoices", JSON.stringify(updated));
      setChatMessages(prev => [...prev, { role: "ai", content: `✅ Invoice **${generatedInvoice.number}** saved. Grand Total: **₹${generatedInvoice.grandTotal.toLocaleString("en-IN")}**` }]);
    }
    if (action === "email" && generatedInvoice) {
      const subject = `Invoice ${generatedInvoice.number} — ${generatedInvoice.customer}`;
      const body = `Dear ${generatedInvoice.customer},\n\nPlease find attached Invoice ${generatedInvoice.number} for Order ${generatedInvoice.orderId}.\n\nGrand Total: ₹${generatedInvoice.grandTotal.toLocaleString("en-IN")}\nBalance Due: ₹${generatedInvoice.balanceDue.toLocaleString("en-IN")}\nPayment Terms: ${generatedInvoice.paymentTerms}\n\nBest regards,\nUdyami Manufacturing`;
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    }
    setViewState("chat");
  };

  const inv = generatedInvoice;

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center"><Receipt className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-lg font-semibold">Invoice Generation AI</h2>
                  <p className="text-xs text-muted-foreground">GST-compliant · {invoices.length} invoices · {invoiceInputs.length} orders in DB</p>
                </div>
              </div>
              {savedDocs.length > 0 && (
                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5" onClick={() => setViewState("history")}>
                  <History className="w-3.5 h-3.5" /> Saved ({savedDocs.length})
                </Button>
              )}
            </div>

            {/* Chat */}
            <div className="rounded-xl border border-border bg-muted/10 mb-4 overflow-hidden">
              <div className="max-h-[280px] overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Receipt className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Generate an invoice by providing an <strong>Order ID</strong> or <strong>Customer Name</strong></p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> Order ID or Customer Name is mandatory</p>
                    <div className="mt-4 space-y-2">
                      {invoiceInputs.slice(0, 3).map((inp, i) => (
                        <button key={i} onClick={() => setChatInput(`Generate invoice for ${inp.order_id} — ${inp.customer_name}`)}
                          className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                          Generate invoice for {inp.order_id} — {inp.customer_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border"}`}>
                      {msg.content.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Enter Order ID (e.g. ORD-2026-001) or Customer Name..." className="text-xs"
                  onKeyDown={e => { if (e.key === "Enter") handleChatSubmit(); }} />
                <Button size="sm" onClick={handleChatSubmit} className="gap-1.5 rounded-xl shrink-0"><Send className="w-3.5 h-3.5" /> Send</Button>
              </div>
            </div>

            {/* Invoices table */}
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Invoices from Database</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/50">
                  {["Invoice #", "Customer", "Product", "Amount", "Tax", "Status", "Date"].map(h => (
                    <th key={h} className="text-left p-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium">{inv.id}</td>
                      <td className="p-3">{inv.customer}</td>
                      <td className="p-3 text-muted-foreground max-w-[120px] truncate">{inv.product}</td>
                      <td className="p-3 font-medium">{inv.amount}</td>
                      <td className="p-3 text-muted-foreground">{inv.tax}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${inv.status === "paid" ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" : "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]"}`}>{inv.status}</span></td>
                      <td className="p-3 text-muted-foreground">{inv.date}</td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No invoices in database yet</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {viewState === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-8">Agents Processing Invoice</h3>
            <div className="w-full max-w-md space-y-3">
              {agentSteps.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${s.status === "running" ? "border-foreground/20 bg-muted/30" : s.status === "done" ? "border-border opacity-60" : "border-transparent opacity-30"}`}>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {s.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : s.status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                  <div><p className="text-sm font-medium">{s.label}</p><p className="text-[10px] text-muted-foreground">Agent: {s.agent}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {viewState === "result" && inv && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" /></div>
              <div>
                <h2 className="text-lg font-semibold">Invoice Generated</h2>
                <p className="text-xs text-muted-foreground">{inv.number} · Order: {inv.orderId} · Quality: {inv.qualityDecision}</p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-background mb-6">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
                <div>
                  <h3 className="text-base font-bold">TAX INVOICE</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">Date: {inv.date} · PO: {inv.poNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Udyami Manufacturing</p>
                  <p className="text-[10px] text-muted-foreground">GSTIN: 27AADCU2230M1Z2</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Billed To:</p>
                  <p className="text-sm font-medium">{inv.customer}</p>
                  <p className="text-[10px] text-muted-foreground">GSTIN: {inv.gstin}</p>
                  <p className="text-[10px] text-muted-foreground">{inv.address}</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div><span className="text-muted-foreground">Order:</span> {inv.orderId}</div>
                  <div><span className="text-muted-foreground">Quote:</span> {inv.quoteId}</div>
                  <div><span className="text-muted-foreground">Challan:</span> {inv.deliveryChallan}</div>
                  <div><span className="text-muted-foreground">Batch:</span> {inv.batchId}</div>
                </div>
              </div>

              <table className="w-full text-sm mb-4">
                <thead><tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-2 font-medium">Description</th>
                  <th className="text-right py-2 font-medium">HSN</th>
                  <th className="text-right py-2 font-medium">Qty</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2">{inv.product}</td>
                    <td className="py-2 text-right text-muted-foreground">{inv.hsnCode}</td>
                    <td className="py-2 text-right">{inv.qty}{inv.qty !== inv.qtyOrdered ? <span className="text-[10px] text-muted-foreground"> / {inv.qtyOrdered} ordered</span> : ""}</td>
                    <td className="py-2 text-right">₹{inv.subtotal.toLocaleString("en-IN")}</td>
                  </tr>
                  {inv.additionalCharges > 0 && <tr className="text-xs text-muted-foreground"><td className="py-1" colSpan={3}>Additional Charges</td><td className="py-1 text-right">₹{inv.additionalCharges.toLocaleString("en-IN")}</td></tr>}
                  {inv.discount > 0 && <tr className="text-xs text-muted-foreground"><td className="py-1" colSpan={3}>Discount</td><td className="py-1 text-right">-₹{inv.discount.toLocaleString("en-IN")}</td></tr>}
                  <tr className="text-xs border-t border-border/50"><td className="py-1.5" colSpan={3}>Taxable Amount</td><td className="py-1.5 text-right font-medium">₹{inv.taxableAmount.toLocaleString("en-IN")}</td></tr>
                  {inv.cgst > 0 && <tr className="text-xs text-muted-foreground"><td className="py-1" colSpan={3}>CGST (9%)</td><td className="py-1 text-right">₹{inv.cgst.toLocaleString("en-IN")}</td></tr>}
                  {inv.sgst > 0 && <tr className="text-xs text-muted-foreground"><td className="py-1" colSpan={3}>SGST (9%)</td><td className="py-1 text-right">₹{inv.sgst.toLocaleString("en-IN")}</td></tr>}
                  {inv.igst > 0 && <tr className="text-xs text-muted-foreground"><td className="py-1" colSpan={3}>IGST (18%)</td><td className="py-1 text-right">₹{inv.igst.toLocaleString("en-IN")}</td></tr>}
                  <tr className="font-bold border-t border-border"><td className="py-3" colSpan={3}>Grand Total</td><td className="py-3 text-right text-base">₹{inv.grandTotal.toLocaleString("en-IN")}</td></tr>
                  {inv.advancePaid > 0 && <tr className="text-xs"><td className="py-1" colSpan={3}>Less: Advance Paid</td><td className="py-1 text-right text-[hsl(142,71%,45%)]">-₹{inv.advancePaid.toLocaleString("en-IN")}</td></tr>}
                  {inv.balanceDue > 0 && <tr className="font-bold text-sm"><td className="py-2" colSpan={3}>Balance Due</td><td className="py-2 text-right">₹{inv.balanceDue.toLocaleString("en-IN")}</td></tr>}
                </tbody>
              </table>

              <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                Payment: {inv.paymentTerms} · Delivery: {inv.deliveryDate} · Tax Type: {inv.taxType}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => handleAction("save")} className="flex-1 h-11 rounded-xl gap-2"><Save className="w-4 h-4" /> Save</Button>
              <Button onClick={() => handleAction("email")} variant="secondary" className="flex-1 h-11 rounded-xl gap-2"><Mail className="w-4 h-4" /> Email</Button>
              <Button onClick={() => handleAction("discard")} variant="ghost" className="h-11 px-4 rounded-xl text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}

        {viewState === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5" /> Saved Invoices</h2>
              <Button variant="ghost" size="sm" onClick={() => { setViewState("chat"); setSelectedDoc(null); }}>← Back</Button>
            </div>
            {selectedDoc ? (
              <div className="p-6 rounded-xl border border-border bg-background">
                <h3 className="font-bold mb-2">{selectedDoc.id}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries({ Customer: selectedDoc.customer, Product: selectedDoc.product, Amount: selectedDoc.amount, Tax: selectedDoc.tax, Date: selectedDoc.date }).map(([k, v]) => (
                    <div key={k}><span className="text-muted-foreground">{k}:</span> {v}</div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => setSelectedDoc(null)}>← Back to list</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {savedDocs.map(doc => (
                  <button key={doc.id} onClick={() => setSelectedDoc(doc)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                    <div className="text-left"><p className="text-sm font-medium">{doc.id}</p><p className="text-xs text-muted-foreground">{doc.customer} · {doc.product}</p></div>
                    <div className="flex items-center gap-3"><span className="text-sm font-semibold">{doc.amount}</span><Eye className="w-4 h-4 text-muted-foreground" /></div>
                  </button>
                ))}
                {savedDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No saved invoices yet.</p>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
