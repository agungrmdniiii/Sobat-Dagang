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
  name?: string;
  username: string;
  role: Role;
  isActive?: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string;
  passwordHash: string;
  mustChangePassword?: boolean;
  createdAt: string;
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
  notes?: string;
  itemDiscount?: number;
}

export interface HeldCart {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  customerNote?: string;
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
