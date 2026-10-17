export interface OrderListItemVM {
  orderId: number;
  stockId: number;
  invoiceId: number;
  productCode?: string;
  productName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  transactionDate: string;
  comments?: string;
  orderStatus?: string;
}

export interface OrderListPagedVM {
  items: OrderListItemVM[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
