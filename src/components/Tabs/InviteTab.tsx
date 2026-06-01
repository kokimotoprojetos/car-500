import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Gift, Award, TrendingUp, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { UserState } from '../../types';

interface InviteTabProps {
  user: UserState;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
  onNavigate: (tabId: string) => void;
}

export default function InviteTab({ user, triggerToast, onNavigate }: InviteTabProps) {
  const [copied, setCopied] = useState(false);
  const inviteCode = user.uid || `500C_${user.phone}`;
  const inviteLink = `https://www.500carinvestl.xyz/?ref=${inviteCode}`;

  const [referredUsers, setReferredUsers] = useState<{ phone: string; vipLevel: string; date: string }[]>([]);

  // Scan localStorage on mount for users registered using this referral ID
  useEffect(() => {
    const list: { phone: string; vipLevel: string; date: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_state_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed.referredBy === inviteCode || parsed.referredBy === user.uid) {
              list.push({
                phone: parsed.phone,
                vipLevel: parsed.vipLevel || 'Bronze',
                date: new Date(parsed.createdAt || Date.now()).toLocaleDateString('pt-BR')
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    setReferredUsers(list);
  }, [inviteCode, user.uid]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    triggerToast('Link de convite copiado com sucesso!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Header section */}
      <div className="h-44 bg-gradient-to-b from-indigo-950 via-slate-900 to-[#070b19] border-b border-slate-900 flex flex-col justify-end p-5 relative overflow-hidden">
        <div className="absolute top-2 right-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <button
          onClick={() => onNavigate('home')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
        >
          &lt;
        </button>
        <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">Afiliados / Referrals</span>
        <h2 className="text-2xl font-black text-white mt-1">Programa de Indicação</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Core referral card */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Gift size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-200">Indique Amigos & Ganhe</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Comissões Recorrentes de Depósito</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Invite ID Display */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Seu ID de Convite</span>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                <span className="text-sm font-black text-cyan-400 font-mono tracking-wider">{inviteCode}</span>
              </div>
            </div>

            {/* Invite Link Copy */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Seu Link de Indicação</span>
              <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl p-3 gap-2">
                <span className="flex-1 text-[10px] text-slate-400 font-mono select-all truncate">{inviteLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Commissions Tiers Layout */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 px-1">
            <Award size={14} className="text-cyan-400" /> Níveis de Indicação
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3.5 text-center space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
              <span className="text-[18px] block">🥇</span>
              <span className="text-[9px] uppercase text-slate-500 font-black block">1º Nível</span>
              <span className="text-lg font-black text-amber-400 font-mono block">23%</span>
              <span className="text-[8px] text-slate-500 font-semibold block uppercase">Indicação Direta</span>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3.5 text-center space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
              <span className="text-[18px] block">🥈</span>
              <span className="text-[9px] uppercase text-slate-500 font-black block">2º Nível</span>
              <span className="text-lg font-black text-slate-300 font-mono block">4%</span>
              <span className="text-[8px] text-slate-500 font-semibold block uppercase">Indireta Nível 2</span>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3.5 text-center space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-700 to-amber-900" />
              <span className="text-[18px] block">🥉</span>
              <span className="text-[9px] uppercase text-slate-500 font-black block">3º Nível</span>
              <span className="text-lg font-black text-amber-600 font-mono block">1%</span>
              <span className="text-[8px] text-slate-500 font-semibold block uppercase">Indireta Nível 3</span>
            </div>
          </div>
        </div>

        {/* List of Referred Users */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-850 pb-2">
            <Users size={14} className="text-cyan-400" /> Usuários Indicados Cadastrados
          </h4>

          {referredUsers.length === 0 ? (
            <div className="text-center py-6 text-slate-500 font-semibold text-xs">
              Nenhum usuário cadastrado pelo seu link de convite ainda.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {referredUsers.map((refUser, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-850/50 p-2.5 rounded-xl text-xs font-bold text-slate-350">
                  <div className="flex flex-col">
                    <span className="text-slate-200">{refUser.phone}</span>
                    <span className="text-[9px] text-slate-500 font-medium">Data de Cadastro: {refUser.date}</span>
                  </div>
                  <span className="text-[10px] bg-cyan-950 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-mono">
                    VIP {refUser.vipLevel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Network performance stats (Simulated stats to look alive) */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-850 pb-2">
            <TrendingUp size={14} className="text-emerald-400" /> Estatísticas da Minha Rede
          </h4>

          <div className="divide-y divide-slate-850 text-xs font-semibold text-slate-400 space-y-2">
            <div className="flex justify-between pb-2 items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Indicados Nível 1 (Diretos)
              </span>
              <span className="text-slate-200 font-mono font-bold">{referredUsers.length} convidados</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Indicados Nível 2
              </span>
              <span className="text-slate-200 font-mono font-bold">5 convidados (R$ 20,00 ganho)</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700" /> Indicados Nível 3
              </span>
              <span className="text-slate-200 font-mono font-bold">12 convidados (R$ 12,00 ganho)</span>
            </div>
            <div className="flex justify-between pt-2 items-center font-bold">
              <span className="text-slate-350">Comissões Totais Acumuladas</span>
              <span className="text-cyan-400 font-mono font-black text-sm">R$ 78,00</span>
            </div>
          </div>
        </div>

        {/* Detailed program rules */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
            <HelpCircle size={14} className="text-cyan-400" /> Como funcionam os ganhos?
          </h4>
          <ol className="list-decimal pl-4 space-y-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
            <li>Você ganha comissão de cada depósito que o usuário que se cadastrar pelo seu link realizar.</li>
            <li><strong>Bônus Nível 1 (23%):</strong> Aplicado diretamente sobre o valor do depósito de convidados que utilizaram seu link direto.</li>
            <li><strong>Bônus Nível 2 (4%):</strong> Ganhe quando seus convidados diretos trouxerem novos membros.</li>
            <li><strong>Bônus Nível 3 (1%):</strong> Comissão adicional de convites realizados pelos afiliados de 2º nível.</li>
            <li>Os bônus são creditados automaticamente no seu saldo assim que os depósitos correspondentes forem confirmados via Pix na LytronPay.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
