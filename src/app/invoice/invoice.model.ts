export interface InvoiceSummary {
  id: number;
  customerName: string;
  totalAmount: number;
  transactionDate: Date;
  status: string;
}

export interface InvoiceOrder {
  orderId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

export interface InvoiceListResponse {
  items: InvoiceSummary[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
