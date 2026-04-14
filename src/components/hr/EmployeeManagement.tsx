import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, UserPlus, Search, Mail, Phone, Building2, TrendingUp, Calendar, Shield, MoreVertical, Download, Copy, AlertCircle, CheckCircle2, Clock, Activity, Edit2, Trash2, Filter, ArrowUpDown, Eye, EyeOff, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format, differenceInMonths, isToday, isTomorrow } from "date-fns";

interface EmployeeForm {
  name: string; email: string; phone: string; department: string; role: string; salary: number;
}

interface EmployeeValidationError {
  field: string;
  message: string;
}

const DEPARTMENTS = ["Production", "Quality", "R&D", "Sales", "Admin", "Logistics"];

const validateEmployeeForm = (form: EmployeeForm): EmployeeValidationError[] => {
  const errors: EmployeeValidationError[] = [];
  if (!form.name?.trim()) errors.push({ field: "name", message: "Name is required" });
  if (form.name && form.name.length < 3) errors.push({ field: "name", message: "Name must be at least 3 characters" });
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push({ field: "email", message: "Invalid email format" });
  if (!form.department) errors.push({ field: "department", message: "Department is required" });
  if (!form.role?.trim()) errors.push({ field: "role", message: "Role is required" });
  if (!form.salary || form.salary <= 0) errors.push({ field: "salary", message: "Salary must be greater than 0" });
  if (form.phone && !/^\d{10}$|^\+/.test(form.phone.replace(/\s/g, ""))) errors.push({ field: "phone", message: "Invalid phone format" });
  return errors;
};

