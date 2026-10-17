import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { WalletBalanceComponent } from './walletbalance';
import { WalletBalanceService } from './walletbalance.service';
import { AuthService } from '../services/auth.service';
import { WalletBalance } from './walletbalance.model';

describe('WalletBalanceComponent', () => {
  let component: WalletBalanceComponent;
  let fixture: ComponentFixture<WalletBalanceComponent>;

  const mockWallets: WalletBalance[] = [
    { id: 1, walletName: 'GCash Store', balance: 5420.5, isCurrent: true },
    { id: 2, walletName: 'Maya Store', balance: 1250.0, isCurrent: false },
    { id: 3, walletName: 'Cash Drawer', balance: 8300.75, isCurrent: false }
  ];

  let mockWalletService: {
    getAll: any;
    getById: any;
    create: any;
    update: any;
    delete: any;
  };

  let mockAuthService: {
    waitForAuthentication: any;
  };

  beforeEach(async () => {
    mockWalletService = {
      getAll: () => of(mockWallets),
      getById: (id: number) => of(mockWallets.find(w => w.id === id)),
      create: (model: any) => of({ id: 4, ...model }),
      update: (id: number, model: any) => of(void 0),
      delete: (id: number) => of(void 0)
    };

    mockAuthService = {
      waitForAuthentication: () => of(true)
    };

    await TestBed.configureTestingModule({
      imports: [WalletBalanceComponent],
      providers: [
        { provide: WalletBalanceService, useValue: mockWalletService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WalletBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load wallets on init', () => {
    expect(component).toBeTruthy();
    expect(component.wallets().length).toBe(3);
    expect(component.currentWallet()?.walletName).toBe('GCash Store');
  });

  it('should compute totalBalance correctly', () => {
    // 5420.50 + 1250.00 + 8300.75 = 14971.25
    expect(component.totalBalance()).toBeCloseTo(14971.25);
  });

  it('should filter wallets based on search term', () => {
    component.searchTerm.set('maya');
    expect(component.filteredWallets().length).toBe(1);
    expect(component.filteredWallets()[0].walletName).toBe('Maya Store');

    component.searchTerm.set('nonexistent');
    expect(component.filteredWallets().length).toBe(0);
  });

  it('should open and populate add modal', () => {
    component.openAddModal();
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(false);
    expect(component.form().walletName).toBe('');
    expect(component.form().balance).toBe(0);
  });

  it('should open and populate edit modal', () => {
    const walletToEdit = mockWallets[1];
    component.openEditModal(walletToEdit);
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(true);
    expect(component.form().id).toBe(2);
    expect(component.form().walletName).toBe('Maya Store');
    expect(component.form().balance).toBe(1250.0);
  });

  it('should validate form and show error for empty wallet name', () => {
    component.openAddModal();
    component.form.set({ walletName: '   ', balance: 100, isCurrent: false });
    component.saveWallet();

    expect(component.resultModal().open).toBe(true);
    expect(component.resultModal().title).toBe('Validation Error');
  });

  it('should validate form and show error for negative balance', () => {
    component.openAddModal();
    component.form.set({ walletName: 'Bank', balance: -50, isCurrent: false });
    component.saveWallet();

    expect(component.resultModal().open).toBe(true);
    expect(component.resultModal().title).toBe('Validation Error');
  });

  it('should call service create when saving in add mode', () => {
    let createdPayload: any = null;
    mockWalletService.create = (payload: any) => {
      createdPayload = payload;
      return of({ id: 5, ...payload });
    };

    component.openAddModal();
    component.form.set({ walletName: 'Petty Cash', balance: 500, isCurrent: false });
    component.saveWallet();

    expect(createdPayload).toEqual({
      walletName: 'Petty Cash',
      balance: 500,
      isCurrent: false
    });
    expect(component.showModal()).toBe(false);
    expect(component.resultModal().open).toBe(true);
    expect(component.resultModal().title).toBe('Success');
  });

  it('should call service update when saving in edit mode', () => {
    let updatedId: number | null = null;
    let updatedPayload: any = null;
    mockWalletService.update = (id: number, payload: any) => {
      updatedId = id;
      updatedPayload = payload;
      return of(void 0);
    };

    component.openEditModal(mockWallets[0]);
    component.form.set({ id: 1, walletName: 'GCash Main', balance: 6000, isCurrent: true });
    component.saveWallet();

    expect(updatedId).toBe(1);
    expect(updatedPayload).toEqual({
      id: 1,
      walletName: 'GCash Main',
      balance: 6000,
      isCurrent: true
    });
    expect(component.showModal()).toBe(false);
    expect(component.resultModal().title).toBe('Success');
  });

  it('should trigger delete confirmation and call delete on confirm', () => {
    let deletedId: number | null = null;
    mockWalletService.delete = (id: number) => {
      deletedId = id;
      return of(void 0);
    };

    const target = mockWallets[1];
    component.deleteWallet(target);

    expect(component.confirmationModal().open).toBe(true);
    expect(component.confirmationModal().title).toBe('Delete Wallet Balance');

    component.confirmAction();

    expect(deletedId).toBe(2);
    expect(component.confirmationModal().open).toBe(false);
    expect(component.resultModal().title).toBe('Deleted');
  });
});

