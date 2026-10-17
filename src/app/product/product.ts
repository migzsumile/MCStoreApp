import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from './product.model';
import { ProductService } from './product.service';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'app-product',
  imports: [CommonModule, FormsModule],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class ProductComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Expose Number for template
  readonly Number = Number;

  // Search
  searchTerm = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Products data
  products = signal<Product[]>([]);
  totalProducts = signal(0);
  totalPages = signal(0);
  loading = signal(false);

  // Filtered products (client-side filtering)
  filteredProducts = computed(() => {
    return this.products();
  });

  filteredTotal = computed(() => this.totalProducts());

  // Products for current page
  paginatedProducts = computed(() => {
    return this.filteredProducts();
  });

  // Modal state
  showModal = signal(false);
  isEditing = signal(false);
  editingProduct = signal<Product | null>(null);
  confirmationModal = signal({
    open: false,
    type: '' as 'update' | 'delete' | '',
    title: '',
    message: ''
  });
  resultModal = signal({
    open: false,
    type: '' as 'success' | 'error' | '',
    title: '',
    message: ''
  });
  pendingDeleteProduct = signal<Product | null>(null);

  // Form data
  productForm = signal({
    productCode: '',
    productName: '',
    unitPrice: 0,
    unitInStock: 0,
    capitalPrice: 0,
    expiryDate: ''
  });

  // Multi-add rows for modal (each row mirrors the Product properties used for create)
  productRows = signal<Array<{
    productCode?: string | null;
    productName?: string | null;
    unitPrice?: number;
    capitalPrice?: number;
    unitInStock?: number;
    expiryDate?: string | null;
  }>>([]);

  ngOnInit() {
    // Subscribe to search subject with debouncing
    this.searchSubject$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage.set(1); // Reset to first page when search changes
        this.loadProducts();
      });

    // Wait for authentication before loading products
    this.authService.waitForAuthentication()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('User authenticated, loading products');
          this.loadProducts();
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

  loadProducts() {
    this.loading.set(true);
    const searchTerm = this.searchTerm().toLowerCase().trim();
    this.productService.getProducts(this.currentPage(), this.pageSize(), searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          this.products.set(response.items);
          this.totalProducts.set(response.totalCount);
          
          // Calculate totalPages - ensure it updates correctly for search results
          const totalCount = response.totalCount || 0;
          const pageSize = this.pageSize();
          const totalPages = Math.max(response.totalPages || Math.ceil(totalCount / pageSize), 1);
          console.log(`Search: "${searchTerm}" | Total: ${totalCount} | Pages: ${totalPages} | PageSize: ${pageSize}`);
          this.totalPages.set(totalPages);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading.set(false);
        }
      });
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadProducts();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadProducts();
    }
  }

  // Search methods
  onSearchChange() {
    this.searchSubject$.next(this.searchTerm());
  }

  // Modal methods
  openAddModal() {
    this.isEditing.set(false);
    this.editingProduct.set(null);
    this.productForm.set({
      productCode: '',
      productName: '',
      unitPrice: 0,
      unitInStock: 0,
      capitalPrice: 0,
      expiryDate: ''
    });
    // initialize multi-row editor with one empty row
    this.productRows.set([this.createEmptyRow()]);
    this.showModal.set(true);
  }

  openEditModal(product: Product) {
    this.isEditing.set(true);
    this.editingProduct.set(product);
    this.productForm.set({
      productCode: product.productCode,
      productName: product.productName,
      unitPrice: product.unitPrice,
      unitInStock: product.unitInStock,
      capitalPrice: product.capitalPrice,
      expiryDate: product.expiryDate ? (product.expiryDate as any).toString().split('T')[0] : ''
    });
    // clear multi-add rows when editing so modal shows the single-edit form
    this.productRows.set([]);
    this.showModal.set(true);
  }

  updateProductForm(field: string, value: any) {
    const current = this.productForm();
    let newValue: any = value;
    if (field === 'unitPrice' || field === 'capitalPrice' || field === 'unitInStock') {
      const num = Number(value);
      newValue = isNaN(num) ? 0 : num;
    }
    this.productForm.set({ ...current, [field]: newValue });
  }

  closeModal() {
    this.showModal.set(false);
    this.isEditing.set(false);
    this.editingProduct.set(null);
    this.productRows.set([]);
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
      const product = this.pendingDeleteProduct();
      if (!product) {
        this.closeConfirmationModal();
        return;
      }

      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.closeConfirmationModal();
          this.pendingDeleteProduct.set(null);
          this.loadProducts();
          this.showResultModal('success', 'Product deleted', 'The product was deleted successfully.');
        },
        error: (error) => {
          this.closeConfirmationModal();
          this.pendingDeleteProduct.set(null);
          console.error('Error deleting product:', error);
          this.showResultModal('error', 'Delete failed', 'The product could not be deleted. Please try again.');
        }
      });
      return;
    }

    if (confirmation.type === 'update' && this.isEditing() && this.editingProduct()) {
      this.productService.updateProduct(this.editingProduct()!.id, this.productForm()).subscribe({
        next: () => {
          this.closeConfirmationModal();
          this.loadProducts();
          this.closeModal();
          this.showResultModal('success', 'Product updated', 'The product was updated successfully.');
        },
        error: (error) => {
          this.closeConfirmationModal();
          console.error('Error updating product:', error);
          this.showResultModal('error', 'Update failed', 'The product could not be updated. Please try again.');
        }
      });
    }
  }

  // Form methods
  saveProduct() {
    if (this.isEditing() && this.editingProduct()) {
      this.confirmationModal.set({
        open: true,
        type: 'update',
        title: 'Confirm update',
        message: `Are you sure you want to update "${this.editingProduct()?.productName || 'this product'}"?`
      });
      return;
    } else {
      // When not editing, use the multi-add flow if rows exist
      const rows = this.productRows();
      if (rows && rows.length > 0) {
        this.saveMultipleProducts();
        return;
      }

      this.productService.addProduct(this.productForm()).subscribe({
        next: () => {
          this.loadProducts(); // Reload products after add
          this.closeModal();
        },
        error: (error) => {
          console.error('Error adding product:', error);
        }
      });
    }
  }

  // Helpers for multi-row add
  private createEmptyRow() {
    return {
      productCode: '',
      productName: '',
      unitPrice: 0,
      capitalPrice: 0,
      unitInStock: 0,
      expiryDate: null
    };
  }

  updateRow(index: number, field: string, value: any) {
    const rows = this.productRows().slice();
    if (!rows[index]) return;
    // coerce numeric fields
    if (field === 'unitPrice' || field === 'capitalPrice' || field === 'unitInStock') {
      const num = Number(value);
      (rows[index] as any)[field] = isNaN(num) ? 0 : num;
    } else {
      (rows[index] as any)[field] = value;
    }
    this.productRows.set(rows);
    this.addRowIfNeeded(index);
  }

  addRowIfNeeded(index: number) {
    const rows = this.productRows();
    const isLast = index === rows.length - 1;
    if (isLast) {
      const last = rows[rows.length - 1];
      // if any meaningful data present, append a new empty row
      const hasData = (last.productName && last.productName.toString().trim() !== '') ||
                      (last.productCode && last.productCode.toString().trim() !== '') ||
                      (last.unitPrice && last.unitPrice > 0) ||
                      (last.capitalPrice && last.capitalPrice > 0) ||
                      (last.unitInStock && last.unitInStock > 0) ||
                      (last.expiryDate && last.expiryDate.toString().trim() !== '');
      if (hasData) {
        this.productRows.update(r => [...r, this.createEmptyRow()]);
      }
    }
  }

  removeRow(index: number) {
    const rows = this.productRows().slice();
    if (index < 0 || index >= rows.length) return;
    rows.splice(index, 1);
    // ensure at least one empty row remains
    if (rows.length === 0) rows.push(this.createEmptyRow());
    this.productRows.set(rows);
  }

  validateRow(row: any) {
    // Validation rules based on provided datatype hints.
    // productCode: required, max 50
    if (!row.productCode || row.productCode.toString().trim() === '') return 'Product code is required';
    if (row.productCode && row.productCode.toString().length > 50) return 'Product code must be 50 characters or less';
    // productName: required, max 50
    if (!row.productName || row.productName.toString().trim() === '') return 'Product name is required';
    if (row.productName && row.productName.toString().length > 50) return 'Product name must be 50 characters or less';
    if (typeof row.unitPrice !== 'number' || row.unitPrice < 0) return 'Unit Price must be 0 or greater';
    if (typeof row.capitalPrice !== 'number' || row.capitalPrice < 0) return 'Capital Price must be 0 or greater';
    if (typeof row.unitInStock !== 'number' || row.unitInStock < 0) return 'Unit In Stock must be 0 or greater';
    if (row.expiryDate && isNaN(Date.parse(row.expiryDate))) return 'Expiry Date must be a valid date';
    return null;
  }

  // Save multiple products in a single request
  saveMultipleProducts() {
    const rows = this.productRows();
    // Filter out truly empty rows (no name and no code)
    const toSave = rows.filter(r => (r.productName && r.productName.toString().trim() !== '') || (r.productCode && r.productCode.toString().trim() !== ''));
    if (toSave.length === 0) {
      alert('No products to add');
      return;
    }

    // Validate each row
    for (let i = 0; i < toSave.length; i++) {
      const err = this.validateRow(toSave[i]);
      if (err) {
        alert(`Row ${i + 1}: ${err}`);
        return;
      }
    }

    // Prepare payload matching API model
    const payload = toSave.map(r => ({
      productCode: r.productCode || '',
      productName: r.productName || '',
      capitalPrice: Number(r.capitalPrice) || 0,
      unitPrice: Number(r.unitPrice) || 0,
      unitInStock: Number(r.unitInStock) || 0,
      expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString() : null
    }));

    this.productService.addProducts(payload).subscribe({
      next: () => {
        this.loadProducts();
        this.closeModal();
      },
      error: (error) => {
        console.error('Error adding multiple products:', error);
        alert('Failed to add products. See console for details.');
      }
    });
  }

  deleteProduct(product: Product) {
    this.pendingDeleteProduct.set(product);
    this.confirmationModal.set({
      open: true,
      type: 'delete',
      title: 'Confirm delete',
      message: `Are you sure you want to delete "${product.productName}"?`
    });
  }

  // Helper methods
  getPagesArray() {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const pages: (number | string)[] = [];
    const pagesToShow = new Set<number>();

    // Always add first 3 pages (but only if they exist)
    if (totalPages >= 1) pagesToShow.add(1);
    if (totalPages >= 2) pagesToShow.add(2);
    if (totalPages >= 3) pagesToShow.add(3);

    // Always add last 3 pages
    if (totalPages >= 1) pagesToShow.add(totalPages);
    if (totalPages >= 2) pagesToShow.add(totalPages - 1);
    if (totalPages >= 3) pagesToShow.add(totalPages - 2);

    // Add current page and nearby pages (current-1, current, current+1)
    if (currentPage > 1) pagesToShow.add(currentPage - 1);
    pagesToShow.add(currentPage);
    if (currentPage < totalPages) pagesToShow.add(currentPage + 1);

    // Sort the pages
    const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

    // Build the final array with ellipsis where needed
    sortedPages.forEach((page, index) => {
      if (index > 0 && sortedPages[index - 1] < page - 1) {
        pages.push('...');
      }
      pages.push(page);
    });

    return pages;
  }
}
