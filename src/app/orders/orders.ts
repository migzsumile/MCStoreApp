import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from './orders.service';
import { OrderItem, OrderSearchResult } from './orders.model';
import { Subject, debounceTime } from 'rxjs';

type ResultType = 'success' | 'error' | '';

interface ResultModalState {
  open: boolean;
  type: ResultType;
  title: string;
  message: string;
}

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private quantityUpdate$ = new Subject<{ index: number; rawValue: string | number; requestId: number }>();
  private latestQuantityRequestId = 0;

  orderQuery = signal('');
  customerName = signal('');
  orderItems = signal<OrderItem[]>([]);
  orderLoading = signal(false);
  savingInvoice = signal(false);
  resultModal = signal<ResultModalState>({ open: false, type: '', title: '', message: '' });

  totalPayment = computed(() => this.orderItems().reduce((sum, item) => sum + item.totalPrice, 0));
  isCreateDisabled = computed(() => this.orderItems().length === 0);

  private readonly sessionKey = 'angularstore-orders-cache';

  ngOnInit() {
    this.loadCachedOrders();

    this.quantityUpdate$
      .pipe(debounceTime(500))
      .subscribe(({ index, rawValue, requestId }) => {
        this.processOrderQuantity(index, rawValue, requestId);
      });
  }

  searchAndAddOrder() {
    const query = this.orderQuery().trim();
    if (!query) {
      return;
    }

    this.orderLoading.set(true);
    this.ordersService.getStockOrderByCodeName(query).subscribe({
      next: (response: OrderSearchResult | null | undefined) => {
        this.orderLoading.set(false);
        console.log('Order search result:', response);

        if (!response || typeof response !== 'object') {
          this.showResult(
            'error',
            'Product not found',
            'No product was found for the entered barcode or name.'
          );
          return;
        }

          this.addOrderFromResult(response);
          this.orderQuery.set('');
        },
          error: (error: unknown) => {
            this.orderLoading.set(false);
            console.error('Orders search failed', error);
            this.showResult('error', 'Search failed', 'Unable to search for order items. Please try again.');
        }
      });
  }

  updateOrderQuantity(index: number, rawValue: string | number) {
    const requestId = ++this.latestQuantityRequestId;
    this.quantityUpdate$.next({ index, rawValue, requestId });
  }

  private processOrderQuantity(index: number, rawValue: string | number, requestId: number) {
    const quantity = Number(rawValue);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    const items = [...this.orderItems()];
    const item = items[index];

    if (!item) {
      return;
    }

    const baseTotal = quantity * item.unitPrice;
    items[index] = { ...item, quantity, totalPrice: baseTotal };
    this.orderItems.set(items);
    this.saveCachedOrders();

    this.ordersService.getBankFee(item.productCode, quantity).subscribe({
      next: (response) => {
        if (requestId !== this.latestQuantityRequestId) {
          return;
        }

        const currentItems = [...this.orderItems()];
        const currentItem = currentItems[index];

        if (!currentItem) {
          return;
        }

        if (response.isDigital) {
          const totalPrice = quantity + response.bankFee;
          currentItems[index] = { ...currentItem, quantity, totalPrice };
          this.orderItems.set(currentItems);
          this.saveCachedOrders();
          return;
        }

        this.ordersService.getTotalPriceByQuantity(item.productCode, quantity).subscribe({
          next: (response) => {
            if (requestId !== this.latestQuantityRequestId) {
              return;
            }

            currentItems[index] = { ...currentItem, 
                        quantity, 
                        totalPrice: response.totalPrice ?? baseTotal };
            this.orderItems.set(currentItems);
            this.saveCachedOrders();
          },
          error: (error: unknown) => {
            console.error('Stock allocation failed', error);
            if (error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 400) {
              if (requestId !== this.latestQuantityRequestId) {
                return;
              }

              const fallbackItems = [...currentItems];
              fallbackItems[index] = {
                ...currentItem,
                quantity: 1,
                totalPrice: 1 * currentItem.unitPrice,
              };
              this.orderItems.set(fallbackItems);
              this.saveCachedOrders();
              this.showResult('error', 'Insufficient Stock', 'Insufficient stock available. Please reduce the quantity or check back later.');
              return;
            }

            this.showResult('error', 'Allocation failed', 'Unable to allocate stocks for the product.');
          }
        });
      },
      error: (error: unknown) => {
        console.error('Bank fee lookup failed', error);
        if (requestId !== this.latestQuantityRequestId) {
          return;
        }

        const fallbackItems = [...this.orderItems()];
        const currentItem = fallbackItems[index];
        if (currentItem) {
          fallbackItems[index] = { ...currentItem, quantity, totalPrice: baseTotal };
          this.orderItems.set(fallbackItems);
          this.saveCachedOrders();
        }
      }
    });
  }


  removeOrderItem(index: number) {
    const updated = this.orderItems().filter((_, idx) => idx !== index);
    this.orderItems.set(updated);
    this.saveCachedOrders();
  }

  createInvoice() {
    if (this.isCreateDisabled()) {
      return;
    }

    this.savingInvoice.set(true);
    const payloadItems = this.orderItems();
    this.ordersService.createInvoice(this.customerName().trim(), this.totalPayment(), payloadItems).subscribe({
      next: () => {
        this.savingInvoice.set(false);
        this.clearOrders();
        this.showResult('success', 'Invoice created', 'The order has been saved successfully.');
      },
      error: (error: unknown) => {
        this.savingInvoice.set(false);
        console.error('Invoice creation failed', error);
        this.showResult('error', 'Save failed', 'Unable to create the invoice at this time. Please check quantities and try again later.');
      }
    });
  }

  closeResultModal() {
    this.resultModal.set({ open: false, type: '', title: '', message: '' });
  }

  private loadCachedOrders() {
    const raw = sessionStorage.getItem(this.sessionKey);
    if (!raw) {
      return;
    }

    try {
      const cached = JSON.parse(raw) as OrderItem[];
      this.orderItems.set(cached.map(item => ({
        ...item,
        quantity: item.quantity >= 1 ? item.quantity : 1,
        totalPrice: item.totalPrice ?? item.unitPrice * item.quantity,
      })));
    } catch {
      sessionStorage.removeItem(this.sessionKey);
    }
  }

  private saveCachedOrders() {
    sessionStorage.setItem(this.sessionKey, JSON.stringify(this.orderItems()));
  }

  updateOrderComments(index: number, value: string) {
    const items = [...this.orderItems()];
    const item = items[index];
    if (!item) {
      return;
    }

    items[index] = { ...item, comments: value ?? '' };
    this.orderItems.set(items);
    this.saveCachedOrders();
  }

  private clearOrders() {
    this.orderItems.set([]);
    this.customerName.set('');
    sessionStorage.removeItem(this.sessionKey);
  }

  private addOrderFromResult(result: OrderSearchResult) {
    const safeResult = {
      stockId: result?.stockId ?? 0,
      productCode: result?.productCode ?? 'Unknown code',
      productName: result?.productName ?? 'Unknown product',
      unitPrice: Number(result?.unitPrice ?? 0),
    };

    const items = [...this.orderItems()];

    items.push({
      ...safeResult,
      quantity: 1,
      totalPrice: safeResult.unitPrice,
      comments: '',
    });

    // const existingIndex = items.findIndex(item => item.stockId === safeResult.stockId);
    // if (existingIndex >= 0) {
    //   const existing = items[existingIndex];
    //   const quantity = existing.quantity + 1;

    //   //Bug: need to update the totalPrice based on the new quantity and unitPrice

    //   items[existingIndex] = {
    //     ...existing,
    //     quantity,
    //     totalPrice: quantity * safeResult.unitPrice,
    //   };
    // } else {
    //   items.push({
    //     ...safeResult,
    //     quantity: 1,
    //     totalPrice: safeResult.unitPrice,
    //     comments: '',
    //   });
    // }

    this.orderItems.set(items);
    this.saveCachedOrders();
  }

  private showResult(type: 'success' | 'error', title: string, message: string) {
    this.resultModal.set({ open: true, type, title, message });
  }
}

