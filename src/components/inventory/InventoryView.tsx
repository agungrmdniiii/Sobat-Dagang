import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown, 
  Filter, 
  LayoutList, 
  LayoutGrid, 
  UploadCloud, 
  Image as ImageIcon, 
  Clock, 
  History, 
  DollarSign, 
  ShoppingBag, 
  RotateCcw,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  Tag,
  ExternalLink,
  Download,
  AlertCircle,
  HelpCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Product, Transaction } from '../../types';
import { CATEGORIES } from '../../constants';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';
import { Card, Button, Badge, Modal, ConfirmDialog, Drawer } from '../ui';
import { useDebounce, useHotkeys } from '../../hooks';
import { ContextHelp } from '../../features/onboarding';

export type StockFilterTab = 'all' | 'safe' | 'low' | 'out';
export type ViewMode = 'table' | 'cards';
export type SortField = 'code' | 'name' | 'category' | 'buyPrice' | 'sellPrice' | 'stock';
export type SortOrder = 'asc' | 'desc';

export interface InventoryViewProps {
  products: Product[];
  transactions: Transaction[];
  initialStockTab?: StockFilterTab;
  initialEditProductId?: string | null;
  onClearInitialEditProductId?: () => void;
  onSaveProduct: (product: Product, isEdit: boolean) => void;
  onDeleteProduct: (id: string) => void;
  onBatchDeleteProducts: (ids: string[]) => void;
  onBatchUpdateCategory: (ids: string[], newCategory: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  onRestoreProducts: (restored: Product[]) => void;
  showToast: (message: string, type?: 'success' | 'error', action?: { label: string; onClick: () => void }) => void;
}

// Helper kompresi gambar max ~200KB via Canvas
const compressImageToMax200KB = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 520;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.72;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 260000 && quality > 0.25) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const generateBarcode = () => {
  const prefix = "SKU";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 899);
  return `${prefix}-${timestamp}${random}`;
};

