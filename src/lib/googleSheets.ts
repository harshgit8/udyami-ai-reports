import { supabase } from "@/integrations/supabase/client";
import type { Invoice, ProductionOrder, QualityInspection, Quotation, RnDFormulation } from "@/types/documents";

type WithId<T> = Partial<T> & { id: string; rawMarkdown: string };

interface SheetData {
  values?: string[][];
  error?: string;
}

export async function readFromSheet(range?: string, sheetName: string = 'Sheet1'): Promise<SheetData> {
  try {
    const { data, error } = await supabase.functions.invoke('google-sheets', {
      body: {
        action: 'read',
        range,
        sheetName,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error reading from sheet:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function writeToSheet(range: string, values: string[][], sheetName: string = 'Sheet1'): Promise<SheetData> {
  try {
    const { data, error } = await supabase.functions.invoke('google-sheets', {
      body: {
        action: 'write',
        range,
        values,
        sheetName,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function appendToSheet(values: string[][], sheetName: string = 'Sheet1'): Promise<SheetData> {
  try {
    const { data, error } = await supabase.functions.invoke('google-sheets', {
      body: {
        action: 'append',
        values,
        sheetName,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error appending to sheet:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Parse markdown quotation into structured data
export function parseQuotationMarkdown(markdown: string): Array<WithId<Quotation>> {
  const quotations: Array<WithId<Quotation>> = [];
  const sections = markdown.split('================================================================================');
  
  sections.forEach((section, index) => {
    if (!section.includes('QUOTATION') || section.includes('Quotation Batch Report')) return;
    
    try {
      const quoteIdMatch = section.match(/\*\*Quote ID:\*\* ([\w_]+)/);
      const dateMatch = section.match(/\*\*Date:\*\* ([\d-]+)/);
      const validUntilMatch = section.match(/\*\*Valid Until:\*\* ([\d-]+)/);
      const customerMatch = section.match(/\*\*Customer:\*\* (.+)/);
      const productMatch = section.match(/\*\*Product:\*\* (.+)/);
      const quantityMatch = section.match(/\*\*Quantity:\*\* (\d+)/);
      const grandTotalMatch = section.match(/\*\*GRAND TOTAL:\*\* ₹([\d.]+)/);
      const unitPriceMatch = section.match(/\*\*Unit Price:\*\* ₹([\d.]+)/);
      const winProbMatch = section.match(/\*\*Win Probability:\*\* (\w+)/);
      
      if (quoteIdMatch && customerMatch) {
        quotations.push({
          id: `q-${index}`,
          quoteId: quoteIdMatch[1],
          date: dateMatch?.[1] || '',
          validUntil: validUntilMatch?.[1] || '',
          customer: customerMatch[1].trim(),
          product: productMatch?.[1]?.trim() || '',
          quantity: parseInt(quantityMatch?.[1] || '0'),
          grandTotal: parseFloat(grandTotalMatch?.[1] || '0'),
          unitPrice: parseFloat(unitPriceMatch?.[1] || '0'),
          winProbability: winProbMatch?.[1] as 'HIGH' | 'MEDIUM' | 'LOW' || 'MEDIUM',
          rawMarkdown: section,
        });
      }
    } catch (e) {
      console.error('Error parsing quotation section:', e);
    }
  });
  
  return quotations;
}

// Parse markdown invoice into structured data
export function parseInvoiceMarkdown(markdown: string): Array<WithId<Invoice>> {
  const invoices: Array<WithId<Invoice>> = [];
  const sections = markdown.split('================================================================================');
  
  sections.forEach((section, index) => {
    if (!section.includes('TAX INVOICE')) return;
    
    try {
      const invoiceNumMatch = section.match(/\*\*Invoice Number:\*\* (.+)/);
      const invoiceDateMatch = section.match(/\*\*Invoice Date:\*\* ([\d-]+)/);
      const dueDateMatch = section.match(/\*\*Due Date:\*\* ([\d-]+)/);
      const customerMatch = section.match(/## 👤 Customer Details\n\*\*(.+)\*\*/);
      const grandTotalMatch = section.match(/\*\*GRAND TOTAL:\*\* ₹([\d.]+)/);
      const balanceDueMatch = section.match(/\*\*BALANCE DUE:\*\* ₹([\d.]+)/);
      const paymentRiskMatch = section.match(/\*\*Payment Risk:\*\* (\w+)/);
      
      if (invoiceNumMatch) {
        invoices.push({
          id: `inv-${index}`,
          invoiceNumber: invoiceNumMatch[1].trim(),
          invoiceDate: invoiceDateMatch?.[1] || '',
          dueDate: dueDateMatch?.[1] || '',
          customer: customerMatch?.[1]?.trim() || 'Unknown',
          grandTotal: parseFloat(grandTotalMatch?.[1] || '0'),
          balanceDue: parseFloat(balanceDueMatch?.[1] || '0'),
          paymentRisk: paymentRiskMatch?.[1]?.split(' ')[0] as 'LOW' | 'MEDIUM' | 'HIGH' || 'MEDIUM',
          rawMarkdown: section,
        });
      }
    } catch (e) {
      console.error('Error parsing invoice section:', e);
    }
  });
  
  return invoices;
}

// Parse markdown quality inspection into structured data
export function parseQualityMarkdown(markdown: string): Array<WithId<QualityInspection>> {
  const inspections: Array<WithId<QualityInspection>> = [];
  const sections = markdown.split('================================================================================');
  
  sections.forEach((section, index) => {
    if (!section.includes('Quality Inspection Report') || section.includes('Batch Report')) return;
    
    try {
      const inspectionIdMatch = section.match(/\*\*Inspection ID:\*\* ([\w_]+)/);
      const batchIdMatch = section.match(/\*\*Batch ID:\*\* (\w+)/);
      const productTypeMatch = section.match(/\*\*Product Type:\*\* (\w+)/);
      const quantityMatch = section.match(/\*\*Quantity:\*\* (\d+)/);
      const defectRateMatch = section.match(/\*\*Defect Rate:\*\* ([\d.]+)%/);
      const decisionMatch = section.match(/\*\*(ACCEPT|REJECT|CONDITIONAL_ACCEPT)\*\*/);
      const severityMatch = section.match(/\*\*Severity Level:\*\* (\w+)/);
      
      if (inspectionIdMatch) {
        inspections.push({
          id: `qc-${index}`,
          inspectionId: inspectionIdMatch[1],
          batchId: batchIdMatch?.[1] || '',
          productType: productTypeMatch?.[1] || '',
          quantity: parseInt(quantityMatch?.[1] || '0'),
          defectRate: parseFloat(defectRateMatch?.[1] || '0'),
          decision: decisionMatch?.[1] as 'ACCEPT' | 'REJECT' | 'CONDITIONAL_ACCEPT' || 'ACCEPT',
          severityLevel: severityMatch?.[1] || 'GOOD',
          rawMarkdown: section,
        });
      }
    } catch (e) {
      console.error('Error parsing quality section:', e);
    }
  });
  
  return inspections;
}

// Parse markdown production report into structured data  
export function parseProductionMarkdown(markdown: string): Array<WithId<ProductionOrder>> {
  const orders: Array<WithId<ProductionOrder>> = [];
  const sections = markdown.split(/### (?:✅|⚠️|❌) Order /);
  
  sections.forEach((section, index) => {
    if (index === 0 || !section.includes('Decision:')) return;
    
    try {
      const orderIdMatch = section.match(/^(ORD-\d+)/);
      const decisionMatch = section.match(/\*\*Decision:\*\* (\w+)/);
      const riskScoreMatch = section.match(/\*\*Risk Score:\*\* (\d+)\/10/);
      const reasonMatch = section.match(/\*\*Reason:\*\* (.+)/);
      const machineMatch = section.match(/\*\*Machine:\*\* (\w+)/);
      const startTimeMatch = section.match(/\*\*Start Time:\*\* (.+)/);
      const endTimeMatch = section.match(/\*\*End Time:\*\* (.+)/);
      
      if (orderIdMatch) {
        orders.push({
          id: `prod-${index}`,
          orderId: orderIdMatch[1],
          decision: decisionMatch?.[1] as 'PROCEED' | 'DELAY' | 'REJECT' || 'PROCEED',
          riskScore: parseInt(riskScoreMatch?.[1] || '0'),
          reason: reasonMatch?.[1]?.trim() || '',
          machine: machineMatch?.[1] || '',
          startTime: startTimeMatch?.[1]?.trim() || '',
          endTime: endTimeMatch?.[1]?.trim() || '',
          rawMarkdown: section,
        });
      }
    } catch (e) {
      console.error('Error parsing production section:', e);
    }
  });
  
  return orders;
}

// Parse markdown R&D formulation into structured data
export function parseRnDMarkdown(markdown: string): Array<WithId<RnDFormulation>> {
  const formulations: Array<WithId<RnDFormulation>> = [];
  const sections = markdown.split('================================================================================');
  
  sections.forEach((section, index) => {
    if (!section.includes('R&D Formulation Report') || section.includes('Batch Report')) return;
    
    try {
      const formulationIdMatch = section.match(/\*\*Formulation ID:\*\* ([\w_]+)/);
      const applicationMatch = section.match(/\*\*Application:\*\* (.+)/);
      const standardsMatch = section.match(/\*\*Standards:\*\* (.+)/);
      const costTargetMatch = section.match(/\*\*Cost Target:\*\* ₹([\d.]+)/);
      const totalCostMatch = section.match(/\*\*Total Cost:\*\* ₹(\d+)/);
      const ul94Match = section.match(/\*\*UL94 Rating:\*\* (.+)/);
      const recommendationMatch = section.match(/\*\*(.+?)\*\*\s*\n\n## 🤖 AI Analysis/);
      const productionReadinessMatch = section.match(/\*\*Production Readiness:\*\* (\w+)/);
      
      if (formulationIdMatch) {
        formulations.push({
          id: `rnd-${index}`,
          formulationId: formulationIdMatch[1],
          application: applicationMatch?.[1]?.trim() || '',
          standards: standardsMatch?.[1]?.trim() || '',
          costTarget: parseFloat(costTargetMatch?.[1] || '0'),
          totalCost: parseInt(totalCostMatch?.[1] || '0'),
          ul94Rating: ul94Match?.[1]?.trim() || '',
          recommendation: recommendationMatch?.[1]?.trim() || '',
          productionReadiness: productionReadinessMatch?.[1] as 'PILOT_TEST' | 'NEEDS_WORK' | 'PRODUCTION_READY' || 'PILOT_TEST',
          rawMarkdown: section,
        });
      }
    } catch (e) {
      console.error('Error parsing R&D section:', e);
    }
  });
  
  return formulations;
}
