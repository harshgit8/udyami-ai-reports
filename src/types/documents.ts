// Document Types for Udyami AI

export interface Quotation {
  id: string;
  quoteId: string;
  date: string;
  validUntil: string;
  customer: string;
  requestId: string;
  product: string;
  quantity: number;
  materialCost: number;
  productionCost: number;
  qualityCost: number;
  riskPremium: number;
  packagingCost: number;
  documentationCost: number;
  subtotal: number;
  profitMargin: number;
  profitMarginPercent: number;
  totalBeforeTax: number;
  gst: number;
  grandTotal: number;
  unitPrice: number;
  leadTime: number;
  paymentTerms: string;
  aiAnalysis: string;
  valueProposition: string;
  winProbability: 'HIGH' | 'MEDIUM' | 'LOW';
  negotiationFlexibility: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customer: string;
  customerAddress: string;
  customerGstin: string;
  customerState: string;
  quoteId: string;
  orderId: string;
  poNumber: string;
  batchId: string;
  inspectionId: string;
  productDescription: string;
  hsnCode: string;
  quantityOrdered: number;
  quantityDelivered: number;
  unitPrice: number;
  qualityStatus: 'ACCEPT' | 'ACCEPT_WITH_DEVIATION' | 'REJECT';
  materialCost: number;
  productionCost: number;
  qualityCost: number;
  packagingCost: number;
  subtotal: number;
  discount: number;
  additionalCharges: number;
  adjustedAmount: number;
  taxType: 'IGST' | 'CGST+SGST';
  gstRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax: number;
  grandTotal: number;
  advancePaid: number;
  balanceDue: number;
  paymentTerms: string;
  deliveryDate: string;
  deliveryChallan: string;
  transport: string;
  paymentRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  collectionPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  financialHealth: 'HEALTHY' | 'WATCH' | 'AT_RISK';
  aiActions: string;
}

export interface QualityInspection {
  id: string;
  inspectionId: string;
  batchId: string;
  timestamp: string;
  productType: string;
  quantity: number;
  inspectionStandard: string;
  totalDefects: number;
  criticalDefects: number;
  majorDefects: number;
  minorDefects: number;
  defectRate: number;
  measurementsTaken: number;
  withinTolerance: number;
  outOfSpec: number;
  severityLevel: 'EXCELLENT' | 'GOOD' | 'MARGINAL' | 'ACCEPTABLE' | 'POOR';
  riskLevel: 'None' | 'Low' | 'Medium' | 'High';
  severityScore: number;
  complianceStandard: string;
  isCompliant: boolean;
  violations: string;
  decision: 'ACCEPT' | 'CONDITIONAL_ACCEPT' | 'REJECT';
  decisionReason: string;
  confidence: number;
  recommendation: string;
  rootCause: string;
  processImprovement: string;
  qualityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  correctiveActions: string;
}

export interface ProductionOrder {
  id: string;
  orderId: string;
  decision: 'PROCEED' | 'DELAY' | 'REJECT';
  riskScore: number;
  reason: string;
  aiAnalysis: string;
  machine: string;
  startTime: string;
  endTime: string;
  recommendation: string;
}

export interface RnDFormulation {
  id: string;
  formulationId: string;
  generated: string;
  application: string;
  standards: string;
  costTarget: number;
  constraints: string[];
  formulation: Record<string, number>;
  totalCost: number;
  ul94Rating: string;
  tensileStrength: number;
  loi: number;
  thermalStability: number;
  processability: string;
  predictionConfidence: number;
  rohsCompliant: boolean;
  reachCompliant: boolean | string;
  toxicity: string;
  issues: string;
  finalRecommendation: string;
  rationale: string;
  tradeoffs: string;
  productionReadiness: 'PILOT_TEST' | 'NEEDS_WORK' | 'PRODUCTION_READY';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type DocumentType = 'quotation' | 'invoice' | 'quality' | 'production' | 'rnd';

export interface DocumentFilter {
  search: string;
  status?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: string;
}
