
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LiveMode } from './components/LiveMode';
import { ChatSession, Message, Attachment, UserSettings } from './types';
import { urduAI } from './services/geminiService';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview');
  const [customInstructions, setCustomInstructions] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    fontSize: 'normal',
    fontFamily: 'nastaleeq',
    highContrast: false,
    voiceName: 'Kore'
  });

  useEffect(() => {
    const saved = localStorage.getItem('urdu_ai_sessions');
    const savedInstructions = localStorage.getItem('urdu_ai_custom_instructions');
    const savedSettings = localStorage.getItem('urdu_ai_settings');
    
    if (savedInstructions) setCustomInstructions(savedInstructions);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0 && !currentSessionId) setCurrentSessionId(parsed[0].id);
      } catch (e) { console.error(e); }
    }

    // Adjust for mobile address bar
    const setHeight = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => window.removeEventListener('resize', setHeight);
  }, []);

  useEffect(() => {
    localStorage.setItem('urdu_ai_sessions', JSON.stringify(sessions));
    localStorage.setItem('urdu_ai_settings', JSON.stringify(settings));
    
    document.body.style.fontSize = settings.fontSize === 'large' ? '1.15rem' : '1rem';
    document.body.className = settings.highContrast ? 'high-contrast bg-black' : 'bg-[#0f172a]';
  }, [sessions, settings]);

  useEffect(() => {
    localStorage.setItem('urdu_ai_custom_instructions', customInstructions);
  }, [customInstructions]);

  const handleSelectSession = (id: string) => {
    if (id !== currentSessionId) {
      urduAI.resetChat();
      setCurrentSessionId(id);
      setIsImageMode(false);
      const session = sessions.find(s => s.id === id);
      if (session) setSelectedModel(session.model || 'gemini-3-pro-preview');
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'نئی گفتگو',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    urduAI.resetChat();
    setIsImageMode(false);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const deleteChat = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0]?.id || null);
      urduAI.resetChat();
    }
  };

  const updateSessionMessages = (id: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        let title = s.title;
        if ((title === 'نئی گفتگو' || title.length < 5) && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 30).trim();
            if (firstUserMsg.content.length > 30) title += '...';
          }
        }
        return { ...s, messages, title, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession = { id: sessionId, title: text.slice(0, 30) || 'تحقیق', messages: [], createdAt: Date.now(), updatedAt: Date.now(), model: selectedModel };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, attachments, timestamp: Date.now() };
    const sessionObj = sessions.find(s => s.id === sessionId);
    const currentMsgs = sessionObj ? sessionObj.messages : [];
    const updatedHistory = [...currentMsgs, userMsg];
    updateSessionMessages(sessionId, updatedHistory);
    setIsLoading(true);
    
    try {
      const assistantId = (Date.now() + 1).toString();
      const placeholder: Message = { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() };
      updateSessionMessages(sessionId, [...updatedHistory, placeholder]);
      
      await urduAI.sendMessageStream(text, selectedModel, updatedHistory, attachments, customInstructions, (full, sources) => {
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === 'assistant') { last.content = full; last.sources = sources; }
            return { ...s, messages: msgs };
          }
          return s;
        }));
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex w-full overflow-hidden ${settings.fontFamily === 'nastaleeq' ? 'urdu-nastaleeq' : 'urdu-sans'}`} style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        sessions={sessions}
        activeId={currentSessionId}
        onSelect={handleSelectSession}
        onNewChat={createNewChat}
        onDelete={deleteChat}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        settings={settings}
        setSettings={setSettings}
      />
      
      <main className="flex-1 flex flex-col relative bg-[#0f172a] overflow-hidden">
        <ChatArea 
          session={sessions.find(s => s.id === currentSessionId) || null}
          onSendMessage={handleSendMessage}
          isImageMode={isImageMode}
          setIsImageMode={setIsImageMode}
          onStartVoice={() => setShowLiveMode(true)}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          settings={settings}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />
        {showLiveMode && <LiveMode settings={settings} onClose={() => setShowLiveMode(false)} />}
      </main>
    </div>
  );
};

export default App;
