import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { AddPaymentInterface } from 'src/app/modules/invoices/model/invoice';
import { finalize } from 'rxjs';

export interface IAddPaymentDialogData {
  id: string;
  invoiceNo: string;
  payeeName: string;
  balance: string;
}

const PAYMENT_TYPES = [
  { id: '1', name: 'Cash' },
  { id: '2', name: 'Check' },
  { id: '6', name: 'ACH' }
];

@Component({
  selector: 'app-v4-add-payment',
  templateUrl: './v4-add-payment.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent,
    V4DatePickerComponent,
    CurrencyPipe
  ]
})
export class V4AddPaymentComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  public dialogRef = inject(MatDialogRef<V4AddPaymentComponent>);
  public dialogData = inject<IAddPaymentDialogData>(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly paymentTypes = PAYMENT_TYPES;

  form!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      Amount: ['', Validators.required],
      type: ['', Validators.required],
      paymentDate: [''],
      Reference: ['']
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const data: AddPaymentInterface = {
      InvoicePaymentAmount: this.form.get('Amount')?.value,
      InvoicePaymentType: this.form.get('type')?.value,
      InvoicePaymentReference: this.form.get('Reference')?.value,
      InvoicePaymentDate: this.form.get('paymentDate')?.value
    };

    this.isSubmitting = true;
    this.invoiceService
      .addpayement(this.dialogData.id, data)
      .pipe(finalize(() => {this.isSubmitting = false;}),takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.dialogRef.close(true);
            this.alertService
              .successAlert({
                content:'Payment added successfully',
                close:true
              });
          }
        }
      });
  }
}
