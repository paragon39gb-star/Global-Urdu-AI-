
import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { ADMIN_EMAIL } from '../constants';

interface LoginModalProps {
  onLogin: (user: User) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performLogin = (email: string, name: string) => {
    const isAppAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    onLogin({
      id: email,
      name: isAppAdmin ? 'ایڈمن قاری خالد محمود' : name,
      email: email
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.includes('@')) {
      setError("براہ کرم درست ای میل درج کریں۔");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      performLogin(formData.email, formData.email.split('@')[0]);
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulated Google Flow
    setTimeout(() => {
      performLogin('visitor@gmail.com', 'گوگل صارف');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0c4a6e] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-all">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-900/40 animate-bounce">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black urdu-text text-white mb-2">خوش آمدید</h2>
          <p className="text-xs text-sky-200/60 urdu-text" dir="rtl">تحقیق شروع کرنے کے لیے لاگ ان کریں۔</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 mb-6 shadow-lg disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="urdu-text font-black">گوگل کے ساتھ لاگ ان کریں</span>
        </button>

        <div className="relative flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-white/10"></div>
          <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">یا ای میل سے</span>
          <div className="h-px flex-1 bg-white/10"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle size={16} />
            <p className="urdu-text text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300/50" />
            <input
              type="email"
              required
              placeholder="ای میل"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300/50" />
            <input
              type="password"
              required
              placeholder="پاس ورڈ"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-sky-400 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            <span className="urdu-text text-lg">لاگ ان</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-8 text-center text-[9px] text-white/20 urdu-text uppercase tracking-widest font-black">
          Urdu AI - GRC Scholarly Engine
        </p>
      </div>
    </div>
  );
};
