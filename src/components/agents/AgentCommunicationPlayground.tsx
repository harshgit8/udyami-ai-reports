import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, FileText, Receipt, Shield, FlaskConical,
  TrendingUp, Zap, Users, Leaf, MessageCircle, Handshake,
  Heart, Dices, GripVertical, Plus, Trash2, Play,
  CheckCircle2, XCircle, ArrowRight, Workflow, Plug,
  ChevronDown, ChevronUp, RotateCcw, Cpu, Loader2,
  Bot, User, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchGrounding, runGroundedAi } from "@/lib/orchestratorGrounding";

// ── Agent definitions ──
interface AgentDef {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  color: string;
  inputs: string[];
  outputs: string[];
  prompt: string; // The AI prompt this agent uses
}

const AGENT_CATALOG: AgentDef[] = [
  {
    id: "quotation-generator", title: "Quotation Generator AI", shortTitle: "Quotation", icon: FileText,
    color: "hsl(210,70%,50%)", inputs: ["Customer Request"], outputs: ["Quotation"],
    prompt: "Generate a professional quotation for polymer manufacturing. Include material cost, production cost, quality cost, profit margin (15-20%), GST calculation, lead time, and payment terms. Use real data from the database for pricing reference. Format as a proper business document with all fields.",
  },
  {
    id: "production-scheduling", title: "Production Scheduling AI", shortTitle: "Scheduling", icon: Calendar,
    color: "hsl(142,60%,40%)", inputs: ["Quotation", "Order"], outputs: ["Production Plan"],
    prompt: "Create an optimized production schedule based on the input data. Assign machines (M1-M5), calculate risk scores (0-10), estimate start/end times, and flag any potential delays. Consider machine capacity, order priority, and due dates. Show the schedule in a clear table format.",
  },
  {
    id: "quality-intelligence", title: "Quality Intelligence AI", shortTitle: "Quality", icon: Shield,
    color: "hsl(38,80%,50%)", inputs: ["Production Plan", "Batch Data"], outputs: ["Quality Report"],
    prompt: "Generate a quality inspection report based on the production data. Analyze defect rates, classify severity (EXCELLENT/GOOD/ACCEPTABLE/UNACCEPTABLE), calculate confidence scores, and provide corrective action recommendations. Include batch ID, defect breakdown (minor/major/critical), and compliance status.",
  },
  {
    id: "invoice-generation", title: "Invoice Generation AI", shortTitle: "Invoice", icon: Receipt,
    color: "hsl(280,60%,50%)", inputs: ["Quotation", "Quality Report"], outputs: ["Invoice"],
    prompt: "Generate a GST-compliant invoice based on the input data. Include invoice number, customer details, product details, quantity, unit price, subtotal, CGST+SGST or IGST breakdown, grand total, advance paid, balance due, payment terms, and due date. Use Indian number formatting (₹).",
  },
  {
    id: "rnd-formulation", title: "R&D Formulation AI", shortTitle: "R&D", icon: FlaskConical,
    color: "hsl(340,70%,50%)", inputs: ["Product Requirements"], outputs: ["Formulation"],
    prompt: "Suggest an R&D formulation for a polymer compound. Include base polymer selection, key additives with percentages, estimated cost per kg, mechanical properties (tensile MPa, LOI), compliance status (RoHS, REACH, UL94 rating), and recommendation. Present as a structured formulation sheet.",
  },
  {
    id: "predictive-pricing", title: "Predictive Pricing Engine", shortTitle: "Pricing", icon: TrendingUp,
    color: "hsl(170,60%,40%)", inputs: ["Market Data", "Cost Data"], outputs: ["Price Recommendation"],
    prompt: "Analyze the current cost structure and market conditions to recommend optimal pricing. Consider raw material costs, production costs, competitor pricing, demand elasticity, and target margins. Provide a pricing recommendation with justification and sensitivity analysis.",
  },
  {
    id: "production-recommendation", title: "Production Recommendation", shortTitle: "Recommend", icon: Zap,
    color: "hsl(50,80%,45%)", inputs: ["Historical Data"], outputs: ["Recommendation"],
    prompt: "Based on historical production data, demand patterns, and current machine setup, recommend the next product to manufacture. Consider customer demand frequency, margin contribution, machine changeover time, and inventory levels. Present top 3 recommendations ranked.",
  },
  {
    id: "supplier-auction", title: "Supplier Reverse Auction", shortTitle: "Auction", icon: Users,
    color: "hsl(200,70%,45%)", inputs: ["Material Request"], outputs: ["Best Offer"],
    prompt: "Simulate a reverse auction for raw material procurement. Show 3-5 supplier bids with pricing, delivery timeline, quality certifications, and payment terms. Rank suppliers and recommend the best offer considering total cost of ownership.",
  },
  {
    id: "carbon-footprint", title: "Carbon Footprint Tracker", shortTitle: "Carbon", icon: Leaf,
    color: "hsl(120,50%,40%)", inputs: ["Production Data"], outputs: ["CO₂ Report"],
    prompt: "Calculate the carbon footprint for the production data provided. Break down CO₂ emissions by energy consumption, raw materials, transportation, and waste. Provide a sustainability score and recommendations for reducing emissions.",
  },
  {
    id: "voice-of-customer", title: "Voice of Customer AI", shortTitle: "VoC", icon: MessageCircle,
    color: "hsl(260,50%,55%)", inputs: ["Reviews", "Complaints"], outputs: ["Sentiment Report"],
    prompt: "Analyze customer feedback and complaints to extract sentiment insights. Categorize feedback themes, identify recurring issues, calculate satisfaction scores, and provide actionable improvement recommendations for product quality and service.",
  },
  {
    id: "negotiation-agents", title: "Auto-Negotiation Agents", shortTitle: "Negotiate", icon: Handshake,
    color: "hsl(20,70%,50%)", inputs: ["Supplier Data"], outputs: ["Deal"],
    prompt: "Simulate an automated negotiation with suppliers. Start with target price, negotiate through 3 rounds showing offer/counter-offer, and arrive at a final deal. Include volume discounts, payment terms negotiation, and delivery schedule optimization.",
  },
  {
    id: "what-if-simulator", title: "What-If Simulator", shortTitle: "Simulate", icon: Dices,
    color: "hsl(300,50%,50%)", inputs: ["Scenario Params"], outputs: ["Simulation Result"],
    prompt: "Run a what-if simulation for the manufacturing scenario. Consider machine failure, raw material shortage, rush order, or price change scenarios. Show impact on production timeline, costs, and delivery commitments. Present results with risk assessment and mitigation strategies.",
  },
  {
    id: "workforce-wellbeing", title: "Workforce Wellbeing AI", shortTitle: "Wellbeing", icon: Heart,
    color: "hsl(350,60%,55%)", inputs: ["Shift Data"], outputs: ["Risk Assessment"],
    prompt: "Analyze workforce data to detect fatigue risks, safety hazards, and shift optimization opportunities. Calculate wellbeing scores, identify at-risk workers, suggest optimal break schedules, and recommend shift rotations for better productivity and safety.",
  },
];

