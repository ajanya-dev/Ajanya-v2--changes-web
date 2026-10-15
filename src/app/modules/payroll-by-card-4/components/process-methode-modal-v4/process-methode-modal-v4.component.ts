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
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

@Component({
  selector: 'app-process-methode-modal-v4',
  templateUrl: './process-methode-modal-v4.component.html',
  styleUrls: ['./process-methode-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    ReactiveFormsModule,
    NgxMaskDirective
  ]
})
export class ProcessMethodeModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef);
  private dialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  accountRefill = this.dialogData ? this.dialogData.accountRefill : 0;
  presetAmount: number = this.dialogData.presetAmount;
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
    this.dialogRef.close({
      accountRefill: this.accountRefill,
      presetAmount: amount
    });
  }

  /**
   * @description Close the modal
   */
  close() {
    this.dialogRef.close();
  }
}
