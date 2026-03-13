import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentStep { label: string; agent: string; status: "pending" | "running" | "done"; }

const recommendations = [
  { product: "Widget A (ABS)", confidence: 94, reason: "High repeat orders from Acme Corp & BuildCo. Machine M1 already configured.", efficiency: "+18%", changeover: "0 min", demand: "Rising" },
  { product: "Widget C (PP-Talc)", confidence: 87, reason: "3 pending orders totaling 800 units. Material in stock.", efficiency: "+12%", changeover: "15 min", demand: "Stable" },
  { product: "Widget E (PVC K70)", confidence: 82, reason: "New RFQ from PowerCable Co. Competitive pricing advantage.", efficiency: "+8%", changeover: "20 min", demand: "Growing" },
  { product: "Widget B (PA66-GF30)", confidence: 76, reason: "Seasonal demand spike expected in April.", efficiency: "+5%", changeover: "25 min", demand: "Seasonal" },
];

export function ProductionRecommendationDetail() {
  const [viewState, setViewState] = useState<"idle" | "analyzing" | "result">("idle");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleAnalyze = () => {
    setViewState("analyzing");
    setAgentSteps([
      { label: "Loading 90-day order history & demand patterns", agent: "HistoryAnalyzer", status: "pending" },
      { label: "Analyzing machine setup & changeover costs", agent: "SetupOptimizer", status: "pending" },
      { label: "Scoring products by margin × demand × readiness", agent: "RecommendationEngine", status: "pending" },
      { label: "Ranking recommendations by confidence score", agent: "ConfidenceRanker", status: "pending" },
    ]);
  };

  useEffect(() => {
    if (viewState !== "analyzing") return;
    let step = 0;
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        step++;
        timerRef.current = setTimeout(run, 900);
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
        {viewState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4"><Zap className="w-8 h-8" /></div>
            <h2 className="text-xl font-semibold mb-1">Production Recommendation</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">Netflix-style product recommendation based on order history, machine state, and market demand.</p>
            <Button onClick={handleAnalyze} className="gap-2 h-11 px-6 rounded-xl"><Zap className="w-4 h-4" /> Generate Recommendations</Button>
          </motion.div>
        )}
        {viewState === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-8">Analyzing Production Data</h3>
            <div className="w-full max-w-md space-y-3">
              {agentSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${step.status === "running" ? "border-foreground/20 bg-muted/30" : step.status === "done" ? "border-border opacity-60" : "border-transparent opacity-30"}`}>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {step.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : step.status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                  <div><p className="text-sm font-medium">{step.label}</p><p className="text-[10px] text-muted-foreground">Agent: {step.agent}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {viewState === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center"><TrendingUp className="w-5 h-5 text-[hsl(142,71%,45%)]" /></div>
                <div><h2 className="text-lg font-semibold">Top Recommendations</h2><p className="text-xs text-muted-foreground">Ranked by confidence · 90-day data</p></div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewState("idle")} className="rounded-xl">Refresh</Button>
            </div>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border ${i === 0 ? "border-[hsl(142,71%,45%/0.3)] bg-[hsl(142,71%,45%/0.03)]" : "border-border"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)] font-medium">TOP PICK</span>}
                        {r.product}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>
                    </div>
                    <div className="text-right"><p className="text-lg font-bold">{r.confidence}%</p><p className="text-[10px] text-muted-foreground">confidence</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="p-2 rounded-lg bg-muted/30 text-center text-xs"><p className="text-muted-foreground">Efficiency</p><p className="font-semibold text-[hsl(142,71%,45%)]">{r.efficiency}</p></div>
                    <div className="p-2 rounded-lg bg-muted/30 text-center text-xs"><p className="text-muted-foreground">Changeover</p><p className="font-semibold">{r.changeover}</p></div>
                    <div className="p-2 rounded-lg bg-muted/30 text-center text-xs"><p className="text-muted-foreground">Demand</p><p className="font-semibold">{r.demand}</p></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
