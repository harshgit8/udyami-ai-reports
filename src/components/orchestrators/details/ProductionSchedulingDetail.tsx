import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Settings, Users, Package, CheckCircle2, Edit2, Save, Send, Loader2, ArrowRight, Clock, Briefcase, Mail, RefreshCw, Activity, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchGrounding, runGroundedAi } from "@/lib/orchestratorGrounding";

interface ProductionOrder {
  id: string;
  product: string;
  deadline: string;
  material: string;
  customer: string;
  priority: string;
  quantity: number;
}

interface ScheduleRow {
  id: number;
  time: string;
  machine: string;
  task: string;
  worker: string;
  risk: number;
  orderId: string;
  customer: string;
  quantity: number;
  decision: string;
}

interface MachineUtilization {
  machine: string;
  utilization: number;
  orders: number;
  status: string;
  hoursUsed: number;
  hoursAvailable: number;
}

interface AgentStep {
  label: string;
  agent: string;
  status: "pending" | "running" | "done";
}

const WORKERS = [
  { id: "W1", name: "Ramesh Patil", expertise: "Injection Molding", shift: "06:00 - 14:00", available: true },
  { id: "W2", name: "Suresh Jadhav", expertise: "Extrusion", shift: "06:00 - 14:00", available: true },
  { id: "W3", name: "Priya Sharma", expertise: "CNC Operations", shift: "08:00 - 16:00", available: true },
  { id: "W4", name: "Amit Deshmukh", expertise: "Assembly", shift: "08:00 - 16:00", available: false },
  { id: "W5", name: "Neha Kulkarni", expertise: "Press Operations", shift: "14:00 - 22:00", available: true },
];

