import os
import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# Initialize ChromaDB
chroma_client = chromadb.Client()

# Embedding model
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Agent knowledge bases
AGENTS = {
    "pricing": "knowledgebase/pricing",
    "production": "knowledgebase/production",
    "quality": "knowledgebase/quality",
    "inventory": "knowledgebase/inventory",
    "rnd": "knowledgebase/rnd",
    "scheduling": "knowledgebase/scheduling"
}


class RAGEngine:

    def __init__(self):
        self.indices = {}
        self.collections = {}
        self._initialize_all_agents()

    def _initialize_all_agents(self):
        """Load all knowledge bases"""
        for agent_name, folder_path in AGENTS.items():
            print(f"Loading {agent_name} knowledge base...")
            self._build_agent_index(agent_name, folder_path)

    def _build_agent_index(self, agent_name, folder_path):
        """Build vector index"""

        try:
            collection = chroma_client.get_or_create_collection(
                name=f"{agent_name}_kb",
                metadata={"hnsw:space": "cosine"}
            )

            self.collections[agent_name] = collection

            if not os.path.exists(folder_path):
                print(f"⚠ Folder not found: {folder_path}")
                return

            documents = SimpleDirectoryReader(folder_path).load_data()

            if not documents:
                print(f"⚠ No documents found in {folder_path}")
                return

            vector_store = ChromaVectorStore(chroma_collection=collection)

            storage_context = StorageContext.from_defaults(
                vector_store=vector_store
            )

            node_parser = SimpleNodeParser.from_defaults(
                chunk_size=500,
                chunk_overlap=100
            )

            index = VectorStoreIndex.from_documents(
                documents,
                storage_context=storage_context,
                node_parser=node_parser,
                embed_model=embed_model
            )

            self.indices[agent_name] = index

            print(f"✓ {agent_name} index built with {len(documents)} documents")

        except Exception as e:
            print(f"✗ Error loading {agent_name}: {str(e)}")

    def query_agent(self, agent_name, query, top_k=3):
        """Query specific agent"""

        if agent_name not in self.indices:
            return {"error": f"Agent '{agent_name}' not found"}

        try:

            index = self.indices[agent_name]

            query_engine = index.as_query_engine(
                similarity_top_k=top_k,
                response_mode="no_text"
            )

            response = query_engine.query(query)

            nodes = response.source_nodes

            if not nodes:
                answer = "No relevant information found in the knowledge base."
            else:
                answer = "\n".join([node.node.text for node in nodes])

            return {
                "agent": agent_name,
                "query": query,
                "response": answer,
                "status": "success"
            }

        except Exception as e:
            return {"error": str(e), "agent": agent_name}

    def route_query(self, query):
        """Auto route query to best agent"""

        query_lower = query.lower()

        routing_map = {
            "pricing": ["price", "quotation", "cost", "rate", "invoice"],
            "production": ["production", "batch", "machine", "capacity"],
            "quality": ["quality", "qc", "iso", "standard", "defect"],
            "inventory": ["inventory", "stock", "material", "raw"],
            "rnd": ["formula", "research", "development", "polymer"],
            "scheduling": ["schedule", "shift", "availability"]
        }

        for agent, keywords in routing_map.items():
            if any(keyword in query_lower for keyword in keywords):
                return agent

        return "production"

    def query_auto_route(self, query):
        """Auto route and query"""
        agent = self.route_query(query)
        return self.query_agent(agent, query)

    def add_document(self, agent_name, file_path):
        """Add document and rebuild index"""

        if agent_name not in AGENTS:
            return {"error": f"Agent '{agent_name}' not found"}

        try:

            agent_folder = AGENTS[agent_name]
            os.makedirs(agent_folder, exist_ok=True)

            self._build_agent_index(agent_name, agent_folder)

            return {
                "status": "success",
                "message": f"Document added to {agent_name}"
            }

        except Exception as e:
            return {"error": str(e)}

    def get_agent_status(self):
        """Check status of agents"""

        status = {}

        for agent_name in AGENTS:
            status[agent_name] = {
                "loaded": agent_name in self.indices,
                "collection": agent_name in self.collections
            }

        return status


# Initialize engine
rag_engine = RAGEngine()