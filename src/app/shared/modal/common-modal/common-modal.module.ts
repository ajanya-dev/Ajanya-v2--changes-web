import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from '../../shared.module';
import { ViewAuditTrailModalComponent } from './view-audit-trail-modal/view-audit-trail-modal.component';
import { CompanySelectModalComponent } from './company-select-modal/company-select-modal.component';
import { BankMapModalComponent } from './bank-map-modal/bank-map-modal.component';
import { ViewAuditTrailComponent } from '../../components/actions/view-audit-trail/view-audit-trail.component';
import { DropDownBankComponent } from '../../components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  faArrowDownToLine,
  faArrowUpToLine
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { BankAcDropdownV3Component } from '../../components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DropDownBankComponent,
    ViewAuditTrailComponent,
    AngularMaterialModule,
    BankAcDropdownV3Component,
    ViewAuditTrailModalComponent,
    BankMapModalComponent,
    CompanySelectModalComponent
  ]
})
export class CommonModalModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faArrowDownToLine, faArrowUpToLine);
  }
}
