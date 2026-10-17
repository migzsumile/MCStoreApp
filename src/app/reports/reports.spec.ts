import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { ReportsService } from './reports.service';
import { ReportsComponent } from './reports';
import { SalesReportVM, StockInsightsVM } from './reports.model';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportsService: any;

  const mockSalesReport: SalesReportVM = {
    startDate: '2026-08-24T00:00:00',
    endDate: '2026-08-24T23:59:59',
    netSalesNormal: 1500,
    costOfNormalProductSold: 900,
    margin: 600,
    netSalesDigital: 500,
    profit: 600
  };

  const mockStockInsights: StockInsightsVM = {
    startDate: '2026-08-24T00:00:00',
    endDate: '2026-08-24T23:59:59',
    totalInventoryPrice: 50000,
    inventoryCost: 35000,
    potentialSalesMargin: 15000,
    topMovingProducts: [
      {
        product: 'Product A',
        quantity: 20,
        unitPrice: 100,
        capitalPrice: 70,
        margin: 30
      }
    ]
  };

  beforeEach(async () => {
    reportsService = {
      getSalesReport: vi.fn().mockReturnValue(of(mockSalesReport)),
      getStockInsights: vi.fn().mockReturnValue(of(mockStockInsights))
    };

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        { provide: ReportsService, useValue: reportsService },
        { provide: AuthService, useValue: { waitForAuthentication: vi.fn().mockReturnValue(of(true)) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load reports on init after auth', () => {
    expect(component).toBeTruthy();
    expect(reportsService.getSalesReport).toHaveBeenCalled();
    expect(reportsService.getStockInsights).toHaveBeenCalled();
    expect(component.salesReport()).toEqual(mockSalesReport);
    expect(component.stockInsights()).toEqual(mockStockInsights);
  });

  it('should compute totalNetSales correctly as sum of normal and digital sales', () => {
    expect(component.totalNetSales()).toBe(2000);
  });

  it('should toggle net sales breakdown visibility', () => {
    expect(component.showNetSalesBreakdown()).toBe(false);
    component.toggleNetSalesBreakdown();
    expect(component.showNetSalesBreakdown()).toBe(true);
    component.toggleNetSalesBreakdown();
    expect(component.showNetSalesBreakdown()).toBe(false);
  });

  it('should switch active report tabs', () => {
    component.setActiveTab('sales');
    expect(component.activeTab()).toBe('sales');
    component.setActiveTab('stock');
    expect(component.activeTab()).toBe('stock');
    component.setActiveTab('all');
    expect(component.activeTab()).toBe('all');
  });

  it('should update date range and fetch data when preset duration changes', () => {
    reportsService.getSalesReport.mockClear();
    reportsService.getStockInsights.mockClear();

    component.onDurationChange('this_month');
    expect(component.selectedDuration()).toBe('this_month');
    expect(reportsService.getSalesReport).toHaveBeenCalled();
    expect(reportsService.getStockInsights).toHaveBeenCalled();
  });

  it('should switch to custom duration and reload on custom date change', () => {
    reportsService.getSalesReport.mockClear();
    reportsService.getStockInsights.mockClear();

    component.startDate.set('2026-08-01');
    component.endDate.set('2026-08-20');
    component.onCustomDateChange();

    expect(component.selectedDuration()).toBe('custom');
    expect(reportsService.getSalesReport).toHaveBeenCalledWith('2026-08-01', '2026-08-20');
    expect(reportsService.getStockInsights).toHaveBeenCalledWith('2026-08-01', '2026-08-20');
  });

  it('should handle service errors gracefully', () => {
    reportsService.getSalesReport.mockReturnValue(throwError(() => new Error('Server error')));
    reportsService.getStockInsights.mockReturnValue(throwError(() => new Error('Server error')));

    component.loadReports();

    expect(component.salesError()).toBe('Failed to load sales report.');
    expect(component.stockError()).toBe('Failed to load stock insights.');
    expect(component.salesLoading()).toBe(false);
    expect(component.stockLoading()).toBe(false);
  });
});

