import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserPlus, Search, Phone, Mail, MapPin, TrendingUp, CalendarCheck, Download, CheckCircle2, AlertCircle, MoreVertical, Users, Briefcase, Clock, Filter, RefreshCw, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";

const SEGMENTS = ["Enterprise", "Mid-Market", "SMB", "New"];
const STATUSES = ["Active", "Prospect", "Inactive"];
const FOLLOWUP_TYPES = ["Call", "Email", "Meeting", "Visit"];

// Form validation
const validateCustomerForm = (form: any) => {
  const errors: string[] = [];
  if (!form.company_name?.trim()) errors.push("Company name is required");
  if (form.company_name?.trim().length < 2) errors.push("Company name must be at least 2 characters");
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push("Invalid email format");
  if (form.phone && !/^[0-9\s\-\+\(\)]{10,}$/.test(form.phone)) errors.push("Invalid phone format (at least 10 digits)");
  return errors;
};

export function CustomerManagement() {
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [form, setForm] = useState({ company_name: "", contact_person: "", email: "", phone: "", address: "", segment: "New", notes: "" });
  const [followupForm, setFollowupForm] = useState({ subject: "", type: "Call", notes: "", due_date: format(new Date(), "yyyy-MM-dd") });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["followups", selectedCustomer],
    queryFn: async () => {
      let q = supabase.from("customer_followups").select("*, customers(company_name)").order("due_date");
      if (selectedCustomer) q = q.eq("customer_id", selectedCustomer);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const addCustomer = useMutation({
    mutationFn: async () => {
      const errors = validateCustomerForm(form);
      if (errors.length > 0) {
        setFormErrors(errors);
        throw new Error("Validation failed");
      }
      const { error } = await supabase.from("customers").insert({ ...form, status: "Prospect" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setAddOpen(false);
      setForm({ company_name: "", contact_person: "", email: "", phone: "", address: "", segment: "New", notes: "" });
      setFormErrors([]);
      toast({ title: "Customer Added", description: "New customer has been added successfully" });
    },
    onError: (error) => {
      if (error.message !== "Validation failed") {
        toast({ title: "Error", description: error.message || "Failed to add customer", variant: "destructive" });
      }
    },
  });

  const addFollowup = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error("No customer selected");
      if (!followupForm.subject?.trim()) throw new Error("Subject is required");
      const { error } = await supabase.from("customer_followups").insert({
        customer_id: selectedCustomer,
        subject: followupForm.subject,
        type: followupForm.type,
        notes: followupForm.notes,
        due_date: followupForm.due_date,
        status: "Pending",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      setFollowupOpen(false);
      setFollowupForm({ subject: "", type: "Call", notes: "", due_date: format(new Date(), "yyyy-MM-dd") });
      toast({ title: "Follow-up Scheduled", description: "Follow-up has been created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to schedule follow-up", variant: "destructive" });
    },
  });

  const completeFollowup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_followups").update({ status: "Completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      toast({ title: "Follow-up Completed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCustomerStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("customers").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer Updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch = c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.contact_person?.toLowerCase().includes(search.toLowerCase());
      const matchSeg = segFilter === "all" || c.segment === segFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchSeg && matchStatus;
    });
  }, [customers, search, segFilter, statusFilter]);

  const totalRevenue = useMemo(() => customers.reduce((s, c) => s + (c.total_revenue || 0), 0), [customers]);
  const totalOrders = useMemo(() => customers.reduce((s, c) => s + (c.total_orders || 0), 0), [customers]);
  const activeCustomers = useMemo(() => customers.filter(c => c.status === "Active").length, [customers]);
  const prospectCount = useMemo(() => customers.filter(c => c.status === "Prospect").length, [customers]);
  const pendingFollowups = useMemo(() => followups.filter((f) => f.status !== "Completed"), [followups]);
  const overdueFollowups = useMemo(() => pendingFollowups.filter(f => isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date))), [pendingFollowups]);

  const SEGMENT_COLORS: Record<string, string> = {
    Enterprise: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    "Mid-Market": "bg-purple-500/10 text-purple-700 border-purple-500/20",
    SMB: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
    New: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  };

  const selectedCustData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Customer Relationship Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} customers · {activeCustomers} active · ₹{(totalRevenue / 100000).toFixed(1)}L lifetime revenue</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="hidden md:flex"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
            </TooltipTrigger>
            <TooltipContent>Export customer list</TooltipContent>
          </Tooltip>
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setFormErrors([]); }}>
            <DialogTrigger asChild><Button size="sm"><UserPlus className="w-4 h-4 mr-1.5" /> Add Customer</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Create a new customer record with contact information and segment</DialogDescription>
              </DialogHeader>
              {formErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {formErrors.map((err, i) => <li key={i} className="text-sm">{err}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input id="company" placeholder="e.g. PowerCable Industries" value={form.company_name} onChange={(e) => { setForm({ ...form, company_name: e.target.value }); setFormErrors([]); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input id="contact" placeholder="Full name" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="segment">Segment</Label>
                    <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                      <SelectTrigger id="segment"><SelectValue /></SelectTrigger>
                      <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="name@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+91 12345 67890" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
                </div>
                <Button className="w-full" disabled={!form.company_name || addCustomer.isPending} onClick={() => addCustomer.mutate()}>
                  {addCustomer.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs - 5 metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, color: "text-blue-600" },
          { label: "Active", value: activeCustomers, icon: CheckCircle2, color: "text-emerald-600", sub: `${prospectCount} prospects` },
          { label: "Lifetime Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: TrendingUp, color: "text-purple-600" },
          { label: "Pending Follow-ups", value: pendingFollowups.length, icon: Clock, color: overdueFollowups.length > 0 ? "text-destructive" : "text-amber-600", sub: `${overdueFollowups.length} overdue` },
          { label: "Avg Order Value", value: totalOrders > 0 ? `₹${((totalRevenue / totalOrders) / 1000).toFixed(0)}K` : "—", icon: Briefcase, color: "text-indigo-600" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{kpi.value}</p>
                  {kpi.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>}
                </div>
                <kpi.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.color} opacity-70 flex-shrink-0 ml-1`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Search Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters & Search
              </h3>
              {(segFilter !== "all" || statusFilter !== "all" || search) && (
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setSegFilter("all"); setStatusFilter("all"); setSearch(""); }}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-9 h-9" 
                placeholder="Search company or contact..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Segment</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSegFilter("all")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${segFilter === "all" ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
                  All ({customers.length})
                </button>
                {SEGMENTS.map((s) => (
                  <button key={s} onClick={() => setSegFilter(segFilter === s ? "all" : s)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${segFilter === s ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
                    {s} ({customers.filter((c) => c.segment === s).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "all", label: `All (${customers.length})` },
                  { value: "Active", label: `Active (${activeCustomers})`, color: "border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30" },
                  { value: "Prospect", label: `Prospect (${prospectCount})`, color: "border-blue-500/30 bg-blue-50/50 text-blue-700 dark:bg-blue-950/30" },
                ].map(s => (
                  <button key={s.value} onClick={() => setStatusFilter(s.value)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                      statusFilter === s.value 
                        ? "bg-foreground text-background border-foreground" 
                        : `border-border hover:bg-accent/50 ${s.color || ""}`
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground font-medium">{filtered.length} of {customers.length} customers</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh customer list</TooltipContent>
            </Tooltip>
          </div>
          
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No customers match your filters.</p>
                {(segFilter !== "all" || statusFilter !== "all") && (
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => { setSegFilter("all"); setStatusFilter("all"); }}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((cust) => (
                <Card 
                  key={cust.id}
                  className={`group cursor-pointer transition-all ${selectedCustomer === cust.id ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"}`}
                  onClick={() => setSelectedCustomer(selectedCustomer === cust.id ? null : cust.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Avatar & Basic Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 to-primary/60 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {cust.company_name?.slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{cust.company_name}</p>
                          <Badge variant="outline" className={`text-[9px] whitespace-nowrap ${cust.segment === "Enterprise" ? "border-blue-500/30 bg-blue-50/50 text-blue-700 dark:bg-blue-950/30" : cust.segment === "Mid-Market" ? "border-purple-500/30 bg-purple-50/50 text-purple-700 dark:bg-purple-950/30" : cust.segment === "SMB" ? "border-cyan-500/30 bg-cyan-50/50 text-cyan-700 dark:bg-cyan-950/30" : "border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30"}`}>
                            {cust.segment}
                          </Badge>
                          <Badge variant={cust.status === "Active" ? "default" : "secondary"} className="text-[9px] whitespace-nowrap">
                            {cust.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {cust.contact_person && <p>{cust.contact_person}</p>}
                          {cust.phone && <span>·</span>}
                          {cust.phone && <p className="truncate">{cust.phone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Revenue & Orders (hidden on mobile) */}
                    <div className="hidden md:block text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                      <p className="font-semibold">₹{(cust.total_revenue || 0).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">{cust.total_orders} orders</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {STATUSES.filter(s => s !== cust.status).map(s => (
                            <DropdownMenuItem 
                              key={s} 
                              onClick={(e) => { e.stopPropagation(); updateCustomerStatus.mutate({ id: cust.id, status: s }); }}
                            >
                              Set {s}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="w-3.5 h-3.5 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="w-3.5 h-3.5 mr-2" />
                            Call Customer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Follow-ups panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  Follow-ups
                  {overdueFollowups.length > 0 && <Badge variant="destructive" className="text-[9px] ml-2">{overdueFollowups.length} overdue</Badge>}
                </h3>
                {selectedCustomer && (
                  <Dialog open={followupOpen} onOpenChange={(open) => { setFollowupOpen(open); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 text-xs"><Clock className="w-3 h-3 mr-1" /> Schedule</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Schedule Follow-up</DialogTitle>
                        <DialogDescription>Schedule a follow-up for {selectedCustData?.company_name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div>
                          <Label htmlFor="subject">Subject *</Label>
                          <Input 
                            id="subject"
                            placeholder="e.g. Discuss Q2 order" 
                            value={followupForm.subject} 
                            onChange={e => setFollowupForm({ ...followupForm, subject: e.target.value })} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="type">Type</Label>
                            <Select value={followupForm.type} onValueChange={v => setFollowupForm({ ...followupForm, type: v })}>
                              <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                              <SelectContent>{FOLLOWUP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="duedate">Due Date</Label>
                            <Input 
                              id="duedate"
                              type="date" 
                              value={followupForm.due_date} 
                              onChange={e => setFollowupForm({ ...followupForm, due_date: e.target.value })} 
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea 
                            id="notes"
                            placeholder="Any additional notes..." 
                            value={followupForm.notes} 
                            onChange={e => setFollowupForm({ ...followupForm, notes: e.target.value })} 
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                        <Button className="w-full" disabled={!followupForm.subject || addFollowup.isPending} onClick={() => addFollowup.mutate()}>
                          {addFollowup.isPending ? "Scheduling..." : "Schedule Follow-up"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {!selectedCustomer && <p className="text-xs text-muted-foreground text-center py-4">Select a customer to view follow-ups</p>}
            </CardContent>
          </Card>

          {selectedCustomer && (
            <ScrollArea className="max-h-[400px] border rounded-lg">
              <div className="space-y-2 p-4">
                {followups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No follow-ups scheduled.</p>
                ) : followups.map((f) => {
                  const isOverdue = f.status !== "Completed" && isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date));
                  const isDueToday = f.status !== "Completed" && isToday(new Date(f.due_date));
                  return (
                    <Card key={f.id} className={`group ${isOverdue ? "border-destructive/40 bg-destructive/5" : isDueToday ? "border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20" : ""}`}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[8px] whitespace-nowrap">{f.type}</Badge>
                            {isOverdue && <Badge variant="destructive" className="text-[8px]">Overdue</Badge>}
                            {isDueToday && <Badge className="text-[8px] bg-amber-500/10 text-amber-700 border-amber-500/20" variant="outline">Today</Badge>}
                          </div>
                          <Badge 
                            variant={f.status === "Completed" ? "default" : "secondary"} 
                            className={`text-[8px] whitespace-nowrap ${f.status === "Completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"}`}
                          >
                            {f.status === "Completed" ? "✓ Done" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{f.subject}</p>
                        {f.notes && <p className="text-[10px] text-muted-foreground">{f.notes}</p>}
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <p className="text-[9px] text-muted-foreground">Due: {format(new Date(f.due_date), "MMM d, yyyy")}</p>
                          {f.status !== "Completed" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 text-[9px]"
                                  onClick={() => completeFollowup.mutate(f.id)}
                                  disabled={completeFollowup.isPending}
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Complete
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mark as completed</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
