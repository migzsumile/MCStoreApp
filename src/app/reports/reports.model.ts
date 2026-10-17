export interface SalesReportVM {
  startDate: string;
  endDate: string;
  netSalesNormal: number;
  costOfNormalProductSold: number;
  margin: number;
  netSalesDigital: number;
  profit: number;
}

export interface TopMovingProductVM {
  product?: string | null;
  quantity: number;
  unitPrice: number;
  capitalPrice: number;
  margin: number;
}

export interface StockInsightsVM {
  startDate: string;
  endDate: string;
  totalInventoryPrice: number;
  inventoryCost: number;
  potentialSalesMargin: number;
  topMovingProducts: TopMovingProductVM[];
}

export type ReportDurationPreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
export type ReportTab = 'all' | 'sales' | 'stock';