// Helper highlight match
const highlightMatch = (text: string, query: string) => {
  if (!query || !query.trim()) return text;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow/90 text-ink rounded-xs px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  transactions,
  initialStockTab = 'all',
  initialEditProductId,
  onClearInitialEditProductId,
  onSaveProduct,
  onDeleteProduct,
  onBatchDeleteProducts,
  onBatchUpdateCategory,
  onUpdateStock,
  onRestoreProducts,
  showToast,
}) => {
  // 1. Loading Simulation / Skeleton State
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 240);
    return () => clearTimeout(timer);
  }, []);

  // 2. Toolbar & Filtering States
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 150);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [stockTab, setStockTab] = useState<StockFilterTab>(initialStockTab);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    if (initialStockTab) {
      setStockTab(initialStockTab);
    }
  }, [initialStockTab]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [categoryDropdownOpen]);

  // 3. Sorting States
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination for large dataset (> 50 rows)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // 4. Selection (Batch Actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false);
  const [newBatchCategory, setNewBatchCategory] = useState(CATEGORIES[0]);
  const [confirmBatchDeleteOpen, setConfirmBatchDeleteOpen] = useState(false);

  // 5. Drawer Detail State
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // 6. Inline Stock Editing State
  const [inlineStockId, setInlineStockId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<number>(0);

  // 7. Form Modal/Drawer State (Tambah / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmCloseFormOpen, setConfirmCloseFormOpen] = useState(false);

  const [formValues, setFormValues] = useState<{
    code: string;
    name: string;
    category: string;
    unit: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
    image?: string;
  }>({
    code: '',
    name: '',
    category: CATEGORIES[0],
    unit: 'pcs',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
  });

  const [formErrors, setFormErrors] = useState<{
    code?: string;
    name?: string;
    buyPrice?: string;
    sellPrice?: string;
    stock?: string;
    minStock?: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // 8. Hitungan jumlah per tab status stok & summary chips
  const stockCounts = useMemo(() => {
    let safeCount = 0;
    let lowCount = 0;
    let outCount = 0;
    products.forEach(p => {
      if (p.stock === 0) outCount++;
      else if (p.stock <= p.minStock) lowCount++;
      else safeCount++;
    });
    return {
      all: products.length,
      safe: safeCount,
      low: lowCount,
      out: outCount,
    };
  }, [products]);

  // Check localStorage size on mount or image update
  const checkStorageQuota = () => {
    try {
      let total = 0;
      for (const x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length * 2);
        }
      }
      // total bytes in MB
      const totalMB = total / (1024 * 1024);
      if (totalMB > 4.0) {
        setStorageWarning(`Penyimpanan browser hampir penuh (${totalMB.toFixed(1)}MB / ~5MB). Hindari unggah foto resolusi tinggi.`);
      } else {
        setStorageWarning(null);
      }
    } catch {
      // ignore
    }
  };

  // Keyboard Shortcuts
  // 'N' -> Buka Tambah Produk (when not inside inputs)
  useHotkeys('n', () => {
    if (!formModalOpen && !detailProduct) {
      handleOpenAddModal();
    }
  });

  // '/' -> Fokus Pencarian
  useHotkeys('/', (e) => {
    if (!formModalOpen && !detailProduct) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  });

  // Filter & Sort Data Produk
  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      // Live Debounced Search
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q);
      
      // Category
      const matchCat = !categoryFilter || p.category === categoryFilter;

      // Tab Status
      let matchTab = true;
      if (stockTab === 'safe') {
        matchTab = p.stock > p.minStock;
      } else if (stockTab === 'low') {
        matchTab = p.stock > 0 && p.stock <= p.minStock;
      } else if (stockTab === 'out') {
        matchTab = p.stock === 0;
      }

      return matchSearch && matchCat && matchTab;
    });

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, debouncedSearch, categoryFilter, stockTab, sortField, sortOrder]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, stockTab]);

  // Paged slice if list is large (> 50)
  const paginatedProducts = useMemo(() => {
    if (filteredAndSortedProducts.length <= pageSize) {
      return filteredAndSortedProducts;
    }
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedProducts.slice(start, start + pageSize);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize);

  // Handler Sort Klik Header
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Helper Riwayat Perubahan Stok dari Transaksi
  const getProductStockHistory = (productId: string, productName: string) => {
    const list: { date: string; invoice: string; qty: number; user: string }[] = [];
    transactions.forEach(t => {
      t.items.forEach(it => {
        if (it.id === productId || it.name === productName) {
          list.push({
            date: t.date,
            invoice: t.id.split('-')[1] || t.id,
            qty: it.quantity,
            user: t.userName,
          });
        }
      });
    });
    return list.slice(0, 10);
  };

  // Buka Modal Tambah Produk Baru
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setHasUnsavedChanges(false);
    setIsDraftSaved(false);
    checkStorageQuota();

    // Check draft in localStorage if exists
    try {
      const savedDraft = localStorage.getItem('sobatdagang_product_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormValues(parsed);
        setIsDraftSaved(true);
        setFormErrors({});
        setTouchedFields({});
        setFormModalOpen(true);
        return;
      }
    } catch {
      // ignore
    }

    setFormValues({
      code: generateBarcode(),
      name: '',
      category: CATEGORIES[0],
      unit: 'pcs',
      buyPrice: 0,
      sellPrice: 0,
      stock: 10,
      minStock: 5,
      image: undefined,
    });
    setFormErrors({});
    setTouchedFields({});
    setFormModalOpen(true);
  };

  // Buka Modal Edit Produk
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setHasUnsavedChanges(false);
    setIsDraftSaved(false);
    checkStorageQuota();
    setFormValues({
      code: p.code,
      name: p.name,
      category: p.category,
      unit: p.unit,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStock: p.minStock,
      image: p.image,
    });
    setFormErrors({});
    setTouchedFields({});
    setFormModalOpen(true);
  };

  // Auto open edit modal if initialEditProductId passed from Dashboard
  useEffect(() => {
    if (initialEditProductId) {
      const p = products.find(prod => prod.id === initialEditProductId);
      if (p) {
        handleOpenEditModal(p);
      }
      onClearInitialEditProductId?.();
    }
  }, [initialEditProductId, products]);

  // Validasi Form Inline
  const validateField = (field: string, val: any) => {
    const errors = { ...formErrors };

    if (field === 'name') {
      if (!val || !val.toString().trim()) {
        errors.name = 'Nama produk wajib diisi';
      } else {
        delete errors.name;
      }
    }

    if (field === 'code') {
      const codeStr = (val || '').toString().trim();
      if (!codeStr) {
        errors.code = 'Kode SKU wajib diisi';
      } else {
        // Cek duplikasi dengan produk lain
        const duplicate = products.find(p => 
          p.code.toLowerCase() === codeStr.toLowerCase() && 
          p.id !== editingProduct?.id
        );
        if (duplicate) {
          errors.code = `Kode SKU sudah digunakan (${duplicate.name})`;
        } else {
          delete errors.code;
        }
      }
    }

    if (field === 'sellPrice') {
      const num = Number(val);
      if (isNaN(num) || num <= 0) {
        errors.sellPrice = 'Harga jual harus lebih besar dari Rp 0';
      } else {
        delete errors.sellPrice;
      }
    }

    if (field === 'buyPrice') {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        errors.buyPrice = 'Harga modal tidak boleh negatif';
      } else {
        delete errors.buyPrice;
      }
    }

    if (field === 'stock') {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        errors.stock = 'Stok tidak boleh negatif';
      } else {
        delete errors.stock;
      }
    }

    if (field === 'minStock') {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        errors.minStock = 'Batas minimum tidak boleh negatif';
      } else {
        delete errors.minStock;
      }
    }

    setFormErrors(errors);
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, (formValues as any)[field]);
  };

  // Autosave Draft
  useEffect(() => {
    if (!formModalOpen || editingProduct) return;
    const timer = setTimeout(() => {
      try {
        if (formValues.name || formValues.sellPrice > 0) {
          localStorage.setItem('sobatdagang_product_draft', JSON.stringify(formValues));
          setIsDraftSaved(true);
        }
      } catch {
        // ignore
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formValues, formModalOpen, editingProduct]);

  const isFormValid = useMemo(() => {
    if (!formValues.name.trim()) return false;
    if (!formValues.code.trim()) return false;
    if (formValues.sellPrice <= 0) return false;
    if (formValues.buyPrice < 0) return false;
    if (formValues.stock < 0) return false;
    if (formValues.minStock < 0) return false;

    // Check duplicate code
    const duplicate = products.find(p => 
      p.code.toLowerCase() === formValues.code.toLowerCase().trim() && 
      p.id !== editingProduct?.id
    );
    if (duplicate) return false;

    return Object.keys(formErrors).length === 0;
  }, [formValues, formErrors, products, editingProduct]);

  // Simpan Form Produk
  const handleSaveProductSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        code: formValues.code.trim(),
        name: formValues.name.trim(),
        category: formValues.category,
        unit: formValues.unit.trim() || 'pcs',
        buyPrice: Number(formValues.buyPrice),
        sellPrice: Number(formValues.sellPrice),
        stock: Number(formValues.stock),
        minStock: Number(formValues.minStock),
        image: formValues.image,
      };
      onSaveProduct(updated, true);
      if (detailProduct?.id === updated.id) {
        setDetailProduct(updated);
      }
      showToast(`Produk "${updated.name}" berhasil diperbarui`, 'success');
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        code: formValues.code.trim() || generateBarcode(),
        name: formValues.name.trim(),
        category: formValues.category,
        unit: formValues.unit.trim() || 'pcs',
        buyPrice: Number(formValues.buyPrice) || 0,
        sellPrice: Number(formValues.sellPrice) || 0,
        stock: Number(formValues.stock) || 0,
        minStock: Number(formValues.minStock) || 5,
        image: formValues.image,
      };
      onSaveProduct(newProduct, false);
      localStorage.removeItem('sobatdagang_product_draft');
      showToast(`Produk "${newProduct.name}" berhasil ditambahkan`, 'success');
    }

    setFormModalOpen(false);
    setHasUnsavedChanges(false);
  };

  // Keyboard Ctrl+Enter untuk simpan form & Esc untuk tutup
  useEffect(() => {
    if (!formModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isFormValid) handleSaveProductSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestCloseForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formModalOpen, isFormValid, hasUnsavedChanges, formValues]);

  const handleRequestCloseForm = useCallback(() => {
    if (hasUnsavedChanges) {
      setConfirmCloseFormOpen(true);
    } else {
      setFormModalOpen(false);
    }
  }, [hasUnsavedChanges]);

  // Upload Gambar File Handler
  const handleImageFile = async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        showToast('Hanya file gambar (JPG, PNG, WebP) yang didukung', 'error');
        return;
      }
      const compressedDataUrl = await compressImageToMax200KB(file);
      setFormValues(prev => ({ ...prev, image: compressedDataUrl }));
      setHasUnsavedChanges(true);
      checkStorageQuota();
      showToast('Foto produk berhasil dikompresi & dimuat', 'success');
    } catch {
      showToast('Gagal memproses gambar', 'error');
    }
  };

  // Hapus Produk Tunggal dengan Toast Undo 5 Detik
  const handleDeleteSingleProduct = (product: Product) => {
    onDeleteProduct(product.id);
    if (detailProduct?.id === product.id) {
      setDetailProduct(null);
    }
    showToast(
      `Produk "${product.name}" berhasil dihapus`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          onRestoreProducts([product]);
          showToast(`Produk "${product.name}" dipulihkan`, 'success');
        },
      }
    );
  };

  // Hapus Massal dengan Toast Undo 5 Detik
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const toDelete = products.filter(p => selectedIds.includes(p.id));
    onBatchDeleteProducts(selectedIds);
    setSelectedIds([]);
    setConfirmBatchDeleteOpen(false);

    showToast(
      `${toDelete.length} produk berhasil dihapus`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          onRestoreProducts(toDelete);
          showToast(`${toDelete.length} produk berhasil dipulihkan`, 'success');
        },
      }
    );
  };

  // Ubah Kategori Massal dengan Toast Undo 5 Detik
  const handleBatchUpdateCategoryConfirm = () => {
    if (selectedIds.length === 0) return;
    const originalProducts = products.filter(p => selectedIds.includes(p.id));
    onBatchUpdateCategory(selectedIds, newBatchCategory);
    setBatchCategoryModalOpen(false);
    setSelectedIds([]);

    showToast(
      `${originalProducts.length} produk diubah ke kategori "${newBatchCategory}"`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          onRestoreProducts(originalProducts);
          showToast('Perubahan kategori dibatalkan', 'success');
        },
      }
    );
  };

  // Update Stok Cepat Inline & Stepper
  const handleStepStock = (product: Product, delta: number) => {
    const originalStock = product.stock;
    const updatedStock = Math.max(0, product.stock + delta);
    onUpdateStock(product.id, updatedStock);
    if (detailProduct?.id === product.id) {
      setDetailProduct({ ...detailProduct, stock: updatedStock });
    }
    showToast(
      `Stok "${product.name}" diperbarui: ${updatedStock} ${product.unit}`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          onUpdateStock(product.id, originalStock);
          if (detailProduct?.id === product.id) {
            setDetailProduct({ ...detailProduct, stock: originalStock });
          }
          showToast(`Stok "${product.name}" dikembalikan ke ${originalStock} ${product.unit}`, 'success');
        }
      }
    );
  };

  const handleSaveInlineStock = (product: Product) => {
    const originalStock = product.stock;
    const val = Math.max(0, Number(inlineStockVal) || 0);
    onUpdateStock(product.id, val);
    if (detailProduct?.id === product.id) {
      setDetailProduct({ ...detailProduct, stock: val });
    }
    setInlineStockId(null);
    showToast(
      `Stok "${product.name}" diperbarui: ${val} ${product.unit}`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          onUpdateStock(product.id, originalStock);
          if (detailProduct?.id === product.id) {
            setDetailProduct({ ...detailProduct, stock: originalStock });
          }
          showToast(`Stok "${product.name}" dikembalikan ke ${originalStock} ${product.unit}`, 'success');
        }
      }
    );
  };

  // Toggle Pilih Semua
  const allCurrentIds = paginatedProducts.map(p => p.id);
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every(id => selectedIds.includes(id));
  const isSomeSelected = allCurrentIds.some(id => selectedIds.includes(id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allCurrentIds])));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Reset Semua Filter
  const handleResetFilters = () => {
    setSearchInput('');
    setCategoryFilter('');
    setStockTab('all');
  };

  // Ekspor CSV Katalog Terfilter
  const handleExportCSV = () => {
    if (filteredAndSortedProducts.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = ['Kode SKU', 'Nama Produk', 'Kategori', 'Satuan', 'Harga Beli (Modal)', 'Harga Jual', 'Stok Saat Ini', 'Batas Min Restok', 'Status Stok'];
    const rows = filteredAndSortedProducts.map(p => {
      const statusText = p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Hampir Habis' : 'Aman';
      return [
        `"${p.code}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.unit}"`,
        p.buyPrice,
        p.sellPrice,
        p.stock,
        p.minStock,
        `"${statusText}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventori-sobatdagang-${stockTab}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Berhasil mengekspor ${filteredAndSortedProducts.length} produk ke CSV`, 'success');
  };

  // Filtered categories for category dropdown search
  const filteredCategoryList = useMemo(() => {
    const q = categorySearchQuery.toLowerCase().trim();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(c => c.toLowerCase().includes(q));
  }, [categorySearchQuery]);

  return (
    <div className="space-y-4 relative select-none">
      {/* ========================================================== */}
      {/* 1. HEADER & RINGKASAN: Judul, Total Produk, Tombol Tambah, */}
      {/*    serta 3 Chip Filter (Total SKU, Stok Menipis, Habis)    */}
      {/* ========================================================== */}
      <div className="bg-surface border border-ink/15 rounded-[24px] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Inventori & Stok Barang
            </h2>
            <span className="bg-ink text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {products.length} SKU
            </span>
          </div>
          <p className="text-[13px] text-muted font-medium mt-0.5">
            Kelola persediaan fisik, pantau batas restok minimum, dan katalog sembako toko.
          </p>

          {/* 3 Chip Ringkasan Cepat Interaktif */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-ink/10">
            {/* Chip 1: Total SKU */}
            <button
              type="button"
              onClick={() => setStockTab('all')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                stockTab === 'all' 
                  ? "bg-ink text-white border-ink ring-2 ring-ink/20" 
                  : "bg-bg text-muted border-ink/15 hover:text-ink hover:border-ink/40"
              )}
            >
              <Package size={13} />
              <span>Semua SKU</span>
              <span className={cn("text-[11px] font-bold px-1.5 py-0.2 rounded-full", stockTab === 'all' ? "bg-white/20 text-white" : "bg-ink/10 text-ink")}>
                {stockCounts.all}
              </span>
            </button>

            {/* Chip 2: Stok Menipis */}
            <button
              type="button"
              onClick={() => setStockTab('low')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                stockTab === 'low' 
                  ? "bg-[#e5a93c] text-white border-[#e5a93c] ring-2 ring-[#e5a93c]/30" 
                  : "bg-[#F5D76E]/30 text-[#856404] border-[#F5D76E]/60 hover:bg-[#F5D76E]/50"
              )}
            >
              <AlertTriangle size={13} />
              <span>Stok Menipis</span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-white/30 text-ink">
                {stockCounts.low}
              </span>
            </button>

            {/* Chip 3: Habis */}
            <button
              type="button"
              onClick={() => setStockTab('out')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                stockTab === 'out' 
                  ? "bg-[#9e1c50] text-white border-[#9e1c50] ring-2 ring-[#9e1c50]/30" 
                  : "bg-[#F4B6D2]/35 text-[#9e1c50] border-[#F4B6D2]/70 hover:bg-[#F4B6D2]/50"
              )}
            >
              <AlertCircle size={13} />
              <span>Stok Habis</span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-white/30 text-ink">
                {stockCounts.out}
              </span>
            </button>
          </div>
        </div>

        {/* Tombol Tambah Produk Pill Hitam Pintasan N */}
        <div className="w-full md:w-auto shrink-0 flex items-center gap-2">
          <Button
            data-tour="inventory-add-button"
            onClick={handleOpenAddModal}
            className="w-full md:w-auto py-2.5 px-5 text-xs font-bold rounded-full flex items-center justify-center gap-2 shadow-xs group"
          >
            <Plus size={15} />
            <span>Tambah Produk</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold text-white/80 bg-white/20 rounded-md select-none ml-1">
              N
            </kbd>
          </Button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. TOOLBAR: Pencarian, Filter Kategori, Tab Status,         */}
      {/*    Toggle Tampilan, dan Ekspor CSV                         */}
      {/* ========================================================== */}
      <div className="bg-surface border border-ink/15 rounded-[22px] p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Sisi Kiri: Pencarian Live dengan debounce 150ms & shortcut "/" */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari nama barang atau kode SKU... (Tekan '/')"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-14 py-2 text-xs font-medium rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink placeholder:text-muted transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    searchInputRef.current?.focus();
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold text-muted bg-surface border border-ink/15 rounded-md select-none">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Tab Status (Semua, Aman, Menipis, Habis) */}
          <div className="p-1 bg-bg border border-ink/15 rounded-full flex items-center relative self-start lg:self-auto overflow-x-auto max-w-full">
            {(
              [
                { id: 'all' as const, label: 'Semua', count: stockCounts.all },
                { id: 'safe' as const, label: 'Aman', count: stockCounts.safe },
                { id: 'low' as const, label: 'Menipis', count: stockCounts.low },
                { id: 'out' as const, label: 'Habis', count: stockCounts.out },
              ]
            ).map(tab => {
              const active = stockTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStockTab(tab.id)}
                  className={cn(
                    "relative px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer z-10 flex items-center gap-1.5 shrink-0",
                    active ? "text-white" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="inventoryMainTabPill"
                      className="absolute inset-0 bg-ink rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>{tab.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums",
                    active ? "bg-white/20 text-white" : "bg-ink/10 text-muted"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Baris Kedua Toolbar: Dropdown Kategori Berpencarian, Toggle Tabel/Kartu, & Tombol Ekspor CSV */}
        <div className="pt-2 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Dropdown Kategori dengan Pencarian Internal */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 cursor-pointer transition-colors",
                categoryFilter 
                  ? "bg-ink text-white border-ink" 
                  : "bg-bg text-ink border-ink/15 hover:border-ink"
              )}
            >
              <Filter size={13} />
              <span>{categoryFilter ? `Kategori: ${categoryFilter}` : 'Semua Kategori'}</span>
              <ChevronDown size={13} className={cn("transition-transform", categoryDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {categoryDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 w-64 bg-surface border border-ink/20 rounded-[20px] shadow-xl p-2 z-40"
                >
                  {/* Pencarian Kategori */}
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Cari kategori..."
                      value={categorySearchQuery}
                      onChange={e => setCategorySearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs rounded-full bg-bg border border-ink/15 text-ink focus:outline-none focus:border-ink placeholder:text-muted"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter('');
                        setCategoryDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-full text-xs font-medium flex items-center justify-between cursor-pointer",
                        !categoryFilter ? "bg-ink text-white font-semibold" : "hover:bg-bg text-ink"
                      )}
                    >
                      <span>Semua Kategori</span>
                      <span className="text-[10px] opacity-70">({products.length})</span>
                    </button>

                    {filteredCategoryList.map(cat => {
                      const count = products.filter(p => p.category === cat).length;
                      const active = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat);
                            setCategoryDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded-full text-xs font-medium flex items-center justify-between cursor-pointer",
                            active ? "bg-ink text-white font-semibold" : "hover:bg-bg text-ink"
                          )}
                        >
                          <span className="truncate">{cat}</span>
                          <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Tabel/Kartu & Ekspor CSV */}
          <div className="flex items-center gap-2">
            {/* Toggle Tampilan Tabel / Kartu */}
            <div className="p-0.5 bg-bg border border-ink/15 rounded-full flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-1.5 rounded-full transition-colors cursor-pointer",
                  viewMode === 'table' ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
                title="Tampilan Tabel"
              >
                <LayoutList size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  "p-1.5 rounded-full transition-colors cursor-pointer",
                  viewMode === 'cards' ? "bg-ink text-white" : "text-muted hover:text-ink"
                )}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Tombol Ekspor CSV */}
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              className="py-1.5 px-3.5 text-xs font-semibold rounded-full flex items-center gap-1.5 border-ink/20 hover:border-ink"
              title="Unduh data terfilter ke format CSV"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </Button>
          </div>

        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. KONTEN TABEL / KARTU / EMPTY STATE                      */}
      {/* ========================================================== */}
      {isLoading ? (
        /* SKELETON SHIMMER ROW */
        <div className="bg-surface rounded-[24px] border border-ink/15 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div 
              key={idx} 
              className="h-14 bg-bg rounded-[16px] animate-pulse border border-ink/10 flex items-center px-4 justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-ink/10" />
                <div className="space-y-1.5">
                  <div className="w-36 h-3.5 bg-ink/10 rounded" />
                  <div className="w-20 h-2.5 bg-ink/5 rounded" />
                </div>
              </div>
              <div className="w-24 h-4 bg-ink/10 rounded hidden sm:block" />
              <div className="w-20 h-4 bg-ink/10 rounded" />
              <div className="w-16 h-4 bg-ink/10 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        /* 5. EMPTY STATES */
        products.length === 0 ? (
          <div className="py-16 text-center bg-surface rounded-[24px] border border-ink/15 p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-bg border border-ink/15 flex items-center justify-center text-muted mx-auto mb-2">
              <Package size={28} />
            </div>
            <h4 className="text-base font-bold text-ink">Belum Ada Produk di Inventori</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Katalog produk toko Anda masih kosong. Tambahkan master produk sembako pertama Anda sekarang.
            </p>
            <Button className="py-2.5 px-5 text-xs font-bold rounded-full" onClick={handleOpenAddModal}>
              <Plus size={14} /> Tambah Produk Pertama
            </Button>
          </div>
        ) : (
          <div className="py-16 text-center bg-surface rounded-[24px] border border-ink/15 p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-bg border border-ink/15 flex items-center justify-center text-muted mx-auto mb-2">
              <Filter size={26} />
            </div>
            <h4 className="text-base font-bold text-ink">Tidak Ada Produk yang Sesuai</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Tidak ada produk yang cocok dengan kata kunci pencarian, filter kategori, atau tab status stok yang dipilih.
            </p>
            <Button variant="secondary" className="py-2 px-4 text-xs font-semibold rounded-full" onClick={handleResetFilters}>
              Hapus Filter & Tampilkan Semua
            </Button>
          </div>
        )
      ) : viewMode === 'table' ? (
        /* ======================= TAMPILAN TABEL DESKTOP & RESPONSIVE ======================= */
        <div className="overflow-hidden rounded-[24px] border border-ink/15 bg-surface shadow-xs">
          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
            <table className="w-full text-left text-[13px] text-ink relative">
              {/* Sticky Header dengan animasi rotasi panah sort */}
              <thead className="sticky top-0 bg-[#EAE4D3] border-b border-ink/15 text-muted uppercase text-[11px] font-bold tracking-wider z-20 select-none shadow-xs">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="cursor-pointer text-ink hover:opacity-80 p-0.5"
                      title={isAllSelected ? "Batalkan pilihan" : "Pilih semua"}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={16} className="text-ink" />
                      ) : isSomeSelected ? (
                        <MinusSquare size={16} className="text-ink" />
                      ) : (
                        <Square size={16} className="text-muted" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-12 text-center">Foto</th>
                  <th 
                    className="py-3 px-3 cursor-pointer hover:text-ink transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Produk & SKU</span>
                      <motion.div animate={{ rotate: sortField === 'name' && sortOrder === 'desc' ? 180 : 0 }}>
                        <ArrowUpDown size={12} className={sortField === 'name' ? 'text-ink font-bold' : 'text-muted/50'} />
                      </motion.div>
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 cursor-pointer hover:text-ink transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kategori</span>
                      <motion.div animate={{ rotate: sortField === 'category' && sortOrder === 'desc' ? 180 : 0 }}>
                        <ArrowUpDown size={12} className={sortField === 'category' ? 'text-ink font-bold' : 'text-muted/50'} />
                      </motion.div>
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-right cursor-pointer hover:text-ink transition-colors"
                    onClick={() => handleSort('buyPrice')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Modal</span>
                      <motion.div animate={{ rotate: sortField === 'buyPrice' && sortOrder === 'desc' ? 180 : 0 }}>
                        <ArrowUpDown size={12} className={sortField === 'buyPrice' ? 'text-ink font-bold' : 'text-muted/50'} />
                      </motion.div>
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 text-right cursor-pointer hover:text-ink transition-colors"
                    onClick={() => handleSort('sellPrice')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Harga Jual</span>
                      <motion.div animate={{ rotate: sortField === 'sellPrice' && sortOrder === 'desc' ? 180 : 0 }}>
                        <ArrowUpDown size={12} className={sortField === 'sellPrice' ? 'text-ink font-bold' : 'text-muted/50'} />
                      </motion.div>
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-center cursor-pointer hover:text-ink transition-colors"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Stok & Progres</span>
                      <ContextHelp content="Batas stok minimum menentukan kapan peringatan stok menipis otomatis dimunculkan pada dasbor toko." placement="top" />
                      <motion.div animate={{ rotate: sortField === 'stock' && sortOrder === 'desc' ? 180 : 0 }}>
                        <ArrowUpDown size={12} className={sortField === 'stock' ? 'text-ink font-bold' : 'text-muted/50'} />
                      </motion.div>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedProducts.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  const isEditingInline = inlineStockId === p.id;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock === 0;

                  // Progress bar stok terhadap batas minimum (max 100%)
                  const progressPct = p.minStock > 0 ? Math.min(100, Math.round((p.stock / p.minStock) * 100)) : 100;

                  return (
                    <motion.tr
                      key={p.id}
                      layout
                      transition={{ duration: 0.18 }}
                      onClick={() => setDetailProduct(p)}
                      className={cn(
                        "hover:bg-bg/60 transition-colors duration-150 cursor-pointer group",
                        isSelected && "bg-bg/80"
                      )}
                    >
                      {/* Checkbox Pilihan Baris */}
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectRow(p.id)}
                          className="cursor-pointer text-ink hover:opacity-80 p-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-ink" />
                          ) : (
                            <Square size={16} className="text-muted/60" />
                          )}
                        </button>
                      </td>

                      {/* Foto / Inisial */}
                      <td className="py-3 px-3 text-center">
                        <div className="w-9 h-9 rounded-[10px] bg-bg border border-ink/10 flex items-center justify-center mx-auto overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-[#B7C7F2]/25 text-[#1c3d7a]">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nama + Kode SKU dengan Highlight */}
                      <td className="py-3 px-3">
                        <div className="min-w-0">
                          <span className="font-semibold text-[13px] text-ink block leading-tight truncate max-w-[220px] group-hover:underline">
                            {highlightMatch(p.name, debouncedSearch)}
                          </span>
                          <span className="font-mono text-[11px] text-muted font-bold block mt-0.5">
                            {highlightMatch(p.code, debouncedSearch)} • {p.unit}
                          </span>
                        </div>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="bg-bg text-ink text-xs font-semibold px-2.5 py-0.5 rounded-full border border-ink/10">
                          {highlightMatch(p.category, debouncedSearch)}
                        </span>
                      </td>

                      {/* Modal */}
                      <td className="py-3 px-3 text-right tabular-nums text-muted font-medium text-[13px] whitespace-nowrap">
                        {formatCurrency(p.buyPrice)}
                      </td>

                      {/* Harga Jual */}
                      <td className="py-3 px-3 text-right tabular-nums text-ink font-bold text-[13px] whitespace-nowrap">
                        {formatCurrency(p.sellPrice)}
                      </td>

                      {/* Stok & Stepper Cepat */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex flex-col items-center gap-1">
                          {isEditingInline ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={inlineStockVal}
                                onChange={e => setInlineStockVal(Math.max(0, Number(e.target.value)))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveInlineStock(p);
                                  if (e.key === 'Escape') setInlineStockId(null);
                                }}
                                autoFocus
                                className="w-16 px-1.5 py-0.5 text-xs font-bold text-center border border-ink rounded bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineStock(p)}
                                className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center cursor-pointer"
                                title="Simpan"
                              >
                                <Check size={11} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* Stepper Minus */}
                              <button
                                type="button"
                                onClick={() => handleStepStock(p, -1)}
                                disabled={p.stock <= 0}
                                className="w-5 h-5 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink hover:border-ink disabled:opacity-30 cursor-pointer"
                                title="Kurangi 1 stok"
                              >
                                <Minus size={11} />
                              </button>

                              {/* Klik angka stok untuk inline edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineStockId(p.id);
                                  setInlineStockVal(p.stock);
                                }}
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer",
                                  isOut && "bg-[#F4B6D2]/35 border-[#F4B6D2]/70 text-[#9e1c50]",
                                  isLow && "bg-[#F5D76E]/30 border-[#F5D76E]/60 text-[#856404]",
                                  !isOut && !isLow && "bg-[#8FA866]/30 border-[#8FA866]/60 text-[#354f1c]"
                                )}
                                title="Klik untuk edit angka stok langsung"
                              >
                                {p.stock} {p.unit}
                              </button>

                              {/* Stepper Plus */}
                              <button
                                type="button"
                                onClick={() => handleStepStock(p, 1)}
                                className="w-5 h-5 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink hover:border-ink cursor-pointer"
                                title="Tambah 1 stok"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          )}

                          {/* Progress bar tipis relatif batas minimum */}
                          <div className="w-20 h-1 bg-ink/10 rounded-full overflow-hidden mt-0.5" title={`Batas minimum: ${p.minStock}`}>
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                isOut && "bg-[#9e1c50]",
                                isLow && "bg-[#e5a93c]",
                                !isOut && !isLow && "bg-[#8FA866]"
                              )}
                              style={{ width: `${Math.max(4, progressPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-block border",
                          isOut && "bg-[#F4B6D2]/40 text-[#9e1c50] border-[#F4B6D2]",
                          isLow && "bg-[#F5D76E]/40 text-[#856404] border-[#F5D76E]",
                          !isOut && !isLow && "bg-[#8FA866]/30 text-[#354f1c] border-[#8FA866]"
                        )}>
                          {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>

                      {/* Aksi Baris (Edit & Hapus) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="w-7 h-7 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-colors cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleProduct(p)}
                            className="w-7 h-7 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-[#F4B6D2] hover:border-[#F4B6D2] transition-colors cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar bila baris > 50 */}
          {filteredAndSortedProducts.length > pageSize && (
            <div className="p-3 bg-bg border-t border-ink/10 flex items-center justify-between text-xs text-muted font-medium">
              <span>
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAndSortedProducts.length)} dari {filteredAndSortedProducts.length} produk
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-full border border-ink/15 flex items-center justify-center disabled:opacity-30 hover:bg-surface cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-bold text-ink px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-full border border-ink/15 flex items-center justify-center disabled:opacity-30 hover:bg-surface cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================= TAMPILAN KARTU / GRID ======================= */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedProducts.map(p => {
              const isSelected = selectedIds.includes(p.id);
              const isLow = p.stock > 0 && p.stock <= p.minStock;
              const isOut = p.stock === 0;
              const progressPct = p.minStock > 0 ? Math.min(100, Math.round((p.stock / p.minStock) * 100)) : 100;

              return (
                <motion.div
                  key={p.id}
                  layout
                  onClick={() => setDetailProduct(p)}
                  className={cn(
                    "p-4 rounded-[22px] bg-surface border border-ink/15 flex flex-col justify-between hover:border-ink transition-colors cursor-pointer relative",
                    isSelected && "ring-2 ring-ink"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-[14px] bg-bg border border-ink/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-[#B7C7F2]/25 text-[#1c3d7a]">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-muted font-bold block">{p.code}</span>
                        <h4 className="font-semibold text-sm text-ink leading-tight truncate">{p.name}</h4>
                        <span className="text-xs text-muted font-medium">{p.category}</span>
                      </div>
                    </div>

                    <div onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleSelectRow(p.id)}
                        className="cursor-pointer text-ink hover:opacity-80 p-0.5"
                      >
                        {isSelected ? <CheckSquare size={17} /> : <Square size={17} className="text-muted/60" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-ink/10 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Modal</span>
                      <span className="text-muted font-medium tabular-nums">{formatCurrency(p.buyPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Harga Jual</span>
                      <span className="font-bold text-ink tabular-nums text-[13px]">{formatCurrency(p.sellPrice)}</span>
                    </div>

                    {/* Stepper Stok Cepat di Kartu */}
                    <div className="flex justify-between items-center pt-1" onClick={e => e.stopPropagation()}>
                      <span className="text-muted font-medium">Stok Fisik</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStepStock(p, -1)}
                          disabled={p.stock <= 0}
                          className="w-5 h-5 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className={cn(
                          "px-2 py-0.2 rounded-full font-bold text-xs border",
                          isOut && "bg-[#F4B6D2]/35 border-[#F4B6D2]/70 text-[#9e1c50]",
                          isLow && "bg-[#F5D76E]/30 border-[#F5D76E]/60 text-[#856404]",
                          !isOut && !isLow && "bg-[#8FA866]/30 border-[#8FA866]/60 text-[#354f1c]"
                        )}>
                          {p.stock} {p.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepStock(p, 1)}
                          className="w-5 h-5 rounded-full border border-ink/15 flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar Tipis */}
                    <div className="h-1 w-full bg-ink/10 rounded-full overflow-hidden mt-1">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          isOut && "bg-[#9e1c50]",
                          isLow && "bg-[#e5a93c]",
                          !isOut && !isLow && "bg-[#8FA866]"
                        )}
                        style={{ width: `${Math.max(4, progressPct)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredAndSortedProducts.length > pageSize && (
            <div className="p-3 bg-surface rounded-[20px] border border-ink/15 flex items-center justify-between text-xs text-muted font-medium">
              <span>
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAndSortedProducts.length)} dari {filteredAndSortedProducts.length} produk
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-full border border-ink/15 flex items-center justify-center disabled:opacity-30 hover:bg-bg cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-bold text-ink px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-full border border-ink/15 flex items-center justify-center disabled:opacity-30 hover:bg-bg cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. BAR AKSI MELAYANG (BATCH ACTIONS BAR)                   */}
      {/* ========================================================== */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3.5 border border-white/20 select-none"
          >
            <span className="text-xs font-bold text-white/90">
              {selectedIds.length} produk terpilih
            </span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setBatchCategoryModalOpen(true)}
                className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full py-1.5 px-3"
              >
                <Tag size={13} />
                <span>Ubah Kategori</span>
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmBatchDeleteOpen(true)}
                className="text-xs bg-[#F4B6D2] hover:bg-[#F4B6D2]/90 text-ink border-transparent rounded-full py-1.5 px-3"
              >
                <Trash2 size={13} />
                <span>Hapus Terpilih</span>
              </Button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer ml-1"
                title="Batal pilih"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 5. DRAWER DETAIL PRODUK DARI KANAN (RESPONSIF BOTTOM SHEET)*/}
      {/* ========================================================== */}
      <Drawer
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title={detailProduct ? detailProduct.name : 'Detail Produk'}
        subtitle={detailProduct ? `${detailProduct.code} • ${detailProduct.category}` : ''}
        width="max-w-md"
      >
        {detailProduct && (
          <div className="space-y-4">
            {/* Foto / Ilustrasi Produk */}
            <div className="w-full h-44 rounded-[22px] bg-bg border border-ink/10 flex items-center justify-center overflow-hidden relative">
              {detailProduct.image ? (
                <img src={detailProduct.image} alt={detailProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted">
                  <Package size={40} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">Tidak ada foto produk</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className="bg-surface text-ink text-xs font-semibold px-2.5 py-0.5 rounded-full border border-ink/15">
                  {detailProduct.category}
                </span>
              </div>
            </div>

            {/* Status Stok & Progres */}
            <div className="p-4 rounded-[22px] bg-bg border border-ink/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted font-medium">Stok Fisik Tersedia</span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                  detailProduct.stock === 0 && "bg-[#F4B6D2]/40 text-[#9e1c50] border-[#F4B6D2]",
                  detailProduct.stock > 0 && detailProduct.stock <= detailProduct.minStock && "bg-[#F5D76E]/40 text-[#856404] border-[#F5D76E]",
                  detailProduct.stock > detailProduct.minStock && "bg-[#8FA866]/30 text-[#354f1c] border-[#8FA866]"
                )}>
                  {detailProduct.stock === 0 ? 'Habis' : detailProduct.stock <= detailProduct.minStock ? 'Hampir Habis' : 'Aman'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ink tabular-nums">
                  {detailProduct.stock} <span className="text-sm font-semibold text-muted">{detailProduct.unit}</span>
                </span>
                <span className="text-xs text-muted">Min restok: {detailProduct.minStock} {detailProduct.unit}</span>
              </div>

              {/* Stepper Cepat di Drawer */}
              <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
                <span className="text-xs text-muted font-medium flex-1">Sesuaikan stok:</span>
                <button
                  type="button"
                  onClick={() => handleStepStock(detailProduct, -1)}
                  disabled={detailProduct.stock <= 0}
                  className="w-7 h-7 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-ink hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <Minus size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepStock(detailProduct, 1)}
                  className="w-7 h-7 rounded-full border border-ink/20 flex items-center justify-center text-ink hover:bg-ink hover:text-white cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Finansial: Modal, Harga Jual & Margin */}
            <div className="p-4 rounded-[22px] bg-bg border border-ink/10 space-y-2 text-xs">
              <span className="font-semibold text-muted block ml-0.5">Informasi Harga & Margin</span>
              <div className="flex justify-between items-center">
                <span className="text-muted">Harga Beli (Modal)</span>
                <span className="font-medium text-ink tabular-nums">{formatCurrency(detailProduct.buyPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Harga Jual Konsumen</span>
                <span className="font-bold text-ink tabular-nums text-sm">{formatCurrency(detailProduct.sellPrice)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-ink/10">
                <span className="font-semibold text-ink">Margin Keuntungan per Unit</span>
                <div className="text-right">
                  <span className="font-bold text-[#354f1c] tabular-nums block">
                    +{formatCurrency(Math.max(0, detailProduct.sellPrice - detailProduct.buyPrice))}
                  </span>
                  <span className="text-[10px] text-muted">
                    {detailProduct.buyPrice > 0 ? `(${(((detailProduct.sellPrice - detailProduct.buyPrice) / detailProduct.buyPrice) * 100).toFixed(1)}%)` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Riwayat Penjualan & Perubahan Stok Terakhir */}
            <div className="p-4 rounded-[22px] bg-bg border border-ink/10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <History size={14} className="text-muted" />
                <span>Riwayat Transaksi Produk Ini</span>
              </div>

              {(() => {
                const history = getProductStockHistory(detailProduct.id, detailProduct.name);
                if (history.length === 0) {
                  return (
                    <p className="text-xs text-muted py-2 text-center">
                      Belum ada catatan penjualan di kasir untuk produk ini.
                    </p>
                  );
                }
                return (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {history.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 rounded-[14px] bg-surface">
                        <div>
                          <span className="font-bold text-ink">#{h.invoice}</span>
                          <span className="text-muted text-[11px] block">{new Date(h.date).toLocaleDateString('id-ID')} • {h.user}</span>
                        </div>
                        <span className="font-bold text-[#9e1c50] tabular-nums">
                          -{h.qty} {detailProduct.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Aksi Bawah Drawer */}
            <div className="pt-2 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 py-2.5 text-xs font-semibold rounded-full"
                onClick={() => {
                  const p = detailProduct;
                  setDetailProduct(null);
                  handleOpenEditModal(p);
                }}
              >
                <Edit3 size={14} />
                <span>Edit Produk</span>
              </Button>
              <Button
                variant="danger"
                className="flex-1 py-2.5 text-xs font-semibold rounded-full bg-[#F4B6D2] hover:bg-[#F4B6D2]/90 text-ink border-transparent"
                onClick={() => {
                  const p = detailProduct;
                  setDetailProduct(null);
                  handleDeleteSingleProduct(p);
                }}
              >
                <Trash2 size={14} />
                <span>Hapus Produk</span>
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================== */}
      {/* 6. FORM TAMBAH / EDIT PRODUK (DUA BAGIAN RAPI & VALIDASI)   */}
      {/* ========================================================== */}
      <Modal
        isOpen={formModalOpen}
        onClose={handleRequestCloseForm}
        title={editingProduct ? `Edit Produk: ${editingProduct.name}` : "Tambah Produk Baru"}
        subtitle={
          editingProduct 
            ? "Perbarui master data SKU, harga jual konsumen, serta batas restok" 
            : "Lengkapi data master produk sembako baru ke inventori toko"
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProductSubmit} className="space-y-4">
          
          {/* Status Draf & Peringatan Storage */}
          <div className="flex items-center justify-between text-xs px-1">
            {!editingProduct && isDraftSaved && (
              <span className="text-muted flex items-center gap-1 font-medium">
                <CheckCircle2 size={13} className="text-green-700" /> Draf tersimpan otomatis
              </span>
            )}
            {storageWarning && (
              <span className="text-[#9e1c50] font-semibold flex items-center gap-1 ml-auto">
                <AlertTriangle size={13} /> {storageWarning}
              </span>
            )}
          </div>

          {/* BAGIAN 1: INFORMASI PRODUK */}
          <div className="p-4 rounded-[22px] bg-bg border border-ink/10 space-y-3">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-muted" /> Bagian 1: Informasi Produk
              </h4>
              <span className="text-[11px] text-muted font-medium">Informasi SKU & Nama</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kode SKU */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-muted ml-1">Kode SKU</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = generateBarcode();
                      setFormValues(prev => ({ ...prev, code: newCode }));
                      setHasUnsavedChanges(true);
                      validateField('code', newCode);
                    }}
                    className="text-[11px] font-semibold text-ink hover:underline cursor-pointer"
                  >
                    Generate Acak
                  </button>
                </div>
                <input
                  type="text"
                  value={formValues.code}
                  onChange={e => {
                    setFormValues({ ...formValues, code: e.target.value });
                    setHasUnsavedChanges(true);
                    validateField('code', e.target.value);
                  }}
                  onBlur={() => handleFieldBlur('code')}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-full bg-surface border text-xs font-mono font-semibold text-ink focus:outline-none focus:border-ink",
                    formErrors.code && touchedFields.code ? "border-[#9e1c50]" : "border-ink/15"
                  )}
                  placeholder="SKU-123456"
                  required
                />
                {formErrors.code && touchedFields.code && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] font-semibold text-[#9e1c50] mt-1 ml-1"
                  >
                    {formErrors.code}
                  </motion.p>
                )}
              </div>

              {/* Satuan Produk */}
              <div>
                <label className="text-xs font-semibold text-muted block mb-1 ml-1">Satuan</label>
                <input
                  type="text"
                  value={formValues.unit}
                  onChange={e => {
                    setFormValues({ ...formValues, unit: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="pcs / kg / liter / botol / bungkus"
                  className="w-full px-3.5 py-2.5 rounded-full bg-surface border border-ink/15 text-xs font-medium text-ink focus:outline-none focus:border-ink"
                  required
                />
              </div>
            </div>

            {/* Nama Produk */}
            <div>
              <label className="text-xs font-semibold text-muted block mb-1 ml-1">Nama Produk</label>
              <input
                type="text"
                value={formValues.name}
                onChange={e => {
                  setFormValues({ ...formValues, name: e.target.value });
                  setHasUnsavedChanges(true);
                  validateField('name', e.target.value);
                }}
                onBlur={() => handleFieldBlur('name')}
                placeholder="Contoh: Beras Pandan Wangi 5kg"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-full bg-surface border text-xs font-medium text-ink focus:outline-none focus:border-ink",
                  formErrors.name && touchedFields.name ? "border-[#9e1c50]" : "border-ink/15"
                )}
                required
              />
              {formErrors.name && touchedFields.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-semibold text-[#9e1c50] mt-1 ml-1"
                >
                  {formErrors.name}
                </motion.p>
              )}
            </div>

            {/* Kategori Selector */}
            <div>
              <label className="text-xs font-semibold text-muted block mb-1 ml-1">Kategori Sembako</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-surface rounded-[18px] border border-ink/10">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFormValues({ ...formValues, category: cat });
                      setHasUnsavedChanges(true);
                    }}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full font-semibold transition-colors cursor-pointer",
                      formValues.category === cat ? "bg-ink text-white" : "bg-bg text-muted hover:text-ink"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Foto Produk Opsional dengan Drag & Drop */}
            <div>
              <label className="text-xs font-semibold text-muted block mb-1 ml-1">Foto Produk (Opsional, Max 200KB)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleImageFile(f);
                }}
              />

              {formValues.image ? (
                <div className="flex items-center gap-3 p-2 rounded-[16px] bg-surface border border-ink/15">
                  <div className="w-14 h-14 rounded-[12px] overflow-hidden border border-ink/10 shrink-0">
                    <img src={formValues.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">Foto produk terpilih</p>
                    <p className="text-[11px] text-muted">Format terkompresi otomatis (&lt; 200KB)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormValues(prev => ({ ...prev, image: undefined }));
                      setHasUnsavedChanges(true);
                    }}
                    className="p-1.5 rounded-full text-muted hover:text-[#9e1c50] cursor-pointer"
                    title="Hapus foto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDraggingImage(true); }}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDraggingImage(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleImageFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-4 rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                    isDraggingImage ? "border-ink bg-surface" : "border-ink/20 bg-surface/50 hover:bg-surface hover:border-ink/40"
                  )}
                >
                  <UploadCloud size={24} className="text-muted mb-1" />
                  <p className="text-xs font-semibold text-ink">Tarik & lepas foto ke sini, atau klik untuk memilih</p>
                  <p className="text-[10px] text-muted mt-0.5">JPEG/PNG dikompresi otomatis agar hemat memori browser</p>
                </div>
              )}
            </div>
          </div>

          {/* BAGIAN 2: HARGA & STOK */}
          <div className="p-4 rounded-[22px] bg-bg border border-ink/10 space-y-3">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-muted" /> Bagian 2: Harga & Stok
              </h4>
              <span className="text-[11px] text-muted font-medium">Margin & Batas Restok</span>
            </div>

            {/* Input Harga Beli & Harga Jual Berformat Rupiah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1 ml-1">Harga Beli / Modal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formValues.buyPrice ? formatNumber(formValues.buyPrice) : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const val = Number(raw) || 0;
                      setFormValues({ ...formValues, buyPrice: val });
                      setHasUnsavedChanges(true);
                      validateField('buyPrice', val);
                    }}
                    onBlur={() => handleFieldBlur('buyPrice')}
                    placeholder="0"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-full bg-surface border border-ink/15 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
                    required
                  />
                </div>
                {formErrors.buyPrice && touchedFields.buyPrice && (
                  <p className="text-[11px] font-semibold text-[#9e1c50] mt-1 ml-1">{formErrors.buyPrice}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1 ml-1">Harga Jual Konsumen (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formValues.sellPrice ? formatNumber(formValues.sellPrice) : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const val = Number(raw) || 0;
                      setFormValues({ ...formValues, sellPrice: val });
                      setHasUnsavedChanges(true);
                      validateField('sellPrice', val);
                    }}
                    onBlur={() => handleFieldBlur('sellPrice')}
                    placeholder="0"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-full bg-surface border border-ink/15 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
                    required
                  />
                </div>
                {formErrors.sellPrice && touchedFields.sellPrice && (
                  <p className="text-[11px] font-semibold text-[#9e1c50] mt-1 ml-1">{formErrors.sellPrice}</p>
                )}
              </div>
            </div>

            {/* Indikator Estimasi Laba Instan */}
            {formValues.sellPrice > 0 && formValues.buyPrice > 0 && (
              <div className="p-2.5 rounded-[14px] bg-surface flex justify-between items-center text-xs">
                <span className="text-muted">Estimasi Keuntungan:</span>
                <span className="font-bold text-[#354f1c] tabular-nums">
                  +{formatCurrency(formValues.sellPrice - formValues.buyPrice)} ({(((formValues.sellPrice - formValues.buyPrice) / formValues.buyPrice) * 100).toFixed(1)}%)
                </span>
              </div>
            )}

            {/* Input Stok & Batas Minimum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1 ml-1">Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  value={formValues.stock}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setFormValues({ ...formValues, stock: val });
                    setHasUnsavedChanges(true);
                    validateField('stock', val);
                  }}
                  onBlur={() => handleFieldBlur('stock')}
                  className="w-full px-3.5 py-2.5 rounded-full bg-surface border border-ink/15 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
                  required
                />
                {formErrors.stock && touchedFields.stock && (
                  <p className="text-[11px] font-semibold text-[#9e1c50] mt-1 ml-1">{formErrors.stock}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <label className="text-xs font-semibold text-muted block">Batas Minimum Restok</label>
                  <ContextHelp content="Batas jumlah persediaan. Jika sisa barang mencapai atau di bawah angka ini, toko akan menandainya sebagai stok menipis." placement="top" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formValues.minStock}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setFormValues({ ...formValues, minStock: val });
                    setHasUnsavedChanges(true);
                    validateField('minStock', val);
                  }}
                  onBlur={() => handleFieldBlur('minStock')}
                  className="w-full px-3.5 py-2.5 rounded-full bg-surface border border-ink/15 text-xs font-semibold text-ink focus:outline-none focus:border-ink"
                  required
                />
                {formErrors.minStock && touchedFields.minStock && (
                  <p className="text-[11px] font-semibold text-[#9e1c50] mt-1 ml-1">{formErrors.minStock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tombol Simpan (Nonaktif sampai valid) & Pintasan Petunjuk */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-muted hidden sm:inline">
              Pintasan: <kbd className="px-1.5 py-0.5 bg-bg border border-ink/15 rounded text-[10px] font-bold">Ctrl+Enter</kbd> Simpan • <kbd className="px-1.5 py-0.5 bg-bg border border-ink/15 rounded text-[10px] font-bold">Esc</kbd> Tutup
            </span>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 sm:flex-none py-2.5 px-5 text-xs font-semibold rounded-full"
                onClick={handleRequestCloseForm}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className={cn(
                  "flex-1 sm:flex-none py-2.5 px-6 text-xs font-bold rounded-full transition-opacity",
                  !isFormValid && "opacity-40 cursor-not-allowed"
                )}
              >
                {editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================== */}
      {/* 7. MODAL BATCH UBAH KATEGORI                               */}
      {/* ========================================================== */}
      <Modal
        isOpen={batchCategoryModalOpen}
        onClose={() => setBatchCategoryModalOpen(false)}
        title="Ubah Kategori Produk Terpilih"
        subtitle={`Pilih kategori baru untuk ${selectedIds.length} produk terpilih`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-bg rounded-[18px] border border-ink/10">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewBatchCategory(cat)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full font-semibold transition-colors cursor-pointer",
                  newBatchCategory === cat ? "bg-ink text-white" : "bg-surface text-muted hover:text-ink"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="pt-2 flex gap-2">
            <Button variant="secondary" className="flex-1 rounded-full text-xs" onClick={() => setBatchCategoryModalOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1 rounded-full text-xs" onClick={handleBatchUpdateCategoryConfirm}>
              Terapkan Kategori
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================== */}
      {/* 8. CONFIRM DIALOG: BATCH DELETE & UNSAVED CHANGES          */}
      {/* ========================================================== */}
      <ConfirmDialog
        isOpen={confirmBatchDeleteOpen}
        onClose={() => setConfirmBatchDeleteOpen(false)}
        onConfirm={handleBatchDelete}
        title={`Hapus ${selectedIds.length} Produk?`}
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} produk ini dari inventori? Anda masih dapat membatalkan aksi ini selama 5 detik setelah dihapus.`}
        confirmLabel="Hapus Produk"
        cancelLabel="Batal"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmCloseFormOpen}
        onClose={() => setConfirmCloseFormOpen(false)}
        onConfirm={() => {
          setConfirmCloseFormOpen(false);
          setFormModalOpen(false);
          setHasUnsavedChanges(false);
        }}
        title="Tutup Form?"
        description="Perubahan yang belum disimpan akan hilang. Yakin ingin keluar dari form ini?"
        confirmLabel="Ya, Buang Perubahan"
        cancelLabel="Kembali ke Form"
        variant="warning"
      />
    </div>
  );
};
