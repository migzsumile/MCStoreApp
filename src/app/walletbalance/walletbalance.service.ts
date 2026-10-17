import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CommonService } from '../services/common.service';
import { WalletBalance, CreateWalletBalanceDto, normalizeWalletBalance } from './walletbalance.model';

@Injectable({
  providedIn: 'root'
})
export class WalletBalanceService {
  private readonly baseUrl = `${environment.apiUrl}api/WalletBalance`;
  private readonly commonService = inject(CommonService);

  /**
   * GET: api/WalletBalances
   * Retrieves all wallet balance records.
   */
  getAll(): Observable<WalletBalance[]> {
    return this.commonService.get<any>(this.baseUrl).pipe(
      map(res => {
        if (Array.isArray(res)) {
          return res.map(normalizeWalletBalance);
        }
        if (res && Array.isArray(res.items)) {
          return res.items.map(normalizeWalletBalance);
        }
        if (res && Array.isArray(res.data)) {
          return res.data.map(normalizeWalletBalance);
        }
        return [];
      })
    );
  }

  /**
   * GET: api/WalletBalances/{id}
   * Retrieves a wallet balance record by its integer ID.
   */
  getById(id: number): Observable<WalletBalance> {
    return this.commonService.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(normalizeWalletBalance)
    );
  }

  /**
   * POST: api/WalletBalances
   * Creates a new wallet balance record.
   */
  create(model: CreateWalletBalanceDto | WalletBalance): Observable<WalletBalance> {
    const payload = {
      walletName: model.walletName,
      balance: model.balance,
      isCurrent: model.isCurrent
    };
    return this.commonService.post<any>(this.baseUrl, payload).pipe(
      map(normalizeWalletBalance)
    );
  }

  /**
   * PUT: api/WalletBalances/{id}
   * Updates an existing wallet balance record.
   */
  update(id: number, model: WalletBalance): Observable<void> {
    const payload = {
      id: model.id,
      walletName: model.walletName,
      balance: model.balance,
      isCurrent: model.isCurrent
    };
    return this.commonService.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * DELETE: api/WalletBalances/{id}
   * Deletes a wallet balance record by ID.
   */
  delete(id: number): Observable<void> {
    return this.commonService.delete<void>(`${this.baseUrl}/${id}`);
  }
}

