import React, { useState } from 'react';
import { User, Wallet, ShieldCheck, History, Calendar, LogOut, ArrowRight, Activity, HelpCircle, Lock, Users, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../../types';

interface ProfileTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  onLogout: () => void;
  onNavigate: (tabId: string) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
}

export default function ProfileTab({ user, onUpdateUser, onLogout, onNavigate, triggerToast }: ProfileTabProps) {
  const [showRechargeHistory, setShowRechargeHistory] = useState(false);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Daily Check-in action identical to home page
  const handleCheckin = () => {
    if (user.checkedInToday) {
      triggerToast('Você já coletou sua recompensa diária hoje. Volte amanhã!');
      return;
    }

    const checkinReward = 5.0;
    const updated = {
      ...user,
      balance: user.balance + checkinReward,
      checkedInToday: true,
      rechargeRecords: [
        {
          id: `checkin_${Date.now()}`,
          type: 'checkin' as const,
          amount: checkinReward,
          status: 'success' as const,
          timestamp: Date.now(),
          description: 'Recompensa de Presença Diária'
        },
        ...user.rechargeRecords
      ]
    };
    onUpdateUser(updated);
    triggerToast(`Check-In efetuado! Saldo atualizado com +$${checkinReward.toFixed(2)}`, 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 4) {
      triggerToast('A senha precisa ter no mínimo 4 dígitos.');
      return;
    }

    const updated = { ...user, passwordHash: newPassword.trim() };
    onUpdateUser(updated);
    triggerToast('Sua senha simulada foi alterada com sucesso!', 'success');
    setNewPassword('');
    setShowPasswordChange(false);
  };

  // Convert dates
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Header card area mimicking image 6 perfectly */}
      <div className="p-5 bg-gradient-to-b from-[#090d24] to-[#070b19] border-b border-slate-900 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
          {/* Avatar frame */}
          <div className="w-14 h-14 rounded-full border-2 border-cyan-500/30 p-1 bg-slate-950 flex items-center justify-center relative shadow-lg">
            <div className="w-full h-full rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-100 font-extrabold text-base uppercase">
              {user.phone.slice(-2)}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090d24]" />
          </div>

          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block">Nível de Membro</span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-100 font-mono">UID:{user.uid}</h3>
              <span className="text-[9px] font-black tracking-widest text-[#06b6d4] uppercase bg-[#06b6d4]/10 bg-opacity-10 border border-[#06b6d4]/30 px-2 py-0.5 rounded">
                {user.vipLevel || 'Bronze'}
              </span>
            </div>
            <button
              onClick={() => triggerToast(`Sua rede coletou $150.00 acumulados no nível ${user.vipLevel}!`)}
              className="text-[9px] text-cyan-400 font-semibold hover:underline"
            >
              Ver Recompensas do Clube &gt;
            </button>
          </div>
        </div>

        {/* Action pills recharging / withdrawing */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onNavigate('recharge')}
            className="h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            Depositar / Recharge
          </button>
          <button
            onClick={() => onNavigate('withdraw')}
            className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            Sacar / Withdraw
          </button>
        </div>
      </div>

      {/* Grid displays mimicking deposit / withdraw stats panel */}
      <div className="p-4 shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {/* Job deposit (investment cost totals) */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 text-center space-y-1">
            <span className="text-xs font-black text-slate-100 font-mono">R${user.jobDeposit.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase block truncate">Depósito Ativo</span>
          </div>

          {/* User withdrawals total */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 text-center space-y-1">
            <span className="text-xs font-black text-slate-100 font-mono">R${user.totalWithdrawn.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase block truncate">Meu Saque</span>
          </div>

          {/* Cash balance */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 text-center space-y-1">
            <span className="text-xs font-black text-cyan-400 font-mono">R${user.balance.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase block truncate">Disponível</span>
          </div>
        </div>
      </div>

      {/* Large navigation shortcuts */}
      <div className="px-4 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              triggerToast(`Você possui ${user.activeInvestments?.length || 0} veículos alugados minerando lucros!`);
              onNavigate('packages');
            }}
            className="h-14 rounded-2xl border border-slate-800 bg-[#090d24] hover:bg-slate-900 text-slate-200 font-black text-xs flex items-center justify-between px-4 transition-all"
          >
            <div className="flex flex-col text-left">
              <span>Meus Carros</span>
              <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider mt-0.5">My Order ({user.activeInvestments?.length || 0})</span>
            </div>
            <ArrowRight size={14} className="text-slate-500" />
          </button>

          <button
            onClick={() => {
              triggerToast('Simulador de equipe: 4 referências registradas Nível 1 (+10% comissões)!', 'success');
            }}
            className="h-14 rounded-2xl border border-slate-800 bg-[#090d24] hover:bg-slate-900 text-slate-200 font-black text-xs flex items-center justify-between px-4 transition-all"
          >
            <div className="flex flex-col text-left">
              <span>Minha Equipe</span>
              <span className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">My Team (4 VIPs)</span>
            </div>
            <Users size={14} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* List Action items group mimicking bottom of standard image 6 */}
      <div className="p-4 space-y-2">
        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Configurações e Registros</h4>

        <div className="bg-[#090d24] border border-slate-800/60 rounded-2xl p-1 divide-y divide-slate-800/40">
          
          {/* Check-in Presence Shortcut */}
          <button
            onClick={handleCheckin}
            className="w-full h-13 flex items-center justify-between px-4 text-xs font-bold text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-cyan-400" />
              <span>Marcar Presença Diária</span>
            </div>
            <ArrowRight size={12} className="text-slate-600" />
          </button>

          {/* Wallet detail metadata */}
          <button
            onClick={() => triggerToast(`Seu processador de carteira principal está estabelecido em USDT TRC20 para saques.`, 'success')}
            className="w-full h-13 flex items-center justify-between px-4 text-xs font-bold text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Wallet size={16} className="text-orange-400" />
              <span>Informações da Carteira</span>
            </div>
            <span className="text-[10px] font-mono font-black text-slate-500">TRC20</span>
          </button>

          {/* Password modifier triggers modal */}
          <button
            onClick={() => setShowPasswordChange(true)}
            className="w-full h-13 flex items-center justify-between px-4 text-xs font-bold text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-slate-400" />
              <span>Alterar Senha Administrativa</span>
            </div>
            <ArrowRight size={12} className="text-slate-600" />
          </button>

          {/* Transaction Rec recharge reports */}
          <button
            onClick={() => setShowRechargeHistory(true)}
            className="w-full h-13 flex items-center justify-between px-4 text-xs font-bold text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <History size={16} className="text-cyan-500" />
              <span>Registro de Recargas (Recharges)</span>
            </div>
            <span className="text-[10px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400 font-mono">
              {user.rechargeRecords.length}
            </span>
          </button>

          {/* Withdraw reports */}
          <button
            onClick={() => setShowWithdrawHistory(true)}
            className="w-full h-13 flex items-center justify-between px-4 text-xs font-bold text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <ListFilter size={16} className="text-orange-400" />
              <span>Registro de Saques (Withdrawals)</span>
            </div>
            <span className="text-[10px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-orange-400 font-mono">
              {user.withdrawRecords.length}
            </span>
          </button>

          {/* Logout exit button */}
          <button
            onClick={onLogout}
            className="w-full h-13 flex items-center justify-between px-4 text-xs font-black text-rose-450 hover:text-rose-400"
          >
            <div className="flex items-center gap-3">
              <LogOut size={16} className="text-rose-500" />
              <span>Sair da conta VIP</span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Encerrar Sessão</span>
          </button>
        </div>
      </div>

      {/* Recharge log sliding modal */}
      <AnimatePresence>
        {showRechargeHistory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-end">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="w-full h-[500px] bg-slate-900 border-t border-cyan-500/30 rounded-t-3xl flex flex-col p-5"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-3 shrink-0">
                <h3 className="text-base font-black text-slate-100">Meu Histórico de Recargas</h3>
                <button
                  onClick={() => setShowRechargeHistory(false)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 text-xs text-slate-400 font-bold"
                >
                  Fechar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-6">
                {user.rechargeRecords.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-bold space-y-1">
                    <p>Sem depósitos registrados.</p>
                    <p className="text-[10px] text-slate-600 font-medium">As recargas efetuadas serão listadas aqui.</p>
                  </div>
                ) : (
                  user.rechargeRecords.map((rec) => (
                    <div key={rec.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase">{rec.description}</span>
                        <p className="text-[9px] text-slate-500 font-semibold">{formatDate(rec.timestamp)}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-xs font-black font-mono text-emerald-400">+${rec.amount.toFixed(2)}</span>
                        <span className="block text-[8px] uppercase tracking-wider text-emerald-500 font-bold font-sans">Sucesso</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw log drawer modal */}
      <AnimatePresence>
        {showWithdrawHistory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-end">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="w-full h-[500px] bg-slate-900 border-t border-slate-850 rounded-t-3xl flex flex-col p-5"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-3 shrink-0">
                <h3 className="text-base font-black text-slate-100">Histórico de Saques realizados</h3>
                <button
                  onClick={() => setShowWithdrawHistory(false)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 text-xs text-slate-400 font-bold"
                >
                  Fechar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-6">
                {user.withdrawRecords.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-bold space-y-1">
                    <p>Sem saques registrados.</p>
                    <p className="text-[10px] text-slate-600 font-medium">As retiradas efetuadas serão listadas aqui.</p>
                  </div>
                ) : (
                  user.withdrawRecords.map((rec) => (
                    <div key={rec.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-orange-400 font-bold uppercase truncate max-w-[150px] block">{rec.description}</span>
                        <p className="text-[9px] text-slate-500 font-bold">{formatDate(rec.timestamp)}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-xs font-black font-mono text-rose-450">-${rec.amount.toFixed(2)}</span>
                        <span className={`block text-[8px] uppercase tracking-wider font-bold ${
                          rec.status === 'success' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'
                        }`}>
                          {rec.status === 'success' ? 'Sucesso' : 'Análise / Pendente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password override modal dialogue */}
      <AnimatePresence>
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative"
            >
              <h3 className="text-base font-black text-slate-100 mb-2">Alterar Senha do Simulador</h3>
              <p className="text-xs text-slate-400 mb-4 font-semibold">Crie uma nova senha de demonstração administrativa.</p>
              
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input
                  type="password"
                  placeholder="Nova senha (mínimo 4 dígitos)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/40"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="flex-1 h-11 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Mudar Senha
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
