import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle2, Loader2, Save, History, Eye, Trash2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchGrounding, runGroundedAi } from "@/lib/orchestratorGrounding";

interface QuoteRecord {
  id: string;
  customer: string;
  product: string;
  qty: number;
  total: string;
  margin: string;
  status: string;
  date: string;
  rawData?: Record<string, unknown>;
}

interface AgentStep {
  label: string;
  agent: string;
  status: "pending" | "running" | "done";
}

export function QuotationGeneratorDetail() {
  const [viewState, setViewState] = useState<"chat" | "processing" | "result" | "history">("chat");
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [quotationInputs, setQuotationInputs] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [savedDocs, setSavedDocs] = useState<QuoteRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<QuoteRecord | null>(null);
  const [generatedQuote, setGeneratedQuote] = useState<any>(null);
  const [validationError, setValidationError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [resResult, resInput] = await Promise.all([
        supabase.from("quotationresult").select("*").order("created_at", { ascending: false }),
        supabase.from("quotation").select("*").order("created_at", { ascending: false }),
      ]);
      if (resResult.data) {
        setQuotes(resResult.data.map(d => ({
          id: d.quote_id || `QT-${d.id}`,
          customer: d.customer || "—",
          product: d.product || "—",
          qty: d.quantity || 0,
          total: `₹${Number(d.grand_total || 0).toLocaleString("en-IN")}`,
          margin: `${d.profit_margin || 0}%`,
          status: "sent",
          date: d.valid_until || "—",
          rawData: d as unknown as Record<string, unknown>,
        })));
      }
      if (resInput.data) setQuotationInputs(resInput.data);
    }
    load();
    const stored = sessionStorage.getItem("udyami-saved-quotes");
    if (stored) setSavedDocs(JSON.parse(stored));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const validateInput = (input: string): { valid: boolean; customer?: string; product?: string; qty?: number; error?: string } => {
    const lower = input.toLowerCase();
    // Must reference a real customer or product from the DB
    const knownCustomers = quotationInputs.map(q => q.customer?.toLowerCase()).filter(Boolean);
    const knownProducts = quotationInputs.map(q => q.product_type?.toLowerCase()).filter(Boolean);
    const allCustomers = [...new Set([...knownCustomers, ...quotes.map(q => q.customer.toLowerCase())])];

    const foundCustomer = allCustomers.find(c => lower.includes(c));
    if (!foundCustomer && !lower.match(/\b(quote|quotation|price|pricing|cost|estimate)\b/i)) {
      return { valid: false, error: "Please mention a customer name or ask about quotation/pricing. I can only generate quotes based on existing data." };
    }

    // Extract quantity
    const qtyMatch = input.match(/(\d+)\s*(units?|pcs?|pieces?|qty|quantity)?/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : undefined;

    // Check for unreasonable quantities
    if (qty && qty > 100000) {
      return { valid: false, error: "Quantity exceeds maximum batch size of 100,000 units. Please specify a smaller quantity." };
    }

    // Find best matching product
    const foundProduct = knownProducts.find(p => lower.includes(p));

    return {
      valid: true,
      customer: foundCustomer ? quotationInputs.find(q => q.customer?.toLowerCase() === foundCustomer)?.customer || quotes.find(q => q.customer.toLowerCase() === foundCustomer)?.customer : undefined,
      product: foundProduct ? quotationInputs.find(q => q.product_type?.toLowerCase() === foundProduct)?.product_type : undefined,
      qty,
    };
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setValidationError("");

    const validation = validateInput(userMsg);
    if (!validation.valid) {
      setValidationError(validation.error || "");
      setChatMessages(prev => [...prev, {
        role: "ai",
        content: `⚠️ ${validation.error}\n\n**Available customers:** ${[...new Set(quotationInputs.map(q => q.customer).filter(Boolean))].join(", ")}\n\n**Available products:** ${[...new Set(quotationInputs.map(q => q.product_type).filter(Boolean))].join(", ")}`
      }]);
      return;
    }

    const matchingInput = validation.customer
      ? quotationInputs.find(q => q.customer?.toLowerCase() === validation.customer?.toLowerCase())
      : quotationInputs[0];

    const matchingResult = validation.customer
      ? quotes.find(q => q.customer.toLowerCase() === (validation.customer || "").toLowerCase())
      : quotes[0];

    if (!matchingInput && !matchingResult) {
      setChatMessages(prev => [...prev, {
        role: "ai",
        content: `I couldn't find matching data in the database. Here are the available options:\n\n**Customers:** ${[...new Set(quotationInputs.map(q => q.customer).filter(Boolean))].join(", ") || "No data yet"}\n\n**Products:** ${[...new Set(quotationInputs.map(q => q.product_type).filter(Boolean))].join(", ") || "No data yet"}\n\nTry: *"Generate quotation for Quantum Materials — 500 units widget_a"*`
      }]);
      return;
    }

    const qty = validation.qty || matchingInput?.quantity || 500;
    const materialCostKg = matchingInput?.material_cost_kg || 120;
    const weightPerUnit = matchingInput?.weight_per_unit_kg || 0.35;
    const productionRate = matchingInput?.production_rate || 60;
    const setupHours = matchingInput?.setup_time_hours || 1.5;
    const materialCost = Math.round(qty * weightPerUnit * materialCostKg);
    const productionHours = Math.ceil(qty / productionRate) + setupHours;
    const productionCost = Math.round(productionHours * 1500);
    const qualityCost = Math.round(qty * 5);
    const riskPremium = matchingInput?.risk_level === "high" ? Math.round(materialCost * 0.05) : matchingInput?.risk_level === "medium" ? Math.round(materialCost * 0.02) : 0;
    const subtotal = materialCost + productionCost + qualityCost + riskPremium;
    const profitMargin = matchingInput?.priority === "critical" ? 28 : matchingInput?.priority === "high" ? 25 : 20;
    const profitAmount = Math.round(subtotal * profitMargin / 100);
    const totalBeforeTax = subtotal + profitAmount;
    const gst = Math.round(totalBeforeTax * 0.18);
    const grandTotal = totalBeforeTax + gst;

    setGeneratedQuote({
      id: `QT-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      customer: matchingInput?.customer || validation.customer || "—",
      product: `${matchingInput?.product_type || "widget"} (${matchingInput?.material_formulation || "Standard"})`,
      application: matchingInput?.application || "General",
      qty,
      materialCost,
      productionCost,
      qualityCost,
      riskPremium,
      subtotal,
      profitMargin,
      profitAmount,
      totalBeforeTax,
      gst,
      grandTotal,
      unitPrice: Math.round(grandTotal / qty * 100) / 100,
      leadTime: matchingResult?.rawData?.lead_time_days || Math.ceil(productionHours / 8) + 3,
      paymentTerms: matchingResult?.rawData?.payment_terms || matchingInput?.priority === "critical" ? "40% advance, 60% on delivery" : "Net 30",
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      compliance: matchingInput?.compliance || "RoHS",
      ul94: matchingInput?.ul94_rating || "HB",
      sourceRequest: matchingInput?.quote_request_id || "—",
      machine: matchingInput?.machine || "—",
    });

    setChatMessages(prev => [...prev, {
      role: "ai",
      content: `✅ Found matching data for **${matchingInput?.customer || validation.customer}**.\n\n📋 Source: Request **${matchingInput?.quote_request_id || "—"}** | Product: **${matchingInput?.product_type || "widget"}** | Application: **${matchingInput?.application || "General"}**\n\nGenerating optimized quotation for **${qty} units**...`
    }]);

    setViewState("processing");
    setAgentSteps([
      { label: `Loading cost data for ${matchingInput?.material_formulation || "material"} @ ₹${materialCostKg}/kg`, agent: "CostAnalyzer", status: "pending" },
      { label: `Calculating production on ${matchingInput?.machine || "machine"} @ ${productionRate} units/hr`, agent: "CapacityPlanner", status: "pending" },
      { label: `Applying ${matchingInput?.compliance || "RoHS"} compliance & ${matchingInput?.risk_level || "low"} risk premium`, agent: "ComplianceEngine", status: "pending" },
      { label: "Generating final quotation with GST", agent: "DocumentCrafter", status: "pending" },
    ]);

    try {
      const grounding = await fetchGrounding("quotation", userMsg);
      const aiOutput = await runGroundedAi({
        orchestrator: "Quotation Generator AI",
        userQuery: userMsg,
        instructions: "Generate the best possible quotation response grounded in quotation request/result data. Include commercial recommendation and a Sources / Reference IDs section.",
        grounding,
      });
      setChatMessages(prev => [...prev, { role: "ai", content: aiOutput }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "ai", content: `⚠️ Grounded quotation insight could not be generated: ${error instanceof Error ? error.message : "Unknown error"}` }]);
    }
  };

  useEffect(() => {
    if (viewState !== "processing") return;
    let step = 0;
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        step++;
        timerRef.current = setTimeout(run, 1100);
      } else {
        setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
        timerRef.current = setTimeout(() => setViewState("result"), 500);
      }
    };
    timerRef.current = setTimeout(run, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);

  const handleAction = (action: "save" | "discard") => {
    if (action === "save" && generatedQuote) {
      const doc: QuoteRecord = {
        id: generatedQuote.id,
        customer: generatedQuote.customer,
        product: generatedQuote.product,
        qty: generatedQuote.qty,
        total: `₹${generatedQuote.grandTotal.toLocaleString("en-IN")}`,
        margin: `${generatedQuote.profitMargin}%`,
        status: "saved",
        date: new Date().toISOString().slice(0, 10),
      };
      const updated = [doc, ...savedDocs].slice(0, 10);
      setSavedDocs(updated);
      sessionStorage.setItem("udyami-saved-quotes", JSON.stringify(updated));
      setChatMessages(prev => [...prev, { role: "ai", content: `✅ Quotation **${generatedQuote.id}** saved successfully. Grand Total: **₹${generatedQuote.grandTotal.toLocaleString("en-IN")}**` }]);
    }
    setViewState("chat");
  };

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Quotation Generator AI</h2>
                  <p className="text-xs text-muted-foreground">Chat to generate quotes · {quotes.length} quotations · {quotationInputs.length} requests in DB</p>
                </div>
              </div>
              {savedDocs.length > 0 && (
                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5" onClick={() => setViewState("history")}>
                  <History className="w-3.5 h-3.5" /> Saved ({savedDocs.length})
                </Button>
              )}
            </div>

            {/* Chat Area */}
            <div className="rounded-xl border border-border bg-muted/10 mb-4 overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Ask me to generate a quotation</p>
                    <p className="text-[10px] text-muted-foreground mt-1">I'll use real data from your database to create accurate quotes</p>
                    <div className="mt-4 space-y-2">
                      {[
                        "Generate quotation for Quantum Materials — 500 units widget_a",
                        "Create quote for PowerCable Co — 1000 units widget_b",
                        "Price estimate for Apex Plastics — 750 units widget_c",
                      ].map((prompt, i) => (
                        <button key={i} onClick={() => { setChatInput(prompt); }}
                          className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border"}`}>
                      {msg.content.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : <span key={j}>{part}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="e.g. Generate quotation for Quantum Materials — 500 units widget_a"
                  className="text-xs"
                  onKeyDown={e => { if (e.key === "Enter") handleChatSubmit(); }}
                />
                <Button size="sm" onClick={handleChatSubmit} className="gap-1.5 rounded-xl shrink-0">
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
              </div>
            </div>

            {/* Recent quotations table */}
            <h3 className="text-sm font-semibold mb-3">Quotations from Database</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/50">
                  {["Quote ID", "Customer", "Product", "Qty", "Total", "Margin", "Valid Until"].map(h => (
                    <th key={h} className="text-left p-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium">{q.id}</td>
                      <td className="p-3">{q.customer}</td>
                      <td className="p-3 text-muted-foreground">{q.product}</td>
                      <td className="p-3">{q.qty}</td>
                      <td className="p-3 font-medium">{q.total}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]">{q.margin}</span></td>
                      <td className="p-3 text-muted-foreground">{q.date}</td>
                    </tr>
                  ))}
                  {quotes.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No quotations in database yet</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {viewState === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-8">Agents Generating Quotation</h3>
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

        {viewState === "result" && generatedQuote && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Quotation Generated</h2>
                <p className="text-xs text-muted-foreground">{generatedQuote.id} · Source: {generatedQuote.sourceRequest} · Valid until {generatedQuote.validUntil}</p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-background mb-6">
              <div className="flex justify-between mb-6 pb-4 border-b border-border">
                <div>
                  <h3 className="text-base font-bold">QUOTATION</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{generatedQuote.id}</p>
                  <p className="text-[10px] text-muted-foreground">Machine: {generatedQuote.machine} · UL94: {generatedQuote.ul94} · {generatedQuote.compliance}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{generatedQuote.customer}</p>
                  <p className="text-xs text-muted-foreground">{generatedQuote.product} × {generatedQuote.qty}</p>
                  <p className="text-[10px] text-muted-foreground">Application: {generatedQuote.application}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {[
                  ["Material Cost", generatedQuote.materialCost],
                  ["Production Cost", generatedQuote.productionCost],
                  ["Quality Cost", generatedQuote.qualityCost],
                  ...(generatedQuote.riskPremium > 0 ? [["Risk Premium", generatedQuote.riskPremium]] : []),
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span>₹{(value as number).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 border-t border-border/50"><span>Subtotal</span><span className="font-medium">₹{generatedQuote.subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Profit ({generatedQuote.profitMargin}%)</span><span>₹{generatedQuote.profitAmount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">GST (18%)</span><span>₹{generatedQuote.gst.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between py-3 border-t border-border font-bold text-base"><span>Grand Total</span><span>₹{generatedQuote.grandTotal.toLocaleString("en-IN")}</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                {[
                  ["Unit Price", `₹${generatedQuote.unitPrice.toLocaleString("en-IN")}`],
                  ["Lead Time", `${generatedQuote.leadTime} days`],
                  ["Payment", generatedQuote.paymentTerms],
                ].map(([label, value]) => (
                  <div key={label} className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-[11px] font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => handleAction("save")} className="flex-1 h-11 rounded-xl gap-2">
                <Save className="w-4 h-4" /> Save Quotation
              </Button>
              <Button onClick={() => handleAction("discard")} variant="ghost" className="h-11 px-4 rounded-xl text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {viewState === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5" /> Saved Quotations</h2>
              <Button variant="ghost" size="sm" onClick={() => { setViewState("chat"); setSelectedDoc(null); }}>← Back</Button>
            </div>
            {selectedDoc ? (
              <div className="p-6 rounded-xl border border-border bg-background">
                <h3 className="font-bold mb-3">{selectedDoc.id}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries({ Customer: selectedDoc.customer, Product: selectedDoc.product, Quantity: selectedDoc.qty, Total: selectedDoc.total, Margin: selectedDoc.margin, Date: selectedDoc.date }).map(([k, v]) => (
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
                    <div className="text-left">
                      <p className="text-sm font-medium">{doc.id}</p>
                      <p className="text-xs text-muted-foreground">{doc.customer} · {doc.product} × {doc.qty}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{doc.total}</span>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {savedDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No saved quotations yet.</p>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
