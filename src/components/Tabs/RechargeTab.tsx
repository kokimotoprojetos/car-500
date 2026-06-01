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
  { id: 'usdt', label: 'USDT TRC20 (Recomendado)', description: 'Simulação de depósitos com rede de blockchain TRON' },
  { id: 'pix', label: 'PIX Instantâneo', description: 'Simulação em Reais Brasileiros (Cotação 1 USDT = R$ 5,00)' }
];

const PRESETS = [1000, 2000, 5000, 15000, 30000, 45000];

export default function RechargeTab({ user, onUpdateUser, triggerToast, onNavigate }: RechargeTabProps) {
  const [method, setMethod] = useState('usdt');
  const [showMethodDrop, setShowMethodDrop] = useState(false);
  const [amount, setAmount] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Active payment gateway screen state indicators
  const [processingInvoice, setProcessingInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<{
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

  const handlePresetSelect = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmitRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Insira um valor de recarga válido maior que zero.');
      return;
    }

    setProcessingInvoice(true);
    setTimeout(() => {
      // Setup dynamic mock payment details
      const mockAddress = method === 'usdt'
        ? 'TYLStSimulatedRechargeAddressTrc20X99XxxYyZz123'
        : '00020101021226830014br.gov.bcb.pix2561500carpremiumrechargegatewaysimulatedpixkey';
      
      setActiveInvoice({
        address: mockAddress,
        amount: val,
        method: method === 'usdt' ? 'USDT TRC20' : 'PIX',
        timeLeft: 300 // 5 minutes standard
      });
      setProcessingInvoice(false);
    }, 800);
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
    triggerToast('Chave de pagamento simulado copiada!', 'success');
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
                  Valor Recarga / Amount (USDT)
                </label>
                <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-cyan-500/50 transition-all">
                  <span className="text-slate-500 font-bold text-sm mr-2 shrink-0">
                    $
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

              {/* Simulated QR Code representation */}
              <div className="w-36 h-36 bg-white rounded-xl p-2 mx-auto flex items-center justify-center shadow-lg relative group">
                <QrCode size={130} className="text-slate-950" />
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
                  Chave ou Endereço do Destinatário
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
