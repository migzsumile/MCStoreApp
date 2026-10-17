import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { OrdersComponent } from './orders';
import { OrdersService } from './orders.service';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let ordersService: jasmine.SpyObj<OrdersService>;

  beforeEach(async () => {
    ordersService = jasmine.createSpyObj('OrdersService', ['getStockOrderByCodeName', 'createInvoice', 'getBankFee', 'getStocksAllocation']);

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the search term when the user types in the barcode input', () => {
    const input = fixture.debugElement.query(By.css('#orderQuery')).nativeElement as HTMLInputElement;

    input.value = 'Widget';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.orderQuery()).toBe('Widget');
  });

  it('should calculate the total price from the current item amount and bank fee when quantity changes', fakeAsync(() => {
    component.orderItems.set([{ stockId: 1, productCode: 'P001', productName: 'Widget', unitPrice: 100, quantity: 1, totalPrice: 100 }]);
    ordersService.getBankFee.and.returnValue(of({ bankFee: 10, isDigital: 1 }));

    component.updateOrderQuantity(0, 2);
    tick(500);

    expect(ordersService.getBankFee).toHaveBeenCalledWith('P001', 2);
    expect(component.orderItems()[0].quantity).toBe(2);
    expect(component.orderItems()[0].totalPrice).toBe(210);
  }));
});
