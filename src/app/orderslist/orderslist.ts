import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../orders/orders.service';
import { OrderListItemVM } from './order-list.model';

@Component({
  selector: 'app-orderslist',
  imports: [CommonModule, FormsModule],
  templateUrl: './orderslist.html',
  styleUrl: './orderslist.css',
})
export class OrdersListComponent implements OnInit {
  private ordersService = inject(OrdersService);

  searchString = signal('');
  transactionDate = signal('');
  orderItems = signal<OrderListItemVM[]>([]);
  loading = signal(false);
  pageNumber = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  totalCount = signal(0);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);

    const searchString = this.searchString().trim();
    const transactionDate = this.transactionDate().trim();

    this.ordersService
      .getOrdersFiltered(
        searchString || undefined,
        transactionDate || undefined,
        this.pageNumber(),
        this.pageSize()
      )
      .subscribe({
        next: (response) => {
          this.orderItems.set(response.items);
          this.totalCount.set(response.totalCount);
          this.totalPages.set(Math.max(response.totalPages || 1, 1));
          this.loading.set(false);
        },
        error: (error: unknown) => {
          console.error('Orders list load failed', error);
          this.loading.set(false);
        }
      });
  }

  searchOrders() {
    this.pageNumber.set(1);
    this.loadOrders();
  }

  clearFilters() {
    this.searchString.set('');
    this.transactionDate.set('');
    this.pageNumber.set(1);
    this.loadOrders();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.pageNumber.set(page);
    this.loadOrders();
  }
}
