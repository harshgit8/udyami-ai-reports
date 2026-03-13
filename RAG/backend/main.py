from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from Rag_engine import rag_engine

app = FastAPI(title="Udyami AI - RAG Engine", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class QueryRequest(BaseModel):
    query: str
    agent: Optional[str] = None

class AgentQueryRequest(BaseModel):
    agent: str
    query: str
    top_k: Optional[int] = 3

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Udyami AI RAG Engine"}

# Get all agents status
@app.get("/agents/status")
def get_agents_status():
    return rag_engine.get_agent_status()

# Query specific agent
@app.post("/query/agent")
def query_agent(request: AgentQueryRequest):
    result = rag_engine.query_agent(request.agent, request.query, request.top_k)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# Auto-route query to best agent
@app.post("/query/auto")
def query_auto(request: QueryRequest):
    result = rag_engine.query_auto_route(request.query)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# Upload document to agent
@app.post("/documents/upload")
async def upload_document(agent: str, file: UploadFile = File(...)):
    if agent not in ["pricing", "production", "quality", "inventory", "rnd", "scheduling"]:
        raise HTTPException(status_code=400, detail="Invalid agent name")
    
    try:
        # Save file
        folder = f"knowledgebase/{agent}"
        os.makedirs(folder, exist_ok=True)
        file_path = os.path.join(folder, file.filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Rebuild index
        result = rag_engine.add_document(agent, file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Multi-agent query (for complex workflows)
@app.post("/query/multi-agent")
def multi_agent_query(request: QueryRequest):
    """Query multiple agents and combine results"""
    results = {}
    for agent in ["pricing", "production", "quality", "inventory"]:
        result = rag_engine.query_agent(agent, request.query, top_k=2)
        results[agent] = result
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
