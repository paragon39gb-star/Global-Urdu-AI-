
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LiveMode } from './components/LiveMode';
import { LoginModal } from './components/LoginModal';
import { ChatSession, Message, Attachment, UserSettings, User, Contact } from './types';
import { chatGRC } from './services/geminiService';
import { NEWS_PROMPT, AI_UPDATES_PROMPT, MOCK_CONTACTS } from './constants';
import { Loader2, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview');
  const [customInstructions, setCustomInstructions] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    fontSize: 18,
    fontFamily: 'sans', 
    highContrast: false,
    voiceName: 'Kore',
    currentUser: null,
    voicePitch: 1.0,
    voiceSpeed: 1.0
  });

  // Safe Load initial settings and data
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Load Custom Instructions
        const savedInstructions = localStorage.getItem('chat_grc_custom_instructions');
        if (savedInstructions) setCustomInstructions(savedInstructions);

        // 2. Load Settings
        const savedSettings = localStorage.getItem('chat_grc_settings');
        let currentParsedUser = null;
        if (savedSettings) {
          try { 
            const parsed = JSON.parse(savedSettings);
            if (typeof parsed.fontSize === 'string') {
              parsed.fontSize = parsed.fontSize === 'large' ? 22 : 18;
            }
            currentParsedUser = parsed.currentUser;
            setSettings(prev => ({ ...prev, ...parsed })); 
          } catch (e) {}
        }

        // 3. Load Sessions
        const storageKey = currentParsedUser ? `chat_grc_sessions_${currentParsedUser.id}` : 'chat_grc_sessions_guest';
        const savedSessions = localStorage.getItem(storageKey);
        if (savedSessions) {
          try {
            const parsed = JSON.parse(savedSessions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSessions(parsed);
              setCurrentSessionId(parsed[0].id);
            }
          } catch (e) {}
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        // Even if some loads fail, make app ready
        setIsAppReady(true);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const createNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'نئی تحقیق',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    chatGRC.resetChat();
  }, [selectedModel]);

  useEffect(() => {
    if (isAppReady && sessions.length === 0) {
      createNewChat();
    }
  }, [isAppReady, sessions.length, createNewChat]);

  useEffect(() => {
    if (!isAppReady) return;

    const storageKey = settings.currentUser ? `chat_grc_sessions_${settings.currentUser.id}` : 'chat_grc_sessions_guest';
    localStorage.setItem(storageKey, JSON.stringify(sessions));
    localStorage.setItem('chat_grc_settings', JSON.stringify(settings));
    localStorage.setItem('chat_grc_custom_instructions', customInstructions);

    document.body.className = settings.highContrast ? 'high-contrast bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900';
    document.documentElement.classList.toggle('dark', settings.highContrast);
  }, [sessions, settings, customInstructions, isAppReady]);

  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId) || null
  , [sessions, currentSessionId]);

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!currentSessionId || !currentSession) return;

    const isFirstMessage = currentSession.messages.length === 0;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: s.messages.map(m => ({ ...m, suggestions: undefined })) }
        : s
    ));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() }
        : s
    ));

    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    try {
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
      ));

      let instructions = customInstructions;
      if (currentSession.contactId) {
        const contact = MOCK_CONTACTS.find(c => c.id === currentSession.contactId);
        if (contact) instructions = `${contact.persona}\n\n${customInstructions}`;
      }

      const fullResponse = await chatGRC.sendMessageStream(
        content,
        selectedModel,
        currentSession?.messages || [],
        attachments,
        instructions,
        (text, sources) => {
          setSessions(prev => prev.map(s => 
            s.id === currentSessionId 
              ? { 
                  ...s, 
                  messages: s.messages.map(m => 
                    m.id === assistantMessageId ? { ...m, content: text, sources } : m
                  ) 
                } 
              : s
          ));
        }
      );

      if (isFirstMessage && !currentSession.contactId) {
        chatGRC.generateTitle(content).then(newTitle => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
        });
      }

      const lastMsgs = [...currentSession.messages, userMessage, { role: 'assistant', content: fullResponse } as Message];
      const newSuggestions = await chatGRC.generateSuggestions(lastMsgs);
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === assistantMessageId ? { ...m, suggestions: newSuggestions } : m
              ) 
            } 
          : s
      ));
      
    } catch (error: any) {
      let errorMessage = "معذرت! جواب موصول کرنے میں دشواری پیش آئی۔";
      if (error.message?.includes("API key not valid")) errorMessage = "API Key درست نہیں۔";
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: errorMessage } : m) } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentNews = () => {
    const today = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    handleSendMessage(NEWS_PROMPT.replace('[CURRENT_DATE]', today));
  };

  const fetchAIUpdates = () => {
    const today = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    handleSendMessage(AI_UPDATES_PROMPT.replace('[CURRENT_DATE]', today));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) return [];
      if (id === currentSessionId) setCurrentSessionId(filtered[0].id);
      return filtered;
    });
  };

  const handleWhatsAppFeedback = () => {
    window.open(`https://wa.me/923099572321?text=${encodeURIComponent("سلام اردو اے آئی! میں اپنی رائے دینا چاہتا ہوں: ")}`, '_blank');
  };

  const getFontClass = () => {
    switch(settings.fontFamily) {
      case 'nastaleeq': return 'urdu-font-nastaleeq';
      case 'naskh': return 'urdu-font-naskh';
      default: return 'urdu-font-sans';
    }
  };

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 bg-[#0c4a6e] flex flex-col items-center justify-center z-[9999]">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl animate-pulse">
            <Sparkles size={48} className="text-sky-300" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0c4a6e] animate-bounce" />
        </div>
        <div className="text-center space-y-4 px-6">
          <h1 className="text-3xl font-black text-white urdu-text tracking-tight">اردو اے آئی</h1>
          <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            <p className="text-sky-100 urdu-text font-bold">تحقیق کا آغاز ہو رہا ہے...</p>
          </div>
          <p className="text-sky-300/40 text-[10px] uppercase font-black tracking-widest">Global Research Centre by Qari Khalid Mahmood</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${getFontClass()}`}>
      <Sidebar 
        sessions={sessions}
        activeId={currentSessionId}
        onSelect={setCurrentSessionId}
        onNewChat={createNewChat}
        onSelectContact={(c) => {
          const existing = sessions.find(s => s.contactId === c.id);
          if (existing) {
            setCurrentSessionId(existing.id);
          } else {
            const newId = `contact_${c.id}_${Date.now()}`;
            const newSession: ChatSession = {
              id: newId,
              title: c.name,
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              model: selectedModel,
              contactId: c.id
            };
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newId);
          }
          setIsSidebarOpen(false);
          chatGRC.resetChat();
        }}
        onDelete={deleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        settings={settings}
        setSettings={setSettings}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        onLogout={() => {
          setSettings(prev => ({ ...prev, currentUser: null }));
          setSessions([]);
          setCurrentSessionId(null);
        }}
        onShowLogin={() => setShowLoginModal(true)}
        onSendFeedback={handleWhatsAppFeedback}
        onInstall={deferredPrompt ? handleInstall : undefined}
      />
      <ChatArea 
        session={currentSession}
        onSendMessage={handleSendMessage}
        onFetchNews={fetchCurrentNews}
        onFetchAIUpdates={fetchAIUpdates}
        isImageMode={isImageMode}
        setIsImageMode={setIsImageMode}
        onStartVoice={() => setShowLiveMode(true)}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={(m) => { setSelectedModel(m); chatGRC.resetChat(); }}
        settings={settings}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onRefreshContext={() => { chatGRC.resetChat(); createNewChat(); }}
      />
      {showLiveMode && <LiveMode settings={settings} onClose={() => setShowLiveMode(false)} />}
      {showLoginModal && (
        <LoginModal 
          onLogin={(u) => { setSettings(prev => ({...prev, currentUser: u})); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