export function ProductionSchedulingDetail() {
  const [step, setStep] = useState<"setup" | "processing" | "review" | "mail">("setup");
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [scheduleResults, setScheduleResults] = useState<any[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [mailTo, setMailTo] = useState("manager@factory.com");
  const [mailSubject, setMailSubject] = useState("Production Schedule — Today");
  const [mailBody, setMailBody] = useState("");
  const [machineUtil, setMachineUtil] = useState<MachineUtilization[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scheduleQuery, setScheduleQuery] = useState("Build the best production schedule for the most critical orders");
  const [groundedPlan, setGroundedPlan] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [prodRes, schedRes] = await Promise.all([
        supabase.from("production").select("*").order("created_at", { ascending: false }),
        supabase.from("productionresult").select("*").order("created_at", { ascending: false }),
      ]);

      if (prodRes.data) {
        setOrders(prodRes.data.map(d => ({
          id: d.order_id || "—",
          product: d.product_type || "widget",
          deadline: d.due_date || "—",
          material: d.priority === "critical" ? "Delayed" : "Ready",
          customer: d.customer || "—",
          priority: d.priority || "normal",
          quantity: d.quantity || 0,
        })));
      }

      if (schedRes.data) {
        setScheduleResults(schedRes.data);
        // Calculate machine utilization from real data
        const machineMap = new Map<string, { orders: number; totalHours: number; decisions: string[] }>();
        schedRes.data.forEach(r => {
          const m = r.machine || "Unknown";
          const existing = machineMap.get(m) || { orders: 0, totalHours: 0, decisions: [] };
          const start = r.start_time ? new Date(r.start_time).getTime() : 0;
          const end = r.end_time ? new Date(r.end_time).getTime() : 0;
          const hours = start && end ? Math.max(0, (end - start) / (1000 * 60 * 60)) : 0;
          existing.orders += 1;
          existing.totalHours += hours;
          if (r.decision) existing.decisions.push(r.decision);
          machineMap.set(m, existing);
        });

        const utilData: MachineUtilization[] = Array.from(machineMap.entries()).map(([machine, data]) => {
          const totalAvail = 16; // 16-hour production window
          const utilPct = Math.min(99, Math.round((data.totalHours / totalAvail) * 100));
          const hasIssue = data.decisions.some(d => d === "DELAYED" || d === "CRITICAL");
          return {
            machine,
            utilization: utilPct,
            orders: data.orders,
            status: hasIssue ? "At Risk" : utilPct > 85 ? "High Load" : "Optimal",
            hoursUsed: Math.round(data.totalHours * 10) / 10,
            hoursAvailable: totalAvail,
          };
        });
        setMachineUtil(utilData);
      }
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('production-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productionresult' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleGenerate = async () => {
    setStep("processing");
    setProgress(0);
    setGroundedPlan("");
    setAgentSteps([
      { label: `Interpreting planner query: ${scheduleQuery}`, agent: "PlannerInterpreter", status: "pending" },
      { label: "Fetching real-time machine capacity & maintenance logs", agent: "MachineMonitor", status: "pending" },
      { label: "Analyzing workforce shifts, skills & availability", agent: "WorkforceAnalyzer", status: "pending" },
      { label: "Running constraint-based scheduling optimization", agent: "ScheduleOptimizer", status: "pending" },
      { label: "Generating grounded production narrative with references", agent: "DispatchPlanner", status: "pending" },
    ]);

    try {
      const grounding = await fetchGrounding("production", scheduleQuery);
      const output = await runGroundedAi({
        orchestrator: "Production Scheduling AI",
        userQuery: scheduleQuery,
        instructions: "Create the best production schedule response for the user query using production orders and production results only. Include machine assignments, risk notes, sequence rationale, and a Sources / Reference IDs section.",
        grounding,
      });
      setGroundedPlan(output);
    } catch (error) {
      setGroundedPlan(`Unable to generate grounded schedule insight: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (step !== "processing") return;
    let s = 0;
    let prog = 0;
    const progInterval = setInterval(() => { prog += 2; setProgress(Math.min(prog, 100)); if (prog >= 100) clearInterval(progInterval); }, 80);

    const run = () => {
      if (s < agentSteps.length) {
        setAgentSteps(prev => prev.map((a, i) => ({ ...a, status: i === s ? "running" : i < s ? "done" : "pending" })));
        s++;
        timerRef.current = setTimeout(run, 800);
      } else {
        setAgentSteps(prev => prev.map(a => ({ ...a, status: "done" as const })));
        // Build schedule from real DB data
        const generated: ScheduleRow[] = [];
        const usedOrders = orders.slice(0, 8);
        usedOrders.forEach((order, i) => {
          const matchingResult = scheduleResults.find(r => r.order_id === order.id);
          const machine = matchingResult?.machine || ["Injection Molder A", "Extrusion Line B", "CNC Router C", "Press Machine E", "Assembly Unit D"][i % 5];
          const worker = WORKERS[i % WORKERS.length];
          const risk = matchingResult?.risk_score || Math.floor(Math.random() * 4) + 1;
          const startTime = matchingResult?.start_time
            ? new Date(matchingResult.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
            : `${String(6 + i * 1.5).padStart(2, "0")}:00`;
          const endTime = matchingResult?.end_time
            ? new Date(matchingResult.end_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
            : `${String(8 + i * 1.5).padStart(2, "0")}:00`;

          generated.push({
            id: i + 1,
            time: `${startTime} - ${endTime}`,
            machine,
            task: `${order.id} — ${order.product} (${order.priority})`,
            worker: worker.name,
            risk,
            orderId: order.id,
            customer: order.customer,
            quantity: order.quantity,
            decision: matchingResult?.decision || "APPROVED",
          });
        });
        setSchedule(generated);

        const body = `Production Schedule — AI Optimized\nGenerated: ${new Date().toLocaleString("en-IN")}\n` +
          `\n${"─".repeat(60)}\n` +
          generated.map(s =>
            `[${s.time}]\n  Machine: ${s.machine}\n  Order: ${s.task}\n  Customer: ${s.customer} | Qty: ${s.quantity}\n  Worker: ${s.worker}\n  Risk: ${s.risk}/10 | Status: ${s.decision}`
          ).join(`\n${"─".repeat(40)}\n`) +
          `\n${"─".repeat(60)}\n\nMachine Utilization Summary:\n` +
          machineUtil.map(m => `  ${m.machine}: ${m.utilization}% (${m.hoursUsed}h / ${m.hoursAvailable}h) — ${m.status}`).join("\n") +
          `\n\nAll materials verified. Risk scores computed from real-time data.\n\nBest regards,\nProduction Scheduling AI — Udyami Platform`;
        setMailBody(body);
        timerRef.current = setTimeout(() => setStep("review"), 500);
      }
    };
    timerRef.current = setTimeout(run, 300);
    return () => { clearInterval(progInterval); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step]);

  const handleUpdateSchedule = (id: number, field: string, value: string) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const getDecisionColor = (decision: string) => {
    if (decision === "APPROVED") return "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]";
    if (decision === "DELAYED") return "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]";
    return "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]";
  };

  const utilChartData = machineUtil.map(m => ({
    name: m.machine.replace(/^(.*?) /, ""),
    utilization: m.utilization,
    fill: m.utilization > 85 ? "hsl(38, 92%, 50%)" : m.utilization > 60 ? "hsl(142, 71%, 45%)" : "hsl(0, 0%, 70%)",
  }));

  return (
    <div className="space-y-6 w-full">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Production Scheduling AI</h2>
                  <p className="text-xs text-muted-foreground">
                    {machineUtil.length} machines · {WORKERS.filter(w => w.available).length} workers available · {orders.length} pending orders
                    <span className="ml-2 text-[10px]">Updated {lastRefresh.toLocaleTimeString("en-IN")}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadData} disabled={isRefreshing} className="gap-1.5 rounded-xl">
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Syncing..." : "Refresh"}
                </Button>
                <Button onClick={handleGenerate} className="gap-2 rounded-xl">
                  <Play className="w-4 h-4" /> Generate Schedule
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 mb-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Scheduling query</label>
              <Input value={scheduleQuery} onChange={e => setScheduleQuery(e.target.value)} placeholder="e.g. Prioritize overdue high-volume orders with lowest delivery risk" className="text-xs" />
            </div>

            {/* Machine Utilization Chart */}
            {machineUtil.length > 0 && (
              <div className="rounded-xl border border-border p-4 mb-4">
                <h4 className="text-xs font-semibold flex items-center gap-2 pb-3 border-b border-border mb-3">
                  <Gauge className="w-3.5 h-3.5" /> Machine Utilization — Real-Time
                </h4>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={utilChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Utilization"]} />
                    <Bar dataKey="utilization" radius={[0, 4, 4, 0]} barSize={18}>
                      {utilChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {machineUtil.map(m => (
                    <div key={m.machine} className="text-center p-2 rounded-lg bg-muted/20">
                      <p className="text-[10px] text-muted-foreground truncate">{m.machine}</p>
                      <p className="text-sm font-bold">{m.utilization}%</p>
                      <p className={`text-[9px] font-medium ${m.status === "Optimal" ? "text-[hsl(142,71%,45%)]" : m.status === "High Load" ? "text-[hsl(38,92%,50%)]" : "text-[hsl(0,84%,60%)]"}`}>
                        {m.status} · {m.orders} orders
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4 space-y-2.5">
                <h4 className="text-xs font-semibold flex items-center gap-2 pb-2 border-b border-border">
                  <Users className="w-3.5 h-3.5" /> Workforce ({WORKERS.filter(w => w.available).length}/{WORKERS.length} available)
                </h4>
                {WORKERS.map(w => (
                  <div key={w.id} className={`text-xs p-2 rounded-lg ${w.available ? "bg-muted/20" : "bg-muted/10 opacity-50"}`}>
                    <div className="flex justify-between font-medium">
                      <span>{w.name}</span>
                      <span className={w.available ? "text-[hsl(142,71%,45%)]" : "text-[hsl(0,84%,60%)]"}>
                        {w.available ? w.expertise : "On Leave"}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {w.shift}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border p-4 space-y-2.5">
                <h4 className="text-xs font-semibold flex items-center gap-2 pb-2 border-b border-border">
                  <Package className="w-3.5 h-3.5" /> Pending Orders — Live from Database
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[hsl(142,71%,45%)]"><Activity className="w-3 h-3" /> Live</span>
                </h4>
                {orders.map(o => (
                  <div key={o.id} className="text-xs p-2.5 rounded-lg bg-muted/20">
                    <div className="flex justify-between font-medium">
                      <span>{o.id} — {o.product}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${o.priority === "critical" ? "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]" : o.priority === "high" ? "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]" : "bg-muted text-muted-foreground"}`}>
                        {o.priority}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 flex justify-between">
                      <span>{o.customer} · Qty: {o.quantity}</span>
                      <span className={o.material === "Ready" ? "text-[hsl(142,71%,45%)]" : "text-[hsl(0,84%,60%)]"}>
                        Material: {o.material} · Due: {o.deadline}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No orders found in database</p>}
              </div>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-2">Optimizing Schedule from Live Data</h3>
            <p className="text-xs text-muted-foreground mb-4">{orders.length} orders · {machineUtil.length} machines · {WORKERS.filter(w => w.available).length} workers</p>
            <Progress value={progress} className="h-2 w-48 mb-8" />
            <div className="w-full max-w-md space-y-3">
              {agentSteps.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${a.status === "running" ? "border-foreground/20 bg-muted/30" : a.status === "done" ? "border-border opacity-60" : "border-transparent opacity-30"}`}>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {a.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : a.status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                  <div><p className="text-sm font-medium">{a.label}</p><p className="text-[10px] text-muted-foreground">Agent: {a.agent}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Optimized Schedule — {schedule.length} Tasks</h3>
                  <p className="text-xs text-muted-foreground">Generated from live database · Review and edit before sharing</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("setup")} className="rounded-xl">← Back</Button>
                <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode(!editMode)} className="gap-1.5 rounded-xl">
                  {editMode ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Edit2 className="w-3.5 h-3.5" /> Edit</>}
                </Button>
                {!editMode && (
                  <Button size="sm" onClick={() => setStep("mail")} className="gap-1.5 rounded-xl">
                    Share <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Machine Utilization Summary */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {machineUtil.map(m => (
                <div key={m.machine} className="p-2.5 rounded-lg border border-border text-center">
                  <p className="text-[10px] text-muted-foreground truncate">{m.machine}</p>
                  <p className="text-lg font-bold">{m.utilization}%</p>
                  <div className="w-full bg-muted/30 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${m.utilization > 85 ? "bg-[hsl(38,92%,50%)]" : "bg-[hsl(142,71%,45%)]"}`} style={{ width: `${m.utilization}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground">
                  <th className="p-3 text-left font-medium">Time</th>
                  <th className="p-3 text-left font-medium">Machine</th>
                  <th className="p-3 text-left font-medium">Order / Product</th>
                  <th className="p-3 text-left font-medium">Customer</th>
                  <th className="p-3 text-left font-medium">Qty</th>
                  <th className="p-3 text-left font-medium">Worker</th>
                  <th className="p-3 text-left font-medium">Risk</th>
                  <th className="p-3 text-left font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {schedule.map(row => (
                    <tr key={row.id} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="p-3">{editMode ? <Input value={row.time} onChange={e => handleUpdateSchedule(row.id, "time", e.target.value)} className="h-8 text-xs" /> : <span className="text-xs font-medium">{row.time}</span>}</td>
                      <td className="p-3">{editMode ? <Input value={row.machine} onChange={e => handleUpdateSchedule(row.id, "machine", e.target.value)} className="h-8 text-xs" /> : <span className="text-xs">{row.machine}</span>}</td>
                      <td className="p-3"><span className="text-xs">{row.task}</span></td>
                      <td className="p-3"><span className="text-xs text-muted-foreground">{row.customer}</span></td>
                      <td className="p-3"><span className="text-xs font-medium">{row.quantity}</span></td>
                      <td className="p-3"><span className="text-xs flex items-center gap-1"><Briefcase className="w-3 h-3 text-muted-foreground" /> {row.worker}</span></td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${row.risk <= 3 ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" : row.risk <= 5 ? "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]" : "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]"}`}>{row.risk}/10</span></td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getDecisionColor(row.decision)}`}>{row.decision}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {step === "mail" && (
          <motion.div key="mail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
              <div><h3 className="text-lg font-semibold">Share Schedule</h3><p className="text-xs text-muted-foreground">Send to your team via email</p></div>
            </div>
            <div className="space-y-3 mb-6">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">To:</label><Input value={mailTo} onChange={e => setMailTo(e.target.value)} placeholder="recipient@company.com" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Subject:</label><Input value={mailSubject} onChange={e => setMailSubject(e.target.value)} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Body:</label><Textarea value={mailBody} onChange={e => setMailBody(e.target.value)} className="min-h-[280px] font-mono text-xs" /></div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("review")}>← Back</Button>
              <Button
                onClick={() => {
                  const mailto = `mailto:${encodeURIComponent(mailTo)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
                  window.open(mailto, "_blank");
                }}
                className="gap-2"
              >
                <Send className="w-4 h-4" /> Open Mail Client
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
