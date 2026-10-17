import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from './invoice.service';
import { AuthService } from '../services/auth.service';
import { InvoiceSummary, InvoiceOrder } from './invoice.model';

@Component({
  selector: 'app-invoice',
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice.html',
  styleUrl: './invoice.css',
})
export class InvoiceComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);

  filterDate = signal('');
  invoices = signal<InvoiceSummary[]>([]);
  invoiceOrders = signal<InvoiceOrder[]>([]);
  loadingInvoices = signal(false);
  loadingOrders = signal(false);
  selectedInvoice = signal<InvoiceSummary | null>(null);
  resultModal = signal({ open: false, title: '', message: '' });
  voidingInvoiceId = signal<number | null>(null);
  voidingOrderIds = signal<number[]>([]);

  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  totalInvoices = signal(0);

  invoiceText = computed(() => this.selectedInvoice() ? `${this.selectedInvoice()?.id} (${this.selectedInvoice()?.customerName})` : 'No invoice selected');

  ngOnInit() {
    this.authService.waitForAuthentication().subscribe({
      next: () => this.loadInvoices(),
      error: (error: unknown) => {
        console.error('Authentication failed:', error);
        this.showResult('Please log in to load invoices.');
      }
    });
  }

  searchByDate() {
    this.currentPage.set(1);
    this.loadInvoices();
  }

  loadInvoices() {
    this.loadingInvoices.set(true);
    const date = this.filterDate().trim();

    const invoices$ = date
      ? this.invoiceService.getInvoicesByDate(date, this.currentPage(), this.pageSize())
      : this.invoiceService.getInvoices(this.currentPage(), this.pageSize());

    invoices$.subscribe({
      next: (response) => {
        this.invoices.set(response.items);
        console.log('Invoices loaded:', this.invoices());
        this.totalInvoices.set(response.totalCount);
        this.totalPages.set(Math.max(response.totalPages || 1, 1));
        this.loadingInvoices.set(false);
      },
      error: (error: unknown) => {
        console.error('Invoice load failed', error);
        this.loadingInvoices.set(false);
        this.showResult('Unable to load invoices.');
      }
    });
  }

  viewInvoiceOrders(invoice: InvoiceSummary) {
    this.selectedInvoice.set(invoice);
    this.loadingOrders.set(true);
    this.invoiceService.getInvoiceOrders(invoice.id).subscribe({
      next: (orders) => {
        this.invoiceOrders.set(orders);
        this.loadingOrders.set(false);
      },
      error: (error: unknown) => {
        console.error('Invoice orders failed', error);
        this.loadingOrders.set(false);
        this.showResult('Unable to load invoice orders.');
      }
    });
  }

  voidInvoice(invoice: InvoiceSummary) {
    if (invoice.status.toLowerCase() === 'void' || this.voidingInvoiceId()) {
      return;
    }

    this.voidingInvoiceId.set(invoice.id);
    this.invoiceService.voidInvoice(invoice.id).subscribe({
      next: () => {
        const updated = this.invoices().map((item) =>
          item.id === invoice.id ? { ...item, status: 'Void' } : item
        );
        this.invoices.set(updated);
        if (this.selectedInvoice()?.id === invoice.id) {
          this.selectedInvoice.set({ ...invoice, status: 'Void' });
        }
        this.showResult('Invoice has been voided.');
        this.voidingInvoiceId.set(null);
      },
      error: (error: unknown) => {
        console.error('Void invoice failed', error);
        this.showResult('Unable to void invoice.');
        this.voidingInvoiceId.set(null);
      }
    });
  }

  voidOrder(order: InvoiceOrder) {
    if (order.status.toLowerCase() === 'void' || this.voidingOrderIds().includes(order.orderId)) {
      return;
    }

    this.voidingOrderIds.set([...this.voidingOrderIds(), order.orderId]);
    this.invoiceService.voidOrder(order.orderId).subscribe({
      next: () => {
        const updated = this.invoiceOrders().map((item) =>
          item.orderId === order.orderId ? { ...item, status: 'Void' } : item
        );
        this.invoiceOrders.set(updated);
        this.showResult('Order has been voided.');
        this.voidingOrderIds.set(this.voidingOrderIds().filter((id) => id !== order.orderId));
      },
      error: (error: unknown) => {
        console.error('Void order failed', error);
        this.showResult('Unable to void order.');
        this.voidingOrderIds.set(this.voidingOrderIds().filter((id) => id !== order.orderId));
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
    this.loadInvoices();
  }

  closeResultModal() {
    this.resultModal.set({ open: false, title: '', message: '' });
  }

  private showResult(message: string) {
    this.resultModal.set({ open: true, title: 'Error', message });
  }
}

