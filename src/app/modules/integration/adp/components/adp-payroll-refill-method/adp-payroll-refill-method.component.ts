import { Component, Inject, Optional } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgxMaskDirective } from 'ngx-mask';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription
} from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

/**
 * Component representing the ADP payroll refill method dialog.
 */
@Component({
  selector: 'app-adp-payroll-refill-method',
  templateUrl: './adp-payroll-refill-method.component.html',
  styleUrls: ['./adp-payroll-refill-method.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    MatExpansionPanel,
    MatExpansionPanelDescription,
    NgxMaskDirective
  ]
})
export class AdpPayrollRefillMethodComponent {
  /**
   * Array of account refill types.
   */
  accountRefillTypes = ['autoProcess', 'partiallyCharge', 'iDecide'];

  /**
   * Object representing the account refill information.
   */
  accountRefill: {
    type: false | 'autoProcess' | 'partiallyCharge' | 'iDecide';
    presetAmount: number | string;
  } = {
    type: false,
    presetAmount: 0
  };

  constructor(
    /**
     * Optional injection of dialog data and material.
     */
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private dialogueData: {
      type: false | 'autoProcess' | 'partiallyCharge' | 'iDecide';
      presetAmount: number | string;
    },
    private matDialoRef: MatDialogRef<AdpPayrollRefillMethodComponent>,
    private alertService: AlertService
  ) {
    if (this.dialogueData) {
      this.accountRefill = this.dialogueData;
    }
  }

  /**
   * Saves the account refill method and closes the dialog.
   */
  saveAndCloseModal() {
    if (!this.accountRefill.type) {
      this.alertService.infoAlert({
        content: 'Please choose how to process payroll'
      });
    } else if (
      this.accountRefill.type == 'partiallyCharge' &&
      (!this.accountRefill.presetAmount ||
        this.accountRefill.presetAmount == '' ||
        this.accountRefill.presetAmount == '0')
    ) {
      this.alertService.infoAlert({ content: 'Please enter a preset amount' });
    } else {
      this.matDialoRef.close(this.accountRefill);
    }
  }
}
