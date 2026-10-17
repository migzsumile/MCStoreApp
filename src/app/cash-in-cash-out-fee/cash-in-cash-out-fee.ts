import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CashInCashOutFeeService } from './cash-in-cash-out-fee.service';
import { CashInCashOutFeeDto, CashInCashOutFeeWriteDto, Operators } from './cash-in-cash-out-fee.model';
import { WalletBalance } from '../walletbalance/walletbalance.model';

@Component({
  selector: 'app-cash-in-cash-out-fee',
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-in-cash-out-fee.html',
  styleUrl: './cash-in-cash-out-fee.css'
})
export class CashInCashOutFeeComponent implements OnInit, OnDestroy {
  private readonly feeService = inject(CashInCashOutFeeService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();

  readonly Number = Number;
  readonly Operators = Operators;
  readonly fees = signal<CashInCashOutFeeDto[]>([]);
  readonly walletBalances = signal<WalletBalance[]>([]);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalFees = signal(0);
  readonly totalPages = signal(1);
  readonly loading = signal(false);
  readonly showModal = signal(false);
  readonly isEditing = signal(false);
  readonly editingFee = signal<CashInCashOutFeeDto | null>(null);
  readonly form = signal<CashInCashOutFeeWriteDto>({
    productCode: '',
    startAmount: 0,
    endAmount: 0,
    fee: 0,
    walletBalanceId: null,
    operator: Operators.add
  });
  readonly feeRows = signal<CashInCashOutFeeWriteDto[]>([]);
  readonly confirmationModal = signal({ open: false, type: '' as 'update' | 'delete' | '', title: '', message: '' });
  readonly resultModal = signal({ open: false, type: '' as 'success' | 'error' | '', title: '', message: '' });
  readonly pendingDeleteFee = signal<CashInCashOutFeeDto | null>(null);
  readonly displayedFees = computed(() => this.fees());

  readonly operatorOptions = [
    { value: Operators.add, label: 'add' },
    { value: Operators.subtract, label: 'subtract' },
    { value: Operators.multiply, label: 'multiply' },
    { value: Operators.divide, label: 'divide' }
  ];

  ngOnInit(): void {
    this.searchSubject$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage.set(1);
      this.loadFees();
    });
    this.authService.waitForAuthentication().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadFees();
        this.loadWalletBalances();
      },
      error: error => console.error('Authentication failed:', error)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWalletBalances(): void {
    this.feeService.getAllLatestWalletBalances().pipe(takeUntil(this.destroy$)).subscribe({
      next: balances => this.walletBalances.set(balances ?? []),
      error: error => console.error('Error loading wallet balances:', error)
    });
  }

  loadFees(): void {
    this.loading.set(true);
    const query = this.searchTerm().trim();
    const request = query ? this.feeService.searchFees(query, this.currentPage(), this.pageSize()) : this.feeService.getFees(this.currentPage(), this.pageSize());
    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        this.fees.set(response.items ?? []);
        this.totalFees.set(response.totalCount ?? 0);
        this.totalPages.set(Math.max(response.totalPages || Math.ceil((response.totalCount ?? 0) / this.pageSize()), 1));
        this.loading.set(false);
      },
      error: error => {
        console.error('Error loading cash-in/cash-out fees:', error);
        this.loading.set(false);
        this.showResultModal('error', 'Load failed', 'The fee rules could not be loaded. Please try again.');
      }
    });
  }

  getWalletDisplayName(fee: CashInCashOutFeeDto): string {
    if (fee.walletName) return fee.walletName;
    if (fee.walletBalance?.walletName) return fee.walletBalance.walletName;
    if (fee.walletBalanceId) {
      const found = this.walletBalances().find(w => w.id === fee.walletBalanceId);
      if (found) return found.walletName;
    }
    return '-';
  }

  getOperatorDisplayName(op: Operators | number | string | undefined | null): string {
    if (op === 0 || op === '0' || op === 'add') return 'add';
    if (op === 1 || op === '1' || op === 'subtract') return 'subtract';
    if (op === 2 || op === '2' || op === 'multiply') return 'multiply';
    if (op === 3 || op === '3' || op === 'divide') return 'divide';
    return 'add';
  }

  onSearchChange(): void { this.searchSubject$.next(this.searchTerm()); }
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) { this.currentPage.set(page); this.loadFees(); }
  }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }
  prevPage(): void { this.goToPage(this.currentPage() - 1); }

  private createEmptyRow(): CashInCashOutFeeWriteDto {
    return {
      productCode: '',
      startAmount: 0,
      endAmount: 0,
      fee: 0,
      walletBalanceId: null,
      operator: Operators.add
    };
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingFee.set(null);
    this.feeRows.set([this.createEmptyRow()]);
    if (this.walletBalances().length === 0) {
      this.loadWalletBalances();
    }
    this.showModal.set(true);
  }

  openEditModal(fee: CashInCashOutFeeDto): void {
    this.isEditing.set(true);
    this.editingFee.set(fee);
    if (this.walletBalances().length === 0) {
      this.loadWalletBalances();
    }
    let opValue: number = Operators.add;
    if (typeof fee.operator === 'number') {
      opValue = fee.operator;
    } else if (typeof fee.operator === 'string') {
      const mapped = (Operators as any)[fee.operator];
      if (mapped !== undefined) opValue = Number(mapped);
      else if (!isNaN(Number(fee.operator))) opValue = Number(fee.operator);
    }

    console.log('Editing fee:', fee, 'Operator value:', opValue);
    // Ensure walletBalanceId is a number for proper <select> matching
    const wbId = fee.walletBalanceId ?? fee.walletBalance?.id ?? null;
    this.form.set({
      productCode: fee.productCode ?? '',
      productId: fee.productId,
      startAmount: fee.startAmount,
      endAmount: fee.endAmount,
      fee: fee.fee,
      walletBalanceId: wbId !== null && wbId !== undefined ? Number(wbId) : null,
      operator: opValue
    });
    this.showModal.set(true);
  }

  updateForm(field: keyof CashInCashOutFeeWriteDto, value: any): void {
    if (field === 'productCode') {
      this.form.update(current => ({ ...current, productCode: String(value ?? '') }));
      return;
    }
    if (field === 'walletBalanceId') {
      const val = value === null || value === '' || value === 'null' ? null : Number(value);
      this.form.update(current => ({ ...current, walletBalanceId: val }));
      return;
    }
    if (field === 'operator') {
      this.form.update(current => ({ ...current, operator: Number(value) }));
      return;
    }
    const numericValue = Number(value);
    this.form.update(current => ({ ...current, [field]: Number.isFinite(numericValue) ? numericValue : 0 }));
  }

  updateRow(index: number, field: keyof CashInCashOutFeeWriteDto, value: any): void {
    const rows = [...this.feeRows()];
    if (!rows[index]) return;

    if (field === 'productCode') {
      rows[index] = { ...rows[index], productCode: String(value ?? '') };
    } else if (field === 'walletBalanceId') {
      const val = value === null || value === '' || value === 'null' ? null : Number(value);
      rows[index] = { ...rows[index], walletBalanceId: val };
    } else if (field === 'operator') {
      rows[index] = { ...rows[index], operator: Number(value) };
    } else {
      const numericValue = Number(value);
      rows[index] = { ...rows[index], [field]: Number.isFinite(numericValue) ? numericValue : 0 };
    }

    this.feeRows.set(rows);
    this.addRowIfNeeded(index);
  }

  addRowIfNeeded(index: number): void {
    const rows = this.feeRows();
    if (index === rows.length - 1) {
      const last = rows[rows.length - 1];
      const hasData = (last.productCode && last.productCode.trim() !== '') ||
                      last.startAmount > 0 ||
                      last.endAmount > 0 ||
                      last.fee > 0 ||
                      (last.walletBalanceId !== null && last.walletBalanceId !== undefined);
      if (hasData) {
        this.feeRows.update(current => [...current, this.createEmptyRow()]);
      }
    }
  }

  removeRow(index: number): void {
    const rows = [...this.feeRows()];
    if (index < 0 || index >= rows.length) return;
    rows.splice(index, 1);
    if (rows.length === 0) {
      rows.push(this.createEmptyRow());
    }
    this.feeRows.set(rows);
  }

  validateRow(row: CashInCashOutFeeWriteDto): string | null {
    if (!row.productCode || row.productCode.trim() === '') {
      return 'Product code is required.';
    }
    if (row.startAmount < 0) {
      return 'Start amount must be 0 or greater.';
    }
    if (row.endAmount < row.startAmount) {
      return 'End amount must be at least the start amount.';
    }
    if (row.fee < 0) {
      return 'Fee must be 0 or greater.';
    }
    return null;
  }

  closeModal(): void { this.showModal.set(false); this.editingFee.set(null); }

  saveFee(): void {
    if (this.isEditing() && this.editingFee()) {
      if (!this.isValidEditForm()) return;
      this.confirmationModal.set({ open: true, type: 'update', title: 'Confirm update', message: 'Are you sure you want to update this fee rule?' });
      return;
    }
    this.saveMultipleFees();
  }

  saveMultipleFees(): void {
    const rows = this.feeRows();
    const toSave = rows.filter(r => (r.productCode && r.productCode.trim() !== '') || r.startAmount > 0 || r.endAmount > 0 || r.fee > 0);
    if (toSave.length === 0) {
      this.showResultModal('error', 'No fee rules to add', 'Please fill in at least one fee rule before saving.');
      return;
    }

    for (let i = 0; i < toSave.length; i++) {
      const error = this.validateRow(toSave[i]);
      if (error) {
        this.showResultModal('error', `Row ${i + 1} invalid`, error);
        return;
      }
    }
    console.log('Saving fee rules:', toSave);
    const payload: CashInCashOutFeeWriteDto[] = toSave.map(r => ({
      productCode: r.productCode.trim(),
      startAmount: r.startAmount,
      endAmount: r.endAmount,
      fee: r.fee,
      walletBalanceId: r.walletBalanceId !== null && r.walletBalanceId !== undefined ? Number(r.walletBalanceId) : null,
      operator: Number(r.operator ?? Operators.add)
    }));

    this.feeService.addFees(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadFees();
        this.showResultModal('success', 'Fee rules added', 'The fee rules were added successfully.');
      },
      error: error => {
        console.error('Error adding fee rules:', error);
        this.showResultModal('error', 'Add failed', 'The fee rules could not be added. Please try again.');
      }
    });
  }

  deleteFee(fee: CashInCashOutFeeDto): void {
    this.pendingDeleteFee.set(fee);
    this.confirmationModal.set({ open: true, type: 'delete', title: 'Confirm delete', message: 'Are you sure you want to delete this fee rule?' });
  }

  confirmAction(): void {
    const confirmation = this.confirmationModal();
    if (confirmation.type === 'delete' && this.pendingDeleteFee()) {
      this.feeService.deleteFee(this.pendingDeleteFee()!.id).subscribe({
        next: () => { this.closeConfirmationModal(); this.pendingDeleteFee.set(null); this.loadFees(); this.showResultModal('success', 'Fee deleted', 'The fee rule was deleted successfully.'); },
        error: error => { console.error('Error deleting fee:', error); this.closeConfirmationModal(); this.showResultModal('error', 'Delete failed', 'The fee rule could not be deleted. Please try again.'); }
      });
    } else if (confirmation.type === 'update' && this.editingFee()) {
      this.feeService.updateFee(this.editingFee()!.id, this.form()).subscribe({
        next: () => { this.closeConfirmationModal(); this.closeModal(); this.loadFees(); this.showResultModal('success', 'Fee updated', 'The fee rule was updated successfully.'); },
        error: error => { console.error('Error updating fee:', error); this.closeConfirmationModal(); this.showResultModal('error', 'Update failed', 'The fee rule could not be updated. Please try again.'); }
      });
    }
  }

  closeConfirmationModal(): void { this.confirmationModal.set({ open: false, type: '', title: '', message: '' }); }
  closeResultModal(): void { this.resultModal.set({ open: false, type: '', title: '', message: '' }); }
  private showResultModal(type: 'success' | 'error', title: string, message: string): void { this.resultModal.set({ open: true, type, title, message }); }

  private isValidEditForm(): boolean {
    const value = this.form();
    if (!value.productCode?.trim() || value.startAmount < 0 || value.endAmount < value.startAmount || value.fee < 0) {
      this.showResultModal('error', 'Invalid fee rule', 'Enter a product code and valid non-negative amounts. End amount must be at least the start amount.');
      return false;
    }
    return true;
  }

  getPagesArray(): number[] { return Array.from({ length: this.totalPages() }, (_, index) => index + 1); }
}