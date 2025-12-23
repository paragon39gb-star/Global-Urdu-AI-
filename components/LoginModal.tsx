
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  onLogin: (user: User) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate a fast login process
    const mockUser: User = {
      id: formData.email || 'guest_user',
      name: formData.name || (formData.email ? formData.email.split('@')[0] : 'محقق'),
      email: formData.email
    };
    onLogin(mockUser);
  };

  const handleGoogleLogin = () => {
    // Simulate Google Login
    const mockGoogleUser: User = {
      id: 'google_user_' + Date.now(),
      name: 'گوگل صارف',
      email: 'user@google.com'
    };
    onLogin(mockGoogleUser);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-panel rounded-[2.5rem] border-sky-500/30 overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/5 to-transparent pointer-events-none" />
        
        <div className="p-8 md:p-12 relative z-10">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-sky-600 to-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-900/40">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold urdu-text text-white mb-2 leading-tight">
              {isSignUp ? 'نیا اکاؤنٹ بنائیں' : 'لاگ ان کریں'}
            </h2>
            <p className="text-sm text-sky-200/60 urdu-text">
              {isSignUp ? 'اپنی تحقیق محفوظ کرنے کے لیے رجسٹر ہوں' : 'چیٹ جی آر سی میں خوش آمدید'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative group">
                <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400/50 group-focus-within:text-sky-400 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="آپ کا نام"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white urdu-text text-right outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-500"
                  dir="rtl"
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400/50 group-focus-within:text-sky-400 transition-colors" />
              <input
                type="email"
                required
                placeholder="ای میل ایڈریس"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400/50 group-focus-within:text-sky-400 transition-colors" />
              <input
                type="password"
                required
                placeholder="پاس ورڈ"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-sky-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-sky-50 transition-all active:scale-95 shadow-xl shadow-sky-400/10 mt-6 group"
            >
              <span className="urdu-text text-lg">{isSignUp ? 'رجسٹر ہوں' : 'لاگ ان'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#082f49] px-4 text-sky-400/50 font-bold urdu-text">یا</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* Removed duplicate fill="currentColor" to resolve JSX error */}
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              {/* Removed duplicate fill="currentColor" to resolve JSX error */}
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              {/* Removed duplicate fill="currentColor" to resolve JSX error */}
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z"
                fill="#FBBC05"
              />
              {/* Removed duplicate fill="currentColor" to resolve JSX error */}
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="urdu-text text-base">گوگل کے ساتھ لاگ ان کریں</span>
          </button>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-sky-400/70 hover:text-sky-300 transition-colors urdu-text"
            >
              {isSignUp ? 'پہلے سے اکاؤنٹ موجود ہے؟ لاگ ان کریں' : 'اکاؤنٹ نہیں ہے؟ ابھی بنائیں'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
