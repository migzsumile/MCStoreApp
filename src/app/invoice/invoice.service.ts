import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';
import { environment } from '../../environments/environment';
import { InvoiceListResponse, InvoiceOrder } from './invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = environment.apiUrl + 'api/invoice/';
  private commonService = inject(CommonService);

  getInvoices(pageNumber: number = 1, pageSize: number = 10): Observable<InvoiceListResponse> {
    const url = `${this.apiUrl}ListInvoicesByAsync?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.commonService.get<InvoiceListResponse>(url);
  }

  getInvoicesByDate(date: string, pageNumber: number = 1, pageSize: number = 10): Observable<InvoiceListResponse> {
    const queryDate = encodeURIComponent(date);
    const url = `${this.apiUrl}ListInvoicesByDateAsync?dateTime=${queryDate}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.commonService.get<InvoiceListResponse>(url);
  }

  getInvoiceOrders(invoiceId: number): Observable<InvoiceOrder[]> {
    const url = `${this.apiUrl}GetInvoiceOrdersAsync?invoiceId=${invoiceId}`;
    return this.commonService.get<InvoiceOrder[]>(url);
  }

  voidInvoice(invoiceId: number): Observable<void> {
    const url = `${this.apiUrl}VoidInvoiceAsync?invoiceId=${invoiceId}`;
    return this.commonService.put<void>(url, null as any, { responseType: 'text' });
  }

  voidOrder(orderId: number): Observable<void> {
    const url = `${this.apiUrl}VoidOrderAsync?orderId=${orderId}`;
    return this.commonService.put<void>(url, null as any, { responseType: 'text' });
  }
}
