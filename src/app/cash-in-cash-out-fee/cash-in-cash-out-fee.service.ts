import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { CashInCashOutFeeDto, CashInCashOutFeeWriteDto, GetAllCashInCashOutFeesResponse } from './cash-in-cash-out-fee.model';
import { WalletBalance } from '../walletbalance/walletbalance.model';

@Injectable({ providedIn: 'root' })
export class CashInCashOutFeeService {
  private readonly apiUrl = environment.apiUrl + 'api/CashInCashOutFee/';
  private readonly commonService = inject(CommonService);

  getAllLatestWalletBalances(): Observable<WalletBalance[]> {
    return this.commonService.get<WalletBalance[]>(`${this.apiUrl}GetAllLatestWalletBalancesAsync`);
  }

  getFees(pageNumber = 1, pageSize = 10): Observable<GetAllCashInCashOutFeesResponse> {
    return this.commonService.get<GetAllCashInCashOutFeesResponse>(`${this.apiUrl}GetAll?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  getFeeById(id: number): Observable<CashInCashOutFeeDto> {
    return this.commonService.get<CashInCashOutFeeDto>(`${this.apiUrl}GetById?id=${id}`);
  }

  getFeesByProductId(productId: number, pageNumber = 1, pageSize = 10): Observable<GetAllCashInCashOutFeesResponse> {
    return this.commonService.get<GetAllCashInCashOutFeesResponse>(`${this.apiUrl}GetByProductId?productId=${productId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  searchFees(query: string, pageNumber = 1, pageSize = 10): Observable<GetAllCashInCashOutFeesResponse> {
    return this.commonService.get<GetAllCashInCashOutFeesResponse>(`${this.apiUrl}Search?q=${encodeURIComponent(query)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  addFees(items: CashInCashOutFeeWriteDto[]): Observable<CashInCashOutFeeDto[]> {
    return this.commonService.post<CashInCashOutFeeDto[]>(`${this.apiUrl}Add`, items);
  }

  updateFee(id: number, item: CashInCashOutFeeWriteDto): Observable<void> {
    return this.commonService.put<void>(`${this.apiUrl}Update/${id}`, item);
  }

  deleteFee(id: number): Observable<void> {
    return this.commonService.delete<void>(`${this.apiUrl}Delete/${id}`);
  }
}