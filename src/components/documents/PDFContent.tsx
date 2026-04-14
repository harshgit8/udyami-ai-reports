interface PDFContentProps {
  type: 'quotation' | 'invoice' | 'quality' | 'production' | 'rnd';
  data: any;
}

// Indian-standard company header matching real polymer industry letterheads
function CompanyHeader() {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: '3px solid #1a1a1a' }}>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#1a1a1a', fontFamily: 'serif' }}>
            NANA'S POLYMERS PVT. LTD.
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>
            (An ISO 9001:2015 Certified Company)
          </p>
          <div className="mt-2 text-[9px] space-y-0.5" style={{ color: '#444' }}>
            <p>Regd. Office: Plot No. 456, MIDC Bhosari, Pune – 411026, Maharashtra, India</p>
            <p>Factory: Gat No. 123, Village Chakan, Tal. Khed, Dist. Pune – 410501</p>
            <p>Tel: +91-20-2712 3456 | Email: accounts@nanaspolymers.com</p>
            <p>CIN: U25200MH2018PTC123456 | PAN: AABCN1234B</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="w-14 h-14 flex items-center justify-center font-bold text-lg" 
               style={{ border: '2px solid #1a1a1a', color: '#1a1a1a', fontFamily: 'serif' }}>
            NP
          </div>
          <p className="text-[8px] mt-1" style={{ color: '#888' }}>Since 2018</p>
        </div>
      </div>
    </div>
  );
}

function GSTINBar({ gstin, stateCode }: { gstin?: string; stateCode?: string }) {
  return (
    <div className="flex justify-between text-[9px] py-1 px-2 mb-4" style={{ background: '#f5f5f5', border: '1px solid #ddd' }}>
      <span><strong>GSTIN:</strong> {gstin || '27AABCN1234B1Z5'}</span>
      <span><strong>State:</strong> Maharashtra ({stateCode || '27'})</span>
      <span><strong>HSN:</strong> 3926</span>
    </div>
  );
}

