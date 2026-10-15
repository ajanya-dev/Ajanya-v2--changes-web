import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3PaymentSourceTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-source-type/v3-payment-source-type.component';
import { V3PaymentTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-type/v3-payment-type.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { ScrollListenerDirective } from 'src/app/directive/scroll-listner.directive';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { V3PaymentsTableComponent } from './components/v3-payments-table/v3-payments-table.component';
import { V3PaymentViewComponent } from './components/v3-payment-view/v3-payment-view.component';
import { SharedCheckModule } from '../../check/shared-check.module';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    V3DataTableModule,
    V3ActionButtonComponent,
    V3ModeOfTransferComponent,
    V3NoRowsToShowOverlayComponent,
    V3DataTableSelectBoxComponent,
    V3ViewButtonComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PaymentTypeComponent,
    V3PaymentSourceTypeComponent,
    V3PayeeNameComponent,
    RouterModule,
    SharedCheckModule,
    SharedModule,
    DemoVideoComponent,
    CommonButtonV35Component,
    CommonButtonV35Component,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    ScrollListenerDirective,
    V3PaymentsTableComponent,
    V3PaymentViewComponent
  ],
  exports: [
    V3PaymentsTableComponent,
    V3PaymentViewComponent,
    ScrollListenerDirective
  ]
})
export class V3PaymentsTableSharedModule {}
