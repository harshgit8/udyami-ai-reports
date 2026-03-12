import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Settings,
  Users,
  Package,
  CheckCircle2,
  Edit2,
  Save,
  Send,
  Loader2,
  ArrowRight,
  Clock,
  Briefcase,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Mock Data
const MOCK_MACHINES = [
  { id: "M1", name: "Injection Molder A", capacity: "95%", setup: "15m", status: "Available" },
  { id: "M2", name: "Extrusion Line B", capacity: "88%", setup: "20m", status: "Available" },
  { id: "M3", name: "CNC Router C", capacity: "92%", setup: "10m", status: "Available" },
  { id: "M4", name: "Assembly Unit D", capacity: "85%", setup: "5m", status: "Maintenance" },
];

const MOCK_WORKERS = [
  { id: "W1", name: "Alice Smith", expertise: "Injection", shift: "06:00 - 14:00" },
  { id: "W2", name: "Bob Jones", expertise: "Extrusion", shift: "06:00 - 14:00" },
  { id: "W3", name: "Charlie Brown", expertise: "CNC", shift: "08:00 - 16:00" },
  { id: "W4", name: "Diana Prince", expertise: "Assembly", shift: "08:00 - 16:00" },
];

const MOCK_ORDERS = [
  { id: "ORD-001", product: "Widget A (x5000)", deadline: "14:00 Today", material: "Ready" },
  { id: "ORD-002", product: "Widget B (x2000)", deadline: "16:00 Today", material: "Ready" },
  { id: "ORD-003", product: "Widget C (x8000)", deadline: "18:00 Today", material: "Delayed" },
];

const INITIAL_SCHEDULE = [
  { id: 1, time: "08:00 - 10:00", machine: "M1 - Injection Molder A", task: "Widget A (Batch 1)", worker: "Alice Smith" },
  { id: 2, time: "10:15 - 12:15", machine: "M1 - Injection Molder A", task: "Widget A (Batch 2)", worker: "Alice Smith" },
  { id: 3, time: "08:00 - 12:00", machine: "M2 - Extrusion Line B", task: "Widget C (Pre-process)", worker: "Bob Jones" },
  { id: 4, time: "08:00 - 11:00", machine: "M3 - CNC Router C", task: "Widget B (Milling)", worker: "Charlie Brown" },
  { id: 5, time: "11:00 - 15:00", machine: "M4 - Assembly Unit D", task: "Widget B (Assembly)", worker: "Diana Prince" },
];

