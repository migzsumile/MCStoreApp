import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReportsService } from './reports.service';
import { ReportDurationPreset, ReportTab, SalesReportVM, StockInsightsVM } from './reports.model';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit, OnDestroy {
  private readonly reportsService = inject(ReportsService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  // Date range signals
  readonly startDate = signal<string>(this.formatDateForInput(new Date()));
  readonly endDate = signal<string>(this.formatDateForInput(new Date()));
  readonly selectedDuration = signal<ReportDurationPreset>('today');
  readonly activeTab = signal<ReportTab>('all');
  readonly showNetSalesBreakdown = signal<boolean>(false);

  // Data signals
  readonly salesReport = signal<SalesReportVM | null>(null);
  readonly stockInsights = signal<StockInsightsVM | null>(null);
  readonly salesLoading = signal<boolean>(false);
  readonly stockLoading = signal<boolean>(false);
  readonly salesError = signal<string | null>(null);
  readonly stockError = signal<string | null>(null);

  // Computed properties
  readonly totalNetSales = computed(() => {
    const report = this.salesReport();
    if (!report) return 0;
    const normal = Number(report.netSalesNormal ?? 0);
    const digital = Number(report.netSalesDigital ?? 0);
    return normal + digital;
  });

  readonly formattedStartDateDisplay = computed(() => {
    return this.formatDisplayDate(this.startDate());
  });

  readonly formattedEndDateDisplay = computed(() => {
    return this.formatDisplayDate(this.endDate());
  });

  readonly isOverallLoading = computed(() => this.salesLoading() || this.stockLoading());

  readonly topMovingProducts = computed(() => {
    const insights = this.stockInsights();
    return insights?.topMovingProducts ?? [];
  });

  readonly durationOptions: Array<{ id: ReportDurationPreset; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' }
  ];

  ngOnInit(): void {
    this.authService.waitForAuthentication()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadReports(),
        error: err => console.error('Authentication failed for reports:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReports(): void {
    const start = this.startDate();
    const end = this.endDate();
    this.loadSalesReport(start, end);
    this.loadStockInsights(start, end);
  }

  loadSalesReport(startDate?: string, endDate?: string): void {
    this.salesLoading.set(true);
    this.salesError.set(null);
    this.reportsService.getSalesReport(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.salesReport.set(data);
          this.salesLoading.set(false);
        },
        error: err => {
          console.error('Error loading sales report:', err);
          this.salesError.set('Failed to load sales report.');
          this.salesLoading.set(false);
        }
      });
  }

  loadStockInsights(startDate?: string, endDate?: string): void {
    this.stockLoading.set(true);
    this.stockError.set(null);
    this.reportsService.getStockInsights(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.stockInsights.set(data);
          this.stockLoading.set(false);
        },
        error: err => {
          console.error('Error loading stock insights:', err);
          this.stockError.set('Failed to load stock insights.');
          this.stockLoading.set(false);
        }
      });
  }

  onDurationChange(duration: ReportDurationPreset): void {
    this.selectedDuration.set(duration);
    if (duration === 'custom') {
      return;
    }

    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (duration) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'this_week': {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    this.startDate.set(this.formatDateForInput(start));
    this.endDate.set(this.formatDateForInput(end));
    this.loadReports();
  }

  onCustomDateChange(): void {
    this.selectedDuration.set('custom');
    this.loadReports();
  }

  setActiveTab(tab: ReportTab): void {
    this.activeTab.set(tab);
  }

  toggleNetSalesBreakdown(): void {
    this.showNetSalesBreakdown.update(v => !v);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[monthIndex] ?? parts[1];
    return `${day} ${month} - ${year}`;
  }
}

