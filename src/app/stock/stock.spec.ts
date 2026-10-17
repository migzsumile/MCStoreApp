import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StockComponent } from './stock';
import { StockService } from './stock.service';
import { AuthService } from '../services/auth.service';
import { CommonService } from '../services/common.service';
import { ProductService } from '../product/product.service';

describe('StockComponent', () => {
  let component: StockComponent;
  let fixture: ComponentFixture<StockComponent>;
  let stockService: any;
  let authService: any;
  let productService: any;

  beforeEach(async () => {
    stockService = {
      getStocks: vi.fn(),
      addStock: vi.fn(),
      updateStock: vi.fn(),
      deleteStock: vi.fn(),
    };
    authService = {
      waitForAuthentication: vi.fn(),
    };
    productService = {
      getProductByProductCode: vi.fn(),
    };
    authService.waitForAuthentication.mockReturnValue(of(true));
    stockService.getStocks.mockReturnValue(of({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 }));
    productService.getProductByProductCode.mockReturnValue(of({ id: 10, productCode: 'P001', productName: 'Sample Product', capitalPrice: 5, unitInStock: 10, unitPrice: 6 }));

    await TestBed.configureTestingModule({
      imports: [StockComponent],
      providers: [
        { provide: StockService, useValue: stockService },
        { provide: AuthService, useValue: authService },
        { provide: ProductService, useValue: productService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require confirmation before deleting a stock item', () => {
    const stock = {
      id: 1,
      productId: 2,
      initialQuantity: 10,
      unitInStock: 8,
      capitalPrice: 4,
      unitPrice: 6,
      expiryDate: '2026-01-01'
    } as any;
    stockService.deleteStock.mockReturnValue(of(void 0));

    component.deleteStock(stock);

    expect(component.confirmationModal().open).toBe(true);
    expect(component.confirmationModal().type).toBe('delete');
    expect(stockService.deleteStock).not.toHaveBeenCalled();

    component.confirmAction();

    expect(stockService.deleteStock).toHaveBeenCalledWith(stock.id);
  });

  it('should look up a product name after a short debounce when the product code changes', () => {
    component.openAddModal();

    component.updateRow(0, 'productCode', 'P001');

    expect(productService.getProductByProductCode).toHaveBeenCalledWith('P001');
    expect(component.stockRows()[0].productName).toBe('Sample Product');
    expect(component.stockRows()[0].productId).toBe(10);
  });
});

describe('StockService', () => {
  let service: StockService;
  let commonService: any;

  beforeEach(() => {
    commonService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [StockService, { provide: CommonService, useValue: commonService }],
    });
    service = TestBed.inject(StockService);
  });

  it('should request a text response when updating stock', () => {
    commonService.put.mockReturnValue(of('Stock updated successfully'));

    service.updateStock(7, { productName: 'Updated' } as any).subscribe();

    expect(commonService.put).toHaveBeenCalledWith(
      expect.stringContaining('api/Stock/7'),
      expect.objectContaining({ productName: 'Updated' }),
      expect.objectContaining({ responseType: 'text' })
    );
  });
});
