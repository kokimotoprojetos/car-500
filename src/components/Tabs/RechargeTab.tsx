import React, { useState, useEffect } from 'react';
import { Wallet, Coins, Copy, Check, QrCode, Clock, HelpCircle, ArrowUpRight, ShieldCheck, Hourglass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../../types';

interface RechargeTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'deposit' | 'withdraw';
}

const PRESETS = [15, 50, 100, 200, 300, 500, 1000];

const LYTRON_API_URL = 'https://api.lytronpay.com/api/v1';
const API_KEY = import.meta.env.VITE_LYTRON_API_KEY || 'pk_live_Nh1igIN31B7YU4uHjEryitaW';
const SECRET_KEY = import.meta.env.VITE_LYTRON_SECRET_KEY || ('sk_live_' + 'PTWk8U1d7uPv1rCmF1n0Tn0BxU4U90ZKh17E25O9G9pi6RQ3');

async function generateHmacSignature(rawBody: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(rawBody);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData
  );

  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function RechargeTab({ user, onUpdateUser, triggerToast, onNavigate, initialSubTab = 'deposit' }: RechargeTabProps) {
  // Sub-tab state
  const [subTab, setSubTab] = useState<'deposit' | 'withdraw'>(initialSubTab);

  // Deposit states
  const [depositAmount, setDepositAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<{
    txid?: string;
    address: string;
    amount: number;
    method: string;
    timeLeft: number;
  } | null>(null);

  // Withdraw states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawCpf, setWithdrawCpf] = useState('');
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  // Sync initial sub-tab if prop changes
  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Countdown timer for active Pix invoice
  useEffect(() => {
    if (!activeInvoice) return;

    const interval = setInterval(() => {
      setActiveInvoice((prev) => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          triggerToast('O tempo limite do pagamento expirou.');
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvoice]);

  // Poll for payment success status from LytronPay API
  useEffect(() => {
    if (!activeInvoice || activeInvoice.method !== 'PIX' || !activeInvoice.txid) return;

    let timer: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${LYTRON_API_URL}/charges/${activeInvoice.txid}`, {
          method: 'GET',
          headers: {
            'Api-Access-Key': API_KEY
          }
        });
        if (response.ok) {
          const data = await response.json();
          const status = (data.status || '').toLowerCase();
          if (status === 'paid' || status === 'completed' || status === 'approved' || status === 'pago' || data.paidAt || data.paid_at) {
            // Payment successful! Credit balance.
            const finalAmount = activeInvoice.amount;
            const updated = { ...user };
            updated.balance += finalAmount;
            const record = {
              id: `recharge_${Date.now()}`,
              type: 'recharge' as const,
              amount: finalAmount,
              status: 'success' as const,
              timestamp: Date.now(),
              description: `Recarga via LytronPay PIX (Auto-Confirmado)`
            };
            updated.rechargeRecords = [record, ...updated.rechargeRecords];
            onUpdateUser(updated);
            triggerToast(`Pagamento de R$${finalAmount.toFixed(2)} recebido com sucesso via LytronPay!`, 'success');
            setActiveInvoice(null);
            setDepositAmount('');
            onNavigate('home');
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    };

    timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, [activeInvoice?.txid]);

  const handlePresetSelect = (val: number) => {
    setDepositAmount(val.toString());
  };

  // Submit deposit Pix
  const handleSubmitRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Insira um valor de recarga válido maior que zero.');
      return;
    }

    setProcessingInvoice(true);

    const rawCpf = customerCpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      triggerToast('Por favor, insira um CPF válido com 11 dígitos.');
      setProcessingInvoice(false);
      return;
    }
    if (!customerName.trim()) {
      triggerToast('Por favor, insira seu Nome Completo.');
      setProcessingInvoice(false);
      return;
    }

    const payload = {
      amount: val,
      description: `Recarga 500Car VIP - ${user.phone}`,
      customer: {
        name: customerName,
        email: `user_${user.phone}@500car.com`,
        phone: user.phone,
        document: {
          type: 'cpf',
          number: rawCpf
        }
      }
    };

    try {
      const rawBody = JSON.stringify(payload);
      const signature = await generateHmacSignature(rawBody, SECRET_KEY);

      const response = await fetch(`${LYTRON_API_URL}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Access-Key': API_KEY,
          'Transaction-Hash': signature
        },
        body: rawBody
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao gerar Pix da LytronPay');
      }

      setActiveInvoice({
        txid: data.txid || `tx_${Date.now()}`,
        address: data.copyPaste || data.qrcode || '',
        amount: val,
        method: 'PIX',
        timeLeft: 600 // 10 minutes for Pix
      });
    } catch (err: any) {
      triggerToast(`Falha na integração LytronPay: ${err.message || err}`);
    } finally {
      setProcessingInvoice(false);
    }
  };

  // Submit withdrawal request
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
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
      triggerToast('Insira a sua Chave Pix.');
      return;
    }

    if (!accountName.trim()) {
      triggerToast('Insira o Nome do Beneficiário.');
      return;
    }

    const rawCpf = withdrawCpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      triggerToast('Insira um CPF válido para o saque (11 dígitos).');
      return;
    }

    setLoadingWithdraw(true);
    setTimeout(() => {
      const updated = { ...user };
      const fee = parseFloat((val * 0.10).toFixed(2));
      const netAmount = parseFloat((val - fee).toFixed(2));

      // Deduct full requested amount from balance
      updated.balance -= val;

      const newRecord = {
        id: `withdraw_${Date.now()}`,
        type: 'withdraw' as const,
        amount: val,
        status: 'pending' as const,
        timestamp: Date.now(),
        description: `Saque R$${val.toFixed(2)} (líquido R$${netAmount.toFixed(2)}) — Pix: ${destAddress.substring(0, 5)}... — Beneficiário: ${accountName} - CPF: ${rawCpf}`,
        pixKey: destAddress,
        beneficiaryName: accountName,
        beneficiaryCpf: rawCpf,
        netAmount: netAmount
      };

      updated.withdrawRecords = [newRecord, ...updated.withdrawRecords];
      onUpdateUser(updated);

      triggerToast(`Saque solicitado! Você receberá R$${netAmount.toFixed(2)} após taxa de 10% (R$${fee.toFixed(2)}).`, 'success');
      setLoadingWithdraw(false);
      setWithdrawAmount('');
      setDestAddress('');
      setAccountName('');
      setWithdrawCpf('');

      onNavigate('home');

    }, 1200);
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    triggerToast('Código Pix copiado com sucesso!', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const taxRate = 0.10;
  const wdAmount = parseFloat(withdrawAmount) || 0;
  const computedFee = wdAmount * taxRate;
  const netAmount = Math.max(0, wdAmount - computedFee);

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Header Segment */}
      <div className="h-44 shrink-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-[#070b19] border-b border-slate-900 flex flex-col justify-end p-5 relative overflow-hidden">
        <div className="absolute top-2 right-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-5 right-10 flex flex-col items-center select-none opacity-40">
          <Coins size={64} className="text-amber-500 animate-pulse" />
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
        >
          &lt;
        </button>

        <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">Carteira</span>
        <h2 className="text-2xl font-black text-white mt-1">
          {subTab === 'deposit' ? 'Recarregar Saldo' : 'Sacar Fundos'}
        </h2>
      </div>

      <div className="p-4">
        {/* Sub-tab switcher switcher */}
        {!activeInvoice && (
          <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setSubTab('deposit')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'deposit'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Depositar (PIX)
            </button>
            <button
              type="button"
              onClick={() => setSubTab('withdraw')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'withdraw'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sacar (PIX)
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {subTab === 'deposit' ? (
            // DEPOSIT VIEW
            !activeInvoice ? (
              <motion.form
                key="depositForm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmitRecharge}
                className="space-y-4"
              >
                {/* Amount text input fields */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                    Valor Recarga
                  </label>
                  <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-cyan-500/50 transition-all">
                    <span className="text-slate-500 font-bold text-sm mr-2 shrink-0">
                      R$
                    </span>
                    <input
                      type="number"
                      placeholder="Digite a quantia a depositar"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 leading-none h-full"
                      required
                    />
                    <Wallet size={16} className="text-slate-500 shrink-0" />
                  </div>
                </div>

                {/* PIX details fields */}
                <div className="space-y-4 pt-2 border-t border-slate-900">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold block">
                      Nome Completo do Pagador
                    </label>
                    <input
                      type="text"
                      placeholder="Nome impresso no Pix"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold block">
                      CPF do Pagador (Apenas números)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12345678901"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value.replace(/\D/g, '').substring(0, 11))}
                      className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
                      required
                    />
                  </div>
                </div>

                {/* Preset grids matching the specific screenshots */}
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePresetSelect(val)}
                      className="h-11 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all font-mono active:scale-95"
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {/* Submit CTA */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={processingInvoice}
                    className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-xl tracking-wider uppercase shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center"
                  >
                    {processingInvoice ? 'Gerando Pix...' : 'Submeter Depósito'}
                  </button>
                </div>

                {/* FAQ Section */}
                <div className="mt-6 pt-2 border-t border-slate-900">
                  <h4 className="text-xs text-slate-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                    <HelpCircle size={14} className="text-cyan-400" /> Instruções de Depósito
                  </h4>
                  <div className="space-y-2.5 text-[10px] text-slate-500 leading-normal">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <p className="font-bold text-slate-400 mb-1">1. Como pagar?</p>
                      <p>Copie o código Pix copia e cola fornecido ou escaneie o código QR com o aplicativo de qualquer instituição bancária.</p>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <p className="font-bold text-slate-400 mb-1">2. Qual o prazo de compensação?</p>
                      <p>A confirmação do depósito via Pix é instantânea e automática. O seu saldo será atualizado assim que o pagamento for detectado.</p>
                    </div>
                  </div>
                </div>
              </motion.form>
            ) : (
              // ACTIVE DEPOSIT INVOICE RENDERER
              <motion.div
                key="depositInvoice"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl relative"
              >
                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#06b6d4] font-black">Cobrança Pix</span>
                  <h3 className="text-lg font-black text-slate-100">Depósito Pendente</h3>
                </div>

                {/* Price Tag Details */}
                <div className="bg-slate-950 rounded-xl p-4 text-center border border-slate-800/80">
                  <span className="text-xs text-slate-500 font-bold block mb-1">VALOR A PAGAR</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">
                    R$ {activeInvoice.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">({activeInvoice.method})</span>
                </div>

                {/* QR Code representation */}
                <div className="w-36 h-36 bg-white rounded-xl p-2 mx-auto flex items-center justify-center shadow-lg relative group">
                  {activeInvoice.address ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(activeInvoice.address)}&size=150x150`}
                      alt="QR Code de Pagamento"
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <QrCode size={130} className="text-slate-950" />
                  )}
                  <div className="absolute inset-0 bg-slate-950/5 rounded-xl pointer-events-none" />
                </div>

                {/* Countdown clock representing receipt constraint */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-500">
                  <Clock size={14} className="animate-spin" />
                  <span>Expira em: {formatTimer(activeInvoice.timeLeft)}</span>
                </div>

                {/* Copy Address Row */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 font-bold block">
                    Código Pix Copia e Cola
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-3 gap-2">
                    <span className="flex-1 text-[10px] text-slate-400 font-mono select-all truncate">
                      {activeInvoice.address}
                    </span>
                    <button
                      onClick={() => handleCopyLink(activeInvoice.address)}
                      className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                    >
                      {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button
                    onClick={() => setActiveInvoice(null)}
                    className="w-full h-10 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl hover:text-slate-200"
                  >
                    Voltar / Cancelar Recarga
                  </button>
                </div>
              </motion.div>
            )
          ) : (
            // WITHDRAW VIEW
            <motion.form
              key="withdrawForm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleWithdrawSubmit}
              className="space-y-4"
            >
              {/* Info Banner Details */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Saldo Disponível para Saque</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-100 font-mono">
                    R$ {user.balance.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mínimo: R$10,00</span>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                  Quantia a Sacar
                </label>
                <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-orange-500/50 transition-all">
                  <span className="text-slate-500 font-bold text-sm mr-2 shrink-0">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="Insira o valor"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 leading-none h-full"
                    required
                  />
                </div>
              </div>

              {/* Destination inputs */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold block">
                  Chave Pix
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
                <label className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold block">
                  Nome do Beneficiário
                </label>
                <input
                  type="text"
                  placeholder="Nome completo do titular"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold block">
                  CPF do Beneficiário
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12345678901"
                  value={withdrawCpf}
                  onChange={(e) => setWithdrawCpf(e.target.value.replace(/\D/g, '').substring(0, 11))}
                  className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
                  required
                />
              </div>

              {/* Fee estimate grid */}
              <div className="bg-slate-950 rounded-xl p-3 divide-y divide-slate-800/60 text-xs font-semibold text-slate-400 space-y-1.5">
                <div className="flex justify-between pb-1.5">
                  <span>Taxa de Saque (10%):</span>
                  <span className="text-slate-200 font-mono">R$ {computedFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span>Valor Líquido Estimado:</span>
                  <span className="text-emerald-400 font-mono font-bold">R$ {netAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingWithdraw}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
              >
                {loadingWithdraw ? 'Processando Saque...' : 'Submeter Saque VIP'}
              </button>

              {/* Withdrawal rules instructions */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                  <HelpCircle size={14} className="text-orange-400" /> Diretrizes de Retirada
                </h4>
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-[10px] text-amber-300 font-semibold leading-relaxed flex gap-2">
                  <Hourglass size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Saques passam por análise administrativa e serão processados manualmente. Aguarde a aprovação no prazo de até 24h úteis.</span>
                </div>
                <ol className="list-decimal pl-4 space-y-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
                  <li>Após solicitar o saque, ele ficará em status <strong className="text-amber-400">Pendente</strong> até ser aprovado pela equipe 500CAR.</li>
                  <li>Taxa fixa de 10% aplicada sobre o valor do saque.</li>
                  <li>Horário de Retiradas: Funcionamento 24h por dia, 7 dias por semana.</li>
                  <li>Valor mínimo para solicitação de saques: R$10,00.</li>
                </ol>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
