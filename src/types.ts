export interface ActiveInvestment {
  id: string;
  packageId: string;
  name: string;
  dailyProfit: number;
  totalProfit: number;
  validityDays: number;
  price: number;
  image: string;
  boughtAt: number; // timestamp
  accumulated: number; // accumulated earnings
}

export interface InvestmentPackage {
  id: string;
  name: string;
  dailyProfit: number;
  totalProfit: number;
  validityDays: number;
  price: number;
  image: string;
}

export interface TransactionRecord {
  id: string;
  type: 'recharge' | 'withdraw' | 'investment' | 'checkin' | 'reward';
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  description: string;
}

export interface UserState {
  uid: string;
  phone: string;
  isLoggedIn: boolean;
  balance: number; // available balance in USDT
  jobDeposit: number; // passive capital or "job deposit"
  totalWithdrawn: number; // sum of successful withdrawals
  vipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  checkedInToday: boolean;
  rechargeRecords: TransactionRecord[];
  withdrawRecords: TransactionRecord[];
  activeInvestments: ActiveInvestment[];
  passwordHash: string;
  referredBy?: string;
  createdAt?: number;
}
