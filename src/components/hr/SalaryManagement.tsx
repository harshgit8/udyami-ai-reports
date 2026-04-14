import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, TrendingUp, CheckCircle2, Clock, Download, AlertCircle, Banknote, Eye, EyeOff, RefreshCw, FileText, Calculator, Filter, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

const MONTHS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
];

export function SalaryManagement() {
  const [monthFilter, setMonthFilter] = useState("2026-04");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSalaries, setShowSalaries] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: records = [], isLoading, error: recordsError } = useQuery({
    queryKey: ["salary_records", monthFilter],
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_records").select("*, employees(name, department, role)").eq("month", monthFilter).order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
    retry: 2,
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_records").update({ status: "Paid", paid_at: new Date().toISOString(), payment_method: "Bank Transfer" }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_records"] });
      toast({ title: "Success", description: "Salary marked as paid." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to process payment", variant: "destructive" });
    },
  });

  const markAllPaid = useMutation({
    mutationFn: async () => {
      const pendingIds = records.filter(r => r.status === "Pending").map(r => r.id);
      if (pendingIds.length === 0) throw new Error("No pending salaries to process");
      for (const id of pendingIds) {
        const { error } = await supabase.from("salary_records").update({ status: "Paid", paid_at: new Date().toISOString(), payment_method: "Bank Transfer" }).eq("id", id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_records"] });
      toast({ title: "Success", description: `Processed ${records.filter(r => r.status === "Pending").length} payments successfully.` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to process bulk payment", variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchSearch = !searchTerm || (r.employees as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [records, statusFilter, searchTerm]);

  const totalPayroll = records.reduce((s, r) => s + (r.net_pay || 0), 0);
  const totalPaid = records.filter(r => r.status === "Paid").reduce((s, r) => s + (r.net_pay || 0), 0);
  const paidCount = records.filter((r) => r.status === "Paid").length;
  const pendingCount = records.filter((r) => r.status === "Pending").length;
  const totalBonus = records.reduce((s, r) => s + (r.bonus || 0), 0);
  const totalDeductions = records.reduce((s, r) => s + (r.deductions || 0), 0);
  const progressPct = records.length > 0 ? (paidCount / records.length) * 100 : 0;
  const avgSalary = records.length > 0 ? totalPayroll / records.length : 0;

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
            <p className="text-sm text-slate-600 mt-1.5">Enterprise salary processing &amp; disbursement system</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["salary_records"] })} className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => setShowSalaries(!showSalaries)} className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600">
                    {showSalaries ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showSalaries ? "Hide" : "Show"} amounts</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 w-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">

          {/* Error State */}
          {recordsError && (
            <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm ml-2">Failed to load salary records. Please try again.</AlertDescription>
            </Alert>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { label: "Total Payroll", value: showSalaries ? fmt(totalPayroll) : "••••••", sub: `${records.length} employees` },
              { label: "Disbursed", value: showSalaries ? fmt(totalPaid) : "••••••", sub: `${paidCount} processed` },
              { label: "Pending", value: showSalaries ? fmt(totalPayroll - totalPaid) : "••••••", sub: `${pendingCount} remaining` },
              { label: "Avg Salary", value: showSalaries ? fmt(avgSalary) : "••••••", sub: "per employee" },
              { label: "Adjustments", value: showSalaries ? `+${fmt(totalBonus)}` : "••••", sub: `bonus / deductions` },
            ].map((kpi) => (
              <Card key={kpi.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl sm:text-3xl font-bold text-slate-900 mt-2 sm:mt-3">{kpi.value}</p>
                  <p className="text-xs text-slate-600 mt-1 sm:mt-2">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="border border-slate-200 rounded-lg p-6 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">Disbursement Progress</h3>
                <p className="text-3xl font-bold text-emerald-600">{progressPct.toFixed(1)}%</p>
              </div>
              <Progress value={progressPct} className="h-2 bg-slate-100" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <p className="text-slate-600 font-medium mb-1">Processed</p>
                  <p className="font-semibold text-slate-900 text-sm">{paidCount} / {records.length}</p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium mb-1">Remaining</p>
                  <p className="font-semibold text-slate-900 text-sm">{pendingCount}</p>
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-end">
                    <Button size="sm" className="w-full h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium" onClick={() => markAllPaid.mutate()} disabled={markAllPaid.isPending}>
                      {markAllPaid.isPending ? "Processing..." : "Process All"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="border-b border-slate-200 bg-white/50">
            <div className="px-4 py-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Filters & Search</h2>
                {(statusFilter !== "all" || searchTerm) && (
                  <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
                    Clear All
                  </Button>
                )}
              </div>
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 rounded-lg border-slate-200 bg-white text-sm placeholder:text-slate-400"
              />
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "all", label: `All (${records.length})` },
                  { value: "Pending", label: `Pending (${pendingCount})` },
                  { value: "Paid", label: `Paid (${paidCount})` },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 h-8 rounded-lg text-xs font-medium border transition-all ${
                      statusFilter === f.value
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Salary records */}
          <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground/50 mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading payroll data...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <IndianRupee className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">No salary records match your filters.</p>
              {(statusFilter !== "all" || searchTerm) && (
                <Button size="sm" variant="outline" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">{filtered.length} of {records.length} records</p>
            {filtered.map((rec) => {
              const emp = rec.employees as any;
              return (
                <Card key={rec.id} className="group hover:shadow-md transition-all duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary/60 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {emp?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{emp?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp?.role} • {emp?.department}</p>
                        </div>
                      </div>

                      {/* Breakdown (hidden on mobile) */}
                      <div className="hidden lg:grid grid-cols-3 gap-6 text-xs flex-shrink-0">
                        <div className="text-center">
                          <p className="text-muted-foreground font-medium">Base</p>
                          <p className="font-semibold text-foreground">{showSalaries ? fmt(rec.base_salary) : "••••"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground font-medium">Bonus</p>
                          <p className="font-semibold text-emerald-600">{showSalaries ? `+${fmt(rec.bonus)}` : "••••"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground font-medium">Deductions</p>
                          <p className="font-semibold text-destructive">{showSalaries ? `-${fmt(rec.deductions)}` : "••••"}</p>
                        </div>
                      </div>

                      {/* Net Pay & Status */}
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-medium hidden sm:block">Net Pay</p>
                          <p className="text-sm sm:text-base font-bold text-foreground">{showSalaries ? fmt(rec.net_pay) : "••••"}</p>
                        </div>
                        <Badge 
                          variant={rec.status === "Paid" ? "default" : "secondary"}
                          className={`text-xs whitespace-nowrap hidden sm:flex ${
                            rec.status === "Paid" 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" 
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                          }`}
                        >
                          {rec.status === "Paid" ? "✓ Paid" : "⏳ Pending"}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {rec.status === "Pending" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 text-xs gap-1" 
                                onClick={() => markPaid.mutate(rec.id)} 
                                disabled={markPaid.isPending}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> 
                                <span className="hidden sm:inline">Pay</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark as paid</TooltipContent>
                          </Tooltip>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {rec.status !== "Paid" && (
                            <>
                              <DropdownMenuItem onClick={() => markPaid.mutate(rec.id)}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem>
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Download Slip
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