// ── Types ──
interface CanvasNode {
  instanceId: string;
  agentId: string;
  x: number;
  y: number;
  status: "idle" | "running" | "awaiting-review" | "approved" | "declined";
  output?: string;
  feedback?: string;
}

interface Connection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

interface ChatLogEntry {
  id: string;
  agentId: string;
  nodeInstanceId: string;
  role: "agent" | "system" | "user-action";
  content: string;
  timestamp: Date;
  status?: "running" | "complete" | "approved" | "declined" | "error";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

// ── Palette Item ──
function PaletteItem({ agent, onAdd }: { agent: AgentDef; onAdd: (a: AgentDef) => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onAdd(agent)}
      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all text-left w-full group"
    >
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${agent.color}20` }}>
        <agent.icon className="w-4 h-4" style={{ color: agent.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{agent.shortTitle}</p>
        <p className="text-[10px] text-muted-foreground truncate">{agent.outputs[0]}</p>
      </div>
      <Plus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

// ── Canvas Node Card ──
function CanvasNodeCard({
  node, agent, connections, allNodes,
  onDragStart, onRemove, onApprove, onDecline, onFeedback, onConnect,
}: {
  node: CanvasNode; agent: AgentDef; connections: Connection[]; allNodes: CanvasNode[];
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onRemove: (id: string) => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onFeedback: (id: string, fb: string) => void;
  onConnect: (from: string, to: string) => void;
}) {
  const [showConnect, setShowConnect] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const outgoing = connections.filter(c => c.fromNode === node.instanceId);
  const incoming = connections.filter(c => c.toNode === node.instanceId);
  const availableTargets = allNodes.filter(
    n => n.instanceId !== node.instanceId && !outgoing.some(c => c.toNode === n.instanceId)
  );

  const statusStyles: Record<string, string> = {
    idle: "bg-muted text-muted-foreground",
    running: "bg-amber-500/10 text-amber-600",
    "awaiting-review": "bg-blue-500/10 text-blue-600",
    approved: "bg-emerald-500/10 text-emerald-600",
    declined: "bg-destructive/10 text-destructive",
  };
  const statusLabels: Record<string, string> = {
    idle: "Idle", running: "⚡ Processing...", "awaiting-review": "⏳ Awaiting Review",
    approved: "✅ Approved", declined: "❌ Declined",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute select-none" style={{ left: node.x, top: node.y }}
    >
      <div className={`w-[240px] rounded-2xl border bg-card shadow-lg overflow-hidden transition-all ${node.status === "running" ? "border-amber-500/50 shadow-amber-500/10" : node.status === "awaiting-review" ? "border-blue-500/50 shadow-blue-500/10" : "border-border"}`}>
        {/* Header */}
        <div
          className="flex items-center gap-2 p-2.5 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => onDragStart(e, node.instanceId)}
          style={{ borderBottom: `2px solid ${agent.color}` }}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
          <div className="p-1 rounded-lg" style={{ backgroundColor: `${agent.color}20` }}>
            <agent.icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
          </div>
          <p className="text-xs font-semibold truncate flex-1">{agent.shortTitle}</p>
          {node.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
          <button onClick={() => onRemove(node.instanceId)} className="p-0.5 rounded hover:bg-destructive/10">
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>

        {/* Status + Ports */}
        <div className="px-2.5 pt-2 space-y-1.5">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[node.status]}`}>
            {statusLabels[node.status]}
          </span>
          <div className="flex flex-wrap gap-1">
            {incoming.length > 0 && incoming.map(c => {
              const src = allNodes.find(n => n.instanceId === c.fromNode);
              const srcAgent = src ? AGENT_CATALOG.find(a => a.id === src.agentId) : null;
              return (
                <span key={c.id} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  ← {srcAgent?.shortTitle}
                </span>
              );
            })}
            {outgoing.length > 0 && outgoing.map(c => {
              const tgt = allNodes.find(n => n.instanceId === c.toNode);
              const tgtAgent = tgt ? AGENT_CATALOG.find(a => a.id === tgt.agentId) : null;
              return (
                <span key={c.id} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {tgtAgent?.shortTitle} →
                </span>
              );
            })}
          </div>
        </div>

