export interface Stock {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  initialQuantity: number;
  unitInStock: number;
  capitalPrice: number;
  unitPrice: number;
  expiryDate?: string | null;
}

export interface StockListPayload {
  // id: number;
  productId: number;
  // productCode: string;
  // productName: string;
  initialQuantity: number;
  unitInStock: number;
  capitalPrice: number;
  unitPrice: number;
  expiryDate?: string | null;
}

export interface GetAllStocksResponse {
  items: Stock[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}