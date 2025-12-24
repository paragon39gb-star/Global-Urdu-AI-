
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LiveMode } from './components/LiveMode';
import { LoginModal } from './components/LoginModal';
import { ChatSession, Message, Attachment, UserSettings, User } from './types';
import { chatGRC } from './services/geminiService';
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
          if (parsed.length > 0) {
            setCurrentSessionId(parsed[0].id);
            chatGRC.resetChat();
          } else {
            createNewChat();
          }
        } catch (e) {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    } else {
      if (sessions.length === 0) {
        createNewChat();
      }
    }
  }, [settings.currentUser, createNewChat]);

  useEffect(() => {
    if (settings.currentUser) {
      localStorage.setItem(`chat_grc_sessions_${settings.currentUser.id}`, JSON.stringify(sessions));
    }
    localStorage.setItem('chat_grc_settings', JSON.stringify(settings));
    document.body.className = settings.highContrast ? 'high-contrast bg-slate-900' : 'bg-[#020617]';
    localStorage.setItem('chat_grc_custom_instructions', customInstructions);
  }, [sessions, settings, customInstructions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!currentSessionId) return;

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
            updatedAt: Date.now(), 
            title: s.messages.length === 0 ? content.slice(0, 40) : s.title 
          }
        : s
    ));

    setIsLoading(true);
    try {
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
      ));

      await chatGRC.sendMessageStream(
        content,
        selectedModel,
        currentSession?.messages || [],
        attachments,
        customInstructions,
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
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        setTimeout(() => createNewChat(), 0);
        return [];
      }
      if (id === currentSessionId) setCurrentSessionId(filtered[0].id);
      return filtered;
    });
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${settings.fontFamily === 'nastaleeq' ? 'urdu-font' : 'sans-font'}`}>
      <Sidebar 
        sessions={sessions}
        activeId={currentSessionId}
        onSelect={setCurrentSessionId}
        onNewChat={createNewChat}
        onDelete={deleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        settings={settings}
        setSettings={setSettings}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        onLogout={() => setSettings({...settings, currentUser: null})}
        onShowLogin={() => setShowLoginModal(true)}
        onSendFeedback={() => window.open('https://grc.org.pk/feedback', '_blank')}
      />
      <ChatArea 
        session={currentSession}
        onSendMessage={handleSendMessage}
        onFetchNews={() => handleSendMessage(NEWS_PROMPT)}
        onFetchAIUpdates={() => handleSendMessage(AI_UPDATES_PROMPT)}
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
          onLogin={(u) => { setSettings({...settings, currentUser: u}); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
