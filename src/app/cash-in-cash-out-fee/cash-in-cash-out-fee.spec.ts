import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { CashInCashOutFeeService } from './cash-in-cash-out-fee.service';
import { CashInCashOutFeeComponent } from './cash-in-cash-out-fee';
import { Operators } from './cash-in-cash-out-fee.model';

describe('CashInCashOutFeeComponent', () => {
  let component: CashInCashOutFeeComponent;
  let fixture: ComponentFixture<CashInCashOutFeeComponent>;
  let feeService: any;

  beforeEach(async () => {
    feeService = {
      getFees: vi.fn().mockReturnValue(of({ items: [], totalCount: 0, totalPages: 1 })),
      searchFees: vi.fn(),
      addFees: vi.fn(),
      updateFee: vi.fn().mockReturnValue(of(void 0)),
      deleteFee: vi.fn(),
      getAllLatestWalletBalances: vi.fn().mockReturnValue(of([
        { id: 1, walletName: 'GCash Store', balance: 5000, isCurrent: true },
        { id: 2, walletName: 'Maya Store', balance: 2000, isCurrent: false }
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [CashInCashOutFeeComponent],
      providers: [
        { provide: CashInCashOutFeeService, useValue: feeService },
        { provide: AuthService, useValue: { waitForAuthentication: vi.fn().mockReturnValue(of(true)) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CashInCashOutFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads fee rules and wallet balances after authentication', () => {
    expect(component).toBeTruthy();
    expect(feeService.getFees).toHaveBeenCalledWith(1, 10);
    expect(feeService.getAllLatestWalletBalances).toHaveBeenCalled();
    expect(component.walletBalances().length).toBe(2);
  });

  it('requires confirmation before updating a fee rule', () => {
    component.openEditModal({
      id: 1,
      productCode: 'GCASH-IN',
      productId: 2,
      startAmount: 0,
      endAmount: 100,
      fee: 5,
      walletBalanceId: 1,
      operator: Operators.add
    });
    component.saveFee();

    expect(component.confirmationModal().type).toBe('update');
    expect(feeService.updateFee).not.toHaveBeenCalled();

    component.confirmAction();
    expect(feeService.updateFee).toHaveBeenCalledWith(1, component.form());
  });

  it('sets isEditing to true on edit and populates productCode, walletBalanceId, and operator', () => {
    component.openEditModal({
      id: 1,
      productCode: 'MAYA-OUT',
      productId: 3,
      startAmount: 10,
      endAmount: 500,
      fee: 15,
      walletBalanceId: 2,
      operator: Operators.subtract
    });
    expect(component.isEditing()).toBe(true);
    expect(component.form().productCode).toBe('MAYA-OUT');
    expect(component.form().walletBalanceId).toBe(2);
    expect(component.form().operator).toBe(Operators.subtract);
  });

  it('resets productCode and sets isEditing to false on add', () => {
    component.openEditModal({
      id: 1,
      productCode: 'MAYA-OUT',
      productId: 3,
      startAmount: 10,
      endAmount: 500,
      fee: 15,
      walletBalanceId: 2,
      operator: Operators.subtract
    });
    component.openAddModal();
    expect(component.isEditing()).toBe(false);
    expect(component.feeRows().length).toBe(1);
    expect(component.feeRows()[0].productCode).toBe('');
    expect(component.feeRows()[0].walletBalanceId).toBeNull();
    expect(component.feeRows()[0].operator).toBe(Operators.add);
  });

  it('adds fee rules with walletBalanceId and operator as a list when saving multiple rows in add modal', () => {
    feeService.addFees.mockReturnValue(of([{ id: 10, productCode: 'GCASH-IN', startAmount: 0, endAmount: 100, fee: 5, walletBalanceId: 1, operator: 0 }]));
    component.openAddModal();
    component.updateRow(0, 'productCode', 'GCASH-IN');
    component.updateRow(0, 'walletBalanceId', 1);
    component.updateRow(0, 'operator', Operators.add);
    component.updateRow(0, 'startAmount', 0);
    component.updateRow(0, 'endAmount', 100);
    component.updateRow(0, 'fee', 5);

    // Typing in row 0 automatically appended an empty row 1
    expect(component.feeRows().length).toBe(2);

    component.saveFee();

    expect(feeService.addFees).toHaveBeenCalledWith([
      {
        productCode: 'GCASH-IN',
        startAmount: 0,
        endAmount: 100,
        fee: 5,
        walletBalanceId: 1,
        operator: 0
      }
    ]);
  });

  it('resolves wallet display name and operator display name correctly', () => {
    const fee1 = {
      id: 1,
      productCode: 'P1',
      startAmount: 0,
      endAmount: 100,
      fee: 2,
      walletBalanceId: 1,
      operator: Operators.add
    };
    expect(component.getWalletDisplayName(fee1)).toBe('GCash Store');
    expect(component.getOperatorDisplayName(fee1.operator)).toBe('add');

    const fee2 = {
      id: 2,
      productCode: 'P2',
      startAmount: 0,
      endAmount: 100,
      fee: 2,
      walletName: 'Direct Wallet Name',
      operator: 'subtract'
    };
    expect(component.getWalletDisplayName(fee2)).toBe('Direct Wallet Name');
    expect(component.getOperatorDisplayName(fee2.operator)).toBe('subtract');
  });

  it('supports adding and removing multiple rows', () => {
    component.openAddModal();
    component.updateRow(0, 'productCode', 'ROW-1');
    expect(component.feeRows().length).toBe(2);

    component.updateRow(1, 'productCode', 'ROW-2');
    expect(component.feeRows().length).toBe(3);

    component.removeRow(0);
    expect(component.feeRows().length).toBe(2);
    expect(component.feeRows()[0].productCode).toBe('ROW-2');
  });
});