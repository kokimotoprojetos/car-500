import React, { useState, useEffect } from 'react';
import { Car, Hourglass, Zap, TrendingUp, Check, ShoppingBag, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, InvestmentPackage } from '../../types';
import { CAR_PACKAGES } from '../../data';
import { payReferralCommission } from '../../lib/supabase';

interface PackagesTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  onNavigate: (tabId: string) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
}

export default function PackagesTab({ user, onUpdateUser, onNavigate, triggerToast }: PackagesTabProps) {
  const [selectedProduct, setSelectedProduct] = useState<InvestmentPackage | null>(null);
  
  // Real-time second counter to simulate active passive mined earnings
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live cumulative earnings gathered from all bought active packages
  const computeActiveProfit = () => {
    if (!user.activeInvestments || user.activeInvestments.length === 0) return 0;
    return user.activeInvestments.reduce((sum, inv) => {
      // Calculate how many seconds have elapsed since purchased
      const secondsElapsed = (Date.now() - inv.boughtAt) / 1000;
      // Daily profit is earned over 24 hours (86400 seconds)
      const profitPerSecond = inv.dailyProfit / 86400;
      return sum + (secondsElapsed * profitPerSecond);
    }, 0);
  };

  const handleBuyPackage = () => {
    if (!selectedProduct) return;

    if (user.balance < selectedProduct.price) {
      triggerToast(`Saldo insuficiente para comprar ${selectedProduct.name}. O valor é de $${selectedProduct.price.toFixed(2)}.`);
      setSelectedProduct(null);
      // Let's redirect to Recharge instantly
      onNavigate('recharge');
      return;
    }

    // Process purchase simulation
    const updated = { ...user };
    updated.balance -= selectedProduct.price;

    // Add purchase to passive capital deposit records
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

    // Log the transaction
    updated.rechargeRecords = [
      {
        id: `buy_${Date.now()}`,
        type: 'investment',
        amount: selectedProduct.price,
        status: 'success',
        timestamp: Date.now(),
        description: `Adquiriu veículo VIP: ${selectedProduct.name}`
      },
      ...updated.rechargeRecords
    ];

    onUpdateUser(updated);
    triggerToast(`${selectedProduct.name} ativado com sucesso! Iniciando mineração de lucros.`, 'success');

    // Pay referral commissions if this user was referred by someone
    if (user.referredBy) {
      payReferralCommission(user.referredBy, selectedProduct.price, user.phone);
    }

    setSelectedProduct(null);
  };

  // Collect passive earnings manually from supercar miner
  const handleCollectMinedEarnings = () => {
    const currentMined = computeActiveProfit();
    if (currentMined <= 0.01) {
      triggerToast('Ainda não há rendimentos significativos acumulados para recolher. Aguarde um instante!');
      return;
    }

    const updated = { ...user };
    updated.balance += currentMined;

    // Reset boughtAt to current so elapsed recalculates from 0 points
    updated.activeInvestments = updated.activeInvestments.map(inv => ({
      ...inv,
      boughtAt: Date.now()
    }));

    // Record collect log
    updated.rechargeRecords = [
      {
        id: `collect_${Date.now()}`,
        type: 'reward',
        amount: currentMined,
        status: 'success',
        timestamp: Date.now(),
        description: `Coleta de rendimentos supercarros`
      },
      ...updated.rechargeRecords
    ];

    onUpdateUser(updated);
    triggerToast(`$${currentMined.toFixed(4)} coletados com sucesso e somados ao seu saldo!`, 'success');
  };

  const accumulatedEarnings = computeActiveProfit();

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-900 sticky top-0 z-20">
        <div className="flex items-center gap-1.5">
          <Car size={18} className="text-cyan-400" />
          <h2 className="text-sm font-black tracking-widest text-slate-100 uppercase">FROTA VIP 500CAR</h2>
        </div>
        <div className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
          Pacotes de Investimento
        </div>
      </div>

      {/* Hero Passive Mining Status Panel */}
      {user.activeInvestments && user.activeInvestments.length > 0 && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-cyan-500/20 p-4 relative overflow-hidden flex flex-col gap-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Mineração Ativa de Lucros
                </span>
                <h3 className="text-xs font-bold text-slate-300 mt-1">Carros Alugados: {user.activeInvestments.length}</h3>
              </div>
              <button
                onClick={handleCollectMinedEarnings}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] rounded-lg tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
              >
                Coletar Lucros
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rendimento Acumulado</span>
              <span className="text-base font-mono font-black text-emerald-400 tracking-tight">
                +${accumulatedEarnings.toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid listing of investment options */}
      <div className="p-4 space-y-4">
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
                      <span className="text-cyan-400 font-mono text-xs">+${pkg.dailyProfit.toFixed(2)}</span>
                    </div>
                    <div className="text-xs flex items-center justify-between border-b border-slate-800/40 pb-1">
                      <span>Rendimento Total</span>
                      <span className="text-slate-300 font-mono text-xs">${pkg.totalProfit.toFixed(2)}</span>
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
                    <span className="text-[10px] text-slate-500 font-bold mr-0.5">R$</span>
                    <span className="text-2xl font-black text-slate-100 font-mono">
                      {pkg.price.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Highly refined dynamic supercar display card */}
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

              {/* Purchase CTA */}
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
    </div>
  );
}
