import React, { useState, useEffect } from 'react';
import { Shield, Users, Search, DollarSign, RefreshCw, Trash2, Edit2, Check, X, ShieldAlert, LogOut, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UserState, TransactionRecord } from '../types';
import { getAllUsersFromSupabase, saveUserToSupabase, deleteUserFromSupabase } from '../lib/supabase';

// Generated credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = '500caradmin@2026';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2-hour session expiry
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15-minute lockout

function isAdminSessionValid(): boolean {
  const raw = localStorage.getItem('admin_session');
  if (!raw) return false;
  try {
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < SESSION_TTL_MS;
  } catch {
    return false;
  }
}

function getFailedAttempts(): number {
  return parseInt(localStorage.getItem('admin_failed_attempts') || '0', 10);
}

function getLockoutUntil(): number {
  return parseInt(localStorage.getItem('admin_lockout_until') || '0', 10);
}

interface PendingWithdrawal {
  user: UserState;
  record: TransactionRecord;
}

export default function AdminPanel() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Users data states
  const [usersList, setUsersList] = useState<UserState[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Edit user modal/inline states
  const [editingUserPhone, setEditingUserPhone] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editVip, setEditVip] = useState<'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'>('Bronze');

  // Toast message
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Check local session with expiry
  useEffect(() => {
    if (isAdminSessionValid()) {
      setIsAuthorized(true);
      fetchUsers();
    } else {
      localStorage.removeItem('admin_session');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check lockout
    const lockoutUntil = getLockoutUntil();
    if (Date.now() < lockoutUntil) {
      const remainingMins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setLoginError(`Conta bloqueada por tentativas excessivas. Tente novamente em ${remainingMins} minuto(s).`);
      return;
    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      localStorage.setItem('admin_session', Date.now().toString());
      localStorage.removeItem('admin_failed_attempts');
      localStorage.removeItem('admin_lockout_until');
      setIsAuthorized(true);
      setLoginError('');
      fetchUsers();
      showToast('Bem-vindo, Administrador!');
    } else {
      const attempts = getFailedAttempts() + 1;
      localStorage.setItem('admin_failed_attempts', attempts.toString());
      if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem('admin_lockout_until', (Date.now() + LOCKOUT_MS).toString());
        localStorage.setItem('admin_failed_attempts', '0');
        setLoginError(`Muitas tentativas incorretas. Login bloqueado por 15 minutos.`);
      } else {
        setLoginError(`Usuário ou senha incorretos. (${attempts}/${MAX_ATTEMPTS} tentativas)`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthorized(false);
    setUsername('');
    setPassword('');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersFromSupabase();
      setUsersList(data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    showToast('Dados atualizados!');
  };

  const startEdit = (user: UserState) => {
    setEditingUserPhone(user.phone);
    setEditBalance(user.balance.toString());
    setEditVip(user.vipLevel);
  };

  const saveEdit = async (user: UserState) => {
    const parsedBalance = parseFloat(editBalance);

    if (isNaN(parsedBalance)) {
      showToast('Por favor, insira valores válidos.');
      return;
    }

    const updatedUser: UserState = {
      ...user,
      balance: parsedBalance,
      vipLevel: editVip
    };

    const success = await saveUserToSupabase(updatedUser);
    if (success) {
      showToast(`Usuário ${user.phone} atualizado com sucesso!`);
      setEditingUserPhone(null);
      // Update local state
      setUsersList(prev => prev.map(u => u.phone === user.phone ? updatedUser : u));
    } else {
      showToast('Erro ao atualizar usuário no Supabase.');
    }
  };

  const handleDelete = async (phone: string) => {
    if (!window.confirm(`Tem certeza que deseja DELETAR o usuário ${phone}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const success = await deleteUserFromSupabase(phone);
    if (success) {
      showToast(`Usuário ${phone} deletado.`);
      setUsersList(prev => prev.filter(u => u.phone !== phone));
    } else {
      showToast('Erro ao deletar usuário.');
    }
  };

  // Moderation Handlers for Withdrawals
  const handleApproveWithdrawal = async (user: UserState, recordId: string, amount: number) => {
    if (!window.confirm(`Aprovar saque de R$ ${amount.toFixed(2)} para ${user.phone}?`)) return;

    const updatedWithdraws = user.withdrawRecords.map(rec => {
      if (rec.id === recordId) {
        return { ...rec, status: 'success' as const };
      }
      return rec;
    });

    const updatedUser: UserState = {
      ...user,
      totalWithdrawn: (user.totalWithdrawn || 0) + amount,
      withdrawRecords: updatedWithdraws
    };

    const success = await saveUserToSupabase(updatedUser);
    if (success) {
      showToast('Saque APROVADO com sucesso!');
      setUsersList(prev => prev.map(u => u.phone === user.phone ? updatedUser : u));
    } else {
      showToast('Erro ao processar aprovação no banco de dados.');
    }
  };

  const handleRejectWithdrawal = async (user: UserState, recordId: string, amount: number) => {
    if (!window.confirm(`RECUSAR saque de R$ ${amount.toFixed(2)} para ${user.phone}? O valor será devolvido ao saldo dele.`)) return;

    const updatedWithdraws = user.withdrawRecords.map(rec => {
      if (rec.id === recordId) {
        return { ...rec, status: 'failed' as const };
      }
      return rec;
    });

    const updatedUser: UserState = {
      ...user,
      balance: user.balance + amount, // Refund balance
      withdrawRecords: updatedWithdraws
    };

    const success = await saveUserToSupabase(updatedUser);
    if (success) {
      showToast('Saque RECUSADO e saldo devolvido ao usuário.');
      setUsersList(prev => prev.map(u => u.phone === user.phone ? updatedUser : u));
    } else {
      showToast('Erro ao processar rejeição no banco de dados.');
    }
  };

  // Compute Stats
  const totalUsers = usersList.length;
  const totalBalances = usersList.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalWithdrawn = usersList.reduce((acc, u) => acc + (u.totalWithdrawn || 0), 0);

  // Extract pending withdrawals from all users
  const pendingWithdrawals: PendingWithdrawal[] = [];
  usersList.forEach(u => {
    if (u.withdrawRecords) {
      u.withdrawRecords.forEach(rec => {
        if (rec.status === 'pending') {
          pendingWithdrawals.push({ user: u, record: rec });
        }
      });
    }
  });

  const totalPendingWithdrawalsCount = pendingWithdrawals.length;

  // Filter list
  const filteredUsers = usersList.filter(u => 
    u.phone.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.uid.includes(searchQuery)
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background lights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide uppercase bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Painel Secreto
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Acesso Administrativo Restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                Usuário / Admin User
              </label>
              <input
                type="text"
                placeholder="Insira o usuário admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                Senha / Password
              </label>
              <input
                type="password"
                placeholder="Insira a senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-500 font-bold text-center mt-1">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98] mt-2"
            >
              Autenticar Administrador
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 bg-cyan-950 border border-cyan-500/40 text-cyan-200 px-4 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold animate-bounce">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5 mb-6 font-sans">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-cyan-400" size={24} />
            <h1 className="text-2xl font-black tracking-wide uppercase bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Painel do Administrador (500CAR)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Gerenciamento centralizado de usuários e saques pendentes em tempo real</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-350 cursor-pointer active:scale-95 transition-all w-1/2 md:w-auto"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
            Recarregar Dados
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/40 text-xs font-bold text-rose-200 cursor-pointer active:scale-95 transition-all w-1/2 md:w-auto"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-cyan-400" />
          <div className="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Usuários</span>
            <span className="text-xl font-black text-white font-mono">{totalUsers}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-400" />
          <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldos Totais</span>
            <span className="text-xl font-black text-emerald-400 font-mono">R$ {totalBalances.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-purple-400" />
          <div className="w-11 h-11 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Sacado</span>
            <span className="text-xl font-black text-purple-400 font-mono">R$ {totalWithdrawn.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
          <div className="w-11 h-11 rounded-xl bg-rose-950/60 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Clock size={20} className={totalPendingWithdrawalsCount > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saques Pendentes</span>
            <span className={`text-xl font-black font-mono ${totalPendingWithdrawalsCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {totalPendingWithdrawalsCount} solicitações
            </span>
          </div>
        </div>
      </div>

      {/* Moderation Section for Pending Withdrawals */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl mb-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <AlertTriangle className="text-rose-500 animate-bounce" size={18} />
          <h2 className="text-base font-black uppercase text-slate-200 tracking-wide">
            Aprovação de Saques Pix Pendentes ({totalPendingWithdrawalsCount})
          </h2>
        </div>

        {totalPendingWithdrawalsCount === 0 ? (
          <div className="text-center py-10 bg-slate-950/30 border border-slate-850 rounded-2xl text-slate-500 font-bold text-xs">
            Nenhuma solicitação de saque Pix pendente no momento.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-450 uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Gmail do Cliente</th>
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4">Valor Solicitado</th>
                  <th className="py-3 px-4">Destinatário / Chave</th>
                  <th className="py-3 px-4">Data da Solicitação</th>
                  <th className="py-3 px-4 text-center">Moderação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-350">
                {pendingWithdrawals.map(({ user, record }) => (
                  <tr key={record.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">{user.phone}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{user.uid}</td>
                    <td className="py-3 px-4 font-mono font-black text-rose-400">R$ {record.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-300 max-w-[220px] truncate">{record.description}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {new Date(record.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApproveWithdrawal(user, record.id, record.amount)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 cursor-pointer active:scale-95 transition-all text-[10px] font-black uppercase flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(user, record.id, record.amount)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-450 cursor-pointer active:scale-95 transition-all text-[10px] font-black uppercase flex items-center gap-1"
                        >
                          <X size={12} />
                          Recusar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database View Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Search filter row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por Gmail ou UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-semibold"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 h-11 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-400 border border-slate-800 active:scale-95 transition-all w-full sm:w-auto"
            >
              Limpar Filtro
            </button>
          )}
        </div>

        {/* Users Table / List */}
        <div className="overflow-x-auto border border-slate-800/80 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800/80 text-slate-450 uppercase font-black tracking-wider">
                <th className="py-4 px-4">Usuário (Gmail)</th>
                <th className="py-4 px-4">UID</th>
                <th className="py-4 px-4">Nível VIP</th>
                <th className="py-4 px-4">Saldo (R$)</th>
                <th className="py-4 px-4">Total Sacado</th>
                <th className="py-4 px-4">Investimentos Ativos</th>
                <th className="py-4 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    Carregando dados dos usuários do Supabase...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    Nenhum usuário cadastrado encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const isEditing = editingUserPhone === item.phone;

                  return (
                    <tr 
                      key={item.phone} 
                      className={`hover:bg-slate-950/20 transition-all ${isEditing ? 'bg-cyan-950/15' : ''}`}
                    >
                      {/* Email/Gmail */}
                      <td className="py-3.5 px-4 font-bold text-slate-200 select-all truncate max-w-[200px]">
                        {item.phone}
                      </td>

                      {/* UID */}
                      <td className="py-3.5 px-4 font-mono select-all font-bold">
                        {item.uid}
                      </td>

                      {/* VIP Level */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editVip}
                            onChange={(e) => setEditVip(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-cyan-500 text-cyan-400 font-bold"
                          >
                            <option value="Bronze">Bronze</option>
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Diamond">Diamond</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            item.vipLevel === 'Diamond' ? 'bg-amber-950 border-amber-500/30 text-amber-400' :
                            item.vipLevel === 'Platinum' ? 'bg-indigo-950 border-indigo-500/30 text-indigo-400' :
                            item.vipLevel === 'Gold' ? 'bg-yellow-950 border-yellow-500/30 text-yellow-400' :
                            item.vipLevel === 'Silver' ? 'bg-slate-950 border-slate-500/30 text-slate-300' :
                            'bg-orange-950 border-orange-950/40 text-orange-400'
                          }`}>
                            {item.vipLevel || 'Bronze'}
                          </span>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-500">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editBalance}
                              onChange={(e) => setEditBalance(e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs focus:outline-none text-slate-100 font-bold"
                            />
                          </div>
                        ) : (
                          <span className="text-emerald-400">R$ {item.balance.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Total Withdrawn */}
                      <td className="py-3.5 px-4 font-mono text-purple-400 font-semibold">
                        R$ {item.totalWithdrawn?.toFixed(2) || '0.00'}
                      </td>

                      {/* Active Investments list count */}
                      <td className="py-3.5 px-4 text-slate-450 font-bold">
                        {item.activeInvestments?.length || 0} pac. ativos
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => saveEdit(item)}
                              className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 cursor-pointer active:scale-95 transition-all"
                              title="Salvar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingUserPhone(null)}
                              className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 cursor-pointer active:scale-95 transition-all"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 cursor-pointer active:scale-95 transition-all"
                              title="Editar Usuário"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.phone)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-450 cursor-pointer active:scale-95 transition-all"
                              title="Deletar Usuário"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
