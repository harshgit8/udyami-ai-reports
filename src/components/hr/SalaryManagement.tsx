import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, TrendingUp, CheckCircle2, Clock, Download, AlertCircle, Banknote } from "lucide-react";

const MONTHS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
];

export function SalaryManagement() {
  const [monthFilter, setMonthFilter] = useState("2026-04");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["salary_records", monthFilter],
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_records").select("*, employees(name, department, role)").eq("month", monthFilter).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_records").update({ status: "Paid", paid_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_records"] });
      toast({ title: "Payment Processed", description: "Salary marked as paid." });
    },
  });

  const markAllPaid = useMutation({
    mutationFn: async () => {
      const pendingIds = records.filter(r => r.status === "Pending").map(r => r.id);
      for (const id of pendingIds) {
        await supabase.from("salary_records").update({ status: "Paid", paid_at: new Date().toISOString() }).eq("id", id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_records"] });
      toast({ title: "Bulk Payment", description: "All pending salaries marked as paid." });
    },
  });

  const filtered = records.filter(r => statusFilter === "all" || r.status === statusFilter);
  const totalPayroll = records.reduce((s, r) => s + (r.net_pay || 0), 0);
  const totalPaid = records.filter(r => r.status === "Paid").reduce((s, r) => s + (r.net_pay || 0), 0);
  const paidCount = records.filter((r) => r.status === "Paid").length;
  const pendingCount = records.filter((r) => r.status === "Pending").length;
  const totalBonus = records.reduce((s, r) => s + (r.bonus || 0), 0);
  const totalDeductions = records.reduce((s, r) => s + (r.deductions || 0), 0);
  const progressPct = records.length > 0 ? (paidCount / records.length) * 100 : 0;

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly salary processing & disbursement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="hidden md:flex">
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Payroll</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalPayroll)}</p>
            <p className="text-[11px] text-muted-foreground">{records.length} employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Disbursed</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{fmt(totalPaid)}</p>
            <p className="text-[11px] text-muted-foreground">{paidCount} paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Pending</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{fmt(totalPayroll - totalPaid)}</p>
            <p className="text-[11px] text-muted-foreground">{pendingCount} remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Bonuses / Deductions</p>
            <p className="text-sm font-bold mt-1">
              <span className="text-emerald-600">+{fmt(totalBonus)}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-destructive">-{fmt(totalDeductions)}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">net adjustments</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Disbursement Progress</p>
            <p className="text-sm font-semibold">{progressPct.toFixed(0)}%</p>
          </div>
          <Progress value={progressPct} className="h-2" />
          <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
            <span>{paidCount} of {records.length} processed</span>
            {pendingCount > 0 && (
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => markAllPaid.mutate()} disabled={markAllPaid.isPending}>
                <Banknote className="w-3 h-3 mr-1" /> Process All Pending
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: "all", label: `All (${records.length})` },
          { value: "Pending", label: `Pending (${pendingCount})` },
          { value: "Paid", label: `Paid (${paidCount})` },
        ].map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === f.value ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Salary records */}
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading payroll data...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <IndianRupee className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No salary records for this period.</p>
            </CardContent>
          </Card>
        ) : filtered.map((rec) => {
          const emp = rec.employees as any;
          return (
            <Card key={rec.id} className="group hover:shadow-sm transition-all">
              <CardContent className="p-3 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  {emp?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{emp?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{emp?.role} · {emp?.department}</p>
                </div>

                {/* Breakdown */}
                <div className="hidden md:grid grid-cols-3 gap-6 text-xs text-center">
                  <div>
                    <p className="text-muted-foreground">Base</p>
                    <p className="font-medium">{fmt(rec.base_salary)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bonus</p>
                    <p className="font-medium text-emerald-600">+{fmt(rec.bonus)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deductions</p>
                    <p className="font-medium text-destructive">-{fmt(rec.deductions)}</p>
                  </div>
                </div>

                {/* Net pay */}
                <div className="text-right min-w-[90px]">
                  <p className="font-bold text-sm">{fmt(rec.net_pay)}</p>
                  <Badge variant={rec.status === "Paid" ? "default" : "secondary"} className="text-[10px]">
                    {rec.status === "Paid" ? "✓ Paid" : "Pending"}
                  </Badge>
                </div>

                {/* Action */}
                {rec.status === "Pending" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs opacity-70 group-hover:opacity-100 transition-opacity" onClick={() => markPaid.mutate(rec.id)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Pay
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
