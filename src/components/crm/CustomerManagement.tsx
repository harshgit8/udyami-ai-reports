import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserPlus, Search, Phone, Mail, MapPin, TrendingUp, CalendarCheck, Download, CheckCircle2, AlertCircle, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";

const SEGMENTS = ["Enterprise", "Mid-Market", "SMB", "New"];
const STATUSES = ["Active", "Prospect", "Inactive"];
const FOLLOWUP_TYPES = ["Call", "Email", "Meeting", "Visit"];

export function CustomerManagement() {
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
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
      const { error } = await supabase.from("customers").insert({ ...form, status: "Prospect" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setAddOpen(false);
      setForm({ company_name: "", contact_person: "", email: "", phone: "", address: "", segment: "New", notes: "" });
      toast({ title: "Customer Added" });
    },
  });

  const addFollowup = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) return;
      const { error } = await supabase.from("customer_followups").insert({
        customer_id: selectedCustomer,
        subject: followupForm.subject,
        type: followupForm.type,
        notes: followupForm.notes,
        due_date: followupForm.due_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      setFollowupOpen(false);
      setFollowupForm({ subject: "", type: "Call", notes: "", due_date: format(new Date(), "yyyy-MM-dd") });
      toast({ title: "Follow-up Scheduled" });
    },
  });

  const completeFollowup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_followups").update({ status: "Completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      toast({ title: "Follow-up Completed" });
    },
  });

  const updateCustomerStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("customers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer Updated" });
    },
  });

  const filtered = customers.filter((c) => {
    const matchSearch = c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.contact_person?.toLowerCase().includes(search.toLowerCase());
    const matchSeg = segFilter === "all" || c.segment === segFilter;
    return matchSearch && matchSeg;
  });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.total_orders || 0), 0);
  const pendingFollowups = followups.filter((f) => f.status !== "Completed");
  const overdueFollowups = pendingFollowups.filter(f => isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date)));

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Relationship Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} customers · ₹{(totalRevenue / 100000).toFixed(1)}L lifetime revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="hidden md:flex"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><UserPlus className="w-4 h-4 mr-1.5" /> Add Customer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Company Name *</Label><Input placeholder="e.g. PowerCable Industries" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Contact Person</Label><Input placeholder="Full name" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                  <div><Label>Segment</Label>
                    <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <Button className="w-full" disabled={!form.company_name} onClick={() => addCustomer.mutate()}>
                  {addCustomer.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Customers", value: customers.length, sub: `${customers.filter(c => c.status === "Active").length} active` },
          { label: "Lifetime Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, sub: `${totalOrders} total orders` },
          { label: "Pending Follow-ups", value: pendingFollowups.length, sub: `${overdueFollowups.length} overdue`, warn: overdueFollowups.length > 0 },
          { label: "Avg Order Value", value: totalOrders > 0 ? `₹${((totalRevenue / totalOrders) / 1000).toFixed(0)}K` : "—", sub: "per order" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.warn ? "text-amber-600" : ""}`}>{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment filter + Search */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSegFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${segFilter === "all" ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
          All ({customers.length})
        </button>
        {SEGMENTS.map((s) => (
          <button key={s} onClick={() => setSegFilter(segFilter === s ? "all" : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${segFilter === s ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-accent"}`}>
            {s} ({customers.filter((c) => c.segment === s).length})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <div className="lg:col-span-2 space-y-1.5">
          <p className="text-xs text-muted-foreground mb-1">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map((cust) => (
            <Card key={cust.id}
              className={`cursor-pointer group transition-all ${selectedCustomer === cust.id ? "ring-2 ring-primary shadow-sm" : "hover:shadow-sm"}`}
              onClick={() => setSelectedCustomer(selectedCustomer === cust.id ? null : cust.id)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {cust.company_name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{cust.company_name}</p>
                    <Badge variant="outline" className={`text-[9px] ${SEGMENT_COLORS[cust.segment || ""] || ""}`}>{cust.segment}</Badge>
                    <Badge variant={cust.status === "Active" ? "default" : "secondary"} className="text-[9px]">{cust.status}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{cust.contact_person}{cust.phone ? ` · ${cust.phone}` : ""}</p>
                </div>
                <div className="hidden md:block text-right text-xs">
                  <p className="font-semibold">₹{(cust.total_revenue || 0).toLocaleString("en-IN")}</p>
                  <p className="text-muted-foreground">{cust.total_orders} orders</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUSES.filter(s => s !== cust.status).map(s => (
                      <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); updateCustomerStatus.mutate({ id: cust.id, status: s }); }}>
                        Set {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Follow-ups panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              Follow-ups
              {overdueFollowups.length > 0 && <Badge variant="destructive" className="text-[9px]">{overdueFollowups.length} overdue</Badge>}
            </h3>
            {selectedCustomer && (
              <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline" className="h-7 text-xs">+ Add</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Schedule Follow-up for {selectedCustData?.company_name}</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div><Label>Subject *</Label><Input placeholder="e.g. Discuss Q2 order" value={followupForm.subject} onChange={e => setFollowupForm({ ...followupForm, subject: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Type</Label>
                        <Select value={followupForm.type} onValueChange={v => setFollowupForm({ ...followupForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{FOLLOWUP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Due Date</Label><Input type="date" value={followupForm.due_date} onChange={e => setFollowupForm({ ...followupForm, due_date: e.target.value })} /></div>
                    </div>
                    <div><Label>Notes</Label><Textarea value={followupForm.notes} onChange={e => setFollowupForm({ ...followupForm, notes: e.target.value })} rows={2} /></div>
                    <Button className="w-full" disabled={!followupForm.subject} onClick={() => addFollowup.mutate()}>Schedule</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedCustomer && <p className="text-xs text-muted-foreground">Select a customer to view follow-ups</p>}

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {followups.length === 0 && selectedCustomer ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No follow-ups scheduled.</p>
              ) : followups.map((f) => {
                const isOverdue = f.status !== "Completed" && isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date));
                const isDueToday = f.status !== "Completed" && isToday(new Date(f.due_date));
                return (
                  <Card key={f.id} className={isOverdue ? "border-destructive/40" : isDueToday ? "border-amber-500/40" : ""}>
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px]">{f.type}</Badge>
                          {isOverdue && <Badge variant="destructive" className="text-[9px]">Overdue</Badge>}
                          {isDueToday && <Badge className="text-[9px] bg-amber-500/10 text-amber-700 border-amber-500/20" variant="outline">Due Today</Badge>}
                        </div>
                        <Badge variant={f.status === "Completed" ? "default" : "secondary"} className="text-[9px]">
                          {f.status === "Completed" ? "✓ Done" : f.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{f.subject}</p>
                      {f.notes && <p className="text-[11px] text-muted-foreground">{f.notes}</p>}
                      {!selectedCustomer && f.customers && <p className="text-[10px] text-muted-foreground">— {(f.customers as any).company_name}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[10px] text-muted-foreground">Due: {f.due_date}</p>
                        {f.status !== "Completed" && (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => completeFollowup.mutate(f.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