export function ProductionSchedulingDetail() {
  const [step, setStep] = useState<'setup' | 'processing' | 'review' | 'mail'>('setup');

  // Processing state
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  // Review state
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [editMode, setEditMode] = useState(false);

  // Mail state
  const [mailTo, setMailTo] = useState('manager@factory.com');
  const [mailSubject, setMailSubject] = useState('Production Schedule for Today');
  const [mailBody, setMailBody] = useState('');

  // Simulate processing
  useEffect(() => {
    if (step === 'processing') {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 1.5;
        setProgress(Math.min(currentProgress, 100));

        if (currentProgress < 25) setLoadingText('Ingesting machines and workforce capacity...');
        else if (currentProgress < 50) setLoadingText('Analyzing expertise & material availability...');
        else if (currentProgress < 75) setLoadingText('Running simulation & optimizing shift schedule...');
        else if (currentProgress < 100) setLoadingText('Mapping workers to tasks and finalizing to-do lists...');
        else {
          clearInterval(interval);
          setTimeout(() => {
            setStep('review');
            const body = `Here is the optimized production schedule for today:\n\n` +
              schedule.map(s => `• [${s.time}] ${s.machine} | Task: ${s.task} | Assigned: ${s.worker}`).join('\n') +
              `\n\nPlease ensure all materials are prepared for the respective shifts.\n\nBest regards,\nProduction AI Orchestrator`;
            setMailBody(body);
          }, 600);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step, schedule]);

  const handleUpdateSchedule = (id: number, field: string, value: string) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSendMail = () => {
    const mailtoLink = `mailto:${mailTo}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">

        {/* SETUP STEP */}
        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Production Environment
                </h3>
                <p className="text-sm text-muted-foreground">Input capabilities, workers, and orders to generate an optimal schedule.</p>
              </div>
              <Button onClick={() => setStep('processing')} className="gap-2">
                <Play className="w-4 h-4" /> Generate Perfect Schedule
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Machines */}
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2">
                  <Settings className="w-4 h-4" /> Machines & Capacities
                </h4>
                {MOCK_MACHINES.map(m => (
                  <div key={m.id} className="text-xs space-y-1 bg-background p-2 rounded-lg border border-border/50">
                    <div className="flex justify-between font-medium">
                      <span>{m.id} - {m.name}</span>
                      <span className={m.status === 'Available' ? 'text-green-500' : 'text-orange-500'}>{m.status}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Capacity: {m.capacity}</span>
                      <span>Setup: {m.setup}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Workers */}
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2">
                  <Users className="w-4 h-4" /> Workforce & Shifts
                </h4>
                {MOCK_WORKERS.map(w => (
                  <div key={w.id} className="text-xs space-y-1 bg-background p-2 rounded-lg border border-border/50">
                    <div className="flex justify-between font-medium">
                      <span>{w.name}</span>
                      <span className="text-primary">{w.expertise}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" /> Shift: {w.shift}
                    </div>
                  </div>
                ))}
              </div>

              {/* Orders */}
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2">
                  <Package className="w-4 h-4" /> Pending Orders
                </h4>
                {MOCK_ORDERS.map(o => (
                  <div key={o.id} className="text-xs space-y-1 bg-background p-2 rounded-lg border border-border/50">
                    <div className="flex justify-between font-medium">
                      <span>{o.product}</span>
                      <span className={o.material === 'Ready' ? 'text-green-500' : 'text-red-500'}>{o.material}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Deadline: {o.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-20 space-y-6"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary/50" />
              </div>
            </div>
            <div className="text-center space-y-2 w-full max-w-md">
              <h3 className="text-xl font-semibold">Generating Schedule...</h3>
              <p className="text-sm text-muted-foreground min-h-[20px] transition-all">{loadingText}</p>
              <Progress value={progress} className="h-2 w-full mt-4" />
            </div>
          </motion.div>
        )}

        {/* REVIEW STEP */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Integrated Master Schedule
                </h3>
                <p className="text-sm text-muted-foreground">Review the mapped tasks and workforce. Edit if necessary.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant={editMode ? "default" : "outline"} onClick={() => setEditMode(!editMode)} className="gap-2 h-9">
                  {editMode ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit2 className="w-4 h-4" /> Edit Mode</>}
                </Button>
                {!editMode && (
                  <Button onClick={() => {
                    const body = `Here is the optimized production schedule for today:\n\n` +
                      schedule.map(s => `• [${s.time}] ${s.machine} | Task: ${s.task} | Assigned: ${s.worker}`).join('\n') +
                      `\n\nPlease ensure all materials are prepared for the respective shifts.\n\nBest regards,\nProduction AI Orchestrator`;
                    setMailBody(body);
                    setStep('mail');
                  }} className="gap-2 h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                    Proceed to Mail <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                    <th className="p-3 text-left font-medium w-[15%]">Time Slot</th>
                    <th className="p-3 text-left font-medium w-[30%]">Machine</th>
                    <th className="p-3 text-left font-medium w-[30%]">Task</th>
                    <th className="p-3 text-left font-medium w-[25%]">Assigned Worker</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        {editMode ? <Input value={row.time} onChange={(e) => handleUpdateSchedule(row.id, 'time', e.target.value)} className="h-8 text-xs bg-background" /> : <span className="font-medium text-xs">{row.time}</span>}
                      </td>
                      <td className="p-3">
                        {editMode ? <Input value={row.machine} onChange={(e) => handleUpdateSchedule(row.id, 'machine', e.target.value)} className="h-8 text-xs bg-background" /> : <span className="text-xs">{row.machine}</span>}
                      </td>
                      <td className="p-3">
                        {editMode ? <Input value={row.task} onChange={(e) => handleUpdateSchedule(row.id, 'task', e.target.value)} className="h-8 text-xs bg-background" /> : <span className="text-xs font-medium text-primary/80">{row.task}</span>}
                      </td>
                      <td className="p-3">
                        {editMode ? <Input value={row.worker} onChange={(e) => handleUpdateSchedule(row.id, 'worker', e.target.value)} className="h-8 text-xs bg-background" /> :
                          <span className="flex items-center gap-1.5 text-xs">
                            <Briefcase className="w-3 h-3 text-muted-foreground" /> {row.worker}
                          </span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* MAIL STEP */}
        {step === 'mail' && (
          <motion.div
            key="mail"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Share Schedule</h3>
              <p className="text-sm text-muted-foreground">Configure the email to send the integrated schedule to the factory manager or workforce.</p>
            </div>

            <div className="bg-muted/30 p-5 rounded-xl border border-border space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">To:</label>
                <Input value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="manager@factory.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Subject:</label>
                <Input value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message Body:</label>
                <Textarea
                  value={mailBody}
                  onChange={(e) => setMailBody(e.target.value)}
                  className="min-h-[250px] font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" onClick={() => setStep('review')} className="text-muted-foreground">
                Back to Schedule
              </Button>
              <Button onClick={handleSendMail} className="gap-2 px-6">
                <Send className="w-4 h-4" /> Open in Mail App
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
