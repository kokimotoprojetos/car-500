import React, { useState, useEffect } from 'react';
import { Wallet, Coins, Copy, Check, QrCode, Clock, HelpCircle, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../../types';

interface RechargeTabProps {
  user: UserState;
  onUpdateUser: (updated: UserState) => void;
  triggerToast: (msg: string, status?: 'success' | 'detail') => void;
  onNavigate: (tabId: string) => void;
}

const METHODS = [
  { id: 'pix', label: 'PIX Instantâneo (LytronPay)', description: 'Pagamento instantâneo via Pix com confirmação automática' },
  { id: 'usdt', label: 'USDT TRC20', description: 'Blockchain Tron' }
];

const PRESETS = [50, 100, 200, 300, 500, 1000];

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

export default function RechargeTab({ user, onUpdateUser, triggerToast, onNavigate }: RechargeTabProps) {
  const [method, setMethod] = useState('pix');
  const [showMethodDrop, setShowMethodDrop] = useState(false);
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Active payment gateway screen state indicators
  const [processingInvoice, setProcessingInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<{
    txid?: string;
    address: string;
    amount: number;
    method: string;
    timeLeft: number;
  } | null>(null);

  // Countdown timer for active simulated invoice
  useEffect(() => {
    if (!activeInvoice) return;

    const interval = setInterval(() => {
      setActiveInvoice((prev) => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          triggerToast('O tempo limite do pagamento simulado expirou.');
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
          if (status === 'paid' || status === 'completed' || status === 'approved' || data.paidAt || data.paid_at) {
            // Payment successful! Credit balance.
            const finalAmount = activeInvoice.amount;
            onUpdateUser((prevUser) => {
              if (!prevUser) return prevUser;
              const updated = { ...prevUser };
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
              return updated;
            });
            triggerToast(`Pagamento de R$${finalAmount.toFixed(2)} recebido com sucesso via LytronPay!`, 'success');
            setActiveInvoice(null);
            setAmount('');
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
    setAmount(val.toString());
  };

  const handleSubmitRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Insira um valor de recarga válido maior que zero.');
      return;
    }

    setProcessingInvoice(true);

    if (method === 'pix') {
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
          email: customerEmail.trim() || `user_${user.phone}@500car.com`,
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
    } else {
      // Mock USDT TRC20 Invoice
      setTimeout(() => {
        setActiveInvoice({
          address: 'TYLStSimulatedRechargeAddressTrc20X99XxxYyZz123',
          amount: val,
          method: 'USDT TRC20',
          timeLeft: 300 // 5 minutes standard
        });
        setProcessingInvoice(false);
      }, 800);
    }
  };

  // Simulate payment confirmation button clicked by the user
  const handleConfirmMockPayment = () => {
    if (!activeInvoice) return;

    const finalAmount = activeInvoice.amount;
    const updated = { ...user };
    updated.balance += finalAmount;

    // Log the success record
    const record = {
      id: `recharge_${Date.now()}`,
      type: 'recharge' as const,
      amount: finalAmount,
      status: 'success' as const,
      timestamp: Date.now(),
      description: `Recarga efetuada via ${activeInvoice.method}`
    };

    updated.rechargeRecords = [record, ...updated.rechargeRecords];
    onUpdateUser(updated);

    triggerToast(`Depósito de $${finalAmount.toFixed(2)} Creditado com sucesso via ${activeInvoice.method}!`, 'success');
    setActiveInvoice(null);
    setAmount('');
    onNavigate('home');
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    const isPix = activeInvoice?.method === 'PIX';
    triggerToast(isPix ? 'Código Pix copiado com sucesso!' : 'Endereço copiado com sucesso!', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 pb-24 relative overflow-y-auto">
      {/* Dynamic Gold Header Segment */}
      <div className="h-44 shrink-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-[#070b19] border-b border-slate-900 flex flex-col justify-end p-5 relative overflow-hidden">
        {/* Floating golden 3D coin background graphics */}
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

        <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">Carteira / Wallet</span>
        <h2 className="text-2xl font-black text-white mt-1">Recarregar Saldo</h2>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {!activeInvoice ? (
            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              onSubmit={handleSubmitRecharge}
              className="space-y-4"
            >
              {/* Method choice dropdown */}
              <div className="space-y-1.5 relative">
                <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                  Método de Recarga / Payment Method
                </label>
                <button
                  type="button"
                  onClick={() => setShowMethodDrop(!showMethodDrop)}
                  className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 flex items-center justify-between hover:border-slate-700/80 transition-all font-bold text-sm text-slate-200"
                >
                  <span>{METHODS.find((m) => m.id === method)?.label}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                <AnimatePresence>
                  {showMethodDrop && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 5 }}
                      className="absolute left-0 right-0 top-20 bg-slate-900 border border-slate-800 rounded-2xl z-50 p-2 shadow-2xl divide-y divide-slate-800/40"
                    >
                      {METHODS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMethod(item.id);
                            setShowMethodDrop(false);
                          }}
                          className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-800 text-xs flex flex-col gap-0.5"
                        >
                          <span className="font-bold text-slate-200">{item.label}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{item.description}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amount text input fields */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                  Valor Recarga / Amount
                </label>
                <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-cyan-500/50 transition-all">
                  <span className="text-slate-500 font-bold text-sm mr-2 shrink-0">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="Digite a quantia a depositar"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 leading-none h-full"
                    required
                  />
                  <Wallet size={16} className="text-slate-500 shrink-0" />
                </div>
              </div>

              {/* Extra PIX details fields */}
              {method === 'pix' && (
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

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold block">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-14 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700/80"
                    />
                  </div>
                </div>
              )}

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
                  {processingInvoice ? 'Gerando invoice...' : 'Submeter Recarga'}
                </button>
              </div>

              {/* FAQ Section */}
              <div className="mt-6 pt-2 border-t border-slate-900">
                <h4 className="text-xs text-slate-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <HelpCircle size={14} className="text-cyan-400" /> Instruções de Depósito
                </h4>
                <div className="space-y-2.5 text-[10px] text-slate-500 leading-normal">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <p className="font-bold text-slate-400 mb-1">1. Qual método de recarga é suportado?</p>
                    <p>Damos preferência a transferências por simulação USDT TRC20, que operam de ponta a ponta na rede.</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <p className="font-bold text-slate-400 mb-1">2. Qual o prazo de conferência?</p>
                    <p>O processamento simulado ocorre geralmente em menos de 10 segundos ao clicar no confirmador da bancada.</p>
                  </div>
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl relative"
            >
              {/* Payment Receipt / Invoice simulation screen */}
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#06b6d4] font-black">Invoice de Pagamento</span>
                <h3 className="text-lg font-black text-slate-100">Depósito Pendente</h3>
              </div>

              {/* Price Tag Details */}
              <div className="bg-slate-950 rounded-xl p-4 text-center border border-slate-800/80">
                <span className="text-xs text-slate-500 font-bold block mb-1">QUANTIA TOTAL A COPIAR</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  ${activeInvoice.amount.toFixed(2)}
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
                  {activeInvoice.method === 'PIX' ? 'Código Pix Copia e Cola' : 'Chave ou Endereço do Destinatário'}
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

              {/* Simulating Receipt Confirm button */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleConfirmMockPayment}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  Simular Pagamento Pago
                </button>
                <button
                  onClick={() => setActiveInvoice(null)}
                  className="w-full h-10 bg-slate-950 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl hover:text-slate-200"
                >
                  Cancelar Recarga
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
