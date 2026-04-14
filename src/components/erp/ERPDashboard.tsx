import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Activity, Users, Factory, ShieldCheck, FileText, TrendingUp, Clock, AlertTriangle, CheckCircle2, Package, IndianRupee, BarChart3, Building2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export function ERPDashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => { const { data } = await supabase.from("employees").select("*"); return data || []; },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", "today-erp"],
    queryFn: async () => {
      const { data } = await supabase.from("shifts").select("*, employees(name, department, role)").eq("shift_date", format(new Date(), "yyyy-MM-dd")).order("start_time");
      return data || [];
    },
  });

  const { data: prodResults = [] } = useQuery({
    queryKey: ["erp-production"],
    queryFn: async () => { const { data } = await supabase.from("productionresult").select("*").order("created_at", { ascending: false }).limit(10); return data || []; },
  });

  const { data: qualityResults = [] } = useQuery({
    queryKey: ["erp-quality"],
    queryFn: async () => { const { data } = await supabase.from("qualityresult").select("*").order("created_at", { ascending: false }).limit(10); return data || []; },
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => { const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(25); return data || []; },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => { const { data } = await supabase.from("customers").select("*"); return data || []; },
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["erp-quotations"],
    queryFn: async () => { const { data } = await supabase.from("quotationresult").select("*").order("created_at", { ascending: false }).limit(10); return data || []; },
  });

  const activeShifts = shifts.filter((s: any) => s.status === "Active").length;
  const scheduledShifts = shifts.filter((s: any) => s.status === "Scheduled").length;
  const completedShifts = shifts.filter((s: any) => s.status === "Completed").length;
  const activeEmployees = employees.filter((e: any) => e.status === "Active").length;
  const qualityAccepted = qualityResults.filter((q: any) => q.decision === "ACCEPTED").length;
  const qualityIssues = qualityResults.filter((q: any) => q.decision === "REJECTED" || q.decision === "CONDITIONAL ACCEPT").length;
  const prodProceeding = prodResults.filter((p: any) => p.decision === "PROCEED").length;
  const prodDelays = prodResults.filter((p: any) => p.decision === "DELAY").length;
  const totalRevenue = customers.reduce((s: number, c: any) => s + (c.total_revenue || 0), 0);
  const totalOrders = customers.reduce((s: number, c: any) => s + (c.total_orders || 0), 0);
  const qualityRate = qualityResults.length > 0 ? ((qualityAccepted / qualityResults.length) * 100).toFixed(0) : "0";
  const prodEfficiency = prodResults.length > 0 ? ((prodProceeding / prodResults.length) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">ERP Operations Center</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time operational intelligence · {format(new Date(), "EEEE, MMM d, yyyy · h:mm a")}</p>
      </div>

      {/* Live status bar */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-3 flex items-center gap-3 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-sm font-medium">All Systems Operational</span>
          <span className="text-xs text-muted-foreground sm:ml-auto">{activeShifts} active shifts · {activeEmployees} employees on duty</span>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Workforce", value: activeEmployees, sub: `of ${employees.length}`, icon: Users, color: "text-blue-600" },
          { label: "Active Shifts", value: activeShifts, sub: `${scheduledShifts} upcoming`, icon: Clock, color: "text-emerald-600" },
          { label: "Production", value: prodResults.length, sub: `${prodDelays} delayed`, icon: Factory, color: "text-purple-600" },
          { label: "Quality Rate", value: `${qualityRate}%`, sub: `${qualityResults.length} inspected`, icon: ShieldCheck, color: "text-cyan-600" },
          { label: "Revenue", value: `₹${(totalRevenue / 100000).toFixed(0)}L`, sub: `${totalOrders} orders`, icon: IndianRupee, color: "text-amber-600" },
          { label: "Customers", value: customers.length, sub: `${customers.filter(c => c.status === "Active").length} active`, icon: Building2, color: "text-foreground" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Efficiency bars */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-2"><Factory className="w-4 h-4" /> Production Efficiency</p>
              <span className="text-sm font-bold">{prodEfficiency}%</span>
            </div>
            <Progress value={Number(prodEfficiency)} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-1.5">{prodProceeding} proceeding · {prodDelays} delayed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Quality Pass Rate</p>
              <span className="text-sm font-bold">{qualityRate}%</span>
            </div>
            <Progress value={Number(qualityRate)} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-1.5">{qualityAccepted} accepted · {qualityIssues} issues</p>
          </CardContent>
        </Card>
      </div>

      {/* 3-column: Shifts, Production, Quality */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Live shifts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Today's Shifts
              <Badge variant="outline" className="text-[9px] ml-auto">{shifts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-1.5">
                {shifts.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No shifts today</p> : shifts.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "Active" ? "bg-emerald-500 animate-pulse" : s.status === "Scheduled" ? "bg-blue-400" : "bg-muted-foreground/40"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.employees?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.start_time}–{s.end_time} · {s.shift_type}</p>
                    </div>
                    <Badge variant={s.status === "Active" ? "default" : "secondary"} className="text-[8px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Production */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Factory className="w-4 h-4" /> Recent Production
              {prodDelays > 0 && <Badge variant="destructive" className="text-[9px] ml-auto">{prodDelays} delayed</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-1.5">
                {prodResults.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.decision === "PROCEED" ? "bg-emerald-500" : p.decision === "DELAY" ? "bg-amber-500" : "bg-destructive"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{p.order_id}</p>
                      <p className="text-[10px] text-muted-foreground">{p.machine} · Risk: {p.risk_score}%</p>
                    </div>
                    <Badge variant={p.decision === "PROCEED" ? "default" : "destructive"} className="text-[8px]">{p.decision}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Audit trail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Audit Trail
              <Badge variant="outline" className="text-[9px] ml-auto">{auditLogs.length} entries</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-1.5">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No audit logs. Actions will appear here in real-time.</p>
                ) : auditLogs.map((log: any) => (
                  <div key={log.id} className="p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[8px]">{log.action}</Badge>
                      <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                    </div>
                    {log.entity && <p className="text-[10px] text-muted-foreground mt-0.5">{log.entity} {log.entity_id ? `#${String(log.entity_id).slice(0, 8)}` : ""}</p>}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quality Intelligence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Quality Intelligence — Latest Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {qualityResults.slice(0, 5).map((q: any) => (
              <div key={q.id} className={`p-3 rounded-xl border ${q.decision === "ACCEPTED" ? "border-emerald-500/20 bg-emerald-500/5" : q.decision === "REJECTED" ? "border-destructive/20 bg-destructive/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium">{q.batch_id || q.inspection_id}</p>
                  <Badge variant={q.decision === "ACCEPTED" ? "default" : "destructive"} className="text-[8px]">{q.decision}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{q.product_type}</p>
                <div className="flex justify-between mt-1.5 text-[10px]">
                  <span>Defect: {q.defect_rate}%</span>
                  <span className={q.risk_level === "HIGH" ? "text-destructive font-medium" : ""}>{q.risk_level}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Quotations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Recent Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {quotations.slice(0, 5).map((q: any) => (
              <div key={q.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{q.customer || "N/A"} — {q.product}</p>
                  <p className="text-[10px] text-muted-foreground">Qty: {q.quantity} · Lead: {q.lead_time_days}d · Margin: {q.profit_margin}%</p>
                </div>
                <p className="text-sm font-bold">₹{(q.grand_total || 0).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
