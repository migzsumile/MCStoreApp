import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { Stock, GetAllStocksResponse, StockListPayload } from './stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl + 'api/Stock/';
  private commonService = inject(CommonService);

  getStocks(pageNumber: number = 1, pageSize: number = 10, search: string = ''): Observable<GetAllStocksResponse> {
    let url = `${this.apiUrl}GetAllStocksAvailable?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (search) {
      url = `${this.apiUrl}GetStocksByProductAsync?pageNumber=${pageNumber}&pageSize=${pageSize}&searchString=${encodeURIComponent(search)}`;
    }
    return this.commonService.get<GetAllStocksResponse>(url);
  }

  addStock(stock: StockListPayload): Observable<string> {
    return this.commonService.post<string>(this.apiUrl, stock, { responseType: 'text' });
  }

  addStocks(stocks: StockListPayload[]): Observable<string> {
    return this.commonService.post<string>(this.apiUrl, { stocks }, { responseType: 'text' });
  }

  updateStock(id: number, updates: Partial<Stock>): Observable<void> {
    const url = `${this.apiUrl}${id}`;
    return this.commonService.put<void>(url, updates, { responseType: 'text' });
  }

  deleteStock(id: number): Observable<void> {
    const url = `${this.apiUrl}${id}`;
    return this.commonService.delete<void>(url);
  }
}
