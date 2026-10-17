import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Macuy Chichai Mini Store');
  private readonly msalService = inject(MsalService);

  readonly isSidebarOpen = signal<boolean>(false);
  readonly isPasswordModalOpen = signal<boolean>(false);
  readonly isUnlocked = signal<boolean>(true); //signal<boolean>(false); //temporary change to keep the sidebar unlocked by default for testing purposes
  readonly passwordInput = signal<string>('');
  readonly passwordError = signal<string>('');
  readonly showPassword = signal<boolean>(false);

  readonly navItems: NavItem[] = [
    { label: 'Home', route: '/home', icon: '🏠', description: 'Store Dashboard' },
    { label: 'POS / New Order', route: '/orders', icon: '🛒', description: 'Point of Sale & Checkout' },
    { label: 'Orders List', route: '/orderslist', icon: '📋', description: 'Order & Transaction History' },
    { label: 'Products', route: '/product', icon: '📦', description: 'Product Catalog & Pricing' },
    { label: 'Stock Inventory', route: '/stock', icon: '📊', description: 'Stock Levels & Valuation' },
    { label: 'Cash In / Out Fees', route: '/cash-in-cash-out-fee', icon: '💳', description: 'Fee Rules Configuration' },
    { label: 'Wallet Balance', route: '/walletbalance', icon: '💰', description: 'Wallet Balances & Funding' },
    { label: 'Invoices', route: '/invoice', icon: '🧾', description: 'Customer Invoices' },
    { label: 'Reports & Insights', route: '/reports', icon: '📈', description: 'Sales & Stock Insights' }
  ];

  ngOnInit() {
    this.msalService.handleRedirectObservable().subscribe();
  }

  onHamburgerClick(): void {
    if (this.isUnlocked()) {
      this.isSidebarOpen.update(open => !open);
    } else {
      this.passwordInput.set('');
      this.passwordError.set('');
      this.isPasswordModalOpen.set(true);
    }
  }

  submitPassword(): void {
    const entered = this.passwordInput().trim();
    if (entered === 'mc0928') {
      this.isUnlocked.set(true);
      this.isPasswordModalOpen.set(false);
      this.passwordError.set('');
      this.passwordInput.set('');
      this.isSidebarOpen.set(true);
    } else {
      this.passwordError.set('Incorrect password. Please try again.');
    }
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
    this.passwordInput.set('');
    this.passwordError.set('');
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  lockMenu(): void {
    this.isUnlocked.set(false);
    this.isSidebarOpen.set(false);
  }

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }
}

