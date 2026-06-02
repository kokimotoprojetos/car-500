import { InvestmentPackage } from './types';

export const CAR_PACKAGES: InvestmentPackage[] = [
  {
    id: 'car_1',
    name: '500Car VIP 1',
    dailyProfit: 11.00,
    totalProfit: 990.00,
    validityDays: 90,
    price: 50.00,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600' // Dark hypercar with cyan glow
  },
  {
    id: 'car_2',
    name: '500Car VIP 2',
    dailyProfit: 22.00,
    totalProfit: 1980.00,
    validityDays: 90,
    price: 100.00,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600' // McLaren orange supercar
  },
  {
    id: 'car_3',
    name: '500Car VIP 3',
    dailyProfit: 66.00,
    totalProfit: 5940.00,
    validityDays: 90,
    price: 300.00,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600' // Sleek metallic gray Porsche
  },
  {
    id: 'car_4',
    name: '500Car VIP 4',
    dailyProfit: 140.00,
    totalProfit: 12600.00,
    validityDays: 90,
    price: 600.00,
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=600' // Red Ferrari supercar
  },
  {
    id: 'car_5',
    name: '500Car VIP 5',
    dailyProfit: 300.00,
    totalProfit: 27000.00,
    validityDays: 90,
    price: 1200.00,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600' // High-end black matte hypercar
  }
];

export interface RouletteItem {
  name: string;
  type: 'money' | 'car' | 'badge';
  value: number; // in USDT or PKR
  label: string;
  color: string;
}

export const ROULETTE_SECTORS: RouletteItem[] = [
  { name: '3000-3100PKR', type: 'money', value: 12.00, label: '3000-3100 PKR', color: '#1E293B' },
  { name: 'Honda Civic', type: 'car', value: 50.00, label: 'Honda Civic (Bonus)', color: '#0F172A' },
  { name: '3777PKR', type: 'money', value: 15.00, label: '3777 PKR', color: '#0284C7' },
  { name: 'Redmi 14C', type: 'badge', value: 25.00, label: 'Redmi 14C', color: '#0EA5E9' },
  { name: '1900-2000PKR', type: 'money', value: 8.00, label: '1900-2000 PKR', color: '#0369A1' },
  { name: '500-600PKR', type: 'money', value: 2.50, label: '500-600 PKR', color: '#075985' },
  { name: 'iPhone 13pro', type: 'car', value: 100.00, label: 'iPhone 13 Pro', color: '#0284C7' },
  { name: 'Tente de Novo', type: 'money', value: 0.50, label: '50 PKR (Bonus)', color: '#334155' }
];
