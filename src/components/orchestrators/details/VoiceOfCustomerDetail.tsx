import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ThumbsUp, ThumbsDown, Minus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentStep { label: string; agent: string; status: "pending" | "running" | "done"; }

const reviews = [
  { customer: "Acme Corp", product: "Widget A", sentiment: "positive", score: 4.8, feedback: "Consistent quality. Delivery on time. Will reorder." },
  { customer: "FastTrack Ltd", product: "Widget C", sentiment: "negative", score: 2.1, feedback: "Last batch had surface defects. Delayed by 3 days." },
  { customer: "BuildCo", product: "Widget A", sentiment: "positive", score: 4.5, feedback: "Good price point. Flame retardancy meets spec." },
  { customer: "PowerCable Co", product: "Widget E", sentiment: "neutral", score: 3.2, feedback: "Acceptable quality but packaging needs improvement." },
  { customer: "TechStart Inc", product: "Widget B", sentiment: "positive", score: 4.6, feedback: "High tensile strength. Perfect for our application." },
  { customer: "Global Mfg", product: "Widget C", sentiment: "negative", score: 1.8, feedback: "Color inconsistency across batches." },
];

export function VoiceOfCustomerDetail() {
  const [viewState, setViewState] = useState<"idle" | "analyzing" | "report">("idle");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleAnalyze = () => {
    setViewState("analyzing");
    setAgentSteps([
      { label: "Collecting customer feedback from all channels", agent: "FeedbackCollector", status: "pending" },
      { label: "Running NLP sentiment analysis", agent: "SentimentAnalyzer", status: "pending" },
      { label: "Identifying recurring complaint patterns", agent: "PatternDetector", status: "pending" },
      { label: "Generating improvement recommendations", agent: "InsightGenerator", status: "pending" },
    ]);
  };
  useEffect(() => {
    if (viewState !== "analyzing") return;
    let step = 0;
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        step++; timerRef.current = setTimeout(run, 900);
      } else {
        setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
        timerRef.current = setTimeout(() => setViewState("report"), 500);
      }
    };
    timerRef.current = setTimeout(run, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);
  const avgScore = (reviews.reduce((a, b) => a + b.score, 0) / reviews.length).toFixed(1);
  const positiveRate = Math.round(reviews.filter(r => r.sentiment === "positive").length / reviews.length * 100);
  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4"><MessageCircle className="w-8 h-8" /></div>
            <h2 className="text-xl font-semibold mb-1">Voice of Customer AI</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">Analyze customer feedback, identify sentiment patterns, and get actionable improvement recommendations.</p>
            <Button onClick={handleAnalyze} className="gap-2 h-11 px-6 rounded-xl"><MessageCircle className="w-4 h-4" /> Analyze Feedback</Button>
          </motion.div>
        )}
        {viewState === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-8">Analyzing Sentiment</h3>
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
        {viewState === "report" && (
          <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" /></div>
                <div><h2 className="text-lg font-semibold">Sentiment Report</h2><p className="text-xs text-muted-foreground">{reviews.length} feedbacks analyzed</p></div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewState("idle")} className="rounded-xl">Refresh</Button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-muted/30 text-center"><p className="text-2xl font-bold">{avgScore}/5</p><p className="text-[10px] text-muted-foreground mt-1">Avg Sentiment</p></div>
              <div className="p-4 rounded-xl bg-[hsl(142,71%,45%/0.05)] border border-[hsl(142,71%,45%/0.2)] text-center"><p className="text-2xl font-bold text-[hsl(142,71%,45%)]">{positiveRate}%</p><p className="text-[10px] text-muted-foreground mt-1">Positive</p></div>
              <div className="p-4 rounded-xl bg-muted/30 text-center"><p className="text-2xl font-bold">{reviews.filter(r => r.sentiment === "negative").length}</p><p className="text-[10px] text-muted-foreground mt-1">Complaints</p></div>
            </div>
            <div className="space-y-2 mb-6">
              {reviews.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-xl border border-border hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {r.sentiment === "positive" ? <ThumbsUp className="w-3.5 h-3.5 text-[hsl(142,71%,45%)]" /> : r.sentiment === "negative" ? <ThumbsDown className="w-3.5 h-3.5 text-[hsl(0,84%,60%)]" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="text-sm font-medium">{r.customer}</span><span className="text-xs text-muted-foreground">· {r.product}</span>
                    </div>
                    <span className={`text-sm font-bold ${r.score >= 4 ? "text-[hsl(142,71%,45%)]" : r.score < 3 ? "text-[hsl(0,84%,60%)]" : ""}`}>{r.score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">{r.feedback}</p>
                </motion.div>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-border">
              <h4 className="text-xs font-semibold mb-2">AI Improvement Suggestions</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Stricter color consistency checks for Widget C batches</li>
                <li>• Upgrade packaging for Widget E per customer request</li>
                <li>• Surface defects on Widget C linked to M2 temperature drift</li>
                <li>• Widget A is top performer — consider increasing capacity</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
