import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, IndianRupee, TrendingDown, Edit2, Trash2, Search, PieChart, BarChart3, AlertCircle } from "lucide-react";

const DEPARTMENTS = ["Production", "Quality", "R&D", "Sales", "Admin", "Logistics"];

export function AdminPanel() {
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("name");
      return data || [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: salaryRecords = [] } = useQuery({
    queryKey: ["salary_records", "2026-04"],
    queryFn: async () => {
      const { data } = await supabase.from("salary_records").select("*, employees(name, department)").eq("month", "2026-04");
      return data || [];
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async (emp: any) => {
      const { error } = await supabase.from("employees").update({
        name: emp.name, role: emp.role, department: emp.department,
        salary: emp.salary, status: emp.status, email: emp.email, phone: emp.phone,
        updated_at: new Date().toISOString(),
      }).eq("id", emp.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditOpen(false);
      toast({ title: "Employee Updated" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Employee Removed" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return employees.filter((e: any) =>
      !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  const totalPayroll = employees.filter((e: any) => e.status === "Active").reduce((s: number, e: any) => s + (e.salary || 0), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => { map[e.category] = (map[e.category] || 0) + (e.amount || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Shield className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Control Panel</h2>
          <p className="text-sm text-muted-foreground">Manage employees, wages, expenses, and operations</p>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: employees.length, icon: Users },
          { label: "Monthly Payroll", value: fmt(totalPayroll), icon: IndianRupee },
          { label: "Total Expenses", value: fmt(totalExpenses), icon: TrendingDown },
          { label: "Avg Salary", value: fmt(employees.length > 0 ? totalPayroll / employees.filter((e: any) => e.status === 'Active').length : 0), icon: BarChart3 },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employee Admin</TabsTrigger>
          <TabsTrigger value="expenses">Expense Tracker</TabsTrigger>
          <TabsTrigger value="salary">Salary Admin</TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filtered.map((emp: any) => (
                <Card key={emp.id} className="group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {emp.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.role} · {emp.department}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold">{fmt(emp.salary || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">/month</p>
                    </div>
                    <Badge variant={emp.status === "Active" ? "default" : "secondary"} className="text-[10px]">{emp.status}</Badge>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditForm({ ...emp }); setEditOpen(true); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => {
                        if (confirm(`Remove ${emp.name}?`)) deleteEmployee.mutate(emp.id);
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4" /> Expense Breakdown — Where Money Goes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseByCategory.map(([cat, amt]) => {
                  const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium truncate">{cat}</div>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-24 text-right text-xs font-semibold">{fmt(amt)}</div>
                      <div className="w-12 text-right text-[10px] text-muted-foreground">{pct.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-1.5">
                  {expenses.map((exp: any) => (
                    <div key={exp.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{exp.description}</p>
                        <p className="text-[10px] text-muted-foreground">{exp.category} · {exp.date}</p>
                      </div>
                      <p className="text-sm font-bold">{fmt(exp.amount)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALARY ADMIN TAB */}
        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">April 2026 — Salary Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1.5">
                  {salaryRecords.map((rec: any) => {
                    const emp = rec.employees as any;
                    return (
                      <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{emp?.name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{emp?.department}</p>
                        </div>
                        <div className="hidden md:flex gap-6 text-[10px]">
                          <div className="text-center">
                            <p className="text-muted-foreground">Base</p>
                            <p className="font-semibold">{fmt(rec.base_salary)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Bonus</p>
                            <p className="font-semibold text-emerald-600">+{fmt(rec.bonus)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Deductions</p>
                            <p className="font-semibold text-destructive">-{fmt(rec.deductions)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{fmt(rec.net_pay)}</p>
                        </div>
                        <Badge variant={rec.status === "Paid" ? "default" : "secondary"} className="text-[9px]">
                          {rec.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details, role, or salary</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-9 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Department</Label>
                  <Select value={editForm.department} onValueChange={v => setEditForm({ ...editForm, department: v })}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="h-9 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Salary (₹/month)</Label>
                  <Input type="number" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: Number(e.target.value) })} className="h-9 mt-1" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="h-9 mt-1" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="h-9 mt-1" />
                </div>
              </div>
              <Button className="w-full" onClick={() => updateEmployee.mutate(editForm)} disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
