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
import { environment } from '../environments/environment';

const authGuard = environment.azureAd.enabled ? [MsalGuard] : [];

export const routes: Routes = [
    {path: '', component: Home, canActivate: authGuard},
    {path: 'home', component: Home, canActivate: authGuard},
    {path: 'product', component: ProductComponent, canActivate: authGuard},
    {path: 'stock', component: StockComponent, canActivate: authGuard},
    {path: 'orders', component: OrdersComponent, canActivate: authGuard},
    {path: 'orderslist', component: OrdersListComponent, canActivate: authGuard},
    {path: 'invoice', component: InvoiceComponent, canActivate: authGuard},
    {path: 'cash-in-cash-out-fee', component: CashInCashOutFeeComponent, canActivate: authGuard},
    {path: 'reports', component: ReportsComponent, canActivate: authGuard},
    {path: 'walletbalance', component: WalletBalanceComponent, canActivate: authGuard},
    {path: 'wallet-balance', component: WalletBalanceComponent, canActivate: authGuard}
];
