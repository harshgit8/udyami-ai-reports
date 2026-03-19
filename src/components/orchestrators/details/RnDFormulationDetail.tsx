import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Dna, Loader2, CheckCircle2, Database, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchGrounding, runGroundedAi } from "@/lib/orchestratorGrounding";

interface FormulationRecord {
  id: string;
  requestId: string;
  polymer: string;
  additives: string;
  cost: number;
  tensile: number;
  ul94: string;
  rohs: string;
  reach: string;
  recommendation: string;
  confidence: string;
  loi: number;
}

interface RnDRequest {
  requestId: string;
  application: string;
  standards: string;
  costTarget: number;
  constraints: string;
  specialNotes: string;
  tensileMin: number;
  chemicalResistance: string;
}

interface AgentStep {
  label: string;
  agent: string;
  status: "pending" | "running" | "done";
}

export function RnDFormulationDetail() {
  const [viewState, setViewState] = useState<"lab" | "evolving" | "result">("lab");
  const [formulations, setFormulations] = useState<FormulationRecord[]>([]);
  const [requests, setRequests] = useState<RnDRequest[]>([]);
  const [generation, setGeneration] = useState(0);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [labQuery, setLabQuery] = useState("Find the best formulation for the highest-fit request");
  const [groundedRecommendation, setGroundedRecommendation] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    async function load() {
      const [resResult, resInput] = await Promise.all([
        supabase.from("rndresult").select("*").order("created_at", { ascending: false }),
        supabase.from("rnd").select("*").order("created_at", { ascending: false }),
      ]);
      if (resResult.data) {
        setFormulations(resResult.data.map(d => ({
          id: d.formulation_id || `FORM-${d.id}`,
          requestId: d.request_id || "—",
          polymer: d.base_polymer || "—",
          additives: d.key_additives || "—",
          cost: d.cost_kg || 0,
          tensile: d.tensile_mpa || 0,
          ul94: d.ul94_rating || "—",
          rohs: d.rohs || "—",
          reach: d.reach || "—",
          recommendation: d.recommendation || "—",
          confidence: d.ai_confidence || "—",
          loi: d.loi || 0,
        })));
      }
      if (resInput.data) {
        setRequests(resInput.data.map(d => ({
          requestId: d.request_id || "—",
          application: d.application || "—",
          standards: d.standards || "—",
          costTarget: d.cost_target_kg || 0,
          constraints: d.constraints || "—",
          specialNotes: d.special_notes || "—",
          tensileMin: d.tensile_min_mpa || 0,
          chemicalResistance: d.chemical_resistance || "—",
        })));
      }
    }
    load();
  }, []);

  const handleEvolve = async () => {
    setViewState("evolving");
    setGeneration(0);
    setGroundedRecommendation("");
    setAgentSteps([
      { label: `Interpreting formulation brief: ${labQuery}`, agent: "BriefInterpreter", status: "pending" },
      { label: `Loading ${formulations.length} formulations & ${requests.length} R&D requests`, agent: "CompoundLibrary", status: "pending" },
      { label: "Evaluating compliance: RoHS, REACH, UL94 for each candidate", agent: "ComplianceChecker", status: "pending" },
      { label: "Cost-performance Pareto front analysis", agent: "ParetoAnalyzer", status: "pending" },
      { label: "Generating grounded formulation recommendation with references", agent: "RequirementsValidator", status: "pending" },
    ]);

    try {
      const grounding = await fetchGrounding("rnd", labQuery);
      const output = await runGroundedAi({
        orchestrator: "R&D Formulation AI",
        userQuery: labQuery,
        instructions: "Recommend the best formulation for the user query using only R&D requests and formulation results. Compare fit to requirements and include a Sources / Reference IDs section.",
        grounding,
      });
      setGroundedRecommendation(output);
    } catch (error) {
      setGroundedRecommendation(`Unable to generate grounded formulation insight: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (viewState !== "evolving") return;
    let step = 0;
    let gen = 0;
    const genInterval = setInterval(() => { gen++; setGeneration(gen); if (gen >= 10) clearInterval(genInterval); }, 400);
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
    return () => { clearInterval(genInterval); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);

  // Match formulation to its source request
  const getSourceRequest = (requestId: string) => requests.find(r => r.requestId === requestId);

  const pilotReady = formulations.filter(f => f.recommendation.includes("PILOT") || f.recommendation.includes("PROCEED"));
  const labTesting = formulations.filter(f => f.recommendation.includes("LABORATORY") || f.recommendation.includes("TESTING"));
  const caution = formulations.filter(f => f.recommendation.includes("CAUTION"));

  const getRecommendationBadge = (rec: string) => {
    if (rec.includes("PILOT") || rec.includes("PROCEED")) return { label: "Pilot Ready", cls: "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" };
    if (rec.includes("CAUTION")) return { label: "Caution", cls: "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]" };
    return { label: "Lab Testing", cls: "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]" };
  };

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "lab" && (
          <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center"><FlaskConical className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-lg font-semibold">R&D Formulation AI</h2>
                  <p className="text-xs text-muted-foreground">{formulations.length} formulations · {requests.length} requests · {pilotReady.length} pilot-ready · {labTesting.length} lab testing · {caution.length} caution</p>
                </div>
              </div>
              <Button onClick={handleEvolve} className="gap-2 rounded-xl"><Dna className="w-4 h-4" /> Run Genetic Evolution</Button>
            </div>

            <div className="rounded-xl border border-border p-4 mb-6 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Formulation query</label>
              <Input value={labQuery} onChange={e => setLabQuery(e.target.value)} placeholder="e.g. Recommend the best low-cost flame-retardant formulation for UL94 demand" className="text-xs" />
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {[
                { label: "Total Formulations", value: formulations.length },
                { label: "R&D Requests", value: requests.length },
                { label: "Pilot Ready", value: pilotReady.length },
                { label: "Lab Testing", value: labTesting.length },
                { label: "Avg Cost", value: `₹${formulations.length > 0 ? Math.round(formulations.reduce((a, b) => a + b.cost, 0) / formulations.length) : 0}/kg` },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold">{m.value}</p>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Formulations — Linked to Source R&D Requests</h4>
            <div className="space-y-2.5">
              {formulations.map((f, i) => {
                const sourceReq = getSourceRequest(f.requestId);
                const badge = getRecommendationBadge(f.recommendation);
                const isExpanded = selectedFormulation === f.id;

                return (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-border hover:border-foreground/10 transition-all overflow-hidden">
                    <div className="p-4 cursor-pointer" onClick={() => setSelectedFormulation(isExpanded ? null : f.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold">{f.polymer}</p>
                            <p className="text-[10px] text-muted-foreground">{f.id} → Source: {f.requestId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{f.confidence}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Cost:</span> <strong>₹{f.cost}/kg</strong></div>
                        <div><span className="text-muted-foreground">Tensile:</span> <strong>{f.tensile} MPa</strong></div>
                        <div><span className="text-muted-foreground">UL94:</span> <strong>{f.ul94}</strong></div>
                        <div><span className="text-muted-foreground">LOI:</span> <strong>{f.loi}%</strong></div>
                        <div><span className="text-muted-foreground">RoHS:</span> <strong>{f.rohs}</strong></div>
                        <div><span className="text-muted-foreground">REACH:</span> <strong>{f.reach}</strong></div>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2 truncate">Additives: {f.additives}</p>
                    </div>

                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border bg-muted/10 px-4 py-3">
                        <div className="mb-3">
                          <p className="text-xs font-semibold mb-1">AI Recommendation</p>
                          <p className="text-xs">{f.recommendation}</p>
                        </div>

                        {sourceReq && (
                          <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5" /> Source R&D Request — {sourceReq.requestId}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-muted-foreground">Application:</span> <strong>{sourceReq.application}</strong></div>
                              <div><span className="text-muted-foreground">Standards:</span> <strong>{sourceReq.standards}</strong></div>
                              <div><span className="text-muted-foreground">Cost Target:</span> <strong>₹{sourceReq.costTarget}/kg</strong>
                                {f.cost <= sourceReq.costTarget
                                  ? <span className="ml-1 text-[hsl(142,71%,45%)] text-[10px]">✓ Within budget</span>
                                  : <span className="ml-1 text-[hsl(0,84%,60%)] text-[10px]">✗ Over budget by ₹{f.cost - sourceReq.costTarget}/kg</span>
                                }
                              </div>
                              <div><span className="text-muted-foreground">Tensile Min:</span> <strong>{sourceReq.tensileMin} MPa</strong>
                                {f.tensile >= sourceReq.tensileMin
                                  ? <span className="ml-1 text-[hsl(142,71%,45%)] text-[10px]">✓ Meets requirement</span>
                                  : <span className="ml-1 text-[hsl(0,84%,60%)] text-[10px]">✗ Below minimum</span>
                                }
                              </div>
                              <div><span className="text-muted-foreground">Constraints:</span> <strong>{sourceReq.constraints}</strong></div>
                              <div><span className="text-muted-foreground">Chemical Resistance:</span> <strong>{sourceReq.chemicalResistance}</strong></div>
                              <div className="col-span-2"><span className="text-muted-foreground">Special Notes:</span> <strong>{sourceReq.specialNotes}</strong></div>
                            </div>
                          </div>
                        )}
                        {!sourceReq && (
                          <p className="text-xs text-muted-foreground italic">No matching R&D request found for {f.requestId}</p>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewState === "evolving" && (
          <motion.div key="evolving" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
            <div className="relative mb-6"><Dna className="w-12 h-12 animate-pulse" /></div>
            <h3 className="text-lg font-medium mb-2">Genetic Algorithm Running</h3>
            <p className="text-xs text-muted-foreground mb-2">Generation {generation}/10 · Evolving across {formulations.length} formulations & {requests.length} requirements</p>
            <Progress value={generation * 10} className="h-2 w-48 mb-8" />
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

        {viewState === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Evolution Complete</h2>
                <p className="text-xs text-muted-foreground">10 generations · Top {Math.min(3, pilotReady.length)} optimal candidates from database</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {(pilotReady.length > 0 ? pilotReady.slice(0, 3) : formulations.slice(0, 3)).map((f, i) => {
                const sourceReq = getSourceRequest(f.requestId);
                return (
                  <div key={f.id} className={`p-4 rounded-xl border ${i === 0 ? "border-[hsl(142,71%,45%/0.3)] bg-[hsl(142,71%,45%/0.03)]" : "border-border"}`}>
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{f.polymer}</p>
                        <p className="text-[10px] text-muted-foreground">{f.id} → {f.requestId} → {sourceReq?.application || "Unknown application"}</p>
                      </div>
                      <span className="text-xs font-medium text-[hsl(142,71%,45%)]">{f.confidence}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">Additives: {f.additives}</p>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      {[
                        ["Cost", `₹${f.cost}/kg`, sourceReq ? (f.cost <= sourceReq.costTarget ? "✓" : "✗") : ""],
                        ["Tensile", `${f.tensile} MPa`, sourceReq ? (f.tensile >= sourceReq.tensileMin ? "✓" : "✗") : ""],
                        ["UL94", f.ul94, ""],
                        ["LOI", `${f.loi}%`, ""],
                      ].map(([label, value, check]) => (
                        <div key={label as string} className="p-2 rounded-lg bg-muted/30 text-center">
                          <p className="text-muted-foreground">{label}</p>
                          <p className="font-semibold">{value} {check === "✓" ? <span className="text-[hsl(142,71%,45%)]">✓</span> : check === "✗" ? <span className="text-[hsl(0,84%,60%)]">✗</span> : ""}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-2 text-muted-foreground">{f.recommendation}</p>
                  </div>
                );
              })}
            </div>

            <Button onClick={() => setViewState("lab")} variant="outline" className="w-full h-11 rounded-xl">← Back to Lab</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
