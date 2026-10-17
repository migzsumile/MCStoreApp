export interface OrderItem {
  stockId: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  comments?: string;
  isMaxQuantity?: boolean;
}

export interface OrderSearchResult {
  stockId: number;
  productCode: string;
  productName: string;
  unitPrice: number;
}

export interface OrdersProductIsDigital {
  bankFee: number;
  isDigital: number;
}