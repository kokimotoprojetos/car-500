import { createClient } from '@supabase/supabase-js';
import { UserState } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://blhyqcwekzgbycurkiwm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YyaTi7ZC4K-upfp3DtltGg_85bKKgQR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hashes a password string using SHA-256 via SubtleCrypto.
 * Returns a hex string. Stored passwords will never be plain text.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_500car_2026'); // salt prefix
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks whether a stored password hash represents a plain-text legacy password.
 * (Less than 60 chars means it's not a SHA-256 hex hash and is likely plain text.)
 */
export function isLegacyPassword(hash: string): boolean {
  return hash.length < 60;
}

/**
 * Maps frontend UserState camelCase to database snake_case
 */
function mapUserToDb(user: UserState) {
  return {
    phone: user.phone,
    uid: user.uid,
    balance: user.balance,
    job_deposit: user.jobDeposit,
    total_withdrawn: user.totalWithdrawn,
    vip_level: user.vipLevel,
    checked_in_today: user.checkedInToday,
    recharge_records: JSON.stringify(user.rechargeRecords),
    withdraw_records: JSON.stringify(user.withdrawRecords),
    active_investments: JSON.stringify(user.activeInvestments),
    password_hash: user.passwordHash,
    referred_by: user.referredBy || '',
    created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Maps database snake_case to frontend UserState
 */
function mapDbToUser(dbUser: any): UserState {
  return {
    uid: dbUser.uid,
    phone: dbUser.phone,
    isLoggedIn: true,
    balance: parseFloat(dbUser.balance),
    jobDeposit: parseFloat(dbUser.job_deposit || 0),
    totalWithdrawn: parseFloat(dbUser.total_withdrawn || 0),
    vipLevel: dbUser.vip_level || 'Bronze',
    checkedInToday: !!dbUser.checked_in_today,
    rechargeRecords: typeof dbUser.recharge_records === 'string' 
      ? JSON.parse(dbUser.recharge_records) 
      : (dbUser.recharge_records || []),
    withdrawRecords: typeof dbUser.withdraw_records === 'string' 
      ? JSON.parse(dbUser.withdraw_records) 
      : (dbUser.withdraw_records || []),
    activeInvestments: typeof dbUser.active_investments === 'string' 
      ? JSON.parse(dbUser.active_investments) 
      : (dbUser.active_investments || []),
    passwordHash: dbUser.password_hash,
    referredBy: dbUser.referred_by || undefined,
    createdAt: dbUser.created_at ? new Date(dbUser.created_at).getTime() : undefined
  };
}

/**
 * Saves or updates a user profile on Supabase
 */
export async function saveUserToSupabase(user: UserState): Promise<boolean> {
  try {
    const payload = mapUserToDb(user);
    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'phone' });

    if (error) {
      console.error('Error saving user to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to sync user with Supabase:', err);
    return false;
  }
}

/**
 * Retrieves a user profile from Supabase by phone number
 */
export async function getUserFromSupabase(phone: string): Promise<UserState | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return null;
    }
    return mapDbToUser(data);
  } catch (err) {
    console.error('Failed to retrieve user from Supabase:', err);
    return null;
  }
}

/**
 * Retrieves all users registered using a specific invite code (referred_by)
 */
export async function getReferredUsersFromSupabase(inviteCode: string): Promise<{ phone: string; vipLevel: string; date: string }[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('phone, vip_level, created_at')
      .eq('referred_by', inviteCode);

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      phone: item.phone,
      vipLevel: item.vip_level || 'Bronze',
      date: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
    }));
  } catch (err) {
    console.error('Failed to retrieve referred users from Supabase:', err);
    return [];
  }
}

/**
 * Retrieves all registered users from Supabase (for admin panel)
 */
export async function getAllUsersFromSupabase(): Promise<UserState[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(mapDbToUser);
  } catch (err) {
    console.error('Failed to retrieve all users from Supabase:', err);
    return [];
  }
}

/**
 * Deletes a user profile from Supabase by phone (which stores email)
 */
export async function deleteUserFromSupabase(phone: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('phone', phone);

    if (error) {
      console.error('Error deleting user from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete user from Supabase:', err);
    return false;
  }
}
