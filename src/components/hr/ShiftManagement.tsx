import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Calendar, CheckCircle2, Play, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { format, addDays, subDays } from "date-fns";

const SHIFT_TYPES = ["Day", "Evening", "Night"];

const SHIFT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Day: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  Evening: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Night: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-500" },
};

const SHIFT_PRESETS: Record<string, { start: string; end: string }> = {
  Day: { start: "09:00", end: "17:00" },
  Evening: { start: "17:00", end: "01:00" },
  Night: { start: "01:00", end: "09:00" },
};

export function ShiftManagement() {
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newShift, setNewShift] = useState({ employee_id: "", shift_type: "Day", start_time: "09:00", end_time: "17:00" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const targetDate = useMemo(() => {
    if (dateFilter === "today") return format(new Date(), "yyyy-MM-dd");
    if (dateFilter === "yesterday") return format(subDays(new Date(), 1), "yyyy-MM-dd");
    if (dateFilter === "tomorrow") return format(addDays(new Date(), 1), "yyyy-MM-dd");
    return null;
  }, [dateFilter]);

  const { data: shifts = [], isLoading, error: shiftsError } = useQuery({
    queryKey: ["shifts", dateFilter],
    queryFn: async () => {
      let q = supabase.from("shifts").select("*, employees(name, department, role, status)").order("start_time");
      if (targetDate) q = q.eq("shift_date", targetDate);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data;
    },
    retry: 2,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, name, department, status").eq("status", "Active").order("name");
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("shifts").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Success", description: "Shift status updated." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update shift", variant: "destructive" });
    },
  });

  const createShift = useMutation({
    mutationFn: async () => {
      if (!newShift.employee_id) throw new Error("Employee is required");
      const startDate = new Date(`2000-01-01T${newShift.start_time}`);
      const endDate = new Date(`2000-01-01T${newShift.end_time}`);
      if (startDate >= endDate) throw new Error("End time must be after start time");
      
      const { error } = await supabase.from("shifts").insert({
        employee_id: newShift.employee_id,
        shift_type: newShift.shift_type,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        shift_date: targetDate || format(new Date(), "yyyy-MM-dd"),
        status: "Scheduled",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setAddOpen(false);
      setNewShift({ employee_id: "", shift_type: "Day", start_time: "09:00", end_time: "17:00" });
      toast({ title: "Success", description: "Shift scheduled successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to create shift", variant: "destructive" });
    },
  });

  const active = shifts.filter((s) => s.status === "Active").length;
  const scheduled = shifts.filter((s) => s.status === "Scheduled").length;
  const completed = shifts.filter((s) => s.status === "Completed").length;
  const total = shifts.length;
  const coverage = employees.length > 0 ? ((active + scheduled) / employees.length * 100).toFixed(0) : "0";

  // Memoized computations
  const byType = useMemo(() => 
    SHIFT_TYPES.map(type => ({
      type,
      shifts: shifts.filter(s => s.shift_type === type && (statusFilter === "all" || s.status === statusFilter)),
    })).filter(g => g.shifts.length > 0),
    [shifts, statusFilter]
  );

  const isShiftValid = newShift.employee_id && newShift.start_time && newShift.end_time && new Date(`2000-01-01T${newShift.start_time}`) < new Date(`2000-01-01T${newShift.end_time}`);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Shift Management</h1>
            <p className="text-sm text-slate-600 mt-1.5">Schedule and manage workforce shifts with real-time visibility</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => qc.invalidateQueries({ queryKey: ["shifts"] })}
                    className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh shift data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">
          {/* Filters Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter by date:</span>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 h-9 rounded-lg border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="all">All Shifts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-900">Schedule New Shift</DialogTitle>
                  <DialogDescription className="text-slate-600">Assign an employee to a shift time slot</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div>
                    <Label htmlFor="emp-select" className="text-sm font-medium text-slate-700">Employee</Label>
                    <Select value={newShift.employee_id} onValueChange={v => setNewShift({ ...newShift, employee_id: v })}>
                      <SelectTrigger id="emp-select" className="h-9 rounded-lg border-slate-200 mt-2">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} • {e.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="shift-type" className="text-sm font-medium text-slate-700">Shift Type</Label>
                    <Select value={newShift.shift_type} onValueChange={v => {
                      setNewShift({ ...newShift, shift_type: v, start_time: SHIFT_PRESETS[v].start, end_time: SHIFT_PRESETS[v].end });
                    }}>
                      <SelectTrigger id="shift-type" className="h-9 rounded-lg border-slate-200 mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFT_TYPES.map(t => (
                          <SelectItem key={t} value={t}>
                            {t} ({SHIFT_PRESETS[t].start} - {SHIFT_PRESETS[t].end})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="text-sm font-medium text-slate-700">Start Time</Label>
                      <Input 
                        id="start-time" 
                        type="time" 
                        value={newShift.start_time} 
                        onChange={e => setNewShift({ ...newShift, start_time: e.target.value })} 
                        className="h-9 rounded-lg border-slate-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-sm font-medium text-slate-700">End Time</Label>
                      <Input 
                        id="end-time" 
                        type="time" 
                        value={newShift.end_time} 
                        onChange={e => setNewShift({ ...newShift, end_time: e.target.value })} 
                        className="h-9 rounded-lg border-slate-200 mt-2"
                      />
                    </div>
                  </div>

                  {newShift.start_time && newShift.end_time && new Date(`2000-01-01T${newShift.start_time}`) >= new Date(`2000-01-01T${newShift.end_time}`) && (
                    <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-sm ml-2">End time must be after start time</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors" 
                    disabled={!isShiftValid || createShift.isPending} 
                    onClick={() => createShift.mutate()}
                  >
                    {createShift.isPending ? "Scheduling..." : "Schedule Shift"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Total Shifts", value: total, unit: "shifts" },
              { label: "Active Now", value: active, unit: "shifts" },
              { label: "Scheduled", value: scheduled, unit: "shifts" },
              { label: "Coverage", value: `${coverage}%`, unit: "target" },
            ].map((stat) => (
              <Card key={stat.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 sm:mt-3">{stat.value}</p>
                  <p className="text-xs text-slate-600 mt-1 sm:mt-2">{stat.unit}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Error State */}
          {shiftsError && (
            <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm ml-2">Failed to load shifts. Please try again.</AlertDescription>
            </Alert>
          )}

          {/* Shifts List */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="text-slate-500 text-sm">Loading shifts...</div>
            </div>
          ) : shifts.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-16 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm text-slate-600 font-medium">No shifts scheduled for this period</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-4 rounded-lg border-slate-200 hover:bg-slate-50"
                  onClick={() => setAddOpen(true)}
                >
                  Schedule a Shift
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {byType.map(({ type, shifts: groupShifts }) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className={`w-2 h-2 rounded-full ${SHIFT_COLORS[type].dot}`} />
                    <h3 className="text-sm font-semibold text-slate-700">{type} Shift</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{groupShifts.length}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {groupShifts.map((shift) => {
                      const emp = shift.employees as any;
                      const isActive = shift.status === "Active";
                      const isCompleted = shift.status === "Completed";
                      
                      return (
                        <Card 
                          key={shift.id} 
                          className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-3 sm:gap-5">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              {/* Status Indicator */}
                              <div className="flex-shrink-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-green-500 animate-pulse" : isCompleted ? "bg-slate-400" : "bg-blue-400"}`} />
                              </div>

                              {/* Employee Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{emp?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-600 truncate">{emp?.role} · {emp?.department}</p>
                              </div>

                              {/* Time */}
                              <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-50 rounded-lg shrink-0">
                                <p className="text-xs sm:text-sm font-mono font-semibold text-slate-900">{shift.start_time}</p>
                                <p className="text-[10px] sm:text-xs text-slate-600 text-center">to</p>
                                <p className="text-xs sm:text-sm font-mono font-semibold text-slate-900">{shift.end_time}</p>
                              </div>

                              {/* Status Badge */}
                              <Badge 
                                className={`text-xs font-semibold rounded-full px-2 sm:px-3 py-1 shrink-0 hidden sm:inline-flex ${
                                  isActive ? "bg-green-100 text-green-700 border-green-300" : 
                                  isCompleted ? "bg-slate-100 text-slate-700 border-slate-300" : 
                                  "bg-blue-100 text-blue-700 border-blue-300"
                                }`}
                              >
                                {shift.status}
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {shift.status === "Scheduled" && (
                                <Button 
                                  size="sm" 
                                  className="h-8 px-2 sm:px-3 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                                  onClick={() => updateStatus.mutate({ id: shift.id, status: "Active" })}
                                >
                                  <Play className="w-3 h-3 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Start</span>
                                </Button>
                              )}
                              {shift.status === "Active" && (
                                <Button 
                                  size="sm" 
                                  className="h-8 px-2 sm:px-3 text-xs rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium transition-colors"
                                  onClick={() => updateStatus.mutate({ id: shift.id, status: "Completed" })}
                                >
                                  <CheckCircle2 className="w-3 h-3 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Complete</span>
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
      </ScrollArea>
    </div>
  );
}
