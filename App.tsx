
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LiveMode } from './components/LiveMode';
import { LoginModal } from './components/LoginModal';
import { ChatSession, Message, Attachment, UserSettings, User, Contact } from './types';
import { chatGRC } from './services/geminiService';
import { NEWS_PROMPT, AI_UPDATES_PROMPT, MOCK_CONTACTS } from './constants';
import { Rocket, ShieldAlert, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  
  // Rule: Use gemini-3-pro-preview for complex research tasks.
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

  // Check for API Key selection on startup
  useEffect(() => {
    const checkKey = async () => {
      setIsCheckingKey(true);
      try {
        // Rule: If process.env.API_KEY is defined and not empty, use it.
        const envKey = process.env.API_KEY;
        const hasSelected = window.aistudio && await window.aistudio.hasSelectedApiKey();
        
        if (envKey && envKey.length > 5) {
          setIsKeyReady(true);
          setKeyError(false);
        } else if (hasSelected) {
          setIsKeyReady(true);
          setKeyError(false);
        } else {
          setKeyError(true);
        }
      } catch (e) {
        // Fallback for unexpected issues
        if (process.env.API_KEY) setIsKeyReady(true);
        else setKeyError(true);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsKeyReady(true);
      setKeyError(false);
    } else {
      // In normal browser, if key is missing, prompt to check env
      alert("براہ کرم ورسل میں API_KEY اینوائرنمنٹ ویری ایبل چیک کریں۔");
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("براؤزر پہلے ہی انسٹال ہے یا فیچر سپورٹ نہیں کر رہا۔");
      return;
    }
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
    setSuggestions([]);
    chatGRC.resetChat();
  }, [selectedModel]);

  const startChatWithContact = (contact: Contact) => {
    const existing = sessions.find(s => s.contactId === contact.id);
    if (existing) {
      setCurrentSessionId(existing.id);
      setIsSidebarOpen(false);
      return;
    }

    const newId = `contact_${contact.id}_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: contact.name,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      contactId: contact.id
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setIsSidebarOpen(false);
    chatGRC.resetChat();
  };

  useEffect(() => {
    const savedInstructions = localStorage.getItem('chat_grc_custom_instructions');
    const savedSettings = localStorage.getItem('chat_grc_settings');
    if (savedInstructions) setCustomInstructions(savedInstructions);
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        if (typeof parsed.fontSize === 'string') {
          parsed.fontSize = parsed.fontSize === 'large' ? 22 : 18;
        }
        setSettings(prev => ({ ...prev, ...parsed })); 
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (settings.currentUser) {
      const saved = localStorage.getItem(`chat_grc_sessions_${settings.currentUser.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
            setCurrentSessionId(parsed[0].id);
          } else { createNewChat(); }
        } catch (e) { createNewChat(); }
      } else { createNewChat(); }
    } else if (sessions.length === 0) { createNewChat(); }
  }, [settings.currentUser, createNewChat]);

  useEffect(() => {
    if (settings.currentUser) {
      localStorage.setItem(`chat_grc_sessions_${settings.currentUser.id}`, JSON.stringify(sessions));
    }
    localStorage.setItem('chat_grc_settings', JSON.stringify(settings));
    document.body.className = settings.highContrast ? 'high-contrast bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900';
    document.documentElement.classList.toggle('dark', settings.highContrast);
    localStorage.setItem('chat_grc_custom_instructions', customInstructions);
  }, [sessions, settings, customInstructions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!currentSessionId || !currentSession) return;

    const isFirstMessage = currentSession.messages.length === 0;
    setSuggestions([]); 
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage], 
            updatedAt: Date.now()
          }
        : s
    ));

    setIsLoading(true);
    // Fix: Move assistantMessageId declaration here to make it accessible in the catch block.
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
        if (contact) {
          instructions = `${contact.persona}\n\n${customInstructions}`;
        }
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

      const newSuggestions = await chatGRC.generateSuggestions([
        ...currentSession.messages,
        userMessage,
        { role: 'assistant', content: fullResponse }
      ]);
      setSuggestions(newSuggestions);
      
    } catch (error: any) {
      console.error("Chat Error:", error);
      let errorMessage = "معذرت! جواب موصول کرنے میں دشواری پیش آئی۔";
      
      if (error.message?.includes("API key not valid")) {
        errorMessage = "API Key درست نہیں ہے۔ براہ کرم چابی دوبارہ منتخب کریں۔";
      } else if (error.message?.includes("Requested entity was not found")) {
        errorMessage = "ماڈل دستیاب نہیں یا کی ختم ہو چکی ہے۔";
        setKeyError(true);
        setIsKeyReady(false);
      } else if (error.message?.includes("Safety")) {
        errorMessage = "یہ سوال پالیسی کے خلاف ہو سکتا ہے۔ براہ کرم لفظ تبدیل کریں۔";
      }
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === assistantMessageId ? { ...m, content: errorMessage } : m
              ) 
            } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentNews = () => {
    const today = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = NEWS_PROMPT.replace('[CURRENT_DATE]', today);
    handleSendMessage(prompt);
  };

  const fetchAIUpdates = () => {
    const today = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = AI_UPDATES_PROMPT.replace('[CURRENT_DATE]', today);
    handleSendMessage(prompt);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) { setTimeout(() => createNewChat(), 0); return []; }
      if (id === currentSessionId) setCurrentSessionId(filtered[0].id);
      return filtered;
    });
  };

  const handleWhatsAppFeedback = () => {
    const message = encodeURIComponent("سلام اردو اے آئی! میں اپنی رائے دینا چاہتا ہوں: ");
    window.open(`https://wa.me/923099572321?text=${message}`, '_blank');
  };

  const getFontClass = () => {
    switch(settings.fontFamily) {
      case 'nastaleeq': return 'urdu-font-nastaleeq';
      case 'naskh': return 'urdu-font-naskh';
      default: return 'urdu-font-sans';
    }
  };

  if (isCheckingKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!isKeyReady && keyError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-500/30">
            <ShieldAlert size={40} className="text-sky-400" />
          </div>
          <h1 className="text-3xl font-black text-white urdu-text">سروس فعال کریں</h1>
          <p className="text-sky-100/70 urdu-text leading-relaxed">
            اردو اے آئی کو استعمال کرنے کے لیے اے پی آئی کی (API Key) کا انتخاب ضروری ہے۔ اگر آپ ورسل پر ہیں تو یقینی بنائیں کہ API_KEY موجود ہے۔
          </p>
          <button 
            onClick={handleOpenKeyDialog}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
          >
            <Rocket size={20} />
            <span className="urdu-text text-xl">لانچ کریں (Launch)</span>
          </button>
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
        onSelectContact={startChatWithContact}
        onDelete={deleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        settings={settings}
        setSettings={setSettings}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        onLogout={() => setSettings({...settings, currentUser: null})}
        onShowLogin={() => setShowLoginModal(true)}
        onSendFeedback={handleWhatsAppFeedback}
        onInstall={deferredPrompt ? handleInstall : undefined}
      />
      <ChatArea 
        session={currentSession}
        onSendMessage={handleSendMessage}
        onFetchNews={fetchCurrentNews}
        onFetchAIUpdates={fetchAIUpdates}
        isImageMode={false}
        setIsImageMode={() => {}}
        onStartVoice={() => setShowLiveMode(true)}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={(m) => { setSelectedModel(m); chatGRC.resetChat(); }}
        settings={settings}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onRefreshContext={() => { chatGRC.resetChat(); createNewChat(); }}
        suggestions={suggestions}
      />
      {showLiveMode && <LiveMode settings={settings} onClose={() => setShowLiveMode(false)} />}
      {showLoginModal && (
        <LoginModal 
          onLogin={(u) => { setSettings({...settings, currentUser: u}); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
