import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import {
  faCalendar,
  faMapMarkerAlt,
  faPen,
  faPlus,
  faShoppingBag,
  faShoppingCart
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { ShopIndexComponent } from './pages/shop-index/shop-index.component';
import { ShopCartComponent } from './pages/shop-cart/shop-cart.component';
import {
  ShopOrderHistoryComponent,
  ShopStatusCellRendererComponent
} from './pages/shop-order-history/shop-order-history.component';
import { ShopItemCardComponent } from './components/shop-item-card/shop-item-card.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { AddShippingAddressComponent } from './modals/add-shipping-address/add-shipping-address.component';
import { OrderViewComponent } from './pages/order-view/order-view.component';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: ShopIndexComponent,
    data: { title: 'Shop ' }
  },
  {
    path: 'cart',
    component: ShopCartComponent
  },
  {
    path: 'order_history',
    component: ShopOrderHistoryComponent
  },
  {
    path: 'order_details/:id',
    component: OrderViewComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    DataTableModule,
    FontAwesomeModule,
    V3DataTableModule,
    ShopIndexComponent,
    ShopCartComponent,
    ShopOrderHistoryComponent,
    ShopItemCardComponent,
    AddShippingAddressComponent,
    OrderViewComponent,
    ShopStatusCellRendererComponent
  ]
})
export class ShopModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faShoppingCart,
      faShoppingBag,
      faPen,
      faMapMarkerAlt,
      faCalendar
    );
  }
}
