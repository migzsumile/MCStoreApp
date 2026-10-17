import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../product/product.service';
import { Stock, GetAllStocksResponse, StockListPayload } from './stock.model';
import { StockService } from './stock.service';

@Component({
  selector: 'app-stock',
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
})
export class StockComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private productCodeLookupSubject$ = new Subject<{ index: number; code: string }>();

  readonly Number = Number;

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  stocks = signal<Stock[]>([]);
  totalStocks = signal(0);
  totalPages = signal(0);
  loading = signal(false);

  filteredStocks = computed(() => this.stocks());
  filteredTotal = computed(() => this.totalStocks());
  paginatedStocks = computed(() => this.filteredStocks());

  showModal = signal(false);
  isEditing = signal(false);
  editingStock = signal<Stock | null>(null);
  confirmationModal = signal({ open: false, type: '' as 'delete' | 'update' | '', title: '', message: '' });
  resultModal = signal({ open: false, type: '' as 'success' | 'error' | '', title: '', message: '' });
  pendingDeleteStock = signal<Stock | null>(null);

  stockForm = signal({
    id: 0,
    productId: 0,
    productCode: '',
    productName: '',
    initialQuantity: 0,
    unitInStock: 0,
    capitalPrice: 0,
    unitPrice: 0,
    expiryDate: ''
  });

  stockRows = signal<Array<{
    id: number;
    productId?: number;
    productCode?: string | null;
    productName?: string | null;
    initialQuantity?: number;
    unitInStock?: number;
    capitalPrice?: number;
    unitPrice?: number;
    expiryDate?: string | null;
  }>>([]);

  ngOnInit() {
    this.searchSubject$.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage.set(1);
      this.loadStocks();
    });

    this.productCodeLookupSubject$.pipe(
      debounceTime(500),
      distinctUntilChanged((previous, current) => previous.index === current.index && previous.code === current.code),
      takeUntil(this.destroy$)
    ).subscribe(({ index, code }) => {
      const trimmedCode = code?.trim() ?? '';
      if (!trimmedCode) {
        this.updateRowLookupResult(index, { productId: 0, productName: '' });
        return;
      }

      this.productService.getProductByProductCode(trimmedCode).pipe(takeUntil(this.destroy$)).subscribe({
        next: (product) => {
          this.updateRowLookupResult(index, {
            productId: product.id ?? 0,
            productName: product.productName ?? ''
          });
        },
        error: (error) => {
          console.error('Error looking up product by code:', error);
          this.updateRowLookupResult(index, { productId: 0, productName: '' });
        }
      });
    });

    this.authService.waitForAuthentication().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadStocks();
      },
      error: (error) => {
        console.error('Authentication failed:', error);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStocks() {
    this.loading.set(true);
    const searchTerm = this.searchTerm().toLowerCase().trim();
    this.stockService.getStocks(this.currentPage(), this.pageSize(), searchTerm).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: GetAllStocksResponse) => {
        this.stocks.set(response.items);
        this.totalStocks.set(response.totalCount);
        const totalPages = Math.max(response.totalPages || Math.ceil(response.totalCount / this.pageSize()), 1);
        this.totalPages.set(totalPages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading stocks:', error);
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadStocks();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadStocks();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadStocks();
    }
  }

  onSearchChange() {
    this.searchSubject$.next(this.searchTerm());
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingStock.set(null);
    this.stockForm.set({
      id: 0,
      productId: 0,
      productCode: '',
      productName: '',
      initialQuantity: 0,
      unitInStock: 0,
      capitalPrice: 0,
      unitPrice: 0,
      expiryDate: ''
    });
    this.stockRows.set([this.createEmptyRow()]);
    this.showModal.set(true);
  }

  openEditModal(stock: Stock) {
    console.log('Editing stock:', stock);
    this.isEditing.set(true);
    this.editingStock.set(stock);
    this.stockForm.set({
      id: stock.id,
      productId: stock.productId,
      productCode: stock.productCode,
      productName: stock.productName,
      initialQuantity: stock.initialQuantity,
      unitInStock: stock.unitInStock,
      capitalPrice: stock.capitalPrice,
      unitPrice: stock.unitPrice,
      expiryDate: stock.expiryDate ? stock.expiryDate.toString().split('T')[0] : ''
    });
    this.stockRows.set([]);
    this.showModal.set(true);
  }

  updateStockForm(field: string, value: any) {
    const current = this.stockForm();
    let newValue: any = value;
    if (field === 'productId' || field === 'initialQuantity' || field === 'unitInStock' || field === 'capitalPrice' || field === 'unitPrice') {
      const num = Number(value);
      newValue = isNaN(num) ? 0 : num;
    }
    this.stockForm.set({ ...current, [field]: newValue });
  }

  closeModal() {
    this.showModal.set(false);
    this.isEditing.set(false);
    this.editingStock.set(null);
    this.stockRows.set([]);
  }

  closeConfirmationModal() {
    this.confirmationModal.set({ open: false, type: '', title: '', message: '' });
  }

  closeResultModal() {
    this.resultModal.set({ open: false, type: '', title: '', message: '' });
  }

  private showResultModal(type: 'success' | 'error', title: string, message: string) {
    this.resultModal.set({ open: true, type, title, message });
  }

  confirmAction() {
    const confirmation = this.confirmationModal();
    if (!confirmation.open) {
      return;
    }

    if (confirmation.type === 'delete') {
      const stock = this.pendingDeleteStock();
      if (!stock) {
        this.closeConfirmationModal();
        return;
      }

      this.stockService.deleteStock(stock.id).subscribe({
        next: () => {
          this.closeConfirmationModal();
          this.pendingDeleteStock.set(null);
          this.loadStocks();
          this.showResultModal('success', 'Stock deleted', 'The stock record was deleted successfully.');
        },
        error: (error) => {
          this.closeConfirmationModal();
          this.pendingDeleteStock.set(null);
          console.error('Error deleting stock:', error);
          this.showResultModal('error', 'Delete failed', 'The stock record could not be deleted. Please try again.');
        }
      });
      return;
    }

    if (confirmation.type === 'update' && this.isEditing() && this.editingStock()) {
      this.stockService.updateStock(this.editingStock()!.id, this.stockForm()).subscribe({
        next: () => {
          this.closeConfirmationModal();
          this.loadStocks();
          this.closeModal();
          this.showResultModal('success', 'Stock updated', 'The stock record was updated successfully.');
        },
        error: (error) => {
          this.closeConfirmationModal();
          console.error('Error updating stock:', error);
          this.showResultModal('error', 'Update failed', 'The stock record could not be updated. Please try again.');
        }
      });
    }
  }

  saveStock() {
    if (this.isEditing() && this.editingStock()) {
      this.confirmationModal.set({
        open: true,
        type: 'update',
        title: 'Confirm update',
        message: `Are you sure you want to update this stock entry?`
      });
      return;
    }

    const rows = this.stockRows();
    if (rows && rows.length > 0) {
      this.saveMultipleStocks();
      return;
    }

    this.stockService.addStock(this.stockForm() as unknown as StockListPayload).subscribe({
      next: () => {
        this.loadStocks();
        this.closeModal();
        this.showResultModal('success', 'Stock added', 'The stock record was added successfully.');
      },
      error: (error) => {
        console.error('Error adding stock:', error);
        this.showResultModal('error', 'Add failed', 'The stock record could not be added. Please try again.');
      }
    });
  }

  private createEmptyRow() {
    return {
      id: 0,
      productId: 0,
      productCode: '',
      productName: '',
      initialQuantity: 0,
      unitInStock: 0,
      capitalPrice: 0,
      unitPrice: 0,
      expiryDate: null
    };
  }

  updateRow(index: number, field: string, value: any) {
    const rows = this.stockRows().slice();
    if (!rows[index]) return;
    if (field === 'productId' || field === 'initialQuantity' || field === 'unitInStock' || field === 'capitalPrice' || field === 'unitPrice') {
      const num = Number(value);
      (rows[index] as any)[field] = isNaN(num) ? 0 : num;
    } else {
      (rows[index] as any)[field] = value;
    }
    this.stockRows.set(rows);

    if (field === 'productCode') {
      const normalizedValue = value?.toString() ?? '';
      this.productCodeLookupSubject$.next({ index, code: normalizedValue });
    }

    this.addRowIfNeeded(index);
  }

  private updateRowLookupResult(index: number, payload: { productId: number; productName: string }) {
    const rows = this.stockRows().slice();
    if (!rows[index]) return;
    
    rows[index] = {
      ...rows[index],
      productId: payload.productId,
      productName: payload.productName
    };

    this.stockRows.set(rows);
    console.log(this.stockRows());
  }

  addRowIfNeeded(index: number) {
    const rows = this.stockRows();
    const isLast = index === rows.length - 1;
    if (isLast) {
      const last = rows[rows.length - 1];
      const hasData = (last.productCode && last.productCode.toString().trim() !== '') ||
        (last.initialQuantity && last.initialQuantity > 0) ||
        (last.unitInStock && last.unitInStock > 0) ||
        (last.capitalPrice && last.capitalPrice > 0) ||
        (last.unitPrice && last.unitPrice > 0) ||
        (last.expiryDate && last.expiryDate.toString().trim() !== '');
      if (hasData) {
        this.stockRows.update(r => [...r, this.createEmptyRow()]);
      }
    }
  }

  removeRow(index: number) {
    const rows = this.stockRows().slice();
    if (index < 0 || index >= rows.length) return;
    rows.splice(index, 1);
    if (rows.length === 0) rows.push(this.createEmptyRow());
    this.stockRows.set(rows);
  }

  validateRow(row: any) {
    if (!row.productId || row.productId <= 0) return 'Product ID is required';
    if (typeof row.initialQuantity !== 'number' || row.initialQuantity < 0) return 'Initial Quantity must be 0 or greater';
    if (typeof row.unitInStock !== 'number' || row.unitInStock < 0) return 'Current Quantity must be 0 or greater';
    if (typeof row.capitalPrice !== 'number' || row.capitalPrice < 0) return 'Capital Price must be 0 or greater';
    if (typeof row.unitPrice !== 'number' || row.unitPrice < 0) return 'Unit Price must be 0 or greater';
    if (row.expiryDate && isNaN(Date.parse(row.expiryDate))) return 'Expiry Date must be a valid date';
    return null;
  }

  saveMultipleStocks() {
    const rows = this.stockRows();
    const toSave = rows.filter(r => (r.productId && r.productId > 0) || (r.initialQuantity && r.initialQuantity > 0) || (r.unitInStock && r.unitInStock > 0));
    if (toSave.length === 0) {
      this.showResultModal('error', 'No stock to add', 'Please fill in at least one stock row before saving.');
      return;
    }

    for (let i = 0; i < toSave.length; i++) {
      const err = this.validateRow(toSave[i]);
      if (err) {
        this.showResultModal('error', `Row ${i + 1} invalid`, err);
        return;
      }
    }

    const payload = toSave.map(r => ({
      productId: Number(r.productId) || 0,
      initialQuantity: Number(r.initialQuantity) || 0,
      unitInStock: Number(r.unitInStock) || 0,
      capitalPrice: Number(r.capitalPrice) || 0,
      unitPrice: Number(r.unitPrice) || 0,
      expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString() : null
    }));

    this.stockService.addStocks(payload).subscribe({
      next: () => {
        this.loadStocks();
        this.closeModal();
        this.showResultModal('success', 'Stocks added', 'The stock records were added successfully.');
      },
      error: (error) => {
        console.error('Error adding multiple stocks:', error);
        this.showResultModal('error', 'Add failed', 'The stock records could not be added. Please try again.');
      }
    });
  }

  deleteStock(stock: Stock) {
    this.pendingDeleteStock.set(stock);
    this.confirmationModal.set({
      open: true,
      type: 'delete',
      title: 'Confirm delete',
      message: `Are you sure you want to delete this stock entry?`
    });
  }

  getPagesArray() {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const pages: (number | string)[] = [];
    const pagesToShow = new Set<number>();

    if (totalPages >= 1) pagesToShow.add(1);
    if (totalPages >= 2) pagesToShow.add(2);
    if (totalPages >= 3) pagesToShow.add(3);
    if (totalPages >= 1) pagesToShow.add(totalPages);
    if (totalPages >= 2) pagesToShow.add(totalPages - 1);
    if (totalPages >= 3) pagesToShow.add(totalPages - 2);
    if (currentPage > 1) pagesToShow.add(currentPage - 1);
    pagesToShow.add(currentPage);
    if (currentPage < totalPages) pagesToShow.add(currentPage + 1);

    const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
    sortedPages.forEach((page, index) => {
      if (index > 0 && sortedPages[index - 1] < page - 1) {
        pages.push('...');
      }
      pages.push(page);
    });

    return pages;
  }
}
