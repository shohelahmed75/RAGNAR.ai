import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { FiFileText, FiLogOut, FiMenu, FiSend, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi';
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
    { role: 'assistant', content: `Welcome, ${user?.username}. I am RAGNAR, your document intelligence studio. Upload a PDF or select an existing file to begin.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`http://${window.location.hostname}:8000/files`);
      setUserFiles(response.data);
    } catch (e) {
      console.error("Failed to fetch files");
    }
  };

  const handleDelete = async (fileId: number, collectionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://${window.location.hostname}:8000/files/${fileId}`);
      if (activeCollection === collectionName) {
        setActiveCollection('');
        setMessages([{ role: 'assistant', content: 'Context cleared. Please select another document.' }]);
      }
      fetchFiles();
    } catch (error) {
      console.error("Failed to delete file");
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

    setUploadStatus({ type: 'info', text: 'Indexing your document. Please wait.' });

    try {
      const response = await axios.post(`http://${window.location.hostname}:8000/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.error) {
        setUploadStatus({ type: 'error', text: response.data.error });
      } else {
        setUploadStatus({ type: 'success', text: `Document indexed: ${response.data.filename}` });
        if (response.data.collection_name) {
          setActiveCollection(response.data.collection_name);
        }
        fetchFiles(); // Refresh list
        setIsSidebarOpen(false); // Close sidebar on mobile after upload
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
      setMessages([...messages, { role: 'assistant', content: 'Select or upload a document before asking questions.' }]);
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

      const response = await axios.post(`http://${window.location.hostname}:8000/chat`, payload);

      if (response.data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${response.data.error}` }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setMessages([...newMessages, { role: 'assistant', content: 'You are not authorized to query this collection.' }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'The connection dropped. Please try again.' }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  const activeFile = userFiles.find(f => f.collection_name === activeCollection);

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand-cluster">
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? 'Close document library' : 'Open document library'}
          >
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="brand-copy">
            <h1>RAGNAR</h1>
            <p className="subtitle">Document Intelligence Engine</p>
          </div>
        </div>


        <div className="header-right">
          <span className="logged-in-text">Signed in as {user?.username}</span>
          <button onClick={logout} className="contact-btn logout-btn">
            <span>Logout</span>
            <FiLogOut />
          </button>
        </div>
      </header>


      <main className="main-content">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <section className="panel upload-panel">
            <div className="panel-heading">
              <p className="section-kicker">U p l o a d . 0 1</p>
              <h2>New Document</h2>
            </div>
            <div
              className="upload-section"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <FiUploadCloud className="upload-icon" />
              <p>Drop a PDF or click to browse</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="file-input"
                accept="application/pdf"
              />
            </div>
            {uploadStatus && (
              <div className={`status-message status-${uploadStatus.type === 'info' ? 'success' : uploadStatus.type}`}>
                {uploadStatus.text}
              </div>
            )}
          </section>

          <section className="panel library-panel">
            <div className="panel-heading">
              <p className="section-kicker">L i b r a r y . 0 2</p>
              <h2>Your Files</h2>
            </div>
            {userFiles.length === 0 ? (
              <p className="empty-state">No documents uploaded yet.</p>
            ) : (
              <ul className="file-list">
                {userFiles.map(f => (
                  <li
                    key={f.id}
                    className={`file-item ${activeCollection === f.collection_name ? 'active' : ''}`}
                  >
                    <button className="file-select-btn" onClick={() => setActiveCollection(f.collection_name)}>
                      <FiFileText />
                      <span>{f.filename}</span>
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDelete(f.id, f.collection_name, e)}
                      title="Delete document"
                      aria-label={`Delete ${f.filename}`}
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <section className="chat-container panel">
          <div className="chat-header">
            <div>
              <p className="section-kicker">A s k . 0 3</p>
              <h2>Conversation</h2>
            </div>
            <div className="context-strip">
              {activeCollection ? `Active: ${activeFile?.filename || activeCollection}` : 'Select a document to begin'}
            </div>
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
              placeholder={activeCollection ? 'Ask RAGNAR a question...' : 'Select a document first...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping || !activeCollection}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping || !activeCollection}
              aria-label="Send message"
            >
              <FiSend />
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
