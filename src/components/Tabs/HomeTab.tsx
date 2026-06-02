import React, { useState } from 'react';
import { Gift, Wallet, ArrowDownCircle, Users, Award, Calendar, ChevronRight, Play, Coins, ShieldCheck, Car, Hourglass, ShoppingBag, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, InvestmentPackage } from '../../types';
import { CAR_PACKAGES } from '../../data';
import { payReferralCommission } from '../../lib/supabase';


interface HomeTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  onNavigate: (tabId: string) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
}

// Helper: get today's date as YYYY-MM-DD string
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeTab({ user, onUpdateUser, onNavigate, triggerToast }: HomeTabProps) {
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InvestmentPackage | null>(null);

  // Welcome bonus modal — shown only the FIRST time (new registration)
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (!user || user.balance !== 16.0 || (user.activeInvestments && user.activeInvestments.length > 0)) {
      return false;
    }
    const welcomed = localStorage.getItem(`welcomed_${user.phone}`);
    return welcomed !== 'true';
  });

  // Login welcome modal — shown on EVERY login (once per session)
  const sessionKey = `login_greeted_${user.phone}`;
  const alreadyGreetedThisSession = sessionStorage.getItem(sessionKey) === 'true';
  const [showLoginModal, setShowLoginModal] = useState(() => {
    // Only show if user already passed the first welcome (welcomed flag set)
    const welcomed = localStorage.getItem(`welcomed_${user.phone}`);
    if (welcomed !== 'true') return false; // First-timers see the bonus modal instead
    return !alreadyGreetedThisSession;
  });

  const handleCloseLoginModal = () => {
    sessionStorage.setItem(sessionKey, 'true');
    setShowLoginModal(false);
  };

  // --- Daily Check-in: validated by date (resets daily) ---
  const checkinKey = `checkin_date_${user.phone}`;
  const lastCheckinDate = localStorage.getItem(checkinKey) || '';
  const alreadyCheckedInToday = lastCheckinDate === todayStr();

  // --- Team Award: daily cooldown ---
  const teamAwardKey = `team_award_date_${user.phone}`;
  const lastTeamAwardDate = localStorage.getItem(teamAwardKey) || '';
  const alreadyClaimedTeamAward = lastTeamAwardDate === todayStr();

  const handleCloseWelcome = () => {
    localStorage.setItem(`welcomed_${user.phone}`, 'true');
    setShowWelcomeModal(false);
  };

  const handleBuyPackage = () => {
    if (!selectedProduct) return;

    if (user.balance < selectedProduct.price) {
      triggerToast(`Saldo insuficiente para comprar ${selectedProduct.name}. O valor é de R$${selectedProduct.price.toFixed(2)}.`);
      setSelectedProduct(null);
      onNavigate('recharge');
      return;
    }

    const updated = { ...user };
    updated.balance -= selectedProduct.price;
    updated.jobDeposit += selectedProduct.price;

    const newInvestment = {
      id: `inv_${Date.now()}`,
      packageId: selectedProduct.id,
      name: selectedProduct.name,
      dailyProfit: selectedProduct.dailyProfit,
      totalProfit: selectedProduct.totalProfit,
      validityDays: selectedProduct.validityDays,
      price: selectedProduct.price,
      image: selectedProduct.image,
      boughtAt: Date.now(),
      accumulated: 0
    };

    updated.activeInvestments = [newInvestment, ...updated.activeInvestments];

    updated.rechargeRecords = [
      {
        id: `buy_${Date.now()}`,
        type: 'investment' as const,
        amount: selectedProduct.price,
        status: 'success' as const,
        timestamp: Date.now(),
        description: `Adquiriu veículo VIP: ${selectedProduct.name}`
      },
      ...updated.rechargeRecords
    ];

    onUpdateUser(updated);
    triggerToast(`${selectedProduct.name} ativado com sucesso! Iniciando mineração de lucros.`, 'success');

    // Pay referral commissions if this user was referred
    if (user.referredBy) {
      payReferralCommission(user.referredBy, selectedProduct.price, user.phone);
    }

    setSelectedProduct(null);
  };

  
  // Auto-slide banner message simulation
  const [notifications] = useState([
    'UID 178*** sacou R$ 450.00!',
    'UID 432*** comprou 500Car VIP 3!',
    'UID 908*** recebeu comissão de indicação!',
    'UID 516*** acaba de ingressar no nível Prata!',
    'UID 882*** recebeu bônus de equipe de R$ 120.00!'
  ]);
  const [activeNotifIndex, setActiveNotifIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveNotifIndex((prev) => (prev + 1) % notifications.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [notifications.length]);


  // Daily Check-in action
  const handleCheckin = () => {
    if (alreadyCheckedInToday) {
      triggerToast('Você já coletou sua recompensa diária hoje. Volte amanhã!');
      return;
    }

    const checkinReward = 5.0;
    const updated = {
      ...user,
      checkedInToday: true,
      balance: user.balance + checkinReward,
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
    localStorage.setItem(checkinKey, todayStr());
    onUpdateUser(updated);
    triggerToast(`Check-In realizado! Recompensa de R$${checkinReward.toFixed(2)} creditada.`, 'success');
  };

  // Simulated Coupon application
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const code = couponCode.trim().toUpperCase();
    if (code === '500CARVIP' || code === 'LUXURY' || code === 'BRONZE') {
      const reward = 50.0; // Gift coupon of $50
      const updated = {
        ...user,
        balance: user.balance + reward,
        rechargeRecords: [
          {
            id: `coupon_${Date.now()}`,
            type: 'reward' as const,
            amount: reward,
            status: 'success' as const,
            timestamp: Date.now(),
            description: `Código promocional: ${code}`
          },
          ...user.rechargeRecords
        ]
      };
      onUpdateUser(updated);
      triggerToast(`Cupom aplicado com sucesso! Recebeu $${reward.toFixed(2)}`, 'success');
      setCouponCode('');
      setShowCouponModal(false);
    } else {
      triggerToast('Cupom inválido ou expirado. Tente "500CARVIP".');
    }
  };

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">

      {/* Sliding announcements ticker */}
      <div className="bg-cyan-950/20 px-4 py-2 border-b border-cyan-500/10 flex items-center gap-2 text-xs">
        <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase border border-cyan-400/20 px-1.5 py-0.2 rounded shrink-0">
          Notícias
        </span>
        <div className="flex-1 overflow-hidden h-4 relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeNotifIndex}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              className="text-slate-400 font-medium truncate absolute w-full text-[11px]"
            >
              {notifications[activeNotifIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Balance panel styled identically to screenshot My Balance */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#06b6d4] font-bold">Meu Saldo</span>
              <h3 className="text-xl font-black text-slate-100 tracking-tight mt-1">Saldo de Investimento</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
              <ShieldCheck size={16} className="text-cyan-400" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Principal</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  R${user.balance.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => onNavigate('recharge')}
                className="text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-400/30 px-3.5 py-1.5 rounded-xl transition-all shadow-md shrink-0 active:scale-95"
              >
                Depositar
              </button>
            </div>
            <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-orange-500/70 font-bold mb-1">Bônus</span>
                <span className="text-xl font-black text-orange-400 font-mono">
                  R${(user.bonusBalance || 0).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => onNavigate('recharge')} // They can withdraw from the recharge tab
                className="text-xs font-semibold bg-orange-950/40 hover:bg-orange-900/40 text-orange-400 border border-orange-400/30 px-3.5 py-1.5 rounded-xl transition-all shadow-md shrink-0 active:scale-95"
              >
                Sacar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Quick Actions buttons (Coupon, Recharge, Withdraw, Invite) */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => setShowSubscriptionsModal(true)}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Car size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Assinaturas</span>
          </button>

          <button
            onClick={() => onNavigate('recharge')}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Wallet size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Recarga</span>
          </button>

          <button
            onClick={() => onNavigate('withdraw')}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ArrowDownCircle size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Saque</span>
          </button>

          <button
            onClick={() => onNavigate('invite')}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Convidar</span>
          </button>
        </div>
      </div>

      {/* Fleet Section (All cars directly on home screen) */}
      <div className="p-4 space-y-4">
        <div className="text-left mb-2 px-1">
          <h2 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase tracking-tight flex items-center gap-2">
            <Car size={20} className="text-cyan-400" />
            Nossa Frota VIP
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Selecione um veículo superesportivo para obter rendimentos diários
          </p>
        </div>

        {CAR_PACKAGES.map((pkg) => {
          const alreadyOwns = user.activeInvestments?.filter((i) => i.packageId === pkg.id).length || 0;

          return (
            <div
              key={pkg.id}
              className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden shadow-lg group"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-300" />

              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-100 tracking-tight">{pkg.name}</h3>
                    {alreadyOwns > 0 && (
                      <span className="text-[9px] font-bold bg-cyan-950 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full">
                        Ativo ({alreadyOwns})
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-slate-400 font-bold">
                    <div className="text-xs flex items-center justify-between border-b border-slate-800/40 pb-1">
                      <span>Rendimento Diário</span>
                      <span className="text-cyan-400 font-mono text-xs">+R${pkg.dailyProfit.toFixed(2)}</span>
                    </div>
                    <div className="text-xs flex items-center justify-between border-b border-slate-800/40 pb-1">
                      <span>Rendimento Total</span>
                      <span className="text-slate-300 font-mono text-xs">R${pkg.totalProfit.toFixed(2)}</span>
                    </div>
                    <div className="text-xs flex items-center justify-between pb-1">
                      <span>Período de Validade</span>
                      <span className="text-slate-300 text-xs flex items-center gap-1">
                        <Hourglass size={12} className="text-slate-500" />
                        {pkg.validityDays} Dias
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-100 font-mono">
                      R${pkg.price.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-800 relative self-center bg-slate-950 shrink-0">
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                </div>
              </div>

              <div className="mt-4 pt-1">
                <button
                  onClick={() => setSelectedProduct(pkg)}
                  className="w-full h-10 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
                >
                  Alugar Veículo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Side-by-side Action row: Team Awards & Check-in */}
      <div className="px-4 mt-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Team Awards block — shows real commission info */}
          <div
            onClick={() => onNavigate('invite')}
            className="h-20 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/10 p-3 flex justify-between items-center relative overflow-hidden cursor-pointer active:scale-98 transition-all"
          >
            <div className="z-10">
              <h3 className="text-xs font-black text-slate-200">Comissões</h3>
              <p className="text-[9px] text-[#06b6d4] font-semibold mt-1">Ver meus indicados</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 shrink-0 z-10 text-amber-500">
              <Award size={22} />
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Daily Check-in mimicking the screenshot with coins output */}
          <div
            onClick={handleCheckin}
            className={`h-20 rounded-2xl p-3 flex justify-between items-center relative overflow-hidden cursor-pointer active:scale-98 transition-all border ${
              alreadyCheckedInToday
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-gradient-to-br from-amber-950 to-slate-900 border-amber-500/10'
            }`}
          >
            <div className="z-10">
              <h3 className="text-xs font-black text-slate-200">Presença</h3>
              <p className={`text-[9px] font-semibold mt-1 ${alreadyCheckedInToday ? 'text-slate-500' : 'text-amber-400'}`}>
                {alreadyCheckedInToday ? 'Coletado Hoje' : 'Check-in diário'}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0 z-10 text-amber-400">
              <Calendar size={20} />
            </div>
            {/* Ambient indicator blur */}
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>
      </div>


      {/* Interactive Subscriptions Modal */}
      <AnimatePresence>
        {showSubscriptionsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative flex flex-col max-h-[80vh]"
            >
              <h3 className="text-base font-black text-slate-100 mb-1">Minhas Assinaturas</h3>
              <p className="text-xs text-slate-400 mb-4 font-semibold">Lista de planos ativos minerando rendimentos.</p>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {!user.activeInvestments || user.activeInvestments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                    Você ainda não possui nenhuma assinatura ativa.
                  </div>
                ) : (
                  user.activeInvestments.map((inv) => (
                    <div key={inv.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {inv.image ? (
                          <img src={inv.image} alt={inv.name} className="w-full h-full object-cover" />
                        ) : (
                          <Car size={20} className="text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-100 truncate">{inv.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Lucro Diário: <span className="text-cyan-400">R$ {inv.dailyProfit.toFixed(2)}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">
                          Acumulado: <span className="text-emerald-400">R$ {inv.accumulated.toFixed(2)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 font-mono block">R$ {inv.price.toFixed(0)}</span>
                        <span className="text-[9px] font-bold text-amber-500 mt-1 block font-mono">Ativo</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-slate-850 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionsModal(false)}
                  className="w-full h-11 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl hover:text-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Purchase Modal overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative"
            >
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mb-2">
                <ShoppingBag size={18} className="text-cyan-400" />
                Confirmar Aluguel VIP
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Você confirma a locação do veículo <span className="font-bold text-slate-200">{selectedProduct.name}</span> pelo valor de 
                <span className="font-bold text-cyan-400"> R$ {selectedProduct.price.toFixed(2)}</span>?
              </p>

              <div className="my-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-bold text-slate-300">
                <div className="flex justify-between">
                  <span>Rendimento Estimado Diário:</span>
                  <span className="text-emerald-400">+R$ {selectedProduct.dailyProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seu Saldo Atual:</span>
                  <span className="text-slate-100">R$ {user.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/60">
                  <span>Saldo Restante após compra:</span>
                  <span className={user.balance >= selectedProduct.price ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {(user.balance - selectedProduct.price).toFixed(2)}
                  </span>
                </div>
              </div>

              {user.balance < selectedProduct.price && (
                <div className="mb-4 bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 flex gap-2 text-[10px] text-rose-300 font-semibold leading-relaxed">
                  <ShieldAlert size={14} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>Seu saldo atual é insuficiente para a transação. Acesse o depósito para adicionar fundos.</span>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 h-11 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:text-slate-200 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBuyPackage}
                  className="flex-1 h-11 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all active:scale-95 shadow-md shadow-cyan-500/10"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Bonus Modal with Confetti */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-6 select-none font-sans">
            {/* Confetti Explosion container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
              {Array.from({ length: 80 }).map((_, i) => {
                const colors = ['#22d3ee', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#a855f7'];
                const size = Math.random() * 8 + 6;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // Burst physics equations starting from center
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 260 + 80;
                const targetX = Math.cos(angle) * velocity;
                const targetY = Math.sin(angle) * velocity - 120; // Gravity simulation lift
                
                return (
                  <motion.div
                    key={i}
                    initial={{ x: '0px', y: '0px', rotate: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: `${targetX}px`,
                      y: `${targetY}px`,
                      rotate: Math.random() * 720 - 360,
                      scale: [0, 1.2, 0.8, 0],
                      opacity: [1, 1, 0.7, 0]
                    }}
                    transition={{
                      duration: Math.random() * 1.6 + 1.0,
                      ease: 'easeOut',
                      repeat: 0
                    }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: size,
                      height: size,
                      backgroundColor: color,
                      borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-slate-900 border border-cyan-500/20 rounded-[32px] p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Radial gradient glow */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="w-20 h-20 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 mb-4 animate-bounce">
                🎉
              </div>

              <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">
                Parabéns!
              </h2>
              <p className="text-xs text-cyan-400 font-bold mt-1 uppercase tracking-widest">
                Clube VIP 500CAR
              </p>

              <div className="my-6 p-5 bg-slate-950 border border-slate-850 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 leading-normal">
                  Sua conta foi ativada com sucesso e você recebeu um bônus inicial de:
                </p>
                <div className="text-3xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
                  R$ 16,00
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">
                  Saldo já liberado na sua carteira
                </p>
              </div>

              <button
                onClick={handleCloseWelcome}
                className="w-full h-13 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-xl tracking-wider uppercase active:scale-95 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Começar a ganhar
              </button>

              {/* Telegram Group Button */}
              <a
                href="https://t.me/+JDFnKWdN7FwyOTFl"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full h-12 bg-[#229ED9] hover:bg-[#1a8bbf] active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#229ED9]/20 cursor-pointer"
              >
                {/* Telegram SVG Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5 shrink-0"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-white font-black text-sm tracking-wide">Entrar no Grupo VIP</span>
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== RECURRING LOGIN WELCOME MODAL ===== */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-6 select-none font-sans">
            <motion.div
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="w-full max-w-sm bg-slate-900 border border-cyan-500/20 rounded-[32px] p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Glow blobs */}
              <div className="absolute -top-10 -left-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Avatar / Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-4xl">
                👋
              </div>

              <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                Bem-vindo de volta!
              </h2>
              <p className="text-xs text-cyan-400 font-bold mt-1 uppercase tracking-widest">
                Clube VIP 500CAR
              </p>

              <div className="my-5 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 leading-relaxed text-center">
                  Fique por dentro das novidades, sinais e atualizações exclusivas do clube no nosso grupo VIP do Telegram!
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Telegram button */}
                <a
                  href="https://t.me/+JDFnKWdN7FwyOTFl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-[#229ED9] hover:bg-[#1a8bbf] active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#229ED9]/20 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 shrink-0">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="text-white font-black text-sm tracking-wide">Entrar no Grupo VIP</span>
                </a>

                {/* Access platform button */}
                <button
                  onClick={handleCloseLoginModal}
                  className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-xl tracking-wider uppercase active:scale-95 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Acessar Plataforma
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
