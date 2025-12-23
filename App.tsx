
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LiveMode } from './components/LiveMode';
import { LoginModal } from './components/LoginModal';
import { ChatSession, Message, Attachment, UserSettings, User } from './types';
import { urduAI } from './services/geminiService';
import { NEWS_PROMPT, AI_UPDATES_PROMPT } from './constants';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview');
  const [customInstructions, setCustomInstructions] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    fontSize: 'normal',
    fontFamily: 'nastaleeq',
    highContrast: false,
    voiceName: 'Kore',
    currentUser: null,
    voicePitch: 1.0,
    voiceSpeed: 1.0
  });

  useEffect(() => {
    const savedInstructions = localStorage.getItem('chat_grc_custom_instructions');
    const savedSettings = localStorage.getItem('chat_grc_settings');
    if (savedInstructions) setCustomInstructions(savedInstructions);
    if (savedSettings) {
      try { setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) })); } catch (e) {}
    }
    const setHeight = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => window.removeEventListener('resize', setHeight);
  }, []);

  useEffect(() => {
    if (settings.currentUser) {
      const saved = localStorage.getItem(`chat_grc_sessions_${settings.currentUser.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          if (parsed.length > 0) { setCurrentSessionId(parsed[0].id); urduAI.resetChat(); }
          else createNewChat();
        } catch (e) { createNewChat(); }
      } else createNewChat();
    } else createNewChat();
  }, [settings.currentUser]);

  useEffect(() => {
    if (settings.currentUser) localStorage.setItem(`chat_grc_sessions_${settings.currentUser.id}`, JSON.stringify(sessions));
    localStorage.setItem('chat_grc_settings', JSON.stringify(settings));
    document.body.className = settings.highContrast ? 'high-contrast bg-black' : 'bg-[#0f172a]';
  }, [sessions, settings]);

  const handleSendMessage = async (text: string, attachments: Attachment[] = [], forcedSessionId?: string) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    setIsLoading(true);
    let sessionId = forcedSessionId || currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession = { id: sessionId, title: text.slice(0, 30) || 'تحقیق', messages: [], createdAt: Date.now(), updatedAt: Date.now(), model: selectedModel };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, attachments, timestamp: Date.now() };
    
    setSessions(prev => {
      const sessionExists = prev.find(s => s.id === sessionId);
      if (!sessionExists && forcedSessionId) {
         return [{ id: sessionId!, title: text.slice(0, 40).trim() || 'نئی تحقیق', messages: [userMsg], createdAt: Date.now(), updatedAt: Date.now(), model: selectedModel }, ...prev];
      }
      return prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, userMsg], title: s.title === 'نئی گفتگو' ? text.slice(0, 40).trim() : s.title, updatedAt: Date.now() } : s);
    });

    try {
      const assistantId = (Date.now() + 1).toString();
      const placeholder: Message = { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, placeholder] } : s));

      const sessionForHistory = sessions.find(s => s.id === sessionId);
      const history = sessionForHistory ? [...sessionForHistory.messages, userMsg] : [userMsg];
      
      await urduAI.sendMessageStream(text, selectedModel, history, attachments, customInstructions, (full, sources) => {
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
    } catch (err) {
      console.error("App Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshContext = () => {
    urduAI.resetChat();
  };

  const handleFetchNews = () => {
    if (isLoading) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fullNewsPrompt = `${NEWS_PROMPT}\n\nآج کی اصل سسٹم تاریخ: ${dateStr}`;
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    urduAI.resetChat();
    handleSendMessage(fullNewsPrompt, [], newId);
  };

  const handleFetchAIUpdates = () => {
    if (isLoading) return;
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    urduAI.resetChat();
    handleSendMessage(AI_UPDATES_PROMPT, [], newId);
  };

  const createNewChat = useCallback(() => {
    const newSession: ChatSession = { id: Date.now().toString(), title: 'نئی گفتگو', messages: [], createdAt: Date.now(), updatedAt: Date.now(), model: selectedModel };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    urduAI.resetChat();
    setIsImageMode(false);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [selectedModel]);

  const deleteChat = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0]?.id || null);
      urduAI.resetChat();
    }
  };

  return (
    <div className={`flex w-full overflow-hidden ${settings.fontFamily === 'nastaleeq' ? 'urdu-nastaleeq' : 'urdu-sans'}`} style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar 
        sessions={sessions} activeId={currentSessionId} onSelect={(id) => { urduAI.resetChat(); setCurrentSessionId(id); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} 
        onNewChat={createNewChat} onDelete={deleteChat} isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} customInstructions={customInstructions} 
        setCustomInstructions={setCustomInstructions} settings={settings} setSettings={setSettings} 
        onLogout={() => { setSettings(prev => ({...prev, currentUser: null})); setSessions([]); setCurrentSessionId(null); }} 
        onShowLogin={() => setShowLoginModal(true)}
        onSendFeedback={() => { window.open(`https://wa.me/923126601660?text=${encodeURIComponent("السلام علیکم چیٹ جی آر سی ٹیم!")}`, '_blank'); }}
      />
      <main className="flex-1 flex flex-col relative bg-[#0f172a] overflow-hidden">
        <ChatArea 
          session={sessions.find(s => s.id === currentSessionId) || null}
          onSendMessage={handleSendMessage}
          onFetchNews={handleFetchNews}
          onFetchAIUpdates={handleFetchAIUpdates}
          isImageMode={isImageMode}
          setIsImageMode={setIsImageMode}
          onStartVoice={() => setShowLiveMode(true)}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelChange={(m) => { setSelectedModel(m); urduAI.resetChat(); }}
          settings={settings}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onRefreshContext={handleRefreshContext}
        />
        {showLiveMode && <LiveMode settings={settings} onClose={() => setShowLiveMode(false)} />}
        {showLoginModal && <LoginModal onLogin={(u) => { setSettings(prev => ({...prev, currentUser: u})); setShowLoginModal(false); }} onClose={() => setShowLoginModal(false)} />}
      </main>
    </div>
  );
};

export default App;
