/**
 * Udyami Feature Flags
 * 
 * Controls which features are visible in the application.
 * Toggle these to enable/disable AI features, advanced modules, etc.
 * 
 * For production: these can be moved to a database table or remote config.
 */

export interface FeatureFlags {
  // Core Operations (always recommended ON)
  quotations: boolean;
  invoices: boolean;
  quality: boolean;
  production: boolean;
  rnd: boolean;

  // Enterprise
  employees: boolean;
  shifts: boolean;
  payroll: boolean;
  crm: boolean;
  erp: boolean;
  admin: boolean;

  // AI Features
  aiChat: boolean;
  aiOrchestrators: boolean;
  agentComm: boolean;
  analytics: boolean;

  // Advanced AI (demo/future)
  whatIfSimulator: boolean;
  predictivePricing: boolean;
  productionRecommendation: boolean;
  supplierAuction: boolean;
  carbonFootprint: boolean;
  voiceOfCustomer: boolean;
  negotiationAgents: boolean;
  workforceWellbeing: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  // Core — ON by default
  quotations: true,
  invoices: true,
  quality: true,
  production: true,
  rnd: true,

  // Enterprise — ON by default
  employees: true,
  shifts: true,
  payroll: true,
  crm: true,
  erp: true,
  admin: true,

  // AI Features — ON but toggleable
  aiChat: true,
  aiOrchestrators: true,
  agentComm: false,       // Advanced — off by default
  analytics: true,

  // Advanced AI — demo mode
  whatIfSimulator: true,
  predictivePricing: true,
  productionRecommendation: true,
  supplierAuction: true,
  carbonFootprint: true,
  voiceOfCustomer: true,
  negotiationAgents: true,
  workforceWellbeing: true,
};

const STORAGE_KEY = "udyami_feature_flags";

export function getFeatureFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults so new flags get their default value
      return { ...DEFAULT_FLAGS, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_FLAGS };
}

export function setFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  const current = getFeatureFlags();
  const updated = { ...current, ...flags };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function resetFeatureFlags(): FeatureFlags {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_FLAGS };
}

// Human-readable labels for the admin panel
export const FLAG_LABELS: Record<keyof FeatureFlags, { label: string; category: string; description: string }> = {
  quotations: { label: "Quotations", category: "Core Operations", description: "Quotation generation and management" },
  invoices: { label: "Invoices", category: "Core Operations", description: "GST-compliant invoice generation" },
  quality: { label: "Quality Control", category: "Core Operations", description: "Quality inspection reports" },
  production: { label: "Production", category: "Core Operations", description: "Production scheduling and orders" },
  rnd: { label: "R&D Lab", category: "Core Operations", description: "Material formulation management" },

  employees: { label: "Employees", category: "Enterprise", description: "Employee directory and management" },
  shifts: { label: "Shifts", category: "Enterprise", description: "Shift scheduling and tracking" },
  payroll: { label: "Payroll", category: "Enterprise", description: "Salary processing and records" },
  crm: { label: "CRM", category: "Enterprise", description: "Customer relationship management" },
  erp: { label: "ERP Ops", category: "Enterprise", description: "Operational intelligence center" },
  admin: { label: "Admin", category: "Enterprise", description: "System administration and controls" },

  aiChat: { label: "Udyami AI Chat", category: "AI Features", description: "AI-powered manufacturing assistant" },
  aiOrchestrators: { label: "AI Orchestrators", category: "AI Features", description: "Autonomous AI agent dashboard" },
  agentComm: { label: "Agent Communication", category: "AI Features", description: "Inter-agent communication playground" },
  analytics: { label: "Analytics", category: "AI Features", description: "Data visualization and charts" },

  whatIfSimulator: { label: "What-If Simulator", category: "Advanced AI", description: "Scenario simulation engine" },
  predictivePricing: { label: "Predictive Pricing", category: "Advanced AI", description: "AI pricing recommendations" },
  productionRecommendation: { label: "Production Recommendation", category: "Advanced AI", description: "Next-product recommendations" },
  supplierAuction: { label: "Supplier Auction", category: "Advanced AI", description: "Reverse auction for suppliers" },
  carbonFootprint: { label: "Carbon Footprint", category: "Advanced AI", description: "CO₂ emissions tracking" },
  voiceOfCustomer: { label: "Voice of Customer", category: "Advanced AI", description: "Sentiment analysis" },
  negotiationAgents: { label: "Negotiation Agents", category: "Advanced AI", description: "Auto-negotiation with suppliers" },
  workforceWellbeing: { label: "Workforce Wellbeing", category: "Advanced AI", description: "Worker safety and fatigue detection" },
};
