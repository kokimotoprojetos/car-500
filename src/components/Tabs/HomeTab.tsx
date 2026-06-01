import React, { useState } from 'react';
import { Gift, Wallet, ArrowDownCircle, Users, Download, Award, Calendar, ChevronRight, Play, Coins, ShieldCheck, Car, Hourglass, ShoppingBag, ShieldAlert } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { UserState, InvestmentPackage } from '../../types';
import { ROULETTE_SECTORS, CAR_PACKAGES } from '../../data';


interface HomeTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  onNavigate: (tabId: string) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
}

export default function HomeTab({ user, onUpdateUser, onNavigate, triggerToast }: HomeTabProps) {
  const [spinning, setSpinning] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [activeWin, setActiveWin] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InvestmentPackage | null>(null);

  const handleBuyPackage = () => {
    if (!selectedProduct) return;

    if (user.balance < selectedProduct.price) {
      triggerToast(`Saldo insuficiente para comprar ${selectedProduct.name}. O valor é de $${selectedProduct.price.toFixed(2)}.`);
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
    setSelectedProduct(null);
  };

  
  // Motion controller for the roulette wheel
  const wheelControls = useAnimation();
  const [currentRot, setCurrentRot] = useState(0);

  // Auto-slide banner message simulation
  const [notifications] = useState([
    'UID 178*** sacou $450.00 com sucesso!',
    'UID 432*** comprou 500Car VIP 3!',
    'UID 908*** recebeu $3777.00 na Roleta!',
    'UID 516*** acaba de ingressar no nível Prata!',
    'UID 882*** recebeu bônus de equipe de $120.00!'
  ]);
  const [activeNotifIndex, setActiveNotifIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveNotifIndex((prev) => (prev + 1) % notifications.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [notifications.length]);

  // Handle roulette spin action
  const handleSpin = async () => {
    if (spinning) return;

    const cost = 15.0; // Costs $15.00
    if (user.balance < cost && user.spinTurns <= 0) {
      triggerToast('Saldo insuficiente para girar a roleta ($15 necessário ou 1 Giro Grátis!). Faça uma Recarga.');
      onNavigate('recharge');
      return;
    }

    setSpinning(true);
    let updatedUser = { ...user };
    
    if (updatedUser.spinTurns > 0) {
      updatedUser.spinTurns -= 1;
    } else {
      updatedUser.balance -= cost;
      // Add transaction record
      updatedUser.rechargeRecords = [
        {
          id: `spin_${Date.now()}`,
          type: 'spin' as const,
          amount: cost,
          status: 'success' as const,
          timestamp: Date.now(),
          description: 'Giro da Sorte 500CAR'
        },
        ...updatedUser.rechargeRecords
      ];
    }

    // Select random winning sector
    const sectorIndex = Math.floor(Math.random() * ROULETTE_SECTORS.length);
    const winItem = ROULETTE_SECTORS[sectorIndex];

    // Compute complete spin rotation. Lands exactly on sectorIndex
    // Standard division: 360 degrees / 8 sectors = 45 degrees per sector
    // We target center of sector to make arrow align neatly
    const sectorDegrees = 360 / ROULETTE_SECTORS.length;
    const targetDeg = (360 - (sectorIndex * sectorDegrees)) - (sectorDegrees / 2);
    
    // Add multiple complete 360 rotations (e.g., 5 cycles = 1800 deg)
    const totalRotationNeeded = currentRot + 1800 + targetDeg;
    setCurrentRot(totalRotationNeeded);

    // Run high speed rotation animation
    await wheelControls.start({
      rotate: totalRotationNeeded,
      transition: { duration: 4.5, ease: [0.1, 0.8, 0.25, 1] }
    });

    // Credit logic and update state
    updatedUser.balance += winItem.value;
    updatedUser.rechargeRecords = [
      {
        id: `spin_win_${Date.now()}`,
        type: 'reward' as const,
        amount: winItem.value,
        status: 'success' as const,
        timestamp: Date.now(),
        description: `Prêmio Roleta: ${winItem.label}`
      },
      ...updatedUser.rechargeRecords
    ];

    onUpdateUser(updatedUser);
    setActiveWin(`Parabéns! Você ganhou ${winItem.label} (Equivalente a $${winItem.value.toFixed(2)})!`);
    setSpinning(false);
  };

  // Daily Check-in action
  const handleCheckin = () => {
    if (user.checkedInToday) {
      triggerToast('Você já coletou sua recompensa diária hoje. Volte amanhã!');
      return;
    }

    const checkinReward = 5.0; // Giving $5.00 daily check-in reward
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
    triggerToast(`Check-In realizado! Recompensa de $${checkinReward.toFixed(2)} creditada.`, 'success');
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
      {/* Dynamic Header */}
      <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-900 sticky top-0 z-20">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-xs">🏎️</span>
          </div>
          <span className="text-base font-black tracking-widest text-slate-100 uppercase bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            500CAR
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Active alerts panel */}
          <div className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>VIP Ativo</span>
          </div>
        </div>
      </div>

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
              <span className="text-[10px] uppercase tracking-widest text-[#06b6d4] font-bold">Meu Saldo / Wallet</span>
              <h3 className="text-xl font-black text-slate-100 tracking-tight mt-1">Saldo de Investimento</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
              <ShieldCheck size={16} className="text-cyan-400" />
            </div>
          </div>

          <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-3xl font-black text-cyan-400 font-mono">
              R${user.balance.toFixed(2)}
            </span>
            <button
              onClick={() => onNavigate('recharge')}
              className="text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-400/30 px-3.5 py-1.5 rounded-xl transition-all shadow-md shrink-0 active:scale-95"
            >
              Depositar
            </button>
          </div>
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


      {/* Grid of Quick Actions buttons (Coupon, Recharge, Withdraw, Invite, APP) */}
      <div className="px-4">
        <div className="grid grid-cols-5 gap-1.5">
          <button
            onClick={() => setShowCouponModal(true)}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Gift size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Cupom</span>
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
            onClick={() => {
              // Copy custom link simulation
              navigator.clipboard?.writeText(window.location.href);
              triggerToast('Link copiado! Bônus de Indicação: 1º Nível: 23% | 2º Nível: 4% | 3º Nível: 1%', 'success');
            }}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Convidar</span>
          </button>

          <button
            onClick={() => {
              triggerToast('Download do aplicativo iniciado na máquina virtual!', 'success');
            }}
            className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Download size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Aplicativo</span>
          </button>
        </div>
      </div>

      {/* Primary Side-by-side Action row: Team Awards & Check-in */}
      <div className="px-4 mt-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Team Awards block mimicking the crowned award screenshot */}
          <div
            onClick={() => {
              triggerToast('Prêmios de Equipe: Bônus de indicação (1º Nível: 23% | 2º Nível: 4% | 3º Nível: 1%) coletados com sucesso!', 'success');
              const updated = {
                ...user,
                balance: user.balance + 50.0,
                rechargeRecords: [
                  {
                    id: `award_${Date.now()}`,
                    type: 'reward' as const,
                    amount: 50.0,
                    status: 'success' as const,
                    timestamp: Date.now(),
                    description: 'Comissão de equipe (Simulado)'
                  },
                  ...user.rechargeRecords
                ]
              };
              onUpdateUser(updated);
            }}
            className="h-20 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/10 p-3 flex justify-between items-center relative overflow-hidden cursor-pointer active:scale-98 transition-all"
          >
            <div className="z-10">
              <h3 className="text-xs font-black text-slate-200">Prêmio de Equipe</h3>
              <p className="text-[9px] text-[#06b6d4] font-semibold mt-1">Coletar Comissão</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 shrink-0 z-10 text-amber-500">
              <Award size={22} className="animate-pulse" />
            </div>
            {/* Ambient indicator blur */}
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Daily Check-in mimicking the screenshot with coins output */}
          <div
            onClick={handleCheckin}
            className={`h-20 rounded-2xl p-3 flex justify-between items-center relative overflow-hidden cursor-pointer active:scale-98 transition-all border ${
              user.checkedInToday
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-gradient-to-br from-amber-950 to-slate-900 border-amber-500/10'
            }`}
          >
            <div className="z-10">
              <h3 className="text-xs font-black text-slate-200">Presença</h3>
              <p className={`text-[9px] font-semibold mt-1 ${user.checkedInToday ? 'text-slate-500' : 'text-amber-400'}`}>
                {user.checkedInToday ? 'Coletado Hoje' : 'Check-in diário'}
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


      {/* Interactive Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative"
            >
              <h3 className="text-base font-black text-slate-100 mb-2">Usar Cupom de Recompensa</h3>
              <p className="text-xs text-slate-400 mb-4">Insira um código válido para adicionar fundos.</p>
              
              <form onSubmit={handleApplyCoupon} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ex: 500CARVIP"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/40 uppercase font-mono"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="flex-1 h-11 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl hover:text-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
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


      {/* Winning Reward Splash Pop-up Overlay */}
      <AnimatePresence>
        {activeWin && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.7, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 50, opacity: 0 }}
              className="w-full max-w-xs bg-slate-900 border border-amber-500/30 rounded-[32px] p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Star dust elements */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" />

              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-4 animate-bounce">
                <Gift size={32} />
              </div>

              <h2 className="text-xl font-black text-slate-100 tracking-tight uppercase">Vitória Fantástica!</h2>
              <p className="text-xs text-amber-400 font-bold mt-1 uppercase tracking-widest">Sorte Sob Rodas</p>

              <div className="my-5 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                  {activeWin}
                </p>
              </div>

              <button
                onClick={() => setActiveWin(null)}
                className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl tracking-wider uppercase active:scale-95 transition-all shadow-lg shadow-amber-500/10"
              >
                Colher Recompensa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
