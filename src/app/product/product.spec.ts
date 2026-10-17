import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductComponent } from './product';
import { ProductService } from './product.service';
import { AuthService } from '../services/auth.service';

describe('ProductComponent', () => {
  let component: ProductComponent;
  let fixture: ComponentFixture<ProductComponent>;
  let productService: any;
  let authService: any;

  beforeEach(async () => {
    productService = {
      getProducts: vi.fn(),
      addProduct: vi.fn(),
      addProducts: vi.fn(),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
    };
    authService = {
      waitForAuthentication: vi.fn(),
    };
    authService.waitForAuthentication.mockReturnValue(of(true));
    productService.getProducts.mockReturnValue(of({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 }));

    await TestBed.configureTestingModule({
      imports: [ProductComponent],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require confirmation before updating a product', () => {
    component.isEditing.set(true);
    component.editingProduct.set({
      id: 1,
      productCode: 'P001',
      productName: 'Test Product',
      unitPrice: 10,
      capitalPrice: 5,
      unitInStock: 10,
      expiryDate: '2026-01-01'
    } as any);
    component.productForm.set({
      productCode: 'P001',
      productName: 'Updated Product',
      unitPrice: 12,
      unitInStock: 12,
      capitalPrice: 6,
      expiryDate: '2026-01-01'
    });
    productService.updateProduct.mockReturnValue(of(void 0));

    component.saveProduct();

    expect(component.confirmationModal().open).toBe(true);
    expect(component.confirmationModal().type).toBe('update');
    expect(productService.updateProduct).not.toHaveBeenCalled();

    component.confirmAction();

    expect(productService.updateProduct).toHaveBeenCalled();
  });

  it('should require confirmation before deleting a product', () => {
    const product = {
      id: 1,
      productCode: 'P001',
      productName: 'Delete Me',
      unitPrice: 10,
      capitalPrice: 5,
      unitInStock: 10,
      expiryDate: '2026-01-01'
    } as any;
    productService.deleteProduct.mockReturnValue(of(void 0));

    component.deleteProduct(product);

    expect(component.confirmationModal().open).toBe(true);
    expect(component.confirmationModal().type).toBe('delete');
    expect(productService.deleteProduct).not.toHaveBeenCalled();

    component.confirmAction();

    expect(productService.deleteProduct).toHaveBeenCalledWith(product.id);
  });
});
