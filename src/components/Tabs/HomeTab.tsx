import React, { useState } from 'react';
import { Gift, Wallet, ArrowDownCircle, Users, Download, Award, Calendar, ChevronRight, Play, Coins, ShieldCheck } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { UserState } from '../../types';
import { ROULETTE_SECTORS } from '../../data';

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
            <span>Simulação VIP</span>
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

      {/* Main Wheel Container ("Spin & Win") */}
      <div className="p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 p-4 shadow-xl relative overflow-hidden flex flex-col items-center">
          {/* Grid Background graphics */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

          {/* Top banner detailing spin rewards */}
          <div className="text-center mb-4 z-10">
            <h2 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent uppercase tracking-tight">
              Spin and Win
            </h2>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">
              Your Chance to Win Big
            </p>
          </div>

          {/* CSS/Canvas styled Spin Wheel container with pointer */}
          <div className="w-60 h-60 rounded-full border-4 border-slate-800 shadow-2xl relative flex items-center justify-center p-2 mb-4 bg-slate-950 z-10">
            {/* LED Indicator Lights on outline */}
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/30 animate-[spin_40s_linear_infinite]" />

            {/* Needle indicator element pointing downwards */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-8 z-30 drop-shadow-lg flex flex-col items-center">
              <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-md relative" />
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-amber-500 -mt-1" />
            </div>

            {/* Rotating central body */}
            <motion.div
              animate={wheelControls}
              className="w-full h-full rounded-full relative overflow-hidden bg-slate-900 border-2 border-slate-700 select-none"
              style={{ transformOrigin: 'center' }}
            >
              {ROULETTE_SECTORS.map((sector, index) => {
                const rotation = index * (360 / ROULETTE_SECTORS.length);
                const skew = 90 - (360 / ROULETTE_SECTORS.length);
                return (
                  <div
                    key={index}
                    className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
                    style={{
                      transform: `rotate(${rotation}deg) skewY(${skew}deg)`,
                      backgroundColor: sector.color
                    }}
                  />
                );
              })}

              {/* Text overlays matching sectors rotated correctly */}
              {ROULETTE_SECTORS.map((sector, index) => {
                const rotation = (index * 45) + 22.5;
                return (
                  <div
                    key={`txt_${index}`}
                    className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-start pt-3 pointer-events-none z-10"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <span className="text-[9px] font-black tracking-tighter text-white bg-slate-900/40 px-1 rounded-full uppercase leading-none text-center">
                      {sector.name}
                      <span className="block text-[8px] text-amber-400 mt-0.5">${sector.value}</span>
                    </span>
                  </div>
                );
              })}

              {/* Center point cap */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center z-20 shadow-md">
                <Coins size={14} className="text-amber-400 animate-bounce" />
              </div>
            </motion.div>
          </div>

          {/* Action trigger & info */}
          <div className="w-full text-center z-10">
            <p className="text-[10px] text-slate-400 font-bold mb-2">
              Somente $15 por giro ou use Giro Grátis ({user.spinTurns} restantes)
            </p>
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-full max-w-xs h-11 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Play size={13} className="fill-slate-950" />
              {spinning ? 'Girando...' : 'Iniciar Giro!'}
            </button>
          </div>
        </div>
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
              triggerToast('Link de convite do Clube 500CAR copiado com sucesso!', 'success');
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
              triggerToast('Prêmios de Equipe: Você possui 3 membros sob convite ativo! Recompensa simulada de +$50.00 acumulada.', 'success');
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
              ${user.balance.toFixed(2)}
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
              <p className="text-xs text-slate-400 mb-4">Insira um código válido para adicionar fundos simulados.</p>
              
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
