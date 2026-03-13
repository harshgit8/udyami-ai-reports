# Udyami AI - Multi-Agent RAG System for MSME Manufacturing

A production-ready RAG (Retrieval-Augmented Generation) platform for manufacturing MSMEs with department-specific AI agents.

## 🚀 Quick Start (Hackathon Mode)

### Backend Setup (5 minutes)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Server runs at: `http://localhost:8000`

### Frontend Setup (5 minutes)

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│              (Chat UI + Dashboard)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│              (Query Router + API)                        │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Pricing│  │Product │  │Quality │
    │ Agent  │  │ Agent  │  │ Agent  │
    └────┬───┘  └────┬───┘  └────┬───┘
         │           │           │
         ▼           ▼           ▼
    ┌──────────────────────────────────┐
    │    ChromaDB Vector Database      │
    │  (Separate collections per agent)│
    └──────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────┐
    │   Knowledge Base (Documents)     │
    │  - PDFs, Excel, CSV, DOCX        │
    └──────────────────────────────────┘
```

## 🤖 Available Agents

| Agent | Purpose | Example Queries |
|-------|---------|-----------------|
| **Pricing** | Quotations, cost analysis | "Generate quotation for 5 tons PVC" |
| **Production** | Batch planning, scheduling | "What is machine capacity?" |
| **Quality** | QC, ISO standards | "Does batch meet ISO standards?" |
| **Inventory** | Stock levels, materials | "Do we have enough PVC resin?" |
| **R&D** | Formulas, research | "Which formula supports 180°C?" |
| **Scheduling** | Machine availability | "When is Extruder-2 available?" |

## 📁 Knowledge Base Structure

```
backend/knowledgebase/
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

## 🔌 API Endpoints

### Health & Status
```bash
GET /health
GET /agents/status
```

### Query Endpoints
```bash
# Query specific agent
POST /query/agent
{
  "agent": "pricing",
  "query": "What is the price of PVC?",
  "top_k": 3
}

# Auto-route to best agent
POST /query/auto
{
  "query": "What is the machine capacity?"
}

# Query multiple agents
POST /query/multi-agent
{
  "query": "Generate quotation for 5 tons"
}
```

### Document Management
```bash
# Upload document
POST /documents/upload
-F "agent=production"
-F "file=@document.pdf"
```

## 🎯 Hackathon Demo Flow

1. **Show Agent Status**
   ```bash
   curl http://localhost:8000/agents/status
   ```

2. **Upload a Document**
   - Use the React UI file upload
   - Or curl: `POST /documents/upload`

3. **Query an Agent**
   - Type in chat: "What is the machine capacity?"
   - System auto-routes to Production Agent
   - Shows retrieved documents + AI response

4. **Show Multi-Agent Workflow**
   - Query: "Generate quotation for 5 tons PVC pipe"
   - System queries Pricing + Inventory + Production agents
   - Combines results

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + CSS |
| Backend | FastAPI + Python |
| RAG Framework | LlamaIndex |
| Vector DB | ChromaDB |
| Embeddings | BGE-small (HuggingFace) |
| Document Parsing | LlamaIndex loaders |

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- pip, npm

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 🚀 Running the System

### Terminal 1: Backend
```bash
cd backend
python main.py
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
```

### Terminal 3: Test (Optional)
```bash
# Test API
curl http://localhost:8000/health

# Query agent
curl -X POST http://localhost:8000/query/auto \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the machine capacity?"}'
```

## 🎨 Frontend Features

- ✅ Real-time chat interface
- ✅ Agent selector (auto-route or manual)
- ✅ Document upload
- ✅ Agent status indicators
- ✅ Responsive design
- ✅ Message history

## 🔧 Configuration

### Add New Agent
1. Create folder: `backend/knowledgebase/new_agent/`
2. Add documents
3. Update `AGENTS` dict in `Rag_engine.py`
4. Restart backend

### Change Embedding Model
Edit `Rag_engine.py`:
```python
embed_model = HuggingFaceEmbedding(
    model_name="BAAI/bge-large-en-v1.5"  # Change here
)
```

### Adjust Chunking
Edit `Rag_engine.py`:
```python
node_parser = SimpleNodeParser.from_defaults(
    chunk_size=1000,      # Increase for longer chunks
    chunk_overlap=200     # Increase for more overlap
)
```

## 📊 Example Queries for Demo

### Pricing Agent
- "What is the raw material cost for PVC?"
- "Generate quotation for 10 tons HDPE"
- "What are the quotation rules?"

### Production Agent
- "What is the capacity of Extruder-2?"
- "Can we produce 5 tons in one day?"
- "What are the production rules?"

### Quality Agent
- "Does batch B4423 meet ISO standards?"
- "What is the burst pressure requirement?"
- "Show QC report sample"

### Inventory Agent
- "How much PVC do we have?"
- "What is the stock level of additives?"
- "Do we have enough materials?"

### R&D Agent
- "Which formula supports 180°C?"
- "What is the polymer composition?"
- "Show all formulas"

### Scheduling Agent
- "When is Extruder-2 available?"
- "What are the machine schedule rules?"
- "Show machine availability"

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `pip install -r requirements.txt` |
| "Connection refused" | Check backend is running on port 8000 |
| "No documents found" | Verify files in `knowledgebase/` folders |
| "CORS error" | Backend CORS is enabled by default |
| "Slow responses" | Reduce `chunk_size` or use smaller embedding model |

## 📈 Performance Tips

1. **Faster Embeddings**: Use `BAAI/bge-small-en-v1.5` (default)
2. **Smaller Chunks**: Reduce `chunk_size` to 300-400
3. **Caching**: Add Redis for query caching
4. **Batch Processing**: Process multiple queries in parallel
5. **Local LLM**: Use Ollama for offline inference

## 🎓 For Judges

**Key Features to Highlight:**
- ✅ Multi-agent RAG architecture
- ✅ Department-specific knowledge bases
- ✅ Auto-routing based on query intent
- ✅ Document upload & indexing
- ✅ Production-ready API
- ✅ Real-time chat interface
- ✅ Scalable to any MSME industry

**Demo Talking Points:**
1. "Each department has its own AI agent with specialized knowledge"
2. "System automatically routes queries to the right agent"
3. "Documents are indexed into vector embeddings for fast retrieval"
4. "Supports any file format: PDF, Excel, CSV, DOCX"
5. "Can be deployed on-premise for data privacy"

## 📝 License

MIT License - Feel free to use for your hackathon!

## 🤝 Support

For issues or questions:
1. Check SETUP.md in backend folder
2. Review API endpoints documentation
3. Check example queries above

---

**Built for Udyami AI - Empowering MSMEs with AI** 🚀
