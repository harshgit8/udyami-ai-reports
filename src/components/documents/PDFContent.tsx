import type { Invoice, ProductionOrder, QualityInspection, Quotation, RnDFormulation } from "@/types/documents";

interface PDFContentProps {
  type: 'quotation' | 'invoice' | 'quality' | 'production' | 'rnd';
  data: unknown;
}

// Company Header Component
function CompanyHeader() {
  return (
    <div className="mb-8 pb-6 border-b-2 border-foreground">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">UDYAMI AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Industrial Manufacturing Solutions</p>
          <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
            <p>456 Factory Road, Pune, Maharashtra 411001</p>
            <p>GSTIN: 27AABCA1234B1Z5 | PAN: AABCA1234B</p>
            <p>Contact: +91-9123456789 | info@udyami.ai</p>
          </div>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center font-bold text-xl">
            U
          </div>
        </div>
      </div>
    </div>
  );
}

// Quotation PDF Content
function QuotationContent({ data }: { data: Partial<Quotation> }) {
  return (
    <div className="text-sm">
      <CompanyHeader />
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">QUOTATION</h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Customer Details</h3>
          <p className="font-medium">{data.customer}</p>
        </div>
        <div className="text-right">
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Quote Details</h3>
          <p><span className="text-muted-foreground">Quote ID:</span> {data.quoteId}</p>
          <p><span className="text-muted-foreground">Date:</span> {data.date}</p>
          <p><span className="text-muted-foreground">Valid Until:</span> {data.validUntil}</p>
        </div>
      </div>

      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="text-left py-2 font-semibold">Description</th>
            <th className="text-right py-2 font-semibold">Qty</th>
            <th className="text-right py-2 font-semibold">Unit Price</th>
            <th className="text-right py-2 font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-3">{data.product}</td>
            <td className="text-right py-3">{data.quantity}</td>
            <td className="text-right py-3">₹{data.unitPrice?.toFixed(2)}</td>
            <td className="text-right py-3">₹{(data.quantity * data.unitPrice)?.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{(data.quantity * data.unitPrice)?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">GST (18%)</span>
            <span>₹{(data.grandTotal - (data.grandTotal / 1.18))?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg">
            <span>Grand Total</span>
            <span>₹{data.grandTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-muted">
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider">Terms & Conditions</h3>
        <p className="text-xs text-muted-foreground">Payment Terms: 50% advance, 50% on delivery</p>
        <p className="text-xs text-muted-foreground">Lead Time: {data.leadTime || '7-14'} days</p>
      </div>

      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>This is a computer-generated quotation.</p>
        <p className="mt-1">Thank you for your business.</p>
      </div>
    </div>
  );
}

// Invoice PDF Content
function InvoiceContent({ data }: { data: Partial<Invoice> }) {
  return (
    <div className="text-sm">
      <CompanyHeader />
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">TAX INVOICE</h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Bill To</h3>
          <p className="font-medium">{data.customer}</p>
        </div>
        <div className="text-right">
          <p><span className="text-muted-foreground">Invoice No:</span> {data.invoiceNumber}</p>
          <p><span className="text-muted-foreground">Date:</span> {data.invoiceDate}</p>
          <p><span className="text-muted-foreground">Due Date:</span> {data.dueDate}</p>
        </div>
      </div>

      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="text-left py-2 font-semibold">Description</th>
            <th className="text-right py-2 font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-3">Services Rendered</td>
            <td className="text-right py-3">₹{(data.grandTotal / 1.18)?.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{(data.grandTotal / 1.18)?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Tax (18%)</span>
            <span>₹{(data.grandTotal - (data.grandTotal / 1.18))?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg">
            <span>Grand Total</span>
            <span>₹{data.grandTotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-muted-foreground">Balance Due</span>
            <span className="font-semibold">₹{data.balanceDue?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-muted">
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider">Bank Details</h3>
        <p className="text-xs">Bank: HDFC Bank | Account: 50200012345678 | IFSC: HDFC0001234</p>
      </div>

      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
}

// Quality Inspection PDF Content
function QualityContent({ data }: { data: Partial<QualityInspection> }) {
  return (
    <div className="text-sm">
      <CompanyHeader />
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">QUALITY INSPECTION REPORT</h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p><span className="text-muted-foreground">Inspection ID:</span> {data.inspectionId}</p>
          <p><span className="text-muted-foreground">Batch ID:</span> {data.batchId}</p>
          <p><span className="text-muted-foreground">Product:</span> {data.productType}</p>
        </div>
        <div className="text-right">
          <p><span className="text-muted-foreground">Quantity:</span> {data.quantity}</p>
          <p><span className="text-muted-foreground">Defect Rate:</span> {data.defectRate}%</p>
          <p><span className="text-muted-foreground">Severity:</span> {data.severityLevel}</p>
        </div>
      </div>

      <div className="mb-6 p-4 border-2 border-foreground">
        <div className="text-center">
          <span className={`text-2xl font-bold ${
            data.decision === 'ACCEPT' ? '' : 
            data.decision === 'REJECT' ? '' : ''
          }`}>
            {data.decision === 'ACCEPT' ? '✓ ACCEPTED' : 
             data.decision === 'REJECT' ? '✗ REJECTED' : 
             '⚠ CONDITIONAL'}
          </span>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>This is an official quality inspection document.</p>
      </div>
    </div>
  );
}

// Production Report PDF Content
function ProductionContent({ data }: { data: Partial<ProductionOrder> }) {
  return (
    <div className="text-sm">
      <CompanyHeader />
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">PRODUCTION ORDER</h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p><span className="text-muted-foreground">Order ID:</span> {data.orderId}</p>
          <p><span className="text-muted-foreground">Machine:</span> {data.machine}</p>
        </div>
        <div className="text-right">
          <p><span className="text-muted-foreground">Start:</span> {data.startTime}</p>
          <p><span className="text-muted-foreground">End:</span> {data.endTime}</p>
          <p><span className="text-muted-foreground">Risk Score:</span> {data.riskScore}/10</p>
        </div>
      </div>

      <div className="mb-6 p-4 border-2 border-foreground">
        <div className="text-center">
          <span className="text-2xl font-bold">
            {data.decision === 'PROCEED' ? '✓ PROCEED' : 
             data.decision === 'DELAY' ? '⚠ DELAYED' : 
             '✗ REJECTED'}
          </span>
        </div>
        <p className="text-center mt-2 text-muted-foreground">{data.reason}</p>
      </div>

      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>This is a computer-generated production order.</p>
      </div>
    </div>
  );
}

// R&D Formulation PDF Content
function RnDContent({ data }: { data: Partial<RnDFormulation> }) {
  return (
    <div className="text-sm">
      <CompanyHeader />
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">R&D FORMULATION REPORT</h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p><span className="text-muted-foreground">Formulation ID:</span> {data.formulationId}</p>
          <p><span className="text-muted-foreground">Application:</span> {data.application}</p>
        </div>
        <div className="text-right">
          <p><span className="text-muted-foreground">Standards:</span> {data.standards}</p>
          <p><span className="text-muted-foreground">Cost:</span> ₹{data.totalCost}/kg</p>
          <p><span className="text-muted-foreground">Rating:</span> {data.ul94Rating}</p>
        </div>
      </div>

      <div className="mb-6 p-4 border-2 border-foreground">
        <div className="text-center">
          <span className="text-lg font-bold">{data.productionReadiness}</span>
        </div>
        <p className="text-center mt-2 text-muted-foreground">{data.recommendation}</p>
      </div>

      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>This is a confidential R&D document.</p>
      </div>
    </div>
  );
}

export function PDFContent({ type, data }: PDFContentProps) {
  const typed = data as Partial<
    Quotation | Invoice | QualityInspection | ProductionOrder | RnDFormulation
  >;
  switch (type) {
    case 'quotation':
      return <QuotationContent data={typed as Partial<Quotation>} />;
    case 'invoice':
      return <InvoiceContent data={typed as Partial<Invoice>} />;
    case 'quality':
      return <QualityContent data={typed as Partial<QualityInspection>} />;
    case 'production':
      return <ProductionContent data={typed as Partial<ProductionOrder>} />;
    case 'rnd':
      return <RnDContent data={typed as Partial<RnDFormulation>} />;
    default:
      return <div>Unknown document type</div>;
  }
}
