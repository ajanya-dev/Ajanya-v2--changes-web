import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IQuickbooksPayrollRun } from '../model/quickbooks-payroll-run';

/**
 * Details of a single QuickBooks Payroll pay run, opened from the view icon on
 * the payroll list.
 */
@Component({
  selector: 'app-quickbooks-payroll-details-modal',
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, CurrencyPipe],
  templateUrl: './quickbooks-payroll-details-modal.component.html',
  styleUrl: './quickbooks-payroll-details-modal.component.scss'
})
export class QuickbooksPayrollDetailsModalComponent {
  injectData = inject<IQuickbooksPayrollRun>(MAT_DIALOG_DATA);

  faXmark = faXmark;
}
