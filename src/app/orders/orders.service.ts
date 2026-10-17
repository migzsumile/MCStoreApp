import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { OrderItem, OrderSearchResult, OrdersProductIsDigital } from './orders.model';
import { OrderListPagedVM } from '../orderslist/order-list.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = environment.apiUrl + 'api/orders/';
  private commonService = inject(CommonService);

  getStockOrderByCodeName(searchString: string): Observable<OrderSearchResult | null> {
    const encoded = encodeURIComponent(searchString);
    const url = `${this.apiUrl}GetStockOrderByCodeNameAsync?searchString=${encoded}`;
    return this.commonService.get<OrderSearchResult>(url);
  }

  createInvoice(customerName: string, totalAmount: number, orders: OrderItem[]): Observable<void> {
    const url = `${this.apiUrl}?customerName=${encodeURIComponent(customerName)}&totalAmount=${totalAmount}`;
    const payload = { orders };
    return this.commonService.post<void>(url, payload, { responseType: 'text' });
  }

  getBankFee(productCode: string, totalAmount: number): Observable<OrdersProductIsDigital> {
  const url = `${this.apiUrl}BankFee?productCode=${encodeURIComponent(productCode)}&amount=${totalAmount}`;
  return this.commonService.get<OrdersProductIsDigital>(url);
  }

  getTotalPriceByQuantity(productCode: string, quantity: number): Observable<OrderItem> {
    const url = `${this.apiUrl}GetTotalPriceByQuantity?productCode=${encodeURIComponent(productCode)}&quantity=${quantity}`;
    return this.commonService.get<OrderItem>(url);
  }

  getOrdersFiltered(searchString?: string, transactionDate?: string, pageNumber = 1, pageSize = 10): Observable<OrderListPagedVM> {
    const queryParts: string[] = [];
    if (searchString) {
      queryParts.push(`searchString=${encodeURIComponent(searchString)}`);
    }
    if (transactionDate) {
      queryParts.push(`transactionDate=${encodeURIComponent(transactionDate)}`);
    }
    queryParts.push(`pageNumber=${pageNumber}`);
    queryParts.push(`pageSize=${pageSize}`);

    const query = queryParts.length ? `?${queryParts.join('&')}` : '';
    const url = `${this.apiUrl}GetOrdersFiltered${query}`;
    return this.commonService.get<OrderListPagedVM>(url);
  }
}
