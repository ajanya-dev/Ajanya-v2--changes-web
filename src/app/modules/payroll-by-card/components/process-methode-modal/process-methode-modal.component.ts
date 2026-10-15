import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { NgxMaskDirective } from 'ngx-mask';
import { NgIf } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

@Component({
  selector: 'app-process-methode-modal',
  templateUrl: './process-methode-modal.component.html',
  styleUrls: ['./process-methode-modal.component.scss'],
  standalone: true,
  imports: [
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    ReactiveFormsModule,
    NgIf,
    NgxMaskDirective
  ]
})
export class ProcessMethodeModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef);
  private _dialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  accountRefill = this._dialogData ? this._dialogData.accountRefill : 0;
  presetAmount: number = this._dialogData.presetAmount;
  utils = Utils;
  amountRequired: boolean;
  amountForm: FormGroup;
  showErrorMsg: boolean;

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.amountForm = this.fb.group({
      presetAmount: [
        this.presetAmount,
        [Validators.required, Validators.min(1)]
      ]
    });
  }

  /**
   * @description -Sets the process method and preset amount for payroll settings.
   */
  setProcessMethod() {
    if (this.amountForm.invalid && this.accountRefill === 1) {
      this.showErrorMsg = true;
      return;
    }
    this.showErrorMsg = false;
    const amount = this.amountForm.valid
      ? this.amountForm.controls.presetAmount.value
      : 0;
    this._dialogRef.close({
      accountRefill: this.accountRefill,
      presetAmount: amount
    });
  }

  /**
   * @description Close the modal
   */
  close() {
    this._dialogRef.close();
  }
}
