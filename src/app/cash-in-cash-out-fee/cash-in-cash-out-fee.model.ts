import { WalletBalance } from '../walletbalance/walletbalance.model';

export enum Operators {
  add = 0,
  subtract = 1,
  multiply = 2,
  divide = 3
}

export interface CashInCashOutFeeDto {
  id: number;
  productId?: number;
  productCode?: string | null;
  productName?: string | null;
  startAmount: number;
  endAmount: number;
  fee: number;
  walletBalanceId?: number | null;
  walletName?: string | null;
  walletBalance?: WalletBalance | null;
  operator?: Operators | number | string;
}

export interface CashInCashOutFeeWriteDto {
  productCode: string;
  productId?: number;
  startAmount: number;
  endAmount: number;
  fee: number;
  walletBalanceId?: number | null;
  operator?: Operators | number;
}

export interface GetAllCashInCashOutFeesResponse {
  items: CashInCashOutFeeDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
