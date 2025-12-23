
import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Volume2, AlertCircle, ShieldCheck } from 'lucide-react';
import { urduAI } from '../services/geminiService';
import { UserSettings } from '../types';

interface LiveModeProps {
  onClose: () => void;
  settings: UserSettings;
}

export const LiveMode: React.FC<LiveModeProps> = ({ onClose, settings }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    startSession();
    return () => {
      stopSession();
    };
  }, []);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      if (inputCtx.state === 'suspended') await inputCtx.resume();

      audioContextRef.current = outputCtx;
      outputNodeRef.current = outputCtx.createGain();
      outputNodeRef.current.connect(outputCtx.destination);

      const sessionPromise = urduAI.connectLive({
        onAudio: async (base64) => {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
          const buffer = await decodeAudioData(decode(base64), audioContextRef.current);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(outputNodeRef.current!);
          
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          sourcesRef.current.add(source);
          source.onended = () => sourcesRef.current.delete(source);
        },
        onTranscription: (text, isUser) => {
          setTranscription(text);
          setIsUserSpeaking(isUser);
        },
        onInterrupted: () => {
          sourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) {}
          });
          sourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        },
        onClose: () => onClose()
      });

      sessionPromiseRef.current = sessionPromise;

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
        
        const base64Data = encode(new Uint8Array(int16.buffer));
        
        sessionPromiseRef.current?.then(session => {
          session.sendRealtimeInput({ 
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } 
          });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);
      setIsActive(true);
    } catch (err: any) {
      console.error("Session Start Error:", err);
      setError(err.message || "Microphone access denied.");
      setTimeout(onClose, 3000);
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(s => {
      try { s.close(); } catch(e) {}
    });
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg glass-panel rounded-[2rem] border-indigo-500/20 p-6 flex flex-col items-center space-y-6 relative overflow-hidden shadow-2xl">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] transition-all duration-700 ${isUserSpeaking ? 'scale-125 opacity-100' : 'scale-100 opacity-40'}`} />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full z-20"><X size={20} /></button>
        <div className="text-center relative z-10">
          <h2 className="text-xl font-bold urdu-text text-white">براہِ راست گفتگو</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-indigo-400 urdu-text text-[10px] font-bold uppercase tracking-widest">Active Link</p>
          </div>
        </div>
        <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${isUserSpeaking ? 'scale-110 shadow-[0_0_60px_rgba(99,102,241,0.3)]' : 'scale-100'}`}>
          <div className={`absolute inset-0 rounded-full border-4 border-indigo-500/20 ${isUserSpeaking ? 'animate-ping' : ''}`} />
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl z-10 border-4 border-white/10">
            {isUserSpeaking ? <Mic size={48} className="text-white animate-pulse" /> : <Volume2 size={48} className="text-white" />}
          </div>
        </div>
        <div className="w-full h-24 flex flex-col items-center justify-center relative z-10">
          {error ? (
            <div className="flex items-center gap-2 text-red-400 urdu-text bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20"><AlertCircle size={18} /><span>{error}</span></div>
          ) : (
            <p className="urdu-text text-center text-gray-200 line-clamp-3 px-4 italic leading-relaxed text-base md:text-xl" dir="rtl">{transcription || "میں تحقیق کے لیے تیار ہوں..."}</p>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 w-full relative z-10">
           <div className="flex items-center gap-2 text-[8px] text-indigo-300 font-bold uppercase tracking-tighter opacity-60"><ShieldCheck size={12}/><span>Secure Research Link • Chat GRC</span></div>
           <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest urdu-text text-center">Global Research Centre • Qari Khalid Mahmood</p>
        </div>
      </div>
    </div>
  );
};
