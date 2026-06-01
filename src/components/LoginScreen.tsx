import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, ChevronDown, CheckCircle, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserFromSupabase, saveUserToSupabase, hashPassword, isLegacyPassword } from '../lib/supabase';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(() => {
    // Remember the checkbox state from last time
    return localStorage.getItem('keep_logged_in_pref') === 'true';
  });

  // Custom alert / notification message
  const [notification, setNotification] = useState<{ status: 'success' | 'detail'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const emailVal = email.trim().toLowerCase();
    if (!emailVal || !emailVal.endsWith('@gmail.com')) {
      triggerToast('Insira um e-mail do Gmail válido (@gmail.com).');
      return;
    }
    if (!password || password.trim().length < 4) {
      triggerToast('Insira uma senha válida (no mínimo 4 dígitos).');
      return;
    }

    const userKey = `user_state_${emailVal}`;

    setLoading(true);
    try {
      // Check database first using the email address
      const existingDb = await getUserFromSupabase(emailVal);

      if (isRegistering) {
        if (existingDb) {
          triggerToast('Este e-mail já está registrado.');
          setLoading(false);
          return;
        }

        // Register new profile with hashed password
        const referrer = localStorage.getItem('pending_invite_referrer') || '';
        const hashedPassword = await hashPassword(password);
        const initialUser = {
          uid: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          phone: emailVal,
          isLoggedIn: false,
          balance: 16.0,
          jobDeposit: 0.0,
          totalWithdrawn: 0.0,
          vipLevel: 'Bronze' as const,
          checkedInToday: false,
          rechargeRecords: [],
          withdrawRecords: [],
          activeInvestments: [],
          passwordHash: hashedPassword,
          referredBy: referrer,
          createdAt: Date.now()
        };

        const success = await saveUserToSupabase(initialUser);
        if (success) {
          localStorage.setItem(userKey, JSON.stringify(initialUser));
          triggerToast('Conta criada! Você ganhou bônus de R$16! Faça login.', 'success');
          setTimeout(() => {
            setIsRegistering(false);
          }, 1000);
        } else {
          triggerToast('Erro ao criar conta no servidor. Tente novamente.');
        }
      } else {
        // Login flow
        if (!existingDb) {
          triggerToast('Gmail não encontrado. Registre-se para poder prosseguir.');
          setLoading(false);
          return;
        } else {
          // Support legacy plain-text passwords (migration to hashed on success)
          let passwordMatches = false;
          if (isLegacyPassword(existingDb.passwordHash)) {
            // Old plain-text comparison
            passwordMatches = existingDb.passwordHash === password;
            if (passwordMatches) {
              // Migrate to hashed password silently
              const hashedPassword = await hashPassword(password);
              existingDb.passwordHash = hashedPassword;
              await saveUserToSupabase(existingDb);
            }
          } else {
            // Standard hashed comparison
            const hashedInput = await hashPassword(password);
            passwordMatches = existingDb.passwordHash === hashedInput;
          }

          if (!passwordMatches) {
            triggerToast('Senha incorreta.');
            setLoading(false);
            return;
          }
          localStorage.setItem(userKey, JSON.stringify(existingDb));
          // Handle persistent login preference
          if (keepLoggedIn) {
            localStorage.setItem('persistent_login_email', emailVal);
            localStorage.setItem('keep_logged_in_pref', 'true');
          } else {
            localStorage.removeItem('persistent_login_email');
            localStorage.setItem('keep_logged_in_pref', 'false');
          }
          triggerToast('Login efetuado com sucesso!', 'success');
          setTimeout(() => {
            onLoginSuccess(emailVal);
          }, 800);
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('Erro de conexão ou servidor. Tente novamente.');
    } finally {
      setLoading(false);
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
          
          {/* Gmail email input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
              E-mail do Gmail / Gmail Address
            </label>
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl h-14 px-4 focus-within:border-cyan-500/50 transition-all">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mr-3 shrink-0">
                Gmail
              </span>
              <input
                type="email"
                placeholder="usuario@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          {/* Manter conectado checkbox - only shown in login mode */}
          {!isRegistering && (
            <div className="flex items-center gap-2.5 px-1">
              <button
                type="button"
                id="keep-logged-in-toggle"
                onClick={() => setKeepLoggedIn(v => !v)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  keepLoggedIn
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'bg-transparent border-slate-600 hover:border-slate-400'
                }`}
              >
                {keepLoggedIn && (
                  <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#070b19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <label
                htmlFor="keep-logged-in-toggle"
                className="text-xs text-slate-300 font-semibold cursor-pointer select-none"
                onClick={() => setKeepLoggedIn(v => !v)}
              >
                Manter conectado
              </label>
              <span className="ml-auto text-[10px] text-slate-600 font-semibold">Lembrar conta</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-13 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-base rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isRegistering ? 'Criar Conta Premium' : 'Acessar 500CAR'}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-xs font-black text-slate-100 hover:text-white transition-all bg-slate-950/90 border border-slate-800 py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            {isRegistering ? (
              <span>
                Já possui uma conta? <span className="text-cyan-400 underline">Fazer Login</span>
              </span>
            ) : (
              <span>
                Não tem cadastro? <span className="text-cyan-400 underline">Registrar Grátis</span>
              </span>
            )}
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
