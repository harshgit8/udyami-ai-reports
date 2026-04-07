import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Search, Mail, Phone, Building2, TrendingUp, Calendar, Shield, MoreVertical, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, differenceInMonths } from "date-fns";

interface EmployeeForm {
  name: string; email: string; phone: string; department: string; role: string; salary: number;
}

const DEPARTMENTS = ["Production", "Quality", "R&D", "Sales", "Admin", "Logistics"];

const STATUS_DOT: Record<string, string> = {
  Active: "bg-emerald-500",
  "On Leave": "bg-amber-500",
  Inactive: "bg-muted-foreground",
};

export function EmployeeManagement() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [form, setForm] = useState<EmployeeForm>({ name: "", email: "", phone: "", department: "Production", role: "", salary: 0 });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", "today-emp"],
    queryFn: async () => {
      const { data } = await supabase.from("shifts").select("employee_id, status").eq("shift_date", format(new Date(), "yyyy-MM-dd"));
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (emp: EmployeeForm) => {
      const { error } = await supabase.from("employees").insert({
        name: emp.name, email: emp.email, phone: emp.phone,
        department: emp.department, role: emp.role, salary: emp.salary,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setAddOpen(false);
      setForm({ name: "", email: "", phone: "", department: "Production", role: "", salary: 0 });
      toast({ title: "Employee Added", description: "New employee record created successfully." });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("employees").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Status Updated" });
    },
  });

  const filtered = employees.filter((e) => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) || e.role?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const activeCount = employees.filter(e => e.status === "Active").length;
  const onLeaveCount = employees.filter(e => e.status === "On Leave").length;
  const onShiftToday = shifts.filter(s => s.status === "Active" || s.status === "Scheduled").length;
  const totalPayroll = employees.filter(e => e.status === "Active").reduce((s, e) => s + (e.salary || 0), 0);
  const deptCounts = DEPARTMENTS.map((d) => ({ dept: d, count: employees.filter((e) => e.department === d).length }));
  const avgTenure = employees.length > 0 ? (employees.reduce((s, e) => s + differenceInMonths(new Date(), new Date(e.join_date)), 0) / employees.length).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Workforce directory & management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="hidden md:flex">
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="w-4 h-4 mr-1.5" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Full Name *</Label><Input placeholder="e.g. Rajesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input placeholder="email@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Department *</Label>
                    <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Role *</Label><Input placeholder="e.g. Machine Operator" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
                </div>
                <div><Label>Monthly Salary (₹) *</Label><Input type="number" placeholder="25000" value={form.salary || ""} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></div>
                <Button className="w-full" disabled={!form.name || !form.role || !form.salary} onClick={() => addMutation.mutate(form)}>
                  {addMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Headcount", value: employees.length, sub: `${activeCount} active`, color: "text-foreground" },
          { label: "On Shift Today", value: onShiftToday, sub: `${onLeaveCount} on leave`, color: "text-emerald-600" },
          { label: "Avg Tenure", value: `${avgTenure}m`, sub: "months", color: "text-blue-600" },
          { label: "Monthly Payroll", value: `₹${(totalPayroll / 100000).toFixed(1)}L`, sub: "active employees", color: "text-amber-600" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department chips */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setDeptFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${deptFilter === "all" ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
          All ({employees.length})
        </button>
        {deptCounts.map(({ dept, count }) => (
          <button key={dept} onClick={() => setDeptFilter(deptFilter === dept ? "all" : dept)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${deptFilter === dept ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
            {dept} ({count})
          </button>
        ))}
      </div>

      {/* Search + Status filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, role, or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} employee{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Employee list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No employees match your filters.</div>
        ) : filtered.map((emp) => {
          const tenure = differenceInMonths(new Date(), new Date(emp.join_date));
          const isOnShift = shifts.some(s => s.employee_id === emp.id && (s.status === "Active" || s.status === "Scheduled"));
          return (
            <Card key={emp.id} className="group hover:shadow-sm transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {emp.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${STATUS_DOT[emp.status] || "bg-muted-foreground"}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{emp.name}</p>
                    {isOnShift && <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600">On Shift</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{emp.role} · {emp.department}</p>
                </div>

                {/* Contact */}
                <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
                  {emp.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</span>}
                  {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>}
                </div>

                {/* Tenure */}
                <div className="hidden md:block text-xs text-center">
                  <p className="text-muted-foreground">Tenure</p>
                  <p className="font-medium">{tenure < 1 ? "New" : `${tenure}m`}</p>
                </div>

                {/* Salary */}
                <div className="text-right min-w-[80px]">
                  <p className="font-semibold text-sm">₹{emp.salary?.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-muted-foreground">/month</p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {emp.status !== "Active" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: emp.id, status: "Active" })}>Set Active</DropdownMenuItem>}
                    {emp.status !== "On Leave" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: emp.id, status: "On Leave" })}>Mark On Leave</DropdownMenuItem>}
                    {emp.status !== "Inactive" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: emp.id, status: "Inactive" })}>Deactivate</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
