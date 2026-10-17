import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface FeatureHighlight {
  id: string;
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  keyBenefits: string[];
  route: string;
  actionText: string;
  metrics: { label: string; value: string };
  gradient: string;
}

export interface Testimonial {
  storeName: string;
  owner: string;
  location: string;
  quote: string;
  highlight: string;
  avatar: string;
  stats: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly activeCategory = signal<'all' | 'sales' | 'inventory' | 'fintech'>('all');

  readonly stats = [
    { value: '3x Faster', label: 'Cashier Checkout Speed', icon: '⚡' },
    { value: '100%', label: 'E-Wallet Cash Flow Clarity', icon: '💰' },
    { value: 'Zero', label: 'Unaccounted Stock Losses', icon: '🛡️' },
    { value: 'Instant', label: 'End-of-Day P&L Insights', icon: '📈' },
  ];

  readonly features: FeatureHighlight[] = [
    {
      id: 'pos',
      badge: 'Speed & Reliability',
      badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: '🛒',
      title: 'POS Ordering & Lightning Checkout',
      tagline: 'Ring up items in seconds without cashier queues.',
      description: 'Designed specifically for high-speed retail counters. Scan barcodes or search products instantly with real-time bill calculations and smooth receipt generation.',
      keyBenefits: [
        'Instant barcode scanner integration & quick search',
        'Automatic subtotal, cash change, and discount calculation',
        'Multi-item order basket with one-touch cancellations'
      ],
      route: '/orders',
      actionText: 'Launch POS Terminal',
      metrics: { label: 'Avg. Checkout', value: '< 15 secs' },
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      id: 'inventory',
      badge: 'Stock Control',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: '📦',
      title: 'Stock Inventory & Valuation',
      tagline: 'Always know what is on the shelves and what to reorder.',
      description: 'Track unit counts, initial batch quantity, cost capital vs selling retail price, and expiry dates to avoid costly stockouts or spoiled shelf items.',
      keyBenefits: [
        'Real-time remaining units stock deduction on checkout',
        'Capital price vs selling price margin calculation',
        'Batch tracking with expiration date alerts'
      ],
      route: '/stock',
      actionText: 'View Stock Inventory',
      metrics: { label: 'Stock Accuracy', value: '99.9%' },
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'cashin-out-fees',
      badge: 'Revenue Booster',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: '⚙️',
      title: 'Configurable Cash-In / Cash-Out Fees',
      tagline: 'Turn digital remittances into a profitable revenue stream.',
      description: 'Set custom tier-based service fees (percentage or flat rate) for customer cash-in and cash-out requests across GCash, Maya, and other payment providers.',
      keyBenefits: [
        'Custom tiered fee matrix based on transaction amount brackets',
        'Support for add/deduct formulas & operator math',
        'Direct link to wallet balances for audit trails'
      ],
      route: '/cash-in-cash-out-fee',
      actionText: 'Configure Fee Rules',
      metrics: { label: 'Fee Margin', value: 'Flexible Tiers' },
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'wallets',
      badge: 'Fintech Hub',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: '💳',
      title: 'Wallet Balance Monitoring (GCash, Maya & More)',
      tagline: 'Eliminate confusion between cash drawer and digital funds.',
      description: 'Live visibility across all digital payment channels. Never get blindsided by low GCash/Maya funds when customers walk in for remittances or cash-in.',
      keyBenefits: [
        'Consolidated balance overview across all merchant wallets',
        'Fast fund top-up and balance adjustments with audit records',
        'Clear separation of store cash drawer vs digital e-money'
      ],
      route: '/walletbalance',
      actionText: 'Monitor Wallet Balances',
      metrics: { label: 'E-Wallet Sync', value: 'Live Balance' },
      gradient: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'invoices',
      badge: 'Complete Transparency',
      badgeColor: 'bg-sky-100 text-sky-700 border-sky-200',
      icon: '🧾',
      title: 'Invoice History & Order Audit Trail',
      tagline: 'Zero disputes with customers, suppliers, and staff.',
      description: 'Searchable archive of every past customer order, receipt, and invoice. Filter by date, invoice ID, or product to resolve customer inquiries immediately.',
      keyBenefits: [
        'Print-ready professional invoice records with itemized totals',
        'Customer transaction history and payment method records',
        'Tamper-evident logs to safeguard against cashier discrepancies'
      ],
      route: '/invoice',
      actionText: 'Explore Invoice History',
      metrics: { label: 'History Retrieval', value: 'Instant' },
      gradient: 'from-sky-600 to-blue-700',
    },
    {
      id: 'reports',
      badge: 'Executive Intelligence',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: '📈',
      title: 'Sales Reports & Stock Insights',
      tagline: 'Make data-backed decisions instead of guessing your profit.',
      description: 'Comprehensive business intelligence showing net sales breakdown (normal store products vs digital transactions), profit margins, and top-moving stock items.',
      keyBenefits: [
        'Net sales breakdown between merchandise and digital transactions',
        'Top-moving and fast-depleting product insights for restocking',
        'Flexible time-filter ranges: Daily, Weekly, Monthly, or Custom'
      ],
      route: '/reports',
      actionText: 'View Reports & Insights',
      metrics: { label: 'Decision Clarity', value: '360° View' },
      gradient: 'from-rose-600 to-pink-600',
    },
  ];

  readonly comparisonPoints = [
    {
      capability: 'Checkout Speed & Scanning',
      manual: 'Manual notebook listing or slow mental math',
      system: 'Instant barcode lookup with sub-second order calculation',
    },
    {
      capability: 'E-Wallet Services (GCash / Maya)',
      manual: 'Mixed up with personal phone wallets; lost fees',
      system: 'Automated fee brackets, dedicated wallet balance monitoring',
    },
    {
      capability: 'Inventory & Expirations',
      manual: 'Stock surprise outages & expired items found too late',
      system: 'Real-time countdown, capital margins & batch expiry tracking',
    },
    {
      capability: 'Daily Profit Calculation',
      manual: 'Hours of counting receipts every night with error risk',
      system: 'One-click net sales, gross margin & digital fee analytics',
    },
    {
      capability: 'Cashier Transparency',
      manual: 'Vulnerable to missing cash and unrecorded items',
      system: 'Itemized invoice history & locked access permission controls',
    },
  ];

  readonly testimonials: Testimonial[] = [
    {
      storeName: 'Macuy Chichai Mini Store',
      owner: 'Flagship Implementation',
      location: 'Retail & Convenience',
      quote: 'Managing our daily grocery sales alongside GCash and Maya cash-in transactions used to be chaotic. Now our balances match to the exact peso every closing time.',
      highlight: 'Reduced closing reconciliation from 1 hour to 5 minutes',
      avatar: '🏪',
      stats: '100% Cash Balanced',
    },
    {
      storeName: 'Neighborhood Mart & Remit',
      owner: 'Community Grocery Owner',
      location: 'High-Volume Retail',
      quote: 'The tiered fee setup for cash-in and cash-out paid for the system in the first week. We know exactly how much profit digital wallet services bring in.',
      highlight: 'Over ₱30k/mo additional profit from digital service fees',
      avatar: '🛒',
      stats: '3x Transaction Volume',
    },
    {
      storeName: 'Metro Corner Variety',
      owner: 'Convenience & General Store',
      location: 'Subdivision Commercial Hub',
      quote: 'The Top Moving Products report showed us which snacks and household goods to double-order before weekends. Dead stock has practically disappeared.',
      highlight: 'Zero stockouts on top 20 best-selling items',
      avatar: '🏬',
      stats: '24% Less Dead Stock',
    },
  ];
}
