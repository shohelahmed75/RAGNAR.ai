import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserFile {
  id: number;
  filename: string;
  collection_name: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hail, ${user?.username}! I am RAGNAR. Upload your scrolls or select an existing one to begin.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
  
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/files');
      setUserFiles(response.data);
    } catch (e) {
      console.error("Failed to fetch files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadStatus({ type: 'error', text: 'Only PDF files are allowed.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus({ type: 'info', text: 'Forging knowledge from your scroll... Please wait.' });
    
    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.error) {
        setUploadStatus({ type: 'error', text: response.data.error });
      } else {
        setUploadStatus({ type: 'success', text: `Knowledge absorbed! (${response.data.filename})` });
        if (response.data.collection_name) {
          setActiveCollection(response.data.collection_name);
        }
        fetchFiles(); // Refresh list
      }
    } catch (error) {
      setUploadStatus({ type: 'error', text: 'Failed to upload document.' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
      handleFileUpload({ target: { files: dataTransfer.files } } as any);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!activeCollection) {
      setMessages([...messages, { role: 'assistant', content: 'You must select or upload a scroll first before asking questions.' }]);
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      
      const payload: any = {
        query: userMessage.content,
        history: history,
        collection_name: activeCollection
      };
      
      const response = await axios.post('http://localhost:8000/chat', payload);

      if (response.data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${response.data.error}` }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
         setMessages([...newMessages, { role: 'assistant', content: 'You are not authorized to query this collection.' }]);
      } else {
         setMessages([...newMessages, { role: 'assistant', content: 'Alas! The connection to the gods was lost.' }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1>RAGNAR</h1>
          <p>Document Intelligence Engine</p>
        </div>
        <div>
          <span style={{ marginRight: '1rem', color: 'var(--accent-color)' }}>Logged in as {user?.username}</span>
          <button onClick={logout} className="upload-btn" style={{ padding: '0.3rem 0.8rem' }}>Logout</button>
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="glass-panel" style={{ flex: '0 0 auto' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-bright)' }}>
              Upload New Scroll
            </h2>
            <div 
              className="upload-section"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '1.5rem 1rem' }}
            >
              <p>Drag & Drop PDF or click</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="file-input" 
                accept="application/pdf"
              />
            </div>
            {uploadStatus && (
              <div className={`status-message status-${uploadStatus.type === 'info' ? 'success' : uploadStatus.type}`} style={{ opacity: uploadStatus.type === 'info' ? 0.8 : 1 }}>
                {uploadStatus.text}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-bright)' }}>
              Your Scrolls
            </h2>
            {userFiles.length === 0 ? (
              <p style={{ color: 'var(--accent-dim)', fontSize: '0.9rem' }}>No scrolls uploaded yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {userFiles.map(f => (
                  <li 
                    key={f.id} 
                    onClick={() => setActiveCollection(f.collection_name)}
                    style={{
                      padding: '0.8rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: activeCollection === f.collection_name ? 'var(--chat-user-bg)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${activeCollection === f.collection_name ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                      transition: 'all 0.2s',
                      wordBreak: 'break-all'
                    }}
                  >
                    {f.filename}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="chat-container glass-panel">
          <div style={{ padding: '0.5rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center', color: 'var(--accent-dim)', fontSize: '0.9rem' }}>
            {activeCollection ? `Active Context: ${userFiles.find(f => f.collection_name === activeCollection)?.filename || activeCollection}` : 'Select a scroll to begin asking questions.'}
          </div>
          
          <div className="chat-history">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                {renderMarkdown(msg.content)}
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble chat-assistant typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="input-area">
            <input 
              type="text" 
              className="chat-input" 
              placeholder={activeCollection ? "Ask RAGNAR a question..." : "Select a scroll first..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping || !activeCollection}
            />
            <button 
              className="send-btn" 
              onClick={sendMessage}
              disabled={!input.trim() || isTyping || !activeCollection}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;
