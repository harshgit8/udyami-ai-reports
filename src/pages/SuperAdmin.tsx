import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Users, Inbox, Plus, Loader2, Trash2, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

type Org = {
  id: string; name: string; slug: string; status: string; plan: string; max_users: number; created_at: string;
};
type ProfileRow = { id: string; full_name: string | null; email: string | null; org_id: string | null; created_at: string };
type DemoReq = {
  id: string; business_name: string; contact_name: string; email: string; phone: string | null;
  company_size: string | null; message: string | null; status: string; created_at: string;
};

export default function SuperAdminPanel() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-semibold tracking-tight">Udyami · Super Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{profile?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => { void signOut(); }}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-semibold tracking-tight">Workspace administration</h1>
          <p className="mt-2 text-muted-foreground text-sm">Manage organizations, issue logins, and triage demo requests.</p>
        </motion.div>

        <Tabs defaultValue="orgs" className="mt-10">
          <TabsList>
            <TabsTrigger value="orgs"><Building2 className="h-4 w-4 mr-2" />Organizations</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="demos"><Inbox className="h-4 w-4 mr-2" />Demo requests</TabsTrigger>
          </TabsList>

          <TabsContent value="orgs" className="mt-6"><OrgsTab /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="demos" className="mt-6"><DemosTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ----------------- ORGS -----------------
function OrgsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", max_users: 4, plan: "starter" });

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["sa-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Org[];
    },
  });

  const createOrg = useMutation({
    mutationFn: async () => {
      const slug = form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase.from("organizations").insert({
        name: form.name.trim(),
        slug,
        max_users: form.max_users,
        plan: form.plan,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Organization created" });
      setOpen(false);
      setForm({ name: "", slug: "", max_users: 4, plan: "starter" });
      void qc.invalidateQueries({ queryKey: ["sa-orgs"] });
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{orgs.length} organization{orgs.length !== 1 && "s"}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />New organization</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create organization</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Polymers Pvt Ltd" /></div>
              <div className="space-y-2"><Label>Slug (optional)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="acme-polymers" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max users</Label>
                  <Input type="number" min={1} max={50} value={form.max_users} onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 4 })} />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createOrg.mutate()} disabled={!form.name.trim() || createOrg.isPending}>
                {createOrg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : (
        <div className="grid gap-3">
          {orgs.map((o) => (
            <Card key={o.id} className="p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{o.name}</h3>
                  <Badge variant="outline" className="text-xs">{o.plan}</Badge>
                  <Badge variant={o.status === "active" ? "default" : "secondary"} className="text-xs">{o.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">slug: {o.slug} · max {o.max_users} users · created {new Date(o.created_at).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
          {orgs.length === 0 && <div className="py-16 text-center text-muted-foreground text-sm">No organizations yet. Create your first one.</div>}
        </div>
      )}
    </div>
  );
}

// ----------------- USERS -----------------
function UsersTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", org_id: "", role: "org_user" as "org_admin" | "org_user" });

  const { data: orgs = [] } = useQuery({
    queryKey: ["sa-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id,name,slug,status,plan,max_users,created_at").order("name");
      if (error) throw error;
      return data as Org[];
    },
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["sa-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,email,org_id,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "create_user", ...form },
      });
      if (error) throw error;
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) throw new Error(errMsg);
    },
    onSuccess: () => {
      toast({ title: "User created", description: `Login issued for ${form.email}` });
      setOpen(false);
      setForm({ email: "", password: "", full_name: "", org_id: "", role: "org_user" });
      void qc.invalidateQueries({ queryKey: ["sa-profiles"] });
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id },
      });
      if (error) throw error;
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) throw new Error(errMsg);
    },
    onSuccess: () => {
      toast({ title: "User removed" });
      void qc.invalidateQueries({ queryKey: ["sa-profiles"] });
    },
    onError: (e) => toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }),
  });

  const orgMap = new Map(orgs.map((o) => [o.id, o.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{profiles.length} user{profiles.length !== 1 && "s"} across all organizations</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Issue login</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue a new login</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Organization</Label>
                <Select value={form.org_id} onValueChange={(v) => setForm({ ...form, org_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>{orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Temporary password</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min 8 characters" minLength={8} /></div>
              <div className="space-y-2"><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "org_admin" | "org_user" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org_admin">Org admin</SelectItem>
                    <SelectItem value="org_user">Org user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!form.org_id || !form.email || form.password.length < 8 || createUser.isPending} onClick={() => createUser.mutate()}>
                {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create login"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <Card key={p.id} className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{p.full_name || "—"}</h3>
                <p className="text-sm text-muted-foreground">{p.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.org_id ? orgMap.get(p.org_id) ?? "Unknown org" : "No organization"} · joined {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Remove ${p.email}?`)) deleteUser.mutate(p.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
          {profiles.length === 0 && <div className="py-16 text-center text-muted-foreground text-sm">No users yet.</div>}
        </div>
      )}
    </div>
  );
}

// ----------------- DEMO REQUESTS -----------------
function DemosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: demos = [], isLoading } = useQuery({
    queryKey: ["sa-demos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("demo_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as DemoReq[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("demo_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["sa-demos"] }); toast({ title: "Status updated" }); },
  });

  if (isLoading) return <div className="py-20 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>;

  return (
    <div className="grid gap-3">
      {demos.length === 0 && <div className="py-16 text-center text-muted-foreground text-sm">No demo requests yet.</div>}
      {demos.map((d) => (
        <Card key={d.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-semibold">{d.business_name}</h3>
                <Badge variant={d.status === "new" ? "default" : "secondary"} className="text-xs capitalize">{d.status}</Badge>
                {d.company_size && <Badge variant="outline" className="text-xs">{d.company_size}</Badge>}
              </div>
              <p className="text-sm mt-1">{d.contact_name}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="inline-flex items-center"><Mail className="h-3.5 w-3.5 mr-1.5" />{d.email}</span>
                {d.phone && <span className="inline-flex items-center"><Phone className="h-3.5 w-3.5 mr-1.5" />{d.phone}</span>}
                <span className="inline-flex items-center"><Calendar className="h-3.5 w-3.5 mr-1.5" />{new Date(d.created_at).toLocaleString()}</span>
              </div>
              {d.message && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.message}</p>}
            </div>
            <Select value={d.status} onValueChange={(v) => setStatus.mutate({ id: d.id, status: v })}>
              <SelectTrigger className="w-36 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      ))}
    </div>
  );
}
