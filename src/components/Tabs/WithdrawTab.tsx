import React, { useState } from 'react';
import { ArrowUpRight, ShieldCheck, Hourglass, HelpCircle, Check, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../../types';

interface WithdrawTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
  onNavigate: (tabId: string) => void;
}

export default function WithdrawTab({ user, onUpdateUser, triggerToast, onNavigate }: WithdrawTabProps) {
  const [amount, setAmount] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Insira um valor de saque válido.');
      return;
    }

    if (val < 10.0) {
      triggerToast('O valor mínimo para saques é de R$10,00.');
      return;
    }

    if (user.balance < val) {
      triggerToast(`Saldo insuficiente. Você possui apenas R$${user.balance.toFixed(2)}.`);
      return;
    }

    if (!destAddress.trim()) {
      triggerToast('Insira o endereço de destino (Chave Pix ou correspondente).');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const updated = { ...user };
      updated.balance -= val;
      updated.totalWithdrawn += val;

      const newRecord = {
        id: `withdraw_${Date.now()}`,
        type: 'withdraw' as const,
        amount: val,
        status: 'pending' as const, // initially pending
        timestamp: Date.now(),
        description: `Saque enviado para: ${destAddress.substring(0, 8)}...`
      };

      updated.withdrawRecords = [newRecord, ...updated.withdrawRecords];
      onUpdateUser(updated);

      triggerToast(`Saque de R$${val.toFixed(2)} solicitado com sucesso!`, 'success');
      setLoading(false);
      setAmount('');
      setDestAddress('');
      setAccountName('');

      // Simulate a background worker that completes the pending withdrawal after 6 seconds
      const timeoutId = newRecord.id;
      setTimeout(() => {
        // Query current state again from local storage to prevent override issues
        const currentStored = localStorage.getItem(`user_state_${user.phone}`);
        if (currentStored) {
          const parsed = JSON.parse(currentStored);
          parsed.withdrawRecords = parsed.withdrawRecords.map((rec: any) => {
            if (rec.id === timeoutId) {
              return { ...rec, status: 'success' };
            }
            return rec;
          });
          onUpdateUser(parsed);
        }
      }, 6000);

      onNavigate('home');
    }, 1200);
  };

  const taxRate = 0.10; // 10% fee processing
  const wdAmount = parseFloat(amount) || 0;
  const computedFee = wdAmount * taxRate;
  const netAmount = Math.max(0, wdAmount - computedFee);

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Header withdraw layout */}
      <div className="h-44 bg-gradient-to-b from-slate-900 to-[#070b19] border-b border-slate-900 flex flex-col justify-end p-5 relative overflow-hidden">
        {/* Abstract glowing sphere */}
        <div className="absolute top-2 right-4 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <button
          onClick={() => onNavigate('home')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
        >
          &lt;
        </button>
        <span className="text-[10px] text-orange-400 font-extrabold tracking-widest uppercase">Processador de Pagamentos</span>
        <h2 className="text-2xl font-black text-white mt-1">Sacar Fundos</h2>
      </div>

      <div className="p-4">
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          
          {/* Info Banner Details */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-1.5">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Saldo Disponível para Saque</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black text-slate-100 font-mono">
                R${user.balance.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Mínimo: R$10,00</span>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
              Quantia a Sacar / Amount
            </label>
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-orange-500/50 transition-all">
              <span className="text-slate-500 font-bold text-sm mr-2 shrink-0">
                R$
              </span>
              <input
                type="number"
                placeholder="Insira o valor"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 leading-none h-full"
                required
              />
            </div>
          </div>

          {/* Destination inputs */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold block">
              Chave Pix / Pix Key
            </label>
            <input
              type="text"
              placeholder="Digite a sua Chave Pix para o recebimento"
              value={destAddress}
              onChange={(e) => setDestAddress(e.target.value)}
              className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-slate-500 font-bold block">
              Nome do Beneficiário (Opcional)
            </label>
            <input
              type="text"
              placeholder="Nome completo do titular"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
            />
          </div>

          {/* Fee estimate grid */}
          <div className="bg-slate-950 rounded-xl p-3 divide-y divide-slate-800/60 text-xs font-semibold text-slate-400 space-y-1.5">
            <div className="flex justify-between pb-1.5">
              <span>Taxa de Saque (10%):</span>
              <span className="text-slate-200 font-mono">R${computedFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5">
              <span>Valor Líquido Estimado:</span>
              <span className="text-emerald-400 font-mono font-bold">R${netAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
          >
            {loading ? 'Processando Saque...' : 'Submeter Saque VIP'}
          </button>
        </form>

        {/* Withdrawal rules instructions */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
            <HelpCircle size={14} className="text-orange-400" /> Diretrizes de Retirada
          </h4>
          <ol className="list-decimal pl-4 space-y-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
            <li>Os saques são processados de forma instantânea para a chave Pix informada.</li>
            <li>Taxa fixa de 10% aplicada sobre o valor do saque.</li>
            <li>Horário de Retiradas: Funcionamento 24h por dia, 7 dias por semana.</li>
            <li>Valor mínimo para solicitação de saques: R$10,00.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