export function EmployeeManagement() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "salary" | "tenure">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<EmployeeValidationError[]>([]);
  const [form, setForm] = useState<EmployeeForm>({ name: "", email: "", phone: "", department: "Production", role: "", salary: 0 });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: employees = [], isLoading, error: employeesError } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("name");
      if (error) throw new Error(error.message);
      return data;
    },
    retry: 2,
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
      const errors = validateEmployeeForm(emp);
      if (errors.length > 0) {
        setValidationErrors(errors);
        throw new Error("Validation failed");
      }
      const { error } = await supabase.from("employees").insert({
        name: emp.name, email: emp.email, phone: emp.phone,
        department: emp.department, role: emp.role, salary: emp.salary,
        join_date: new Date().toISOString(),
        status: "Active",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setAddOpen(false);
      setForm({ name: "", email: "", phone: "", department: "Production", role: "", salary: 0 });
      setValidationErrors([]);
      toast({ title: "Success", description: "Employee added successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to add employee", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("employees").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Success", description: "Status updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return employees
      .filter((e) => {
        const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.role?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === "all" || e.department === deptFilter;
        const matchStatus = statusFilter === "all" || e.status === statusFilter;
        return matchSearch && matchDept && matchStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") comparison = (a.name || "").localeCompare(b.name || "");
        else if (sortBy === "salary") comparison = (a.salary || 0) - (b.salary || 0);
        else if (sortBy === "tenure") {
          const aTenure = differenceInMonths(new Date(), new Date(a.join_date));
          const bTenure = differenceInMonths(new Date(), new Date(b.join_date));
          comparison = aTenure - bTenure;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [employees, search, deptFilter, statusFilter, sortBy, sortOrder]);

  const activeCount = employees.filter(e => e.status === "Active").length;
  const onLeaveCount = employees.filter(e => e.status === "On Leave").length;
  const inactiveCount = employees.filter(e => e.status === "Inactive").length;
  const onShiftToday = shifts.filter(s => s.status === "Active" || s.status === "Scheduled").length;
  const totalPayroll = employees.filter(e => e.status === "Active").reduce((s, e) => s + (e.salary || 0), 0);
  const avgSalary = activeCount > 0 ? totalPayroll / activeCount : 0;
  const deptCounts = DEPARTMENTS.map((d) => ({ dept: d, count: employees.filter((e) => e.department === d).length }));
  const avgTenure = employees.length > 0 ? (employees.reduce((s, e) => s + differenceInMonths(new Date(), new Date(e.join_date)), 0) / employees.length).toFixed(0) : "0";

  const handleSelectAll = useCallback(() => {
    if (selectedEmployees.length === filtered.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filtered.map(e => e.id));
    }
  }, [filtered, selectedEmployees]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
            <p className="text-sm text-slate-600 mt-1.5">Manage workforce information, roles, and attendance</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["employees"] })} className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-900">Add New Employee</DialogTitle>
                  <DialogDescription className="text-slate-600">Register a new employee in the system</DialogDescription>
                </DialogHeader>
                {validationErrors.length > 0 && (
                  <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm ml-2">
                      <ul className="list-disc pl-5 space-y-1">
                        {validationErrors.map((err, i) => <li key={i}>{err.message}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-5 pt-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                    <Input id="name" placeholder="e.g. Rajesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 rounded-lg border-slate-200 mt-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                      <Input id="email" type="email" placeholder="email@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 rounded-lg border-slate-200 mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</Label>
                    <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dept">Department *</Label>
                    <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                      <SelectTrigger id="dept"><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-slate-700">Role</Label>
                    <Input id="role" placeholder="e.g. Machine Operator" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-9 rounded-lg border-slate-200 mt-2" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="salary" className="text-sm font-medium text-slate-700">Monthly Salary (₹)</Label>
                  <Input id="salary" type="number" placeholder="25000" value={form.salary || ""} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} className="h-9 rounded-lg border-slate-200 mt-2" />
                </div>
                <Button className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors" disabled={addMutation.isPending} onClick={() => addMutation.mutate(form)}>
                  {addMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">
          {/* Error State */}
          {employeesError && (
            <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm ml-2">Failed to load employees. Please try again.</AlertDescription>
            </Alert>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { label: "Total Headcount", value: employees.length, sub: "workforce" },
              { label: "Active", value: activeCount, sub: `${employees.length > 0 ? (activeCount/employees.length*100).toFixed(0) : 0}%` },
              { label: "On Leave", value: onLeaveCount, sub: "employees" },
              { label: "Avg Tenure", value: `${avgTenure}m`, sub: "months" },
              { label: "Payroll", value: `₹${(totalPayroll / 100000).toFixed(1)}L`, sub: "monthly" },
            ].map((kpi) => (
              <Card key={kpi.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 sm:mt-3">{kpi.value}</p>
                  <p className="text-xs text-slate-600 mt-1 sm:mt-2">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

      {/* Filters & Controls */}
      <div className="border-b border-slate-200 bg-white/50">
        <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Filters & Search</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50" onClick={() => { setSearch(""); setDeptFilter("all"); setStatusFilter("all"); setSelectedEmployees([]); }}>
                    Clear All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset all filters</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name, role, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg border-slate-200 text-sm bg-white placeholder:text-slate-400" />
          </div>

          {/* Department Filter Pills */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Department</p>
            <div className="flex gap-2 flex-wrap">
              {["All", ...DEPARTMENTS].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept === "All" ? "all" : dept)}
                  className={`px-3 h-8 rounded-lg text-xs font-medium border transition-all ${
                    (dept === "All" ? deptFilter === "all" : deptFilter === dept)
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {dept === "All" ? `All (${employees.length})` : dept}
                </button>
              ))}
            </div>
          </div>

          {/* Status & Sort Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter" className="text-xs font-medium text-slate-600 uppercase tracking-wide">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="h-9 rounded-lg border-slate-200 mt-2 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({employees.length})</SelectItem>
                  <SelectItem value="Active">Active ({activeCount})</SelectItem>
                  <SelectItem value="On Leave">On Leave ({onLeaveCount})</SelectItem>
                  <SelectItem value="Inactive">Inactive ({inactiveCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-by" className="text-xs font-medium text-slate-600 uppercase tracking-wide">Sort By</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger id="sort-by" className="h-9 rounded-lg border-slate-200 mt-2 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="tenure">Tenure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-order" className="text-xs font-medium text-slate-600 uppercase tracking-wide">Order</Label>
              <Button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} variant="outline" className="w-full h-9 mt-2 rounded-lg border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 justify-between">
                {sortOrder === "asc" ? "Ascending" : "Descending"}
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-4 py-3 sm:px-6 md:px-8 md:py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm">
        <p className="text-slate-600">{filtered.length} of {employees.length} employee{filtered.length !== 1 ? "s" : ""}</p>
        {selectedEmployees.length > 0 && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-200 text-slate-900">{selectedEmployees.length} selected</Badge>
            <Button size="sm" className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium">Bulk Actions</Button>
          </div>
        )}
      </div>

      {/* Employee List */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-slate-600">Loading employees...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-lg p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-sm text-slate-600 mb-4">No employees match your filters.</p>
            <Button variant="outline" className="h-8 px-3 rounded-lg border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50" onClick={() => { setSearch(""); setDeptFilter("all"); setStatusFilter("all"); }}>Clear Filters</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((emp) => {
              const tenure = differenceInMonths(new Date(), new Date(emp.join_date));
              const isOnShift = shifts.some(s => s.employee_id === emp.id && (s.status === "Active" || s.status === "Scheduled"));
              const isSelected = selectedEmployees.includes(emp.id);
              const statusColor = emp.status === "Active" ? "bg-green-500" : emp.status === "On Leave" ? "bg-blue-400" : "bg-slate-400";
              return (
                <div key={emp.id} className={`group border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md hover:border-slate-300 ${isSelected ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, emp.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                    />

                    {/* Status Dot & Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-sm">
                        {emp.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{emp.name}</h3>
                        {isOnShift && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold">On Shift</Badge>}
                        {tenure < 3 && <Badge className="bg-blue-100 text-blue-700 text-[10px] font-semibold">New Hire</Badge>}
                      </div>
                      <p className="text-xs text-slate-600">{emp.role} • {emp.department}</p>
                    </div>

                    {/* Contact Info (Hidden on mobile) */}
                    <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600">
                      {emp.email && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={`mailto:${emp.email}`} className="flex items-center gap-1 hover:text-slate-900">
                                <Mail className="w-3.5 h-3.5" />
                                {emp.email.split("@")[0]}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>{emp.email}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {emp.phone && (
                        <a href={`tel:${emp.phone}`} className="flex items-center gap-1 hover:text-slate-900">
                          <Phone className="w-3.5 h-3.5" />
                          {emp.phone}
                        </a>
                      )}
                    </div>

                    {/* Metrics (Hidden on mobile) */}
                    <div className="hidden md:flex items-center gap-6 text-xs border-l border-slate-200 pl-6">
                      <div className="text-center">
                        <p className="text-slate-600 mb-1">Tenure</p>
                        <p className="font-semibold text-slate-900">{tenure < 1 ? "New" : `${tenure}m`}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600 mb-1">Salary</p>
                        <p className="font-semibold text-slate-900">₹{(emp.salary / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-xs"><Eye className="w-3 h-3 mr-2" /> View Profile</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {emp.status !== "Active" && <DropdownMenuItem className="text-xs" onClick={() => updateStatus.mutate({ id: emp.id, status: "Active" })}>Set Active</DropdownMenuItem>}
                        {emp.status !== "On Leave" && <DropdownMenuItem className="text-xs" onClick={() => updateStatus.mutate({ id: emp.id, status: "On Leave" })}>Mark On Leave</DropdownMenuItem>}
                        {emp.status !== "Inactive" && <DropdownMenuItem className="text-xs" onClick={() => updateStatus.mutate({ id: emp.id, status: "Inactive" })}>Deactivate</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
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
