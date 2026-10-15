import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { V3CommonTransactionTableComponent } from './components/v3-common-transaction-table/v3-common-transaction-table.component';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3PaymentSourceTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-source-type/v3-payment-source-type.component';
import { V3PaymentTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-type/v3-payment-type.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';

@NgModule({
  imports: [
    CommonModule,
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
    V3CommonTransactionTableComponent
  ],
  exports: [V3CommonTransactionTableComponent]
})
export class V3CommonTransactionTableModule {}
