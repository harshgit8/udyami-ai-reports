import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, CheckCircle2, AlertTriangle, XCircle, Activity, RefreshCw, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { fetchGrounding, runGroundedAi } from "@/lib/orchestratorGrounding";

interface BatchRecord {
  id: string;
  inspectionId: string;
  product: string;
  qty: number;
  defects: number;
  critical: number;
  major: number;
  minor: number;
  rate: string;
  rateNum: number;
  decision: string;
  severity: string;
  riskLevel: string;
  score: number;
  recommendation: string;
}

interface QualityInput {
  batchId: string;
  productType: string;
  quantity: number;
  inspectionStandard: string;
  visualInspection: string;
  measurements: string;
  defectsFound: string;
  specialRequirements: string;
}

interface AgentStep {
  label: string;
  agent: string;
  status: "pending" | "running" | "done";
}

export function QualityIntelligenceDetail() {
  const [viewState, setViewState] = useState<"overview" | "inspecting" | "report">("overview");
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [qualityInputs, setQualityInputs] = useState<QualityInput[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [defectDistribution, setDefectDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [productBreakdown, setProductBreakdown] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysisQuery, setAnalysisQuery] = useState("");
  const [groundedReport, setGroundedReport] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [resResult, resInput] = await Promise.all([
        supabase.from("qualityresult").select("*").order("created_at", { ascending: false }),
        supabase.from("quality").select("*").order("created_at", { ascending: false }),
      ]);

      if (resResult.data) {
        let totalMinor = 0, totalMajor = 0, totalCritical = 0, totalPass = 0;
        const productMap = new Map<string, { pass: number; fail: number; conditional: number; total: number }>();

        const records: BatchRecord[] = resResult.data.map(d => {
          const dec = d.decision || "ACCEPT";
          if (dec === "ACCEPT") totalPass++;
          totalMinor += d.minor || 0;
          totalMajor += d.major || 0;
          totalCritical += d.critical || 0;

          const pType = d.product_type || "unknown";
          const existing = productMap.get(pType) || { pass: 0, fail: 0, conditional: 0, total: 0 };
          existing.total++;
          if (dec === "ACCEPT") existing.pass++;
          else if (dec === "REJECT") existing.fail++;
          else existing.conditional++;
          productMap.set(pType, existing);

          return {
            id: d.batch_id || `BATCH-${d.id}`,
            inspectionId: d.inspection_id || "—",
            product: d.product_type || "—",
            qty: d.quantity || 0,
            defects: d.total_defects || 0,
            critical: d.critical || 0,
            major: d.major || 0,
            minor: d.minor || 0,
            rate: `${d.defect_rate || 0}%`,
            rateNum: Number(d.defect_rate) || 0,
            decision: dec,
            severity: d.severity_level || "—",
            riskLevel: d.risk_level || "—",
            score: d.confidence || 90,
            recommendation: d.recommendation || "—",
          };
        });
        setBatches(records);

        setDefectDistribution([
          { name: "Pass (No Defects)", value: records.filter(r => r.defects === 0).length, color: "hsl(142, 71%, 45%)" },
          { name: "Minor Only", value: records.filter(r => r.defects > 0 && r.critical === 0 && r.major === 0).length, color: "hsl(210, 40%, 70%)" },
          { name: "Major Defects", value: records.filter(r => r.major > 0).length, color: "hsl(38, 92%, 50%)" },
          { name: "Critical Defects", value: records.filter(r => r.critical > 0).length, color: "hsl(0, 84%, 60%)" },
        ].filter(d => d.value > 0));

        setProductBreakdown(Array.from(productMap.entries()).map(([name, data]) => ({
          name: name.replace("widget_", "Widget ").toUpperCase(),
          Pass: data.pass,
          Fail: data.fail,
          Conditional: data.conditional,
        })));
      }

      if (resInput.data) {
        setQualityInputs(resInput.data.map(d => ({
          batchId: d.batch_id || "—",
          productType: d.product_type || "—",
          quantity: d.quantity || 0,
          inspectionStandard: d.inspection_standard || "—",
          visualInspection: d.visual_inspection || "—",
          measurements: d.measurements || "—",
          defectsFound: d.defects_found || "None",
          specialRequirements: d.special_requirements || "—",
        })));
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('quality-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qualityresult' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quality' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleInspect = async (batchId: string) => {
    setSelectedBatch(batchId);
    setAnalysisQuery(`Analyze batch ${batchId} and formulate the best quality report based on inspection evidence`);
    setGroundedReport("");
    setViewState("inspecting");
    const batch = batches.find(b => b.id === batchId);
    const input = qualityInputs.find(q => q.batchId === batchId);
    setAgentSteps([
      { label: `Loading inspection data for ${batchId} — ${batch?.product || "product"}`, agent: "SensorCollector", status: "pending" },
      { label: `Analyzing ${batch?.defects || 0} defects: ${batch?.critical || 0} critical, ${batch?.major || 0} major, ${batch?.minor || 0} minor`, agent: "DefectDetector", status: "pending" },
      { label: `Standard: ${input?.inspectionStandard || "ISO 9001"} · Visual: ${input?.visualInspection?.substring(0, 30) || "N/A"}...`, agent: "StandardsChecker", status: "pending" },
      { label: "Generating grounded quality recommendation with references", agent: "CertificateEngine", status: "pending" },
    ]);

    try {
      const grounding = await fetchGrounding("quality", batchId);
      const output = await runGroundedAi({
        orchestrator: "Quality Intelligence AI",
        userQuery: `Analyze batch ${batchId}`,
        instructions: "Generate the strongest possible quality report grounded only in quality inspection input/result data. Include decision rationale, corrective actions, and a Sources / Reference IDs section.",
        grounding,
      });
      setGroundedReport(output);
    } catch (error) {
      setGroundedReport(`Unable to generate grounded quality insight: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (viewState !== "inspecting") return;
    let step = 0;
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        step++;
        timerRef.current = setTimeout(run, 1000);
      } else {
        setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
        timerRef.current = setTimeout(() => setViewState("report"), 500);
      }
    };
    timerRef.current = setTimeout(run, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);

  const inspectedBatch = batches.find(b => b.id === selectedBatch);
  const inspectedInput = qualityInputs.find(q => q.batchId === selectedBatch);

  const totalInspected = batches.reduce((a, b) => a + b.qty, 0);
  const passRate = batches.length > 0 ? Math.round(batches.filter(b => b.decision === "ACCEPT").length / batches.length * 100) : 0;
  const avgDefectRate = batches.length > 0 ? (batches.reduce((a, b) => a + b.rateNum, 0) / batches.length).toFixed(2) : "0";
  const rejectedCount = batches.filter(b => b.decision === "REJECT").length;

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center"><Shield className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-lg font-semibold">Quality Intelligence AI</h2>
                  <p className="text-xs text-muted-foreground">
                    {batches.length} inspections · {totalInspected.toLocaleString()} units · {passRate}% pass rate
                    <span className="ml-2 flex items-center gap-1 inline-flex"><Activity className="w-3 h-3 text-[hsl(142,71%,45%)]" /> Live</span>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadData} disabled={isRefreshing} className="gap-1.5 rounded-xl">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {[
                { label: "Pass Rate", value: `${passRate}%`, trend: passRate >= 90 ? "up" : "down", color: passRate >= 90 ? "text-[hsl(142,71%,45%)]" : "text-[hsl(38,92%,50%)]" },
                { label: "Avg Defect Rate", value: `${avgDefectRate}%`, trend: Number(avgDefectRate) < 1 ? "up" : "down", color: Number(avgDefectRate) < 1 ? "text-[hsl(142,71%,45%)]" : "text-[hsl(38,92%,50%)]" },
                { label: "Batches Inspected", value: String(batches.length), trend: "up", color: "" },
                { label: "Units Checked", value: totalInspected.toLocaleString(), trend: "up", color: "" },
                { label: "Rejected", value: String(rejectedCount), trend: rejectedCount === 0 ? "up" : "down", color: rejectedCount === 0 ? "text-[hsl(142,71%,45%)]" : "text-[hsl(0,84%,60%)]" },
              ].map(kpi => (
                <div key={kpi.label} className="p-3 rounded-xl border border-border text-center">
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  <div className="flex items-center justify-center gap-0.5">
                    {kpi.trend === "up" ? <TrendingUp className="w-3 h-3 text-[hsl(142,71%,45%)]" /> : <TrendingDown className="w-3 h-3 text-[hsl(0,84%,60%)]" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Defect Distribution</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={defectDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {defectDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {defectDistribution.map(d => (
                    <div key={d.name} className="flex items-center gap-1 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quality by Product</h4>
                {productBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={productBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Pass" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Fail" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Conditional" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">No data available</div>
                )}
              </div>
            </div>

            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Inspection Results — Click to run detailed AI analysis</h4>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/50">
                  {["Batch", "Inspection", "Product", "Qty", "Defects", "Rate", "Critical", "Major", "Minor", "Severity", "Risk", "Decision", ""].map(h => (
                    <th key={h} className="text-left p-2 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-2 font-medium">{b.id}</td>
                      <td className="p-2 text-muted-foreground text-[10px]">{b.inspectionId}</td>
                      <td className="p-2">{b.product}</td>
                      <td className="p-2">{b.qty}</td>
                      <td className="p-2 font-medium">{b.defects}</td>
                      <td className="p-2">{b.rate}</td>
                      <td className="p-2"><span className={b.critical > 0 ? "text-[hsl(0,84%,60%)] font-bold" : "text-muted-foreground"}>{b.critical}</span></td>
                      <td className="p-2"><span className={b.major > 0 ? "text-[hsl(38,92%,50%)] font-bold" : "text-muted-foreground"}>{b.major}</span></td>
                      <td className="p-2 text-muted-foreground">{b.minor}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.severity === "EXCELLENT" ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" : b.severity === "GOOD" ? "bg-[hsl(210,40%,70%/0.2)] text-[hsl(210,40%,50%)]" : b.severity === "ACCEPTABLE" ? "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]" : "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]"}`}>
                          {b.severity}
                        </span>
                      </td>
                      <td className="p-2 text-[10px]">{b.riskLevel}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.decision === "ACCEPT" ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" : b.decision === "REJECT" ? "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]" : "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]"}`}>
                          {b.decision}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg px-2" onClick={() => handleInspect(b.id)}>Analyze</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {viewState === "inspecting" && (
          <motion.div key="inspecting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-2">Deep Analysis — {selectedBatch}</h3>
            <p className="text-xs text-muted-foreground mb-8">Running AI quality agents on real inspection data</p>
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

        {viewState === "report" && inspectedBatch && (
          <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inspectedBatch.decision === "ACCEPT" ? "bg-[hsl(142,71%,45%/0.1)]" : inspectedBatch.decision === "REJECT" ? "bg-[hsl(0,84%,60%/0.1)]" : "bg-[hsl(38,92%,50%/0.1)]"}`}>
                {inspectedBatch.decision === "ACCEPT" ? <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" /> : inspectedBatch.decision === "REJECT" ? <XCircle className="w-5 h-5 text-[hsl(0,84%,60%)]" /> : <AlertTriangle className="w-5 h-5 text-[hsl(38,92%,50%)]" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">Quality Report — {inspectedBatch.id}</h2>
                <p className="text-xs text-muted-foreground">{inspectedBatch.product} · {inspectedBatch.qty} units · Inspection: {inspectedBatch.inspectionId}</p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-background mb-4">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Defect Rate", value: inspectedBatch.rate, color: inspectedBatch.rateNum < 0.5 ? "text-[hsl(142,71%,45%)]" : inspectedBatch.rateNum < 1 ? "text-[hsl(38,92%,50%)]" : "text-[hsl(0,84%,60%)]" },
                  { label: "Total Defects", value: String(inspectedBatch.defects), color: inspectedBatch.defects === 0 ? "text-[hsl(142,71%,45%)]" : "" },
                  { label: "Severity", value: inspectedBatch.severity, color: inspectedBatch.severity === "EXCELLENT" ? "text-[hsl(142,71%,45%)]" : inspectedBatch.severity === "GOOD" ? "" : "text-[hsl(0,84%,60%)]" },
                  { label: "Confidence", value: `${inspectedBatch.score}%`, color: "" },
                ].map(m => (
                  <div key={m.label} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Defect Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-lg border border-border text-center">
                  <p className="text-[10px] text-muted-foreground">Critical</p>
                  <p className={`text-xl font-bold ${inspectedBatch.critical > 0 ? "text-[hsl(0,84%,60%)]" : "text-[hsl(142,71%,45%)]"}`}>{inspectedBatch.critical}</p>
                  <p className="text-[9px] text-muted-foreground">Safety/function failures</p>
                </div>
                <div className="p-3 rounded-lg border border-border text-center">
                  <p className="text-[10px] text-muted-foreground">Major</p>
                  <p className={`text-xl font-bold ${inspectedBatch.major > 0 ? "text-[hsl(38,92%,50%)]" : "text-[hsl(142,71%,45%)]"}`}>{inspectedBatch.major}</p>
                  <p className="text-[9px] text-muted-foreground">Dimensional/spec deviations</p>
                </div>
                <div className="p-3 rounded-lg border border-border text-center">
                  <p className="text-[10px] text-muted-foreground">Minor</p>
                  <p className="text-xl font-bold text-muted-foreground">{inspectedBatch.minor}</p>
                  <p className="text-[9px] text-muted-foreground">Cosmetic/surface issues</p>
                </div>
              </div>

              {/* Input Data */}
              {inspectedInput && (
                <div className="mb-6 p-4 rounded-lg bg-muted/20 border border-border/50">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Inspection Input Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Standard:</span> {inspectedInput.inspectionStandard}</div>
                    <div><span className="text-muted-foreground">Visual:</span> {inspectedInput.visualInspection}</div>
                    <div><span className="text-muted-foreground">Measurements:</span> {inspectedInput.measurements}</div>
                    <div><span className="text-muted-foreground">Defects Found:</span> {inspectedInput.defectsFound}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Special Req:</span> {inspectedInput.specialRequirements}</div>
                  </div>
                </div>
              )}

              {/* Decision */}
              <div className={`p-4 rounded-lg border ${inspectedBatch.decision === "ACCEPT" ? "border-[hsl(142,71%,45%/0.3)] bg-[hsl(142,71%,45%/0.03)]" : inspectedBatch.decision === "REJECT" ? "border-[hsl(0,84%,60%/0.3)] bg-[hsl(0,84%,60%/0.03)]" : "border-[hsl(38,92%,50%/0.3)] bg-[hsl(38,92%,50%/0.03)]"}`}>
                <p className="text-sm font-semibold mb-1">AI Decision: {inspectedBatch.decision}</p>
                <p className="text-xs">{inspectedBatch.recommendation}</p>
                <p className="text-[10px] text-muted-foreground mt-2">Risk Level: {inspectedBatch.riskLevel} · Confidence: {inspectedBatch.score}%</p>
              </div>
            </div>

            <Button onClick={() => { setViewState("overview"); setSelectedBatch(null); }} variant="outline" className="w-full h-11 rounded-xl">
              ← Back to Inspections
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