        {/* Approve / Decline */}
        {node.status === "awaiting-review" && (
          <div className="px-2.5 py-2 space-y-1.5">
            <div className="flex gap-1.5">
              <Button size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={() => onApprove(node.instanceId)}>
                <CheckCircle2 className="w-3 h-3" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="flex-1 h-7 text-[11px] gap-1" onClick={() => setShowFeedback(true)}>
                <XCircle className="w-3 h-3" /> Decline
              </Button>
            </div>
            {showFeedback && (
              <div className="space-y-1">
                <textarea
                  value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Reason for decline..."
                  className="w-full text-[11px] p-1.5 rounded-lg border border-border bg-background resize-none h-12"
                />
                <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => {
                  onDecline(node.instanceId);
                  onFeedback(node.instanceId, feedbackText);
                  setShowFeedback(false);
                  setFeedbackText("");
                }}>Submit & Decline</Button>
              </div>
            )}
          </div>
        )}

        {node.status === "declined" && node.feedback && (
          <div className="px-2.5 pb-2">
            <div className="p-1.5 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-[10px] text-destructive">{node.feedback}</p>
            </div>
          </div>
        )}

        {/* Connect */}
        <div className="px-2.5 pb-2">
          <button onClick={() => setShowConnect(!showConnect)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            <Plug className="w-3 h-3" /> Connect {showConnect ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showConnect && availableTargets.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-1 space-y-0.5">
                {availableTargets.map(t => {
                  const ta = AGENT_CATALOG.find(a => a.id === t.agentId)!;
                  return (
                    <button key={t.instanceId} onClick={() => { onConnect(node.instanceId, t.instanceId); setShowConnect(false); }}
                      className="w-full flex items-center gap-1.5 p-1 rounded-lg hover:bg-accent/50 text-left">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <ta.icon className="w-3 h-3" style={{ color: ta.color }} />
                      <span className="text-[10px]">{ta.shortTitle}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Connection Lines ──
function ConnectionLines({ connections, nodes }: { connections: Connection[]; nodes: CanvasNode[] }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" className="fill-muted-foreground/50" />
        </marker>
      </defs>
      {connections.map(conn => {
        const from = nodes.find(n => n.instanceId === conn.fromNode);
        const to = nodes.find(n => n.instanceId === conn.toNode);
        if (!from || !to) return null;
        const x1 = from.x + 240, y1 = from.y + 40, x2 = to.x, y2 = to.y + 40;
        const cx1 = x1 + Math.abs(x2 - x1) * 0.4;
        const cx2 = x2 - Math.abs(x2 - x1) * 0.4;
        return (
          <g key={conn.id}>
            <path d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
              fill="none" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="2" strokeDasharray="6 3" markerEnd="url(#arrowhead)" />
            {/* Animated dot along the path */}
            <circle r="3" fill="hsl(var(--primary))">
              <animateMotion dur="3s" repeatCount="indefinite"
                path={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`} />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

// ── Chat Log Panel ──
function ChatLogPanel({ logs, onClear }: { logs: ChatLogEntry[]; onClear: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="flex flex-col h-full border border-border rounded-2xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">Pipeline Output</span>
          <Badge variant="secondary" className="text-[10px]">{logs.length} entries</Badge>
        </div>
        {logs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-6 text-[10px] px-2">Clear</Button>
        )}
      </div>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-3">
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground">Pipeline output will appear here</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Add agents, connect them, and run the pipeline</p>
            </div>
          )}
          {logs.map(log => {
            const agent = AGENT_CATALOG.find(a => a.id === log.agentId);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                {/* Agent header */}
                <div className="flex items-center gap-1.5">
                  {log.role === "agent" && agent && (
                    <>
                      <div className="p-0.5 rounded" style={{ backgroundColor: `${agent.color}20` }}>
                        <agent.icon className="w-3 h-3" style={{ color: agent.color }} />
                      </div>
                      <span className="text-[10px] font-semibold">{agent.shortTitle}</span>
                    </>
                  )}
                  {log.role === "system" && (
                    <>
                      <Workflow className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">System</span>
                    </>
                  )}
                  {log.role === "user-action" && (
                    <>
                      <User className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-semibold text-primary">Human Review</span>
                    </>
                  )}
                  {log.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
                  {log.status === "approved" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {log.status === "declined" && <XCircle className="w-3 h-3 text-destructive" />}
                  <span className="text-[9px] text-muted-foreground ml-auto">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {/* Content */}
                <div className={`rounded-xl p-2.5 text-xs ${
                  log.role === "agent" ? "bg-muted/50 border border-border" :
                  log.role === "user-action" ? "bg-primary/5 border border-primary/20" :
                  "bg-muted/30"
                }`}>
                  {log.status === "running" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{log.content}</span>
                    </div>
                  ) : (
                    <div className="prose prose-xs max-w-none prose-headings:text-xs prose-headings:font-bold prose-p:text-xs prose-p:mb-1 prose-table:text-[10px] prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── AI call helper ──
const CHAT_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

async function callAgentAI(agent: AgentDef, upstreamOutput: string, pipelineQuery: string): Promise<string> {
  const groundingMap: Record<string, "quotation" | "invoice" | "production" | "quality" | "rnd"> = {
    "quotation-generator": "quotation",
    "invoice-generation": "invoice",
    "production-scheduling": "production",
    "quality-intelligence": "quality",
    "rnd-formulation": "rnd",
  };

  const groundingType = groundingMap[agent.id];

  // For grounded agents, use the grounding helper
  if (groundingType) {
    const grounding = await fetchGrounding(groundingType, pipelineQuery || upstreamOutput || agent.shortTitle);
    return runGroundedAi({
      orchestrator: agent.title,
      userQuery: pipelineQuery || `Run ${agent.shortTitle} in the pipeline`,
      instructions: `${agent.prompt} Ensure the output is shaped for downstream sub-agents and ends with Sources / Reference IDs.`,
      grounding,
      upstreamOutput,
    });
  }

  // For non-grounded agents, call AI chat directly with the agent prompt + upstream context
  const prompt = [
    `Agent: ${agent.title}`,
    `Task: ${pipelineQuery || `Run ${agent.shortTitle} analysis`}`,
    `Instructions: ${agent.prompt}`,
    upstreamOutput ? `Upstream agent output:\n${upstreamOutput}` : "",
    "Requirements:",
    "- Answer in English only.",
    "- If no upstream data is available, use reasonable industry defaults for polymer manufacturing.",
    "- Structure the output clearly with markdown.",
  ].filter(Boolean).join("\n\n");

  const response = await fetch(CHAT_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });

  if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") break;
      try {
        const parsed = JSON.parse(json);
        const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (chunk) output += chunk;
      } catch { buffer = `${line}\n${buffer}`; break; }
    }
  }
  return output.trim();
}

// ── Main Playground ──
export function AgentCommunicationPlayground() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatLogEntry[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [pipelineQuery, setPipelineQuery] = useState("Run the best grounded multi-agent manufacturing workflow");
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const addLog = useCallback((entry: Omit<ChatLogEntry, "id" | "timestamp">) => {
    setChatLogs(prev => [...prev, { ...entry, id: `log-${Date.now()}-${Math.random()}`, timestamp: new Date() }]);
  }, []);

  const updateLog = useCallback((logId: string, updates: Partial<ChatLogEntry>) => {
    setChatLogs(prev => prev.map(l => l.id === logId ? { ...l, ...updates } : l));
  }, []);

  // ── Add agent ──
  const addAgent = useCallback((agent: AgentDef) => {
    const count = nodes.filter(n => n.agentId === agent.id).length;
    setNodes(prev => [...prev, {
      instanceId: `${agent.id}-${Date.now()}`,
      agentId: agent.id,
      x: 280 + (nodes.length % 3) * 280,
      y: 60 + Math.floor(nodes.length / 3) * 220 + count * 30,
      status: "idle",
    }]);
  }, [nodes]);

  // ── Drag ──
  const handleDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.instanceId === nodeId);
    if (!node) return;
    setDragging({ nodeId, offsetX: e.clientX - node.x, offsetY: e.clientY - node.y });
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setNodes(prev => prev.map(n =>
      n.instanceId === dragging.nodeId ? { ...n, x: e.clientX - dragging.offsetX, y: e.clientY - dragging.offsetY } : n
    ));
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // ── Connect ──
  const connectAgents = useCallback((fromNode: string, toNode: string) => {
    const from = nodes.find(n => n.instanceId === fromNode);
    const to = nodes.find(n => n.instanceId === toNode);
    if (!from || !to) return;
    const fa = AGENT_CATALOG.find(a => a.id === from.agentId);
    const ta = AGENT_CATALOG.find(a => a.id === to.agentId);
    setConnections(prev => [...prev, {
      id: `${fromNode}-${toNode}`, fromNode, fromPort: fa?.outputs[0] || "output",
      toNode, toPort: ta?.inputs[0] || "input",
    }]);
    addLog({ agentId: "", nodeInstanceId: "", role: "system", content: `🔗 Connected **${fa?.shortTitle}** → **${ta?.shortTitle}**`, status: "complete" });
  }, [nodes, addLog]);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.instanceId !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId));
  }, []);

  // ── RUN PIPELINE (REAL AI) ──
  const runPipeline = useCallback(async () => {
    if (nodes.length === 0) {
      toast({ title: "No agents", description: "Add agents to the canvas first.", variant: "destructive" });
      return;
    }
    if (pipelineRunning) return;
    setPipelineRunning(true);

    // Topological sort
    const hasIncoming = new Set(connections.map(c => c.toNode));
    const roots = nodes.filter(n => !hasIncoming.has(n.instanceId));
    if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

    const order: string[] = [];
    const visited = new Set<string>();
    const queue = roots.map(r => r.instanceId);
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      order.push(current);
      for (const conn of connections.filter(c => c.fromNode === current)) {
        if (!visited.has(conn.toNode)) queue.push(conn.toNode);
      }
    }
    for (const n of nodes) {
      if (!visited.has(n.instanceId)) order.push(n.instanceId);
    }

    addLog({ agentId: "", nodeInstanceId: "", role: "system", content: `🚀 **Pipeline started** — ${order.length} agents in sequence`, status: "complete" });

    // Reset all nodes
    setNodes(prev => prev.map(n => ({ ...n, status: "idle" as const, output: undefined, feedback: undefined })));

    const nodeOutputs: Record<string, string> = {};

    for (const nodeId of order) {
      const node = nodes.find(n => n.instanceId === nodeId);
      if (!node) continue;
      const agent = AGENT_CATALOG.find(a => a.id === node.agentId);
      if (!agent) continue;

      // Set running
      setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "running" as const } : n));

      const runningLogId = `log-${Date.now()}-${Math.random()}`;
      setChatLogs(prev => [...prev, {
        id: runningLogId, agentId: agent.id, nodeInstanceId: nodeId,
        role: "agent", content: `Processing ${agent.shortTitle}...`, timestamp: new Date(), status: "running",
      }]);

      // Gather upstream output
      const upstreamConns = connections.filter(c => c.toNode === nodeId);
      const upstreamData = upstreamConns.map(c => nodeOutputs[c.fromNode]).filter(Boolean).join("\n\n---\n\n");

      try {
        const output = await callAgentAI(agent, upstreamData, pipelineQuery);
        nodeOutputs[nodeId] = output;

        setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "awaiting-review" as const, output } : n));
        updateLog(runningLogId, { content: output, status: "complete" });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "declined" as const, output: `Error: ${errMsg}` } : n));
        updateLog(runningLogId, { content: `❌ Error: ${errMsg}`, status: "error" });
      }

      // Wait for human review before continuing to next agent
      await waitForReview(nodeId);
    }

    addLog({ agentId: "", nodeInstanceId: "", role: "system", content: "✅ **Pipeline complete** — All agents processed", status: "complete" });
    setPipelineRunning(false);
  }, [nodes, connections, addLog, updateLog, toast, pipelineRunning, pipelineQuery]);

  // Wait for user to approve/decline before pipeline continues
  const reviewResolvers = useRef<Record<string, () => void>>({});

  const waitForReview = (nodeId: string): Promise<void> => {
    return new Promise(resolve => {
      reviewResolvers.current[nodeId] = resolve;
    });
  };

  const approveNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "approved" as const } : n));
    const node = nodes.find(n => n.instanceId === nodeId);
    const agent = node ? AGENT_CATALOG.find(a => a.id === node.agentId) : null;
    addLog({ agentId: agent?.id || "", nodeInstanceId: nodeId, role: "user-action", content: `✅ **Approved** ${agent?.shortTitle || "agent"} output — forwarding to next agent`, status: "approved" });
    if (reviewResolvers.current[nodeId]) {
      reviewResolvers.current[nodeId]();
      delete reviewResolvers.current[nodeId];
    }
  }, [nodes, addLog]);

  const declineNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, status: "declined" as const } : n));
    const node = nodes.find(n => n.instanceId === nodeId);
    const agent = node ? AGENT_CATALOG.find(a => a.id === node.agentId) : null;
    addLog({ agentId: agent?.id || "", nodeInstanceId: nodeId, role: "user-action", content: `❌ **Declined** ${agent?.shortTitle || "agent"} output`, status: "declined" });
    if (reviewResolvers.current[nodeId]) {
      reviewResolvers.current[nodeId]();
      delete reviewResolvers.current[nodeId];
    }
  }, [nodes, addLog]);

  const feedbackNode = useCallback((nodeId: string, feedback: string) => {
    setNodes(prev => prev.map(n => n.instanceId === nodeId ? { ...n, feedback } : n));
    if (feedback) {
      addLog({ agentId: "", nodeInstanceId: nodeId, role: "user-action", content: `💬 Feedback: ${feedback}`, status: "declined" });
    }
  }, [addLog]);

  const resetCanvas = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setChatLogs([]);
    reviewResolvers.current = {};
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Workflow className="w-5 h-5" />
              <h1 className="text-xl font-semibold tracking-tight">Agent Communication</h1>
            </div>
            <p className="text-xs text-muted-foreground">Connect agents, run the pipeline with real AI, review & approve each step.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetCanvas} className="gap-1.5" disabled={pipelineRunning}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={runPipeline} className="gap-1.5" disabled={pipelineRunning || nodes.length === 0}>
              {pipelineRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {pipelineRunning ? "Running..." : "Run Pipeline"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main layout: Palette + Canvas + Chat */}
      <div className="flex gap-3 h-[calc(100vh-180px)]">
        {/* Agent Palette */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, width: paletteOpen ? 200 : 44 }}
          className="border border-border rounded-2xl bg-card flex flex-col overflow-hidden flex-shrink-0"
        >
          <div className="p-2.5 border-b border-border flex items-center justify-between">
            {paletteOpen && <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Agents</span>}
            <button onClick={() => setPaletteOpen(!paletteOpen)} className="p-1 rounded hover:bg-accent">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          {paletteOpen && (
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {AGENT_CATALOG.map(a => <PaletteItem key={a.id} agent={a} onAdd={addAgent} />)}
            </div>
          )}
        </motion.div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 border border-border rounded-2xl bg-muted/20 relative overflow-auto"
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          style={{ backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        >
          <div className="absolute top-3 left-3 right-3 z-10 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Pipeline query</label>
            <div className="flex gap-2">
              <Input value={pipelineQuery} onChange={e => setPipelineQuery(e.target.value)} placeholder="e.g. Turn quotation into production plan, then quality review, then invoice" className="h-9 text-xs bg-background" />
            </div>
          </div>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pt-16">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Plus className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Click agents from the palette</p>
                <p className="text-[10px] text-muted-foreground/60">Then connect & run the pipeline</p>
              </div>
            </div>
          )}

          <ConnectionLines connections={connections} nodes={nodes} />

          <AnimatePresence>
            {nodes.map(node => {
              const agent = AGENT_CATALOG.find(a => a.id === node.agentId)!;
              return (
                <CanvasNodeCard
                  key={node.instanceId} node={node} agent={agent}
                  connections={connections} allNodes={nodes}
                  onDragStart={handleDragStart} onRemove={removeNode}
                  onApprove={approveNode} onDecline={declineNode}
                  onFeedback={feedbackNode} onConnect={connectAgents}
                />
              );
            })}
          </AnimatePresence>

          {nodes.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              <Badge variant="secondary" className="text-[9px]">{nodes.length} agents</Badge>
              <Badge variant="secondary" className="text-[9px]">{connections.length} connections</Badge>
              <Badge variant="secondary" className="text-[9px]">{nodes.filter(n => n.status === "approved").length} approved</Badge>
            </div>
          )}
        </div>

        {/* Chat Output Panel */}
        <div className="w-[340px] flex-shrink-0">
          <ChatLogPanel logs={chatLogs} onClear={() => setChatLogs([])} />
        </div>
      </div>
    </div>
  );
}
