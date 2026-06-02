import React from 'react';
import { Headphones, ChevronRight, MessageSquare, Clock, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface SupportTabProps {
  onOpenLiveChat: () => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
  onNavigate: (tabId: string) => void;
}

export default function SupportTab({ onOpenLiveChat, triggerToast, onNavigate }: SupportTabProps) {
  
  const handleOpenLink = (channelName: string) => {
    window.open('https://t.me/car500support', '_blank');
  };

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Immersive Header matching image cover with neon customer support text */}
      <div className="h-48 shrink-0 bg-gradient-to-t from-slate-950 via-indigo-950/60 to-black relative flex items-end p-5 select-none overflow-hidden">
        {/* Cover illustration using sports/cyber neon image or fallback visual */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600" 
            alt="Customer support background" 
            className="w-full h-full object-cover opacity-35 object-center brightness-75 filter blur-xs"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b19] via-transparent to-black" />
        </div>

        {/* Back button */}
        <button
          onClick={() => onNavigate('home')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white z-10"
        >
          &lt;
        </button>

        <div className="relative z-10 w-full text-center space-y-1.5 pb-2">
          <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">Canal de Ajuda VIP</span>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">CUSTOMER SUPPORT</h2>
          <p className="text-[9px] text-[#06b6d4] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1">
            <Clock size={11} className="text-cyan-400" /> New Working hours 00:00-23:59
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Atendimento Online</h3>

        {/* Support items grid mimicking screenshot 5 */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleOpenLink('Telegram 1')}
            className="w-full h-18 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <span className="text-xl">✈️</span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-200">Telegram Suporte VIP</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Atendimento 1-on-1</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500" />
          </button>

          {/* Telegram Exclusive Service 1 */}
          <button
            onClick={() => handleOpenLink('Telegram - Canal 1')}
            className="w-full h-18 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <span className="text-xl">✈️</span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-200">Telegram Exclusive</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Atendimento de Suporte Telegram</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500" />
          </button>

          {/* Telegram Exclusive Service 2 */}
          <button
            onClick={() => handleOpenLink('Telegram - Canal 2')}
            className="w-full h-18 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <span className="text-xl">📢</span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-200">Telegram Channel</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Mural de Comunicados do Clã 500CAR</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Extra Info */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="text-cyan-400" size={16} />
            <h4 className="text-xs font-bold text-slate-200">Dicas Importantes</h4>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
            Nossos gerentes simulados de atendimento oficial nunca solicitam sua senha secreta para validação. Dúvidas na plataforma de teste? Use o chat rápido do aplicativo.
          </p>
        </div>
      </div>
    </div>
  );
}
