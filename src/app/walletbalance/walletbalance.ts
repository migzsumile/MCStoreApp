import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletBalanceService } from './walletbalance.service';
import { AuthService } from '../services/auth.service';
import { WalletBalance, WalletBalanceFormModel } from './walletbalance.model';

@Component({
  selector: 'app-walletbalance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './walletbalance.html',
  styleUrl: './walletbalance.css'
})
export class WalletBalanceComponent implements OnInit {
  private readonly walletService = inject(WalletBalanceService);
  private readonly authService = inject(AuthService);

  // Data signals
  readonly wallets = signal<WalletBalance[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly searchTerm = signal<string>('');

  // Pagination signals
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Modal signals
  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly form = signal<WalletBalanceFormModel>({
    walletName: '',
    balance: 0,
    isCurrent: false
  });

  readonly confirmationModal = signal<{
    open: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    open: false,
    title: '',
    message: ''
  });

  readonly resultModal = signal<{
    open: boolean;
    title: string;
    message: string;
    isError?: boolean;
  }>({
    open: false,
    title: '',
    message: '',
    isError: false
  });

  // Computed properties
  readonly filteredWallets = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.wallets();
    if (!term) return list;
    return list.filter(w =>
      w.walletName.toLowerCase().includes(term) ||
      w.id.toString().includes(term)
    );
  });

  readonly totalBalance = computed(() => {
    return this.wallets().reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  });

  readonly currentWallet = computed(() => {
    return this.wallets().find(w => w.isCurrent) ?? null;
  });

  readonly totalWalletsCount = computed(() => this.wallets().length);

  readonly totalFilteredCount = computed(() => this.filteredWallets().length);

  readonly totalPages = computed(() => {
    const count = this.totalFilteredCount();
    return Math.max(1, Math.ceil(count / this.pageSize()));
  });

  readonly paginatedWallets = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredWallets().slice(start, start + size);
  });

  ngOnInit(): void {
    this.authService.waitForAuthentication().subscribe({
      next: () => this.loadWallets(),
      error: err => {
        console.error('Authentication wait error:', err);
        this.loadWallets();
      }
    });
  }

  loadWallets(): void {
    this.loading.set(true);
    this.walletService.getAll().subscribe({
      next: data => {
        this.wallets.set(data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error fetching wallet balances:', err);
        this.loading.set(false);
        this.showResult('Error', 'Unable to load wallet balances. Please verify backend connection.', true);
      }
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.form.set({
      walletName: '',
      balance: 0,
      isCurrent: this.wallets().length === 0 // Default to current if first wallet
    });
    this.showModal.set(true);
  }

  openEditModal(wallet: WalletBalance): void {
    this.isEditing.set(true);
    this.form.set({
      id: wallet.id,
      walletName: wallet.walletName,
      balance: wallet.balance,
      isCurrent: wallet.isCurrent
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  updateFormField<K extends keyof WalletBalanceFormModel>(key: K, value: WalletBalanceFormModel[K]): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  saveWallet(): void {
    const currentForm = this.form();
    const trimmedName = currentForm.walletName?.trim();

    if (!trimmedName) {
      this.showResult('Validation Error', 'Wallet Name is required.', true);
      return;
    }

    if (currentForm.balance < 0 || isNaN(Number(currentForm.balance))) {
      this.showResult('Validation Error', 'Balance must be a valid non-negative number.', true);
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && currentForm.id) {
      const payload: WalletBalance = {
        id: currentForm.id,
        walletName: trimmedName,
        balance: Number(currentForm.balance),
        isCurrent: Boolean(currentForm.isCurrent)
      };

      this.walletService.update(currentForm.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadWallets();
          this.showResult('Success', 'Wallet balance updated successfully.');
        },
        error: err => {
          console.error('Error updating wallet balance:', err);
          this.saving.set(false);
          this.showResult('Error', 'Failed to update wallet balance. Please try again.', true);
        }
      });
    } else {
      const payload = {
        walletName: trimmedName,
        balance: Number(currentForm.balance),
        isCurrent: Boolean(currentForm.isCurrent)
      };

      this.walletService.create(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadWallets();
          this.showResult('Success', 'Wallet balance created successfully.');
        },
        error: err => {
          console.error('Error creating wallet balance:', err);
          this.saving.set(false);
          this.showResult('Error', 'Failed to create wallet balance. Please try again.', true);
        }
      });
    }
  }

  setAsCurrent(wallet: WalletBalance): void {
    if (wallet.isCurrent) return;

    this.walletService.update(wallet.id, {
      ...wallet,
      isCurrent: true
    }).subscribe({
      next: () => {
        this.loadWallets();
        this.showResult('Success', `"${wallet.walletName}" is now the active current wallet.`);
      },
      error: err => {
        console.error('Error setting current wallet:', err);
        this.showResult('Error', 'Failed to set wallet as current. Please try again.', true);
      }
    });
  }

  deleteWallet(wallet: WalletBalance): void {
    this.confirmationModal.set({
      open: true,
      title: 'Delete Wallet Balance',
      message: `Are you sure you want to delete "${wallet.walletName}" with a balance of ₱${wallet.balance.toFixed(2)}? This action cannot be undone.`,
      onConfirm: () => {
        this.walletService.delete(wallet.id).subscribe({
          next: () => {
            this.closeConfirmationModal();
            this.loadWallets();
            this.showResult('Deleted', `Wallet "${wallet.walletName}" was successfully deleted.`);
          },
          error: err => {
            console.error('Error deleting wallet balance:', err);
            this.closeConfirmationModal();
            this.showResult('Error', 'Failed to delete wallet balance. Please try again.', true);
          }
        });
      }
    });
  }

  confirmAction(): void {
    const action = this.confirmationModal().onConfirm;
    if (action) {
      action();
    }
  }

  closeConfirmationModal(): void {
    this.confirmationModal.set({
      open: false,
      title: '',
      message: ''
    });
  }

  showResult(title: string, message: string, isError: boolean = false): void {
    this.resultModal.set({
      open: true,
      title,
      message,
      isError
    });
  }

  closeResultModal(): void {
    this.resultModal.set({
      open: false,
      title: '',
      message: '',
      isError: false
    });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  getPagesArray(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}

