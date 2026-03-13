# 🏗️ Udyami AI - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                    (React Frontend)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Chat Interface  │  Agent Selector  │  File Upload       │   │
│  │  Message History │  Status Badges   │  Real-time Indexing│   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    HTTP/REST API
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    API LAYER                                      │
│                  (FastAPI Server)                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /health          /agents/status                         │   │
│  │  /query/agent     /query/auto      /query/multi-agent    │   │
│  │  /documents/upload                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                  AGENT ORCHESTRATOR                               │
│                  (RAG Engine)                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Query Router  │  Agent Selector  │  Document Processor │   │
│  │  Multi-Agent Coordinator                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐          ┌────────┐          ┌────────┐
    │Pricing │          │Product │          │Quality │
    │Agent   │          │Agent   │          │Agent   │
    └────┬───┘          └────┬───┘          └────┬───┘
         │                   │                   │
         ▼                   ▼                   ▼
    ┌────────┐          ┌────────┐          ┌────────┐
    │Pricing │          │Product │          │Quality │
    │KB      │          │KB      │          │KB      │
    └────┬───┘          └────┬───┘          └────┬───┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                  VECTOR DATABASE LAYER                            │
│                    (ChromaDB)                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  pricing_collection  │  production_collection           │   │
│  │  quality_collection  │  inventory_collection            │   │
│  │  rnd_collection      │  scheduling_collection           │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                  EMBEDDING LAYER                                  │
│              (HuggingFace BGE-small)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Text → 384-dim Vector Embeddings                        │   │
│  │  Fast & Efficient (CPU-friendly)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                  KNOWLEDGE BASE LAYER                             │
│              (Documents & Files)                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PDFs  │  Excel  │  CSV  │  DOCX  │  Images            │   │
│  │  ├─ raw_material_prices.xlsx                            │   │
│  │  ├─ quotation_rules.pdf                                 │   │
│  │  ├─ machine_capacity.xlsx                               │   │
│  │  ├─ iso_standards.pdf                                   │   │
│  │  ├─ stock_levels.xlsx                                   │   │
│  │  ├─ polymer_formulas.xlsx                               │   │
│  │  └─ machine_schedule_rules.pdf                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Query Flow Diagram

```
USER QUERY
    │
    ▼
┌─────────────────────────────────────────┐
│  Query Router                           │
│  - Analyze query intent                 │
│  - Extract keywords                     │
│  - Determine best agent                 │
└─────────────────────────────────────────┘
    │
    ├─ "quotation" → Pricing Agent
    ├─ "machine" → Scheduling Agent
    ├─ "quality" → Quality Agent
    ├─ "inventory" → Inventory Agent
    ├─ "formula" → R&D Agent
    └─ "production" → Production Agent
    │
    ▼
┌─────────────────────────────────────────┐
│  Selected Agent                         │
│  - Load agent's knowledge base          │
│  - Prepare query                        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Embedding Model                        │
│  - Convert query to vector              │
│  - 384-dimensional embedding            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Vector Search (ChromaDB)               │
│  - Find similar documents               │
│  - Cosine similarity search             │
│  - Return top-K results (K=3)           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Retrieved Documents                    │
│  - Document 1 (similarity: 0.92)        │
│  - Document 2 (similarity: 0.87)        │
│  - Document 3 (similarity: 0.81)        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  LLM Reasoning                          │
│  - Combine query + retrieved docs       │
│  - Generate answer                      │
│  - Format response                      │
└─────────────────────────────────────────┘
    │
    ▼
STRUCTURED OUTPUT
(Table / JSON / Text)
```

---

## Multi-Agent Workflow Example

```
USER REQUEST: "Generate quotation for 5 tons PVC pipe"
    │
    ▼
┌─────────────────────────────────────────┐
│  Query Router                           │
│  → Detected: Pricing + Production       │
└─────────────────────────────────────────┘
    │
    ├─────────────────────────────────────────────────────────┐
    │                                                         │
    ▼                                                         ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  Pricing Agent       │                          │  Production Agent    │
│  Query: "PVC price"  │                          │  Query: "Capacity"   │
│  Result: $2.5/kg     │                          │  Result: 10 tons/day │
└──────────────────────┘                          └──────────────────────┘
    │                                                         │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    ▼                                                         ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  Inventory Agent     │                          │  Scheduling Agent    │
│  Query: "PVC stock"  │                          │  Query: "Availability"
│  Result: 12 tons     │                          │  Result: 2 days      │
└──────────────────────┘                          └──────────────────────┘
    │
    └─────────────────────────────────────────────────────────┐
                                                              │
                                                              ▼
                                                    ┌──────────────────────┐
                                                    │  Combine Results     │
                                                    │  - Cost: $12,500     │
                                                    │  - Availability: Yes │
                                                    │  - Timeline: 2 days  │
                                                    └──────────────────────┘
                                                              │
                                                              ▼
                                                    QUOTATION OUTPUT
```

---

## Data Flow Diagram

