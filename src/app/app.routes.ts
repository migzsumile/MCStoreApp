import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ProductComponent } from './product/product';
import { StockComponent } from './stock/stock';
import { OrdersComponent } from './orders/orders';
import { OrdersListComponent } from './orderslist/orderslist';
import { MsalGuard } from '@azure/msal-angular';
import { InvoiceComponent } from './invoice/invoice';
import { CashInCashOutFeeComponent } from './cash-in-cash-out-fee/cash-in-cash-out-fee';
import { ReportsComponent } from './reports/reports';
import { WalletBalanceComponent } from './walletbalance/walletbalance';

export const routes: Routes = [
    {path: '', component: OrdersComponent, canActivate: [MsalGuard]},
    {path: 'home', component: Home, canActivate: [MsalGuard]},
    {path: 'product', component: ProductComponent, canActivate: [MsalGuard]},
    {path: 'stock', component: StockComponent, canActivate: [MsalGuard]},
    {path: 'orders', component: OrdersComponent, canActivate: [MsalGuard]},
    {path: 'orderslist', component: OrdersListComponent, canActivate: [MsalGuard]},
    {path: 'invoice', component: InvoiceComponent, canActivate: [MsalGuard]},
    {path: 'cash-in-cash-out-fee', component: CashInCashOutFeeComponent, canActivate: [MsalGuard]},
    {path: 'reports', component: ReportsComponent, canActivate: [MsalGuard]},
    {path: 'walletbalance', component: WalletBalanceComponent, canActivate: [MsalGuard]},
    {path: 'wallet-balance', component: WalletBalanceComponent, canActivate: [MsalGuard]}
];
