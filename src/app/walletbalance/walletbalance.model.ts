export interface WalletBalance {
  id: number;
  walletName: string;
  balance: number;
  isCurrent: boolean;
}

export type CreateWalletBalanceDto = Omit<WalletBalance, 'id'>;

export interface WalletBalanceFormModel {
  id?: number;
  walletName: string;
  balance: number;
  isCurrent: boolean;
}

/**
 * Normalizes any backend response (handling both PascalCase and camelCase properties)
 */
export function normalizeWalletBalance(raw: any): WalletBalance {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    walletName: String(raw?.walletName ?? raw?.WalletName ?? '').trim(),
    balance: Number(raw?.balance ?? raw?.Balance ?? 0),
    isCurrent: Boolean(raw?.isCurrent ?? raw?.IsCurrent ?? false)
  };
}