```
DOCUMENT UPLOAD
    │
    ▼
┌─────────────────────────────────────────┐
│  File Receiver                          │
│  - Accept PDF, Excel, CSV, DOCX         │
│  - Validate file format                 │
│  - Save to agent folder                 │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Document Parser                        │
│  - Extract text from PDF                │
│  - Parse Excel sheets                   │
│  - Handle multiple formats              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Chunking Engine                        │
│  - Split into 500-token chunks          │
│  - Maintain 100-token overlap           │
│  - Preserve context                     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Embedding Model                        │
│  - Convert chunks to vectors            │
│  - 384-dimensional embeddings           │
│  - Batch processing                     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Vector Database                        │
│  - Store embeddings                     │
│  - Index for fast search                │
│  - Metadata storage                     │
└─────────────────────────────────────────┘
    │
    ▼
READY FOR QUERIES
```

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT TEMPLATE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent Name: [Pricing / Production / Quality / etc]        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Knowledge Base                                     │   │
│  │  - raw_material_prices.xlsx                         │   │
│  │  - quotation_rules.pdf                              │   │
│  │  - [Other domain-specific documents]                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Vector Collection (ChromaDB)                       │   │
│  │  - Indexed embeddings                               │   │
│  │  - Metadata                                         │   │
│  │  - Search index                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Query Engine                                       │   │
│  │  - Receive query                                    │   │
│  │  - Embed query                                      │   │
│  │  - Search vector DB                                │   │
│  │  - Retrieve top-K documents                         │   │
│  │  - Generate response                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Output Formatter                                   │   │
│  │  - Structured output (JSON/Table)                   │   │
│  │  - Human-readable format                            │   │
│  │  - Confidence scores                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                         │
│  React 18 + CSS                                             │
│  - Chat UI                                                  │
│  - Agent Selector                                           │
│  - File Upload                                              │
│  - Status Indicators                                        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  API LAYER                                                  │
│  FastAPI + Python                                           │
│  - RESTful endpoints                                        │
│  - Request validation                                       │
│  - Error handling                                           │
│  - CORS support                                             │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER                                       │
│  LlamaIndex + Python                                        │
│  - Query routing                                            │
│  - Agent orchestration                                      │
│  - Document processing                                      │
│  - Multi-agent coordination                                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                 │
│  ChromaDB + HuggingFace                                     │
│  - Vector storage                                           │
│  - Embeddings                                               │
│  - Similarity search                                        │
│  - Metadata management                                      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  STORAGE LAYER                                              │
│  File System                                                │
│  - PDF documents                                            │
│  - Excel spreadsheets                                       │
│  - CSV files                                                │
│  - DOCX documents                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Load Balancer (Nginx)                               │  │
│  │  - Route traffic                                     │  │
│  │  - SSL/TLS termination                               │  │
│  │  - Rate limiting                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                              │                   │
│         ▼                              ▼                   │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Frontend        │        │  Backend         │         │
│  │  (React)         │        │  (FastAPI)       │         │
│  │  Port: 3000      │        │  Port: 8000      │         │
│  └──────────────────┘        └──────────────────┘         │
│                                      │                     │
│                                      ▼                     │
│                              ┌──────────────────┐         │
│                              │  ChromaDB        │         │
│                              │  Vector DB       │         │
│                              │  Port: 8001      │         │
│                              └──────────────────┘         │
│                                      │                     │
│                                      ▼                     │
│                              ┌──────────────────┐         │
│                              │  File Storage    │         │
│                              │  Knowledge Base  │         │
│                              └──────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Scaling Strategy

```
SINGLE INSTANCE (MVP)
┌─────────────────────────────────────┐
│  Frontend + Backend + Vector DB     │
│  Single Server                      │
└─────────────────────────────────────┘

HORIZONTAL SCALING (Production)
┌──────────────────────────────────────────────────────────┐
│  Load Balancer                                           │
│  ┌────────────────┬────────────────┬────────────────┐   │
│  │  Backend 1     │  Backend 2     │  Backend 3     │   │
│  │  (FastAPI)     │  (FastAPI)     │  (FastAPI)     │   │
│  └────────────────┴────────────────┴────────────────┘   │
│                        │                                 │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Shared Vector Database (ChromaDB)               │   │
│  │  - Distributed storage                           │   │
│  │  - Replication                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                        │                                 │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Shared File Storage                             │   │
│  │  - S3 / NFS                                       │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

```
QUERY OPTIMIZATION
┌─────────────────────────────────────┐
│  Query Caching (Redis)              │
│  - Cache frequent queries           │
│  - Reduce DB hits                   │
│  - 10x faster responses              │
└─────────────────────────────────────┘

EMBEDDING OPTIMIZATION
┌─────────────────────────────────────┐
│  Batch Processing                   │
│  - Process multiple queries         │
│  - GPU acceleration                 │
│  - Parallel embedding               │
└─────────────────────────────────────┘

DATABASE OPTIMIZATION
┌─────────────────────────────────────┐
│  Indexing                           │
│  - Vector indexing                  │
│  - Metadata indexing                │
│  - Query optimization               │
└─────────────────────────────────────┘
```

---

**This architecture is designed for:**
- ✅ Fast development (hackathon-ready)
- ✅ Easy scaling (horizontal & vertical)
- ✅ High performance (<2s queries)
- ✅ Production reliability (99.9% uptime)
- ✅ Data privacy (on-premise deployment)
