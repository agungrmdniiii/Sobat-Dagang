/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Role } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: 'BRG001', name: 'Beras Premium 5kg', category: 'Beras', buyPrice: 65000, sellPrice: 75000, stock: 20, minStock: 5, unit: 'karung' },
  { id: '2', code: 'BRG002', name: 'Minyak Goreng 1L', category: 'Minyak', buyPrice: 14000, sellPrice: 16500, stock: 48, minStock: 10, unit: 'botol' },
  { id: '3', code: 'BRG003', name: 'Gula Pasir 1kg', category: 'Gula', buyPrice: 13500, sellPrice: 15500, stock: 30, minStock: 5, unit: 'pcs' },
  { id: '4', code: 'BRG004', name: 'Indomie Goreng', category: 'Mie Instan', buyPrice: 2800, sellPrice: 3500, stock: 120, minStock: 20, unit: 'pcs' },
  { id: '5', code: 'BRG005', name: 'Indomie Soto', category: 'Mie Instan', buyPrice: 2800, sellPrice: 3500, stock: 100, minStock: 20, unit: 'pcs' },
  { id: '6', code: 'BRG006', name: 'Kopi Kapal Api 165g', category: 'Kopi', buyPrice: 12000, sellPrice: 14500, stock: 25, minStock: 5, unit: 'pcs' },
  { id: '7', code: 'BRG007', name: 'Teh Botol Sosro 450ml', category: 'Minuman', buyPrice: 4500, sellPrice: 6000, stock: 24, minStock: 6, unit: 'botol' },
  { id: '8', code: 'BRG008', name: 'Aqua 600ml', category: 'Minuman', buyPrice: 2500, sellPrice: 3500, stock: 48, minStock: 12, unit: 'botol' },
  { id: '9', code: 'BRG009', name: 'Susu Indomilk Cokelat', category: 'Susu', buyPrice: 5000, sellPrice: 6500, stock: 15, minStock: 5, unit: 'kotak' },
  { id: '10', code: 'BRG010', name: 'Sabun Lifebuoy Merah', category: 'Sabun', buyPrice: 4000, sellPrice: 5500, stock: 40, minStock: 10, unit: 'pcs' },
  { id: '11', code: 'BRG011', name: 'Rinso Bubuk 770g', category: 'Deterjen', buyPrice: 22000, sellPrice: 26000, stock: 12, minStock: 4, unit: 'pcs' },
  { id: '12', code: 'BRG012', name: 'Pepsodent 190g', category: 'Pasta Gigi', buyPrice: 11000, sellPrice: 13500, stock: 20, minStock: 5, unit: 'pcs' },
  { id: '13', code: 'BRG013', name: 'Telor Ayam 1kg', category: 'Sembako', buyPrice: 24000, sellPrice: 28000, stock: 15, minStock: 5, unit: 'kg' },
  { id: '14', code: 'BRG014', name: 'Tepung Segitiga Biru', category: 'Tepung', buyPrice: 11000, sellPrice: 13000, stock: 10, minStock: 5, unit: 'kg' },
  { id: '15', code: 'BRG015', name: 'Kecap Bango 550ml', category: 'Bumbu', buyPrice: 21000, sellPrice: 24500, stock: 8, minStock: 3, unit: 'pouch' },
];

export const CATEGORIES = [
  'Beras', 'Minyak', 'Gula', 'Mie Instan', 'Kopi', 'Minuman', 'Susu', 'Sabun', 'Deterjen', 'Pasta Gigi', 'Sembako', 'Tepung', 'Bumbu'
];

export const USERS = [
  { id: 'u1', username: 'admin', password: 'admin123', role: Role.ADMIN },
  { id: 'u2', username: 'kasir', password: 'kasir123', role: Role.KASIR },
];
