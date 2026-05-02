/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  ADMIN = 'ADMIN',
  KASIR = 'KASIR',
}

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  received: number;
  change: number;
  paymentMethod: PaymentMethod;
  userId: string;
  userName: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  totalProducts: number;
  lowStockCount: number;
  transactionsToday: number;
}