// ─── QUOTATION ───────────────────────────────────────────
function QuotationContent({ data }: { data: any }) {
  const subtotal = (data.quantity || 0) * (data.unitPrice || 0);
  const gstAmt = data.grandTotal ? data.grandTotal - (data.grandTotal / 1.18) : subtotal * 0.18;
  
  return (
    <div className="text-[11px]" style={{ color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      <CompanyHeader />
      
      <div className="text-center mb-4">
        <h2 className="text-base font-bold tracking-wider" style={{ letterSpacing: '3px' }}>QUOTATION</h2>
        <div className="w-16 h-0.5 mx-auto mt-1" style={{ background: '#1a1a1a' }} />
      </div>

      <GSTINBar />

      <div className="grid grid-cols-2 gap-6 mb-5">
        <div style={{ borderLeft: '3px solid #1a1a1a', paddingLeft: '8px' }}>
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>To</p>
          <p className="font-bold text-xs">{data.customer || '—'}</p>
        </div>
        <div className="text-right text-[10px] space-y-0.5">
          <p><span style={{ color: '#888' }}>Quote Ref:</span> <strong>{data.quoteId || '—'}</strong></p>
          <p><span style={{ color: '#888' }}>Date:</span> {data.date || '—'}</p>
          <p><span style={{ color: '#888' }}>Valid Until:</span> {data.validUntil || '30 days from date'}</p>
          <p><span style={{ color: '#888' }}>Payment:</span> {data.paymentTerms || '50% Advance, 50% on Delivery'}</p>
        </div>
      </div>

      <table className="w-full mb-4" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: 'white' }}>
            <th className="text-left py-1.5 px-2 text-[9px] font-semibold">Sr.</th>
            <th className="text-left py-1.5 px-2 text-[9px] font-semibold">Description of Goods</th>
            <th className="text-center py-1.5 px-2 text-[9px] font-semibold">HSN</th>
            <th className="text-right py-1.5 px-2 text-[9px] font-semibold">Qty</th>
            <th className="text-right py-1.5 px-2 text-[9px] font-semibold">Unit Price (₹)</th>
            <th className="text-right py-1.5 px-2 text-[9px] font-semibold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-2 px-2">1</td>
            <td className="py-2 px-2 font-medium">{data.product || '—'}</td>
            <td className="text-center py-2 px-2">3926</td>
            <td className="text-right py-2 px-2">{data.quantity?.toLocaleString('en-IN') || '—'}</td>
            <td className="text-right py-2 px-2">₹{data.unitPrice?.toFixed(2) || '0.00'}</td>
            <td className="text-right py-2 px-2 font-medium">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-56 text-[10px]">
          <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>CGST (9%)</span>
            <span>₹{(gstAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>SGST (9%)</span>
            <span>₹{(gstAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-xs" style={{ borderTop: '2px solid #1a1a1a' }}>
            <span>Grand Total</span>
            <span>₹{(data.grandTotal || subtotal + gstAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 text-[9px]" style={{ background: '#fafafa', border: '1px solid #eee' }}>
        <p className="font-bold uppercase tracking-wider mb-1.5" style={{ fontSize: '8px', color: '#888' }}>Terms & Conditions</p>
        <ol className="list-decimal pl-4 space-y-0.5" style={{ color: '#555' }}>
          <li>Prices are ex-factory, exclusive of freight and insurance.</li>
          <li>Payment: {data.paymentTerms || '50% advance, balance before dispatch'}.</li>
          <li>Delivery: {data.leadTime || '7-14'} working days from receipt of confirmed order.</li>
          <li>Material conforms to BIS/IS standards as applicable.</li>
          <li>This quotation is valid for 30 days from the date of issue.</li>
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-10 pt-4" style={{ borderTop: '1px solid #ddd' }}>
        <div className="text-[9px]" style={{ color: '#888' }}>
          <p>Prepared by: Sales Department</p>
          <p>This is a system-generated quotation.</p>
        </div>
        <div className="text-right text-[9px]">
          <p className="font-bold" style={{ color: '#1a1a1a' }}>For Nana's Polymers Pvt. Ltd.</p>
          <div className="mt-6 mb-1" style={{ borderBottom: '1px solid #aaa', width: '120px', marginLeft: 'auto' }} />
          <p style={{ color: '#888' }}>Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}

// ─── INVOICE (GST Tax Invoice - Indian Format) ──────────
function InvoiceContent({ data }: { data: any }) {
  const taxableAmt = data.grandTotal ? data.grandTotal / 1.18 : 0;
  const totalTax = data.grandTotal ? data.grandTotal - taxableAmt : 0;
  const isIGST = data.taxType === 'IGST';

  return (
    <div className="text-[11px]" style={{ color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      <CompanyHeader />

      <div className="text-center mb-3">
        <h2 className="text-base font-bold tracking-wider" style={{ letterSpacing: '3px' }}>TAX INVOICE</h2>
        <p className="text-[8px]" style={{ color: '#888' }}>(Under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)</p>
        <div className="w-16 h-0.5 mx-auto mt-1" style={{ background: '#1a1a1a' }} />
      </div>

      <GSTINBar gstin="27AABCN1234B1Z5" stateCode="27" />

      <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
        <div style={{ border: '1px solid #ddd', padding: '8px' }}>
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Bill To / Ship To</p>
          <p className="font-bold text-xs">{data.customer || '—'}</p>
          <p className="mt-1" style={{ color: '#555' }}>GSTIN: {data.customerGstin || '—'}</p>
          <p style={{ color: '#555' }}>PO No: {data.poNumber || '—'}</p>
          <p style={{ color: '#555' }}>Order: {data.orderId || '—'}</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '8px' }} className="text-right">
          <p><span style={{ color: '#888' }}>Invoice No:</span> <strong>{data.invoiceNumber || '—'}</strong></p>
          <p><span style={{ color: '#888' }}>Date:</span> {data.invoiceDate || '—'}</p>
          <p><span style={{ color: '#888' }}>Due Date:</span> {data.dueDate || '—'}</p>
          <p><span style={{ color: '#888' }}>D/C No:</span> {data.deliveryChallan || '—'}</p>
          <p><span style={{ color: '#888' }}>Delivery:</span> {data.deliveryDate || '—'}</p>
        </div>
      </div>

      <table className="w-full mb-3" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: 'white' }}>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Sr.</th>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Description</th>
            <th className="text-center py-1.5 px-2 text-[8px] font-semibold">HSN</th>
            <th className="text-right py-1.5 px-2 text-[8px] font-semibold">Qty</th>
            <th className="text-right py-1.5 px-2 text-[8px] font-semibold">Rate (₹)</th>
            <th className="text-right py-1.5 px-2 text-[8px] font-semibold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-2 px-2">1</td>
            <td className="py-2 px-2 font-medium">{data.product || data.productDescription || '—'}</td>
            <td className="text-center py-2 px-2">{data.hsnCode || '3926'}</td>
            <td className="text-right py-2 px-2">{data.quantity?.toLocaleString('en-IN') || '—'}</td>
            <td className="text-right py-2 px-2">₹{data.subtotal && data.quantity ? (data.subtotal / data.quantity).toFixed(2) : '—'}</td>
            <td className="text-right py-2 px-2 font-medium">₹{data.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mb-4">
        <div className="w-64 text-[10px]">
          <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span>₹{(data.subtotal || taxableAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {data.adjustments != null && (
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666' }}>Adjustments</span>
              <span>{Number(data.adjustments) >= 0 ? '+' : ''}₹{Number(data.adjustments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Taxable Amount</span>
            <span>₹{(data.taxableAmount || taxableAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {isIGST ? (
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666' }}>IGST (18%)</span>
              <span>₹{(data.igst || totalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>CGST (9%)</span>
                <span>₹{(data.cgst || totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>SGST (9%)</span>
                <span>₹{(data.sgst || totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
          {data.advancePaid != null && Number(data.advancePaid) > 0 && (
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666' }}>Less: Advance Paid</span>
              <span>-₹{Number(data.advancePaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold text-xs" style={{ borderTop: '2px solid #1a1a1a' }}>
            <span>Grand Total</span>
            <span>₹{(data.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {data.balanceDue != null && (
            <div className="flex justify-between py-1 font-semibold" style={{ color: Number(data.balanceDue) > 0 ? '#c00' : '#080' }}>
              <span>Balance Due</span>
              <span>₹{Number(data.balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 p-3 text-[9px]" style={{ background: '#fafafa', border: '1px solid #eee' }}>
        <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: '8px', color: '#888' }}>Bank Details for NEFT/RTGS</p>
        <div className="grid grid-cols-2 gap-2" style={{ color: '#555' }}>
          <p>Bank: HDFC Bank, Bhosari Branch</p>
          <p>A/c No: 50200087654321</p>
          <p>IFSC: HDFC0001234</p>
          <p>A/c Type: Current Account</p>
        </div>
      </div>

      <div className="mb-3 text-[8px]" style={{ color: '#888' }}>
        <p className="font-bold mb-1">Terms:</p>
        <p>1. Payment: {data.paymentTerms || 'Net 30 days from invoice date'}.</p>
        <p>2. Interest @ 18% p.a. will be charged on overdue payments.</p>
        <p>3. Subject to Pune jurisdiction.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 pt-4" style={{ borderTop: '1px solid #ddd' }}>
        <div className="text-[9px]" style={{ color: '#888' }}>
          <p>E. & O.E.</p>
          <p>Computer generated invoice.</p>
        </div>
        <div className="text-right text-[9px]">
          <p className="font-bold" style={{ color: '#1a1a1a' }}>For Nana's Polymers Pvt. Ltd.</p>
          <div className="mt-8 mb-1" style={{ borderBottom: '1px solid #aaa', width: '120px', marginLeft: 'auto' }} />
          <p style={{ color: '#888' }}>Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}

// ─── QUALITY INSPECTION REPORT ──────────────────────────
function QualityContent({ data }: { data: any }) {
  const isPass = data.decision === 'ACCEPT' || data.decision === 'ACCEPTED';
  const isConditional = data.decision?.includes('CONDITIONAL');
  
  return (
    <div className="text-[11px]" style={{ color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      <CompanyHeader />

      <div className="text-center mb-4">
        <h2 className="text-base font-bold tracking-wider" style={{ letterSpacing: '2px' }}>QUALITY INSPECTION CERTIFICATE</h2>
        <p className="text-[8px]" style={{ color: '#888' }}>As per IS/ISO 9001:2015 Quality Management System</p>
        <div className="w-16 h-0.5 mx-auto mt-1" style={{ background: '#1a1a1a' }} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 text-[10px]">
        <div style={{ border: '1px solid #ddd', padding: '8px' }}>
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Inspection Details</p>
          <p><span style={{ color: '#888' }}>Inspection ID:</span> <strong>{data.inspectionId || '—'}</strong></p>
          <p><span style={{ color: '#888' }}>Batch No:</span> {data.batchId || '—'}</p>
          <p><span style={{ color: '#888' }}>Product:</span> {data.productType || '—'}</p>
          <p><span style={{ color: '#888' }}>Quantity:</span> {data.quantity?.toLocaleString('en-IN') || '—'} units</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '8px' }} className="text-right">
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Test Results</p>
          <p><span style={{ color: '#888' }}>Total Defects:</span> {data.totalDefects ?? '—'}</p>
          <p><span style={{ color: '#888' }}>Defect Rate:</span> {data.defectRate ?? '—'}%</p>
          <p><span style={{ color: '#888' }}>Severity:</span> {data.severityLevel || '—'}</p>
          <p><span style={{ color: '#888' }}>Risk Level:</span> {data.riskLevel || '—'}</p>
        </div>
      </div>

      {/* Defect breakdown */}
      <table className="w-full mb-4" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: 'white' }}>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Category</th>
            <th className="text-center py-1.5 px-2 text-[8px] font-semibold">Count</th>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Classification</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-1.5 px-2">Critical</td>
            <td className="text-center py-1.5 px-2 font-bold" style={{ color: (data.critical || 0) > 0 ? '#c00' : '#080' }}>{data.critical ?? 0}</td>
            <td className="py-1.5 px-2 text-[9px]" style={{ color: '#888' }}>Safety / functional failure</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-1.5 px-2">Major</td>
            <td className="text-center py-1.5 px-2 font-bold" style={{ color: (data.major || 0) > 0 ? '#e60' : '#080' }}>{data.major ?? 0}</td>
            <td className="py-1.5 px-2 text-[9px]" style={{ color: '#888' }}>Performance impact</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-1.5 px-2">Minor</td>
            <td className="text-center py-1.5 px-2">{data.minor ?? 0}</td>
            <td className="py-1.5 px-2 text-[9px]" style={{ color: '#888' }}>Cosmetic / non-functional</td>
          </tr>
        </tbody>
      </table>

      {/* Decision stamp */}
      <div className="mb-4 py-4 text-center" style={{ border: '3px solid #1a1a1a' }}>
        <p className="text-lg font-bold" style={{ color: isPass ? '#080' : isConditional ? '#e60' : '#c00' }}>
          {isPass ? '✓ ACCEPTED' : isConditional ? '⚠ CONDITIONAL ACCEPT' : '✗ REJECTED'}
        </p>
        <p className="text-[9px] mt-1" style={{ color: '#666' }}>Confidence: {data.confidence ?? '—'}%</p>
      </div>

      {data.recommendation && (
        <div className="mb-4 p-3 text-[9px]" style={{ background: '#fafafa', border: '1px solid #eee' }}>
          <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: '8px', color: '#888' }}>Recommendation</p>
          <p style={{ color: '#555' }}>{data.recommendation}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mt-8 pt-4" style={{ borderTop: '1px solid #ddd' }}>
        <div className="text-[9px]">
          <p className="font-bold mb-4" style={{ color: '#1a1a1a' }}>Inspected By:</p>
          <div style={{ borderBottom: '1px solid #aaa', width: '120px' }} className="mb-1" />
          <p style={{ color: '#888' }}>QC Inspector</p>
        </div>
        <div className="text-right text-[9px]">
          <p className="font-bold mb-4" style={{ color: '#1a1a1a' }}>Approved By:</p>
          <div style={{ borderBottom: '1px solid #aaa', width: '120px', marginLeft: 'auto' }} className="mb-1" />
          <p style={{ color: '#888' }}>QC Supervisor</p>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTION ORDER ───────────────────────────────────
function ProductionContent({ data }: { data: any }) {
  return (
    <div className="text-[11px]" style={{ color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      <CompanyHeader />

      <div className="text-center mb-4">
        <h2 className="text-base font-bold tracking-wider" style={{ letterSpacing: '2px' }}>PRODUCTION ORDER / SCHEDULE</h2>
        <div className="w-16 h-0.5 mx-auto mt-1" style={{ background: '#1a1a1a' }} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 text-[10px]">
        <div style={{ border: '1px solid #ddd', padding: '8px' }}>
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Order Details</p>
          <p><span style={{ color: '#888' }}>Order ID:</span> <strong>{data.orderId || '—'}</strong></p>
          <p><span style={{ color: '#888' }}>Machine:</span> {data.machine || '—'}</p>
          <p><span style={{ color: '#888' }}>Risk Score:</span> {data.riskScore ?? '—'}/10</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '8px' }} className="text-right">
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Schedule</p>
          <p><span style={{ color: '#888' }}>Start:</span> {data.startTime || '—'}</p>
          <p><span style={{ color: '#888' }}>End:</span> {data.endTime || '—'}</p>
        </div>
      </div>

      <div className="mb-4 py-4 text-center" style={{ border: '3px solid #1a1a1a' }}>
        <p className="text-lg font-bold" style={{ 
          color: data.decision === 'PROCEED' ? '#080' : data.decision === 'DELAY' ? '#e60' : '#c00' 
        }}>
          {data.decision === 'PROCEED' ? '✓ PROCEED WITH PRODUCTION' : 
           data.decision === 'DELAY' ? '⚠ PRODUCTION DELAYED' : '✗ PRODUCTION HALTED'}
        </p>
      </div>

      {data.reason && (
        <div className="mb-4 p-3 text-[9px]" style={{ background: '#fafafa', border: '1px solid #eee' }}>
          <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: '8px', color: '#888' }}>Reason / Notes</p>
          <p style={{ color: '#555' }}>{data.reason}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mt-10 pt-4" style={{ borderTop: '1px solid #ddd' }}>
        <div className="text-[9px]">
          <p className="font-bold mb-4">Production Manager:</p>
          <div style={{ borderBottom: '1px solid #aaa', width: '120px' }} className="mb-1" />
          <p style={{ color: '#888' }}>Signature & Date</p>
        </div>
        <div className="text-right text-[9px]">
          <p className="font-bold mb-4">Plant Head:</p>
          <div style={{ borderBottom: '1px solid #aaa', width: '120px', marginLeft: 'auto' }} className="mb-1" />
          <p style={{ color: '#888' }}>Signature & Date</p>
        </div>
      </div>
    </div>
  );
}

// ─── R&D FORMULATION REPORT ─────────────────────────────
function RnDContent({ data }: { data: any }) {
  return (
    <div className="text-[11px]" style={{ color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      <CompanyHeader />

      <div className="text-center mb-4">
        <h2 className="text-base font-bold tracking-wider" style={{ letterSpacing: '2px' }}>R&D FORMULATION REPORT</h2>
        <p className="text-[8px]" style={{ color: '#c00' }}>CONFIDENTIAL — FOR INTERNAL USE ONLY</p>
        <div className="w-16 h-0.5 mx-auto mt-1" style={{ background: '#1a1a1a' }} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 text-[10px]">
        <div style={{ border: '1px solid #ddd', padding: '8px' }}>
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Formulation</p>
          <p><span style={{ color: '#888' }}>ID:</span> <strong>{data.formulationId || '—'}</strong></p>
          <p><span style={{ color: '#888' }}>Base Polymer:</span> {data.basePolymer || '—'}</p>
          <p><span style={{ color: '#888' }}>Application:</span> {data.application || '—'}</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '8px' }} className="text-right">
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Specifications</p>
          <p><span style={{ color: '#888' }}>Cost:</span> ₹{data.totalCost ?? '—'}/kg</p>
          <p><span style={{ color: '#888' }}>UL94 Rating:</span> {data.ul94Rating || '—'}</p>
          <p><span style={{ color: '#888' }}>Tensile:</span> {data.tensileMpa ?? '—'} MPa</p>
          <p><span style={{ color: '#888' }}>LOI:</span> {data.loi ?? '—'}%</p>
        </div>
      </div>

      <table className="w-full mb-4" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: 'white' }}>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Parameter</th>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Value</th>
            <th className="text-left py-1.5 px-2 text-[8px] font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-1.5 px-2">RoHS Compliance</td>
            <td className="py-1.5 px-2">{data.rohs || '—'}</td>
            <td className="py-1.5 px-2" style={{ color: data.rohs === 'True' || data.rohs === 'COMPLIANT' ? '#080' : '#c00' }}>
              {data.rohs === 'True' || data.rohs === 'COMPLIANT' ? '✓ Pass' : '—'}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-1.5 px-2">REACH Compliance</td>
            <td className="py-1.5 px-2">{data.reach || '—'}</td>
            <td className="py-1.5 px-2" style={{ color: data.reach === 'True' || data.reach === 'COMPLIANT' ? '#080' : '#c00' }}>
              {data.reach === 'True' || data.reach === 'COMPLIANT' ? '✓ Pass' : '—'}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <td className="py-1.5 px-2">Key Additives</td>
            <td className="py-1.5 px-2" colSpan={2}>{data.keyAdditives || '—'}</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-4 py-4 text-center" style={{ border: '3px solid #1a1a1a' }}>
        <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{data.productionReadiness || data.finalRecommendation || '—'}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 pt-4" style={{ borderTop: '1px solid #ddd' }}>
        <div className="text-[9px]">
          <p className="font-bold mb-4">Formulation Chemist:</p>
          <div style={{ borderBottom: '1px solid #aaa', width: '120px' }} className="mb-1" />
          <p style={{ color: '#888' }}>Signature & Date</p>
        </div>
        <div className="text-right text-[9px]">
          <p className="font-bold mb-4">R&D Head:</p>
          <div style={{ borderBottom: '1px solid #aaa', width: '120px', marginLeft: 'auto' }} className="mb-1" />
          <p style={{ color: '#888' }}>Signature & Date</p>
        </div>
      </div>
    </div>
  );
}

export function PDFContent({ type, data }: PDFContentProps) {
  switch (type) {
    case 'quotation':
      return <QuotationContent data={data} />;
    case 'invoice':
      return <InvoiceContent data={data} />;
    case 'quality':
      return <QualityContent data={data} />;
    case 'production':
      return <ProductionContent data={data} />;
    case 'rnd':
      return <RnDContent data={data} />;
    default:
      return <div>Unknown document type</div>;
  }
}
