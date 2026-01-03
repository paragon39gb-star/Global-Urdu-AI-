
import React from 'react';
import { X, Sparkles, BookOpen, ShieldCheck, Award, MessageCircle, ExternalLink, GraduationCap, Microscope, Library, CheckCircle2, Globe, Heart, User as UserIcon } from 'lucide-react';
import { ABOUT_TEXT, USAGE_PROCEDURE_TEXT, WHATSAPP_LINK, DETAILED_INFO_SECTIONS } from '../constants';
import { UserSettings } from '../types';

interface IntroModalProps {
  onClose: () => void;
  settings: UserSettings;
}

export const IntroModal: React.FC<IntroModalProps> = ({ onClose, settings }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-500">
      <div className={`relative w-full max-w-2xl overflow-hidden rounded-[3rem] border shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-sky-100'}`}>
        
        {/* Dynamic Header */}
        <div className="shrink-0 h-40 bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] relative flex flex-col items-center justify-center overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/10 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>
            
            <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20 backdrop-blur-md border border-white/10">
              <X size={22} />
            </button>
            
            <div className="text-center text-white z-10 px-4">
                <div className="inline-block p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-3 animate-pulse">
                  <Globe size={32} className="text-sky-300" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black urdu-text tracking-wider">گلوبل ریسرچ سینٹر</h2>
                <p className="text-sky-200/80 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">International Knowledge Hub</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pt-8 pb-10 px-6 md:px-12">
          <div className="space-y-10" dir="rtl">
            
            {/* Mission Vision Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-center space-y-4 shadow-sm">
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 text-white rounded-full text-xs font-black shadow-lg">
                      <Award size={16} />
                      <span>علمی و تحقیقی منشور</span>
                  </div>
                  <p className="urdu-text text-xl md:text-2xl text-slate-800 leading-relaxed font-black">
                      {ABOUT_TEXT}
                  </p>
                  <div className="flex justify-center gap-2">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-300"></div>)}
                  </div>
              </div>
            </div>

            {/* Founder Spotlight Card */}
            <div className="bg-[#0c4a6e] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 opacity-10 transform scale-150 rotate-12 transition-transform duration-700 group-hover:rotate-0">
                  <GraduationCap size={150} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-[2rem] flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(251,191,36,0.3)] border-4 border-white/20">
                      <UserIcon size={48} className="text-white" />
                  </div>
                  <div className="text-center md:text-right">
                      <h3 className="text-3xl font-black urdu-text text-yellow-400 mb-1">قاری خالد محمود گولڈ میڈلسٹ</h3>
                      <p className="text-sm text-sky-100/90 urdu-text font-bold">بانی و سرپرستِ اعلیٰ - گلوبل ریسرچ سینٹر (GRC)</p>
                      <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/10">محقق</span>
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/10">گولڈ میڈلسٹ</span>
                      </div>
                  </div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DETAILED_INFO_SECTIONS.map((section, idx) => (
                    <div key={idx} className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-sky-300 transition-all hover:shadow-xl group">
                        <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                            {idx === 0 ? <BookOpen size={24} /> : idx === 1 ? <Library size={24} /> : <Microscope size={24} />}
                        </div>
                        <h3 className="text-xl font-black urdu-text text-slate-900 mb-2">{section.title}</h3>
                        <p className="urdu-text text-sm text-slate-600 leading-relaxed">
                            {section.content}
                        </p>
                    </div>
                ))}
                {/* Additional Feature: Ethics */}
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl md:col-span-2 flex items-start gap-5">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black urdu-text text-emerald-900 mb-1">علمی دیانت و ثقاہت</h3>
                      <p className="urdu-text text-sm text-emerald-800/80 leading-relaxed">
                          اردو اے آئی کی تمام معلومات مستند علمی مآخذ (قرآن، حدیث، فقہ) سے لی جاتی ہیں۔ ہم قاری صاحب کے وضع کردہ تحقیقی اصولوں پر سختی سے کاربند ہیں۔
                      </p>
                    </div>
                </div>
            </div>

            {/* Methodology List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-900">
                <Sparkles size={22} className="text-yellow-500" />
                <h3 className="text-2xl font-black urdu-text">جامع تفسیری ستون</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['متن و ترجمہ', 'شانِ نزول', 'سیاق و سباق', 'فقہی مسائل', 'تاریخی پس منظر', 'علمی خلاصہ', 'مستند حوالے', 'عملی پیغام'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <CheckCircle2 size={14} className="text-sky-500 shrink-0" />
                    <span className="urdu-text text-[11px] font-black text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage */}
            <div className="bg-sky-50 border-2 border-dashed border-sky-200 p-8 rounded-[2.5rem] text-center space-y-4">
              <h3 className="text-xl font-black urdu-text text-sky-900">آپ کیا پوچھ سکتے ہیں؟</h3>
              <p className="urdu-text text-base text-sky-800/70 leading-relaxed italic">
                "{USAGE_PROCEDURE_TEXT}"
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="shrink-0 p-8 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-4">
             <div className="flex flex-col md:flex-row gap-3 w-full">
               <a 
                 href={WHATSAPP_LINK}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black transition-all shadow-[0_10px_20px_-5px_rgba(37,211,102,0.4)] active:scale-95"
               >
                  <MessageCircle size={22} />
                  <span className="urdu-text text-lg">علمی رابطہ (WhatsApp)</span>
                  <ExternalLink size={16} />
               </a>
               <button 
                 onClick={onClose}
                 className="py-4 px-8 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black urdu-text hover:bg-slate-50 transition-all shadow-sm"
               >
                 تحقیق شروع کریں
               </button>
             </div>
             
             <div className="flex items-center gap-2 text-slate-400 font-bold">
               <Heart size={14} className="text-rose-500 fill-rose-500" />
               <span className="text-[10px] uppercase tracking-widest urdu-text">Built for the Muslim Ummah</span>
             </div>
        </div>
      </div>
    </div>
  );
};
