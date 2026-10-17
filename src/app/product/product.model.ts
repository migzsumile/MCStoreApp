export interface Product {
  id: number;
  productCode: string;
  productName: string;
  capitalPrice: number;
  unitInStock: number;
  unitPrice: number;
  expiryDate?: string | null;
}

export interface GetAllProductsResponse {
  items: Product[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}