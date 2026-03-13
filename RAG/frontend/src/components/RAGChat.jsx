import React, { useState, useEffect, useRef } from 'react';
import './RAGChat.css';

const RAGChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('auto');
  const [agents, setAgents] = useState({});
  const messagesEndRef = useRef(null);

  const API_BASE = 'http://localhost:8000';

  // Fetch agent status on mount
  useEffect(() => {
    fetchAgentStatus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/status`);
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;
      
      if (selectedAgent === 'auto') {
        response = await fetch(`${API_BASE}/query/auto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input })
        });
      } else {
        response = await fetch(`${API_BASE}/query/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: selectedAgent,
            query: input,
            top_k: 3
          })
        });
      }

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}`,
          agent: data.agent || selectedAgent
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          agent: data.agent || selectedAgent
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Connection error: ${error.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('agent', selectedAgent === 'auto' ? 'production' : selectedAgent);

    try {
      const response = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `✓ Document uploaded to ${selectedAgent} agent`
        }]);
        fetchAgentStatus();
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="rag-chat-container">
      <div className="chat-header">
        <h1>Udyami AI - Factory Intelligence</h1>
        <div className="agent-selector">
          <label>Agent:</label>
          <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            <option value="auto">Auto-Route</option>
            <option value="pricing">Pricing Agent</option>
            <option value="production">Production Agent</option>
            <option value="quality">Quality Agent</option>
            <option value="inventory">Inventory Agent</option>
            <option value="rnd">R&D Agent</option>
            <option value="scheduling">Scheduling Agent</option>
          </select>
        </div>
      </div>

      <div className="agent-status">
        {Object.entries(agents).map(([agent, status]) => (
          <div key={agent} className={`status-badge ${status.loaded ? 'loaded' : 'error'}`}>
            {agent}: {status.loaded ? '✓' : '✗'}
          </div>
        ))}
      </div>

      <div className="messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-header">
              <span className="role">{msg.role === 'user' ? 'You' : msg.agent || 'System'}</span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {loading && <div className="message assistant"><div className="typing">Thinking...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about production, pricing, quality, inventory..."
          disabled={loading}
        />
        <label className="file-upload">
          📎
          <input type="file" onChange={handleFileUpload} accept=".pdf,.xlsx,.csv,.docx" />
        </label>
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
};

export default RAGChat;
