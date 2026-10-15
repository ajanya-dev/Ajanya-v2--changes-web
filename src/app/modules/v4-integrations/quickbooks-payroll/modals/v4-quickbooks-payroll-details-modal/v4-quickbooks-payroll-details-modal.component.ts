import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { IQuickbooksPayrollRun } from 'src/app/modules/integration/pages/quickbooks-payroll/model/quickbooks-payroll-run';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * Details of a single QuickBooks Payroll pay run, opened from the view icon on
 * the payroll list.
 */
@Component({
  selector: 'app-v4-quickbooks-payroll-details-modal',
  standalone: true,
  templateUrl: './v4-quickbooks-payroll-details-modal.component.html',
  imports: [
    MatDialogModule,
    LucideAngularModule,
    CurrencyPipe,
    CommonButtonV4Component
  ]
})
export class V4QuickbooksPayrollDetailsModalComponent {
  readonly data: { payroll: IQuickbooksPayrollRun } = inject(MAT_DIALOG_DATA);
}
