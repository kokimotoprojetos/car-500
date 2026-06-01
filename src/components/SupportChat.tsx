import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const FAQ_RESPONSES: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['recarregar', 'recarga', 'recharge', 'deposito', 'depositar'],
    answer: 'Para recarregar, acesse a guia "Recarga", insira o valor desejado e preencha seus dados para pagar via Pix. O saldo será creditado automaticamente após a confirmação!'
  },
  {
    keywords: ['sacar', 'saque', 'withdraw', 'retirar', 'pagamento'],
    answer: 'Os saques podem ser solicitados na sua tela de Perfil em "Sacar" ou pela guia rápida. O tempo de processamento é rápido e os registros de saque podem ser acompanhados na sua carteira!'
  },
  {
    keywords: ['carro', 'pacote', 'investir', 'rendimento', 'lucro'],
    answer: 'Cada veículo VIP da frota 500CAR oferece um retorno diário diferenciado de até 300% ao final do ciclo de 90 dias. Ao adquirir a locação do seu supercarro, ele começará a gerar rendimentos na sua carteira segundo a segundo.'
  },
  {
    keywords: ['roleta', 'spin', 'girar', 'ganhar'],
    answer: 'A seção "Gire e Ganhe" (Spin & Win) na tela inicial custa 1500 pontos ou R$ 15,00 por giro. Você tem a chance de obter até R$ 37,77 extras ou supercarros na roleta!'
  },
  {
    keywords: ['indicado', 'convite', 'equipe', 'indicador', 'referencia'],
    answer: 'Você pode copiar seu link exclusivo de indicação clicando em "Convidar" na tela principal e convidar novos parceiros para ingressarem na sua rede de níveis VIP para maximizar suas comissões de equipe.'
  }
];

export default function SupportChat({ isOpen, onClose }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'Olá! Bem-vindo ao suporte de atendimento do 500CAR Luxury Club. Como posso ajudar você no portal VIP hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) setInputValue('');

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simple keyword engine to formulate automated responses
    setTimeout(() => {
      let botAnswer = 'Compreendo! Nossa equipe oficial está monitorando. Digite outra dúvida relacionada a "Recarga", "Saques", "Roleta", "Veículos" ou indicados.';
      
      const lowerText = text.toLowerCase();
      for (const item of FAQ_RESPONSES) {
        if (item.keywords.some(kw => lowerText.includes(kw))) {
          botAnswer = item.answer;
          break;
        }
      }

      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: botAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 850);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col justify-end">
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full h-[650px] bg-slate-900 border-t border-cyan-500/30 rounded-t-3xl flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 rounded-t-3xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center relative animate-pulse">
                <Bot size={18} className="text-cyan-400" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Suporte 500CAR <CheckCircle size={12} className="text-cyan-400" />
                </h3>
                <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Online • Resposta Imediata</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick FAQ Suggestion Bar */}
          <div className="px-3 py-2 bg-slate-800/40 overflow-x-auto flex gap-2 scrollbar-none shrink-0 border-b border-slate-800/30">
            {['Como Recarregar?', 'Como Sacar?', 'Como funciona a Roleta?', 'Comissão de Equipe'].map((label) => (
              <button
                key={label}
                onClick={() => handleSend(label)}
                className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-semibold text-cyan-400 hover:bg-slate-950 hover:border-cyan-500/30 transition-all shrink-0 active:scale-95"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {msg.sender === 'bot' ? (
                  <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center shrink-0 self-start mt-1">
                    <Bot size={13} className="text-cyan-400" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 self-start mt-1">
                    <User size={13} className="text-slate-300" />
                  </div>
                )}
                <div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-tr-none'
                        : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 px-1 text-right">
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Footer/Input */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 shrink-0 flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite sua pergunta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center hover:from-cyan-300 hover:to-blue-400 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
