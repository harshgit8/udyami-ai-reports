import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Loader2, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentStep { label: string; agent: string; status: "pending" | "running" | "done"; }
interface NegotiationRound { round: number; ourOffer: string; supplierCounter: string; status: "accepted" | "countered"; }

const negotiations = [
  { supplier: "Reliance Polymers", material: "ABS Resin", initialPrice: "₹185/kg", finalPrice: "₹162/kg", savings: "12.4%", status: "completed", rounds: 4 },
  { supplier: "BASF India", material: "PA66 Pellets", initialPrice: "₹320/kg", finalPrice: "₹285/kg", savings: "10.9%", status: "completed", rounds: 3 },
  { supplier: "Sabic Materials", material: "PC Granules", initialPrice: "₹410/kg", finalPrice: null, savings: null, status: "in-progress", rounds: 2 },
  { supplier: "LG Chem", material: "PP Compound", initialPrice: "₹145/kg", finalPrice: "₹128/kg", savings: "11.7%", status: "completed", rounds: 5 },
];

export function NegotiationAgentsDetail() {
  const [viewState, setViewState] = useState<"overview" | "negotiating" | "result">("overview");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [rounds, setRounds] = useState<NegotiationRound[]>([]);
  const [activeNeg, setActiveNeg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleNegotiate = (supplier: string) => {
    setActiveNeg(supplier); setViewState("negotiating"); setRounds([]);
    setAgentSteps([
      { label: "Loading supplier history & pricing data", agent: "SupplierProfiler", status: "pending" },
      { label: "Setting negotiation parameters", agent: "StrategyPlanner", status: "pending" },
      { label: "Running automated negotiation rounds", agent: "NegotiationBot", status: "pending" },
      { label: "Evaluating final offer vs benchmark", agent: "DealEvaluator", status: "pending" },
    ]);
  };

  useEffect(() => {
    if (viewState !== "negotiating") return;
    let step = 0;
    const mockRounds: NegotiationRound[] = [
      { round: 1, ourOffer: "₹350/kg", supplierCounter: "₹400/kg", status: "countered" },
      { round: 2, ourOffer: "₹365/kg", supplierCounter: "₹390/kg", status: "countered" },
      { round: 3, ourOffer: "₹375/kg", supplierCounter: "₹380/kg", status: "countered" },
      { round: 4, ourOffer: "₹378/kg", supplierCounter: "₹378/kg", status: "accepted" },
    ];
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        if (step === 2) { let r = 0; const ri = setInterval(() => { if (r < mockRounds.length) { setRounds(prev => [...prev, mockRounds[r]]); r++; } else clearInterval(ri); }, 600); }
        step++; timerRef.current = setTimeout(run, 1200);
      } else {
        setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
        timerRef.current = setTimeout(() => setViewState("result"), 500);
      }
    };
    timerRef.current = setTimeout(run, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center"><Handshake className="w-6 h-6" /></div>
              <div><h2 className="text-lg font-semibold">Auto-Negotiation Agents</h2><p className="text-xs text-muted-foreground">AI negotiates with suppliers · {negotiations.filter(n => n.status === "completed").length} deals closed</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[{ label: "Total Savings", value: "₹2.4L", color: "text-[hsl(142,71%,45%)]" }, { label: "Avg Saving", value: "11.7%" }, { label: "Active", value: "1" }].map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/30 text-center"><p className={`text-xl font-bold ${m.color || ""}`}>{m.value}</p><p className="text-[10px] text-muted-foreground mt-1">{m.label}</p></div>
              ))}
            </div>
            <div className="space-y-2.5">
              {negotiations.map((n, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl border border-border hover:border-foreground/10 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {n.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : <Clock className="w-4 h-4 text-[hsl(38,92%,50%)] animate-pulse" />}
                      <div><p className="text-sm font-semibold">{n.supplier}</p><p className="text-xs text-muted-foreground">{n.material} · {n.rounds} rounds</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-xs text-muted-foreground line-through">{n.initialPrice}</p><p className="text-sm font-bold">{n.finalPrice || "Pending"}</p></div>
                      {n.savings && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]">-{n.savings}</span>}
                      {n.status === "in-progress" && <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => handleNegotiate(n.supplier)}>Continue</Button>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {viewState === "negotiating" && (
          <motion.div key="negotiating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-foreground/60" />
            <h3 className="text-lg font-medium mb-2">Negotiating with {activeNeg}</h3>
            <p className="text-xs text-muted-foreground mb-6">AI agent conducting automated rounds</p>
            <div className="w-full max-w-lg space-y-3 mb-6">
              {agentSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${step.status === "running" ? "border-foreground/20 bg-muted/30" : step.status === "done" ? "border-border opacity-60" : "border-transparent opacity-30"}`}>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {step.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : step.status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                  <div><p className="text-sm font-medium">{step.label}</p><p className="text-[10px] text-muted-foreground">Agent: {step.agent}</p></div>
                </div>
              ))}
            </div>
            {rounds.length > 0 && (
              <div className="w-full max-w-lg">
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Rounds</h4>
                <div className="space-y-2">
                  {rounds.map(r => (
                    <motion.div key={r.round} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-2.5 rounded-lg border border-border text-xs flex items-center justify-between">
                      <span className="font-medium">Round {r.round}</span><span>Our: {r.ourOffer}</span><span>Theirs: {r.supplierCounter}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status === "accepted" ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" : "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]"}`}>{r.status}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        {viewState === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-[hsl(142,71%,45%)]" /></div>
            <h2 className="text-xl font-semibold mb-1">Deal Closed!</h2>
            <p className="text-sm text-muted-foreground mb-6">{activeNeg} — Final: ₹378/kg (7.8% savings)</p>
            <Button variant="outline" onClick={() => { setViewState("overview"); setActiveNeg(null); }} className="rounded-xl">← Back</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
