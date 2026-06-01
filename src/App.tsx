import React, { useState, useEffect } from 'react';
import { Home, Car, Headphones, User, AlertCircle, Sparkles, HelpCircle, Coins, Wallet, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import MobileFrame from './components/MobileFrame';
import LoginScreen from './components/LoginScreen';
import SupportChat from './components/SupportChat';

// Tab screens
import HomeTab from './components/Tabs/HomeTab';
import PackagesTab from './components/Tabs/PackagesTab';
import RechargeTab from './components/Tabs/RechargeTab';
import SupportTab from './components/Tabs/SupportTab';
import ProfileTab from './components/Tabs/ProfileTab';
import InviteTab from './components/Tabs/InviteTab';

import { UserState } from './types';
import { saveUserToSupabase, getUserFromSupabase } from './lib/supabase';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const isAdminRoute = window.location.pathname === '/oculto';
  const [user, setUser] = useState<UserState | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; status: 'success' | 'detail' } | null>(null);
  const [autoLogging, setAutoLogging] = useState(true); // Prevents flash of login screen on refresh

  // Trigger brief floating notifications
  const triggerToast = (msg: string, status: 'success' | 'detail' = 'detail') => {
    setToast({ msg, status });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Auto-login on page load if "Manter conectado" was selected
  useEffect(() => {
    const persistedEmail = localStorage.getItem('persistent_login_email');
    if (!persistedEmail) {
      setAutoLogging(false);
      return;
    }
    // Try to restore session from Supabase, fallback to localStorage cache
    getUserFromSupabase(persistedEmail).then((dbUser) => {
      if (dbUser) {
        dbUser.isLoggedIn = true;
        setUser(dbUser);
        localStorage.setItem(`user_state_${persistedEmail}`, JSON.stringify(dbUser));
      } else {
        // Fallback: use cached local state
        const cached = localStorage.getItem(`user_state_${persistedEmail}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.isLoggedIn = true;
            setUser(parsed);
          } catch { /* ignore */ }
        } else {
          // Cache also missing — clear the persisted email
          localStorage.removeItem('persistent_login_email');
        }
      }
      setAutoLogging(false);
    }).catch(() => {
      setAutoLogging(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time live earnings ticker running globally
  useEffect(() => {
    if (!user || !user.isLoggedIn || !user.activeInvestments || user.activeInvestments.length === 0) return;

    const ticker = setInterval(() => {
      setUser((current) => {
        if (!current) return null;
        if (!current.activeInvestments || current.activeInvestments.length === 0) return current;

        // Calculate second-by-second passive profit increment
        let incrementSum = 0;
        const now = Date.now();
        
        current.activeInvestments.forEach((inv) => {
          // Profit per second = dailyProfit / 86400
          incrementSum += inv.dailyProfit / 86400;
        });

        const nextBalance = current.balance + incrementSum;
        const updated = {
          ...current,
          balance: parseFloat(nextBalance.toFixed(6))
        };

        // Cache update in local storage
        localStorage.setItem(`user_state_${current.phone}`, JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [user?.isLoggedIn, user?.activeInvestments?.length]);

  // Periodic sync to Supabase (every 10 seconds) to persist passive earnings
  useEffect(() => {
    if (!user || !user.isLoggedIn || !user.phone) return;

    const syncInterval = setInterval(() => {
      const userKey = `user_state_${user.phone}`;
      const stored = localStorage.getItem(userKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          saveUserToSupabase(parsed);
        } catch (e) {
          console.error('Error in periodic sync to Supabase:', e);
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [user?.phone, user?.isLoggedIn]);

  // Auth logins handler
  const handleLoginSuccess = async (phoneNumber: string) => {
    const dbUser = await getUserFromSupabase(phoneNumber);
    if (dbUser) {
      dbUser.isLoggedIn = true;
      setUser(dbUser);
      localStorage.setItem(`user_state_${phoneNumber}`, JSON.stringify(dbUser));
      setActiveTab('home');
      triggerToast('Acesso Premium Liberado!', 'success');
    } else {
      // Fallback to local storage if database lookup fails but user is cached locally
      const userKey = `user_state_${phoneNumber}`;
      const stored = localStorage.getItem(userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.isLoggedIn = true;
        setUser(parsed);
        localStorage.setItem(userKey, JSON.stringify(parsed));
        saveUserToSupabase(parsed); // Re-sync to database
        setActiveTab('home');
        triggerToast('Acesso Premium Liberado! (Offline)', 'success');
      } else {
        triggerToast('Erro ao carregar dados do usuário.');
      }
    }
  };

  const handleUpdateUser = (updatedState: UserState) => {
    setUser(updatedState);
    if (updatedState.phone) {
      localStorage.setItem(`user_state_${updatedState.phone}`, JSON.stringify(updatedState));
      saveUserToSupabase(updatedState);
    }
  };

  const handleLogout = () => {
    if (user) {
      const loggedOut = { ...user, isLoggedIn: false };
      setUser(null);
      localStorage.setItem(`user_state_${user.phone}`, JSON.stringify(loggedOut));
      localStorage.removeItem('persistent_login_email'); // Clear persistent session
      saveUserToSupabase(loggedOut);
      triggerToast('Sessão encerrada com sucesso.', 'detail');
    }
  };

  const renderActiveTab = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            user={user}
            onUpdateUser={handleUpdateUser}
            onNavigate={setActiveTab}
            triggerToast={triggerToast}
          />
        );
      case 'packages':
        return (
          <PackagesTab
            user={user}
            onUpdateUser={handleUpdateUser}
            onNavigate={setActiveTab}
            triggerToast={triggerToast}
          />
        );
      case 'recharge':
        return (
          <RechargeTab
            user={user}
            onUpdateUser={handleUpdateUser}
            triggerToast={triggerToast}
            onNavigate={setActiveTab}
            initialSubTab="deposit"
          />
        );
      case 'support':
        return (
          <SupportTab
            onOpenLiveChat={() => setIsLiveChatOpen(true)}
            triggerToast={triggerToast}
            onNavigate={setActiveTab}
          />
        );
      case 'profile':
        return (
          <ProfileTab
            user={user}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onNavigate={setActiveTab}
            triggerToast={triggerToast}
          />
        );
      case 'withdraw':
        return (
          <RechargeTab
            user={user}
            onUpdateUser={handleUpdateUser}
            triggerToast={triggerToast}
            onNavigate={setActiveTab}
            initialSubTab="withdraw"
          />
        );
      case 'invite':
        return (
          <InviteTab
            user={user}
            triggerToast={triggerToast}
            onNavigate={setActiveTab}
          />
        );
      default:
        return <HomeTab user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} triggerToast={triggerToast} />;
    }
  };

  // Render admin panel for secret route (after all hooks)
  if (isAdminRoute) {
    return <AdminPanel />;
  }

  // Show loading spinner while auto-login check runs (prevents flash of login screen)
  if (autoLogging) {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col items-center justify-center bg-[#070b19] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Carregando sessão...</p>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <AnimatePresence mode="wait">
        {!user || !user.isLoggedIn ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full bg-[#070b19] relative"
          >
            {/* Viewport page container */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {renderActiveTab()}
            </div>

            {/* Bottom Tab Navigation Bar mimicking screenshots 2, 3, 6 */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 px-4 flex items-center justify-between shrink-0 z-40 select-none">
              
              {/* Home Tab Trigger */}
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 py-1 px-3.5 transition-all text-xs font-semibold ${
                  activeTab === 'home' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Home size={20} className={activeTab === 'home' ? 'stroke-2' : 'stroke-1'} />
                <span>Home</span>
              </button>

              {/* Recharge/Wallet Tab Trigger */}
              <button
                onClick={() => setActiveTab('recharge')}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all text-xs font-semibold ${
                  activeTab === 'recharge' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Wallet size={20} className={activeTab === 'recharge' ? 'stroke-2' : 'stroke-1'} />
                <span>Carteira</span>
              </button>

              {/* Central stylized action button that triggers the Invite/Referrals tab */}
              <button
                onClick={() => {
                  setActiveTab('invite');
                }}
                className={`w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-xl shadow-cyan-500/20 flex items-center justify-center -mt-6 border-4 active:scale-90 hover:scale-105 transition-all cursor-pointer group z-50 ${
                  activeTab === 'invite' ? 'border-cyan-400 text-cyan-400 bg-slate-950' : 'border-slate-950 text-slate-950'
                }`}
              >
                <Users size={22} className="group-hover:rotate-12 transition-transform duration-300" />
              </button>

              {/* Online Service Tab Trigger */}
              <button
                onClick={() => setActiveTab('support')}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all text-xs font-semibold ${
                  activeTab === 'support' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Headphones size={20} className={activeTab === 'support' ? 'stroke-2' : 'stroke-1'} />
                <span>Suporte</span>
              </button>

              {/* Profile/My Tab Trigger */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 py-1 px-3.5 transition-all text-xs font-semibold ${
                  activeTab === 'profile' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <User size={20} className={activeTab === 'profile' ? 'stroke-2' : 'stroke-1'} />
                <span>Perfil</span>
              </button>
            </div>

            {/* Float Headset button at bottom-right of viewport for easy quick assistant triggers */}
            <div className="absolute bottom-24 right-5 z-[80] select-none">
              <button
                onClick={() => setIsLiveChatOpen(true)}
                className="w-12 h-12 rounded-full bg-[#0ea5e9] hover:bg-cyan-400 border border-cyan-300/30 text-white flex items-center justify-center shadow-2xl active:scale-95 hover:scale-105 hover:rotate-6 transition-all cursor-pointer animate-bounce"
              >
                💬
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Globally mounted interactive Assistant Robot helpdesk */}
      <SupportChat
        isOpen={isLiveChatOpen}
        onClose={() => setIsLiveChatOpen(false)}
      />

      {/* Global interactive toast notifications system */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            className={`fixed top-14 left-1/2 -translate-x-1/2 p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 z-[150] w-[85%] max-w-xs ${
              toast.status === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-250'
                : 'bg-indigo-950/95 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {toast.status === 'success' ? (
              <Sparkles size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-indigo-400 shrink-0" />
            )}
            <span className="text-[11px] font-bold leading-tight">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileFrame>
  );
}
