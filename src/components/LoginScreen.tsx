import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, ChevronDown, CheckCircle, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (phoneNumber: string) => void;
}

const COUNTRY_CODES = [
  { code: '+27', name: 'South Africa' },
  { code: '+55', name: 'Brazil' },
  { code: '+1', name: 'US/Canada' },
  { code: '+44', name: 'UK' },
  { code: '+91', name: 'India' },
  { code: '+92', name: 'Pakistan' },
  { code: '+351', name: 'Portugal' }
];

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [countryCode, setCountryCode] = useState('+27');
  const [showDropdown, setShowDropdown] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom alert / notification message
  const [notification, setNotification] = useState<{ status: 'success' | 'detail'; text: string } | null>(null);

  const triggerToast = (text: string, status: 'success' | 'detail' = 'detail') => {
    setNotification({ status, text });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('pending_invite_referrer', ref);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 6) {
      triggerToast('Insira um número de telefone válido (no mínimo 6 dígitos).');
      return;
    }
    if (!password || password.trim().length < 4) {
      triggerToast('Insira uma senha válida (no mínimo 4 dígitos).');
      return;
    }

    const fullPhone = `${countryCode}${phone.trim()}`;
    const userKey = `user_state_${fullPhone}`;
    const existing = localStorage.getItem(userKey);

    if (isRegistering) {
      if (existing) {
        triggerToast('Este número de telefone já está registrado.');
        return;
      }
      // Register new simulation profile with default balance
      const referrer = localStorage.getItem('pending_invite_referrer') || '';
      const initialUser = {
        uid: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        phone: fullPhone,
        balance: 16.0,
        jobDeposit: 0.0,
        totalWithdrawn: 0.0,
        vipLevel: 'Bronze',
        checkedInToday: false,
        spinTurns: 1, // Start with 1 free spin!
        rechargeRecords: [],
        withdrawRecords: [],
        activeInvestments: [],
        passwordHash: password,
        referredBy: referrer,
        createdAt: Date.now()
      };
      localStorage.setItem(userKey, JSON.stringify(initialUser));
      triggerToast('Conta criada! Você ganhou bônus de R$16! Faça login.', 'success');
      setTimeout(() => {
        setIsRegistering(false);
      }, 1000);
    } else {
      // Login flow
      if (!existing) {
        // Create user anyway to make testing smooth and foolproof for the user,
        // but notify them! It is extremely elegant to support automatic quick-entry.
        const referrer = localStorage.getItem('pending_invite_referrer') || '';
        const defaultUser = {
          uid: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          phone: fullPhone,
          balance: 16.0, // Give them R$16.00 credit automatically so they can try packages out of the box!
          jobDeposit: 0.0,
          totalWithdrawn: 0.0,
          vipLevel: 'Bronze',
          checkedInToday: false,
          spinTurns: 2, // Give them 2 free spins to test!
          rechargeRecords: [],
          withdrawRecords: [],
          activeInvestments: [],
          passwordHash: password,
          referredBy: referrer,
          createdAt: Date.now()
        };
        localStorage.setItem(userKey, JSON.stringify(defaultUser));
        triggerToast('Nova conta simulada ativada com saldo bônus de R$16!', 'success');
        setTimeout(() => {
          onLoginSuccess(fullPhone);
        }, 1200);
      } else {
        const parsed = JSON.parse(existing);
        if (parsed.passwordHash !== password) {
          triggerToast('Senha incorreta.');
          return;
        }
        triggerToast('Login efetuado com sucesso!', 'success');
        setTimeout(() => {
          onLoginSuccess(fullPhone);
        }, 800);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-6 px-6 relative overflow-y-auto">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/fundo2.png" 
          alt="Background" 
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/20 to-slate-950/45" />
      </div>

      {/* Decorative luxury neon lights */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header section */}
      <div className="relative z-10 text-center pt-4">
        <div className="flex justify-between items-start mb-4">
          <div className="text-left">
            <h1 className="text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase">
              Área de Login
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 shadow-md">
            <span className="text-lg">🌐</span>
          </div>
        </div>
      </div>

      {/* Form Credentials layout */}
      <div className="relative z-10 mt-2 mb-auto pt-2">
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Phone input with country code */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
              Telefone / Phone Number
            </label>
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-3 focus-within:border-cyan-500/50 transition-all">
              {/* Dropdown selector triggers popup */}
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 text-slate-200 font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 mr-2 shrink-0 active:scale-95 transition-all"
              >
                <span>{countryCode}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Country select items custom popup */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-3 top-16 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-1 divide-y divide-slate-800/40"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setCountryCode(item.code);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/80 rounded-lg text-slate-300 flex justify-between items-center"
                      >
                        <span>{item.name}</span>
                        <span className="font-bold text-cyan-400">{item.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="tel"
                placeholder="Insira seu telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 leading-none h-full self-center"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
              Senha / Password
            </label>
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-cyan-500/50 transition-all">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mr-3 shrink-0">
                Senha
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Insira sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0 leading-none h-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-13 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-base rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isRegistering ? 'Criar Conta Premium' : 'Acessar 500CAR'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-semibold text-slate-400 hover:text-slate-200 hover:underline transition-all"
          >
            {isRegistering
              ? 'Já possui uma conta? Faça Login'
              : 'Não tem cadastro? Clique aqui para Registrar'}
          </button>
        </div>
      </div>

      {/* Standard warning / disclaimer simulator info */}
      <div className="relative z-10 text-center pb-2">
        <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
          Ao prosseguir você concorda com os termos de associação do clube exclusivo 500CAR. Simulador interativo VIP.
        </p>
      </div>

      {/* Floating status alert */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={`absolute left-6 right-6 bottom-24 p-3 rounded-xl border flex items-center gap-2.5 shadow-2xl z-50 ${
              notification.status === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200'
            }`}
          >
            {notification.status === 'success' ? (
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <Phone size={18} className="text-cyan-400 shrink-0" />
            )}
            <span className="text-xs font-semibold leading-snug">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
