# Udyami AI - RAG Engine Setup

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python main.py
```

Server will start at: `http://localhost:8000`

### 3. Test the RAG Engine

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Check Agent Status
```bash
curl http://localhost:8000/agents/status
```

#### Query Pricing Agent
```bash
curl -X POST http://localhost:8000/query/agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "pricing",
    "query": "What is the price of PVC resin?"
  }'
```

#### Auto-Route Query
```bash
curl -X POST http://localhost:8000/query/auto \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the machine capacity?"
  }'
```

#### Upload New Document
```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "agent=production" \
  -F "file=@path/to/document.pdf"
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/agents/status` | Get all agents status |
| POST | `/query/agent` | Query specific agent |
| POST | `/query/auto` | Auto-route query |
| POST | `/query/multi-agent` | Query multiple agents |
| POST | `/documents/upload` | Upload document |

## Agents Available

- **pricing** - Quotation, pricing, cost analysis
- **production** - Production planning, batch scheduling
- **quality** - QC, ISO standards, defect analysis
- **inventory** - Stock levels, material availability
- **rnd** - Formulas, research, development
- **scheduling** - Machine scheduling, availability

## Knowledge Base Structure

```
knowledgebase/
├── pricing/
│   ├── raw_material_prices.xlsx
│   └── quotation_rules.pdf
├── production/
│   ├── machine_capacity.xlsx
│   └── production_rules.pdf
├── quality/
│   ├── iso_standards.pdf
│   └── qc_report_sample.xlsx
├── inventory/
│   └── stock_levels.xlsx
├── rnd/
│   └── polymer_formulas.xlsx
└── scheduling/
    └── machine_schedule_rules.pdf
```

## For Hackathon Demo

1. Start the server
2. Show document upload working
3. Query each agent with sample questions
4. Show auto-routing in action
5. Demonstrate multi-agent queries

## Troubleshooting

**Issue**: "Module not found"
- Make sure you're in the `backend` folder
- Run `pip install -r requirements.txt`

**Issue**: "No documents found"
- Check that files exist in `knowledgebase/` folders
- Ensure file formats are supported (PDF, XLSX, CSV, DOCX)

**Issue**: "Connection refused"
- Make sure server is running on port 8000
- Check firewall settings
