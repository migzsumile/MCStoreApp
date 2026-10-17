import { Injectable, signal, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, GetAllProductsResponse } from './product.model';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { CommonService } from '../services/common.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl + 'api/product/';
  private commonService = inject(CommonService);
  private authService = inject(AuthService);

  constructor() {}

  getProducts(pageNumber: number = 1, pageSize: number = 10, search: string = ''): Observable<GetAllProductsResponse> {
    let url = `${this.apiUrl}getAllProducts?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (search) {
      url = `${this.apiUrl}SearchProduct?searchString=${encodeURIComponent(search)}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
    }
    return this.commonService.get<GetAllProductsResponse>(url);
  }

  getProductByProductCode(productCode: string): Observable<Product> {
    const url = `${this.apiUrl}GetProductByProductCode?productCode=${encodeURIComponent(productCode)}`;
    return this.commonService.get<Product>(url);
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Observable<Product> {
    return this.commonService.post<Product>(this.apiUrl, product);
  }

  // Add multiple products using ProductListDTO wrapper expected by .NET API
  addProducts(products: Array<Omit<Product, 'id' | 'createdAt' | 'expiryDate'>>): Observable<Product[]> {
    const url = `${this.apiUrl}AddProduct`;
    const body = { products };
    return this.commonService.post<Product[]>(url, body);
  }

  updateProduct(id: number, updates: Partial<Product>): Observable<void> {
    const url = `${this.apiUrl}${id}`;
    return this.commonService.put<void>(url, updates);
  }

  deleteProduct(id: number): Observable<void> {
    const url = `${this.apiUrl}${id}`;
    return this.commonService.delete<void>(url);
  }
}