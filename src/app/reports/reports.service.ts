import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { SalesReportVM, StockInsightsVM } from './reports.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly apiUrl = environment.apiUrl + 'api/reports/';
  private readonly commonService = inject(CommonService);

  getSalesReport(startDate?: string, endDate?: string): Observable<SalesReportVM> {
    let url = `${this.apiUrl}sales`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.commonService.get<SalesReportVM>(url);
  }

  getStockInsights(startDate?: string, endDate?: string): Observable<StockInsightsVM> {
    let url = `${this.apiUrl}stockinsights`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.commonService.get<StockInsightsVM>(url);
  }
}

