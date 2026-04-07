import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, CheckCircle2, Play, Pause, Plus, Users, AlertCircle } from "lucide-react";
import { format, addDays, subDays } from "date-fns";

const SHIFT_TYPES = ["Day", "Evening", "Night"];
const SHIFT_COLORS: Record<string, string> = {
  Day: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Evening: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Night: "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

export function ShiftManagement() {
  const [dateFilter, setDateFilter] = useState("today");
  const [addOpen, setAddOpen] = useState(false);
  const [newShift, setNewShift] = useState({ employee_id: "", shift_type: "Day", start_time: "09:00", end_time: "17:00" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const targetDate = dateFilter === "today" ? format(new Date(), "yyyy-MM-dd")
    : dateFilter === "yesterday" ? format(subDays(new Date(), 1), "yyyy-MM-dd")
    : dateFilter === "tomorrow" ? format(addDays(new Date(), 1), "yyyy-MM-dd")
    : null;

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts", dateFilter],
    queryFn: async () => {
      let q = supabase.from("shifts").select("*, employees(name, department, role)").order("start_time");
      if (targetDate) q = q.eq("shift_date", targetDate);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, name, department").eq("status", "Active").order("name");
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("shifts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Shift Updated" });
    },
  });

  const createShift = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shifts").insert({
        employee_id: newShift.employee_id,
        shift_type: newShift.shift_type,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        shift_date: targetDate || format(new Date(), "yyyy-MM-dd"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setAddOpen(false);
      toast({ title: "Shift Created" });
    },
  });

  const active = shifts.filter((s) => s.status === "Active").length;
  const scheduled = shifts.filter((s) => s.status === "Scheduled").length;
  const completed = shifts.filter((s) => s.status === "Completed").length;
  const total = shifts.length;

  // Group shifts by type
  const byType = SHIFT_TYPES.map(type => ({
    type,
    shifts: shifts.filter(s => s.shift_type === type),
  })).filter(g => g.shifts.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shift Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {targetDate ? format(new Date(targetDate + "T00:00"), "EEEE, MMM d, yyyy") : "All shifts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="all">All Shifts</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> New Shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule New Shift</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Employee *</Label>
                  <Select value={newShift.employee_id} onValueChange={v => setNewShift({ ...newShift, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.department})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shift Type</Label>
                  <Select value={newShift.shift_type} onValueChange={v => setNewShift({ ...newShift, shift_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIFT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start</Label><Input type="time" value={newShift.start_time} onChange={e => setNewShift({ ...newShift, start_time: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="time" value={newShift.end_time} onChange={e => setNewShift({ ...newShift, end_time: e.target.value })} /></div>
                </div>
                <Button className="w-full" disabled={!newShift.employee_id} onClick={() => createShift.mutate()}>
                  {createShift.isPending ? "Scheduling..." : "Schedule Shift"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Shifts", value: total, icon: Calendar, color: "text-foreground" },
          { label: "Active Now", value: active, icon: Play, color: "text-emerald-600", pulse: active > 0 },
          { label: "Scheduled", value: scheduled, icon: Clock, color: "text-blue-600" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-muted-foreground" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${kpi.color}`}>
                  {kpi.value}
                  {kpi.pulse && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2 align-middle" />}
                </p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shift list grouped by type */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No shifts found for this period.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddOpen(true)}>Schedule a Shift</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {byType.map(({ type, shifts: groupShifts }) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`${SHIFT_COLORS[type] || ""}`}>{type} Shift</Badge>
                <span className="text-xs text-muted-foreground">{groupShifts.length} employee{groupShifts.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-1.5">
                {groupShifts.map((shift) => {
                  const emp = shift.employees as any;
                  return (
                    <Card key={shift.id} className="group">
                      <CardContent className="p-3 flex items-center gap-3">
                        {/* Status dot */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${shift.status === "Active" ? "bg-emerald-500 animate-pulse" : shift.status === "Scheduled" ? "bg-blue-400" : "bg-muted-foreground/40"}`} />

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                          {emp?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{emp?.name || "Unknown"}</p>
                          <p className="text-[11px] text-muted-foreground">{emp?.role} · {emp?.department}</p>
                        </div>

                        {/* Time */}
                        <div className="text-center px-3">
                          <p className="text-sm font-mono tracking-tight">{shift.start_time} – {shift.end_time}</p>
                        </div>

                        {/* Status badge */}
                        <Badge variant={shift.status === "Active" ? "default" : shift.status === "Completed" ? "secondary" : "outline"} className="text-[10px] min-w-[70px] justify-center">
                          {shift.status}
                        </Badge>

                        {/* Actions */}
                        <div className="flex gap-1 min-w-[80px] justify-end">
                          {shift.status === "Scheduled" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: shift.id, status: "Active" })}>
                              <Play className="w-3 h-3 mr-1" /> Start
                            </Button>
                          )}
                          {shift.status === "Active" && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: shift.id, status: "Completed" })}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> End
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
