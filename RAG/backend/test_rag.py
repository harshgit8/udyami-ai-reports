#!/usr/bin/env python3
"""
Quick test script for Udyami AI RAG Engine
Run this to verify the system is working
"""

import requests
import json
from Rag_engine import rag_engine

API_BASE = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_agent_status():
    """Test agent status endpoint"""
    print_section("1. Testing Agent Status")
    try:
        response = requests.get(f"{API_BASE}/agents/status")
        data = response.json()
        print("Agent Status:")
        for agent, status in data.items():
            loaded = "✓" if status['loaded'] else "✗"
            print(f"  {loaded} {agent}: {status}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_query_agent():
    """Test querying specific agent"""
    print_section("2. Testing Agent Query")
    
    test_queries = {
        "pricing": "What is the price of PVC resin?",
        "production": "What is the machine capacity?",
        "quality": "What are the ISO standards?",
        "inventory": "How much PVC do we have?",
    }
    
    for agent, query in test_queries.items():
        try:
            response = requests.post(
                f"{API_BASE}/query/agent",
                json={"agent": agent, "query": query, "top_k": 2}
            )
            data = response.json()
            
            if "error" in data:
                print(f"✗ {agent}: {data['error']}")
            else:
                print(f"✓ {agent}:")
                print(f"  Query: {query}")
                print(f"  Response: {data['response'][:100]}...")
        except Exception as e:
            print(f"✗ {agent}: {e}")

def test_auto_route():
    """Test auto-routing"""
    print_section("3. Testing Auto-Route Query")
    
    test_queries = [
        "What is the quotation for 5 tons?",
        "Can we produce 10 tons?",
        "Does it meet quality standards?",
        "What materials do we have?",
    ]
    
    for query in test_queries:
        try:
            response = requests.post(
                f"{API_BASE}/query/auto",
                json={"query": query}
            )
            data = response.json()
            
            if "error" in data:
                print(f"✗ Query: {query}")
                print(f"  Error: {data['error']}")
            else:
                print(f"✓ Query: {query}")
                print(f"  Routed to: {data['agent']}")
                print(f"  Response: {data['response'][:80]}...")
        except Exception as e:
            print(f"✗ Error: {e}")

def test_multi_agent():
    """Test multi-agent query"""
    print_section("4. Testing Multi-Agent Query")
    
    query = "Generate quotation for 5 tons PVC pipe"
    
    try:
        response = requests.post(
            f"{API_BASE}/query/multi-agent",
            json={"query": query}
        )
        data = response.json()
        
        print(f"Query: {query}\n")
        for agent, result in data.items():
            if "error" in result:
                print(f"✗ {agent}: {result['error']}")
            else:
                print(f"✓ {agent}:")
                print(f"  {result['response'][:100]}...\n")
    except Exception as e:
        print(f"✗ Error: {e}")

def test_health():
    """Test health endpoint"""
    print_section("0. Testing Health Check")
    try:
        response = requests.get(f"{API_BASE}/health")
        data = response.json()
        print(f"✓ Service Status: {data['status']}")
        print(f"  Service: {data['service']}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        print(f"  Make sure backend is running: python main.py")
        return False

def main():
    print("\n" + "="*60)
    print("  Udyami AI - RAG Engine Test Suite")
    print("="*60)
    
    # Check if backend is running
    if not test_health():
        print("\n⚠ Backend is not running!")
        print("Start it with: python main.py")
        return
    
    # Run tests
    test_agent_status()
    test_query_agent()
    test_auto_route()
    test_multi_agent()
    
    print_section("✓ All Tests Complete!")
    print("Your RAG system is ready for the hackathon demo!\n")

if __name__ == "__main__":
    main()
