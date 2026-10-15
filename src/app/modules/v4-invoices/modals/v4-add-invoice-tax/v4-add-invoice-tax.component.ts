import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize, of } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  AddinvoiceTaxInterface,
  IAddTaxModalRes,
  IAddTaxRes
} from 'src/app/modules/invoices/model/invoice';

@Component({
  selector: 'app-v4-add-invoice-tax',
  templateUrl: './v4-add-invoice-tax.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    MatDialogClose
  ]
})
export class V4AddInvoiceTaxComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  public dialogRef = inject(MatDialogRef<V4AddInvoiceTaxComponent>);
  public data: IAddTaxModalRes = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  taxForm!: FormGroup;
  editMode = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.taxForm = this.fb.group({
      tax_name: ['', Validators.required],
      tax_in: ['', Validators.required, this.decimalValidator()],
      note: ['']
    });

    this.setEditData();
  }

  setEditData(): void {
    if (this.data && this.data.mode !== 'NOT-TAX') {
      this.editMode = true;
      this.taxForm.patchValue({
        tax_name: this.data.tax_name,
        tax_in: this.data.tax_percentage,
        note: this.data.note
      });
    }
  }

  decimalValidator(): ValidatorFn {
    return (control) => {
      const isValid = /^-?\d*\.?\d+$/.test(control.value);
      return of(isValid ? null : { invalidDecimal: true });
    };
  }

  onTaxInKeyup(): void {
    const value = parseFloat(this.taxForm.get('tax_in')?.value);
    if (value > 100) {
      this.taxForm.patchValue({ tax_in: 100 });
    }
  }

  private buildBody(): AddinvoiceTaxInterface {
    return {
      tax_name: this.taxForm.get('tax_name')?.value,
      tax_percentage: this.taxForm.get('tax_in')?.value,
      note: this.taxForm.get('note')?.value
    };
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.taxForm.markAllAsTouched();
    if (!this.taxForm.valid) return;

    const taxIn = this.taxForm.get('tax_in')?.value;
    if (taxIn > 100) {
      this.alertService.infoAlert({
        content: 'Tax percentage should be less than 100'
      });
      return;
    }
    if (taxIn === '0') {
      this.alertService.warningAlert({ content: 'Enter valid Tax percentage' });
      return;
    }

    this.isSubmitting = true;
    this.invoiceService
      .addtax(this.buildBody())
      .pipe(finalize(() => {this.isSubmitting = false;}),takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if ((res as IAddTaxRes).success) {
            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
            this.dialogRef.close((res as IAddTaxRes).data);
            this.alertService
              .successAlert({
                content:'Tax added successfully',
                close:true
            });  
          }
        }
      });
  }

  update(): void {
    this.taxForm.markAllAsTouched();
    if (!this.taxForm.valid) return;

    const taxIn = this.taxForm.get('tax_in')?.value;
    if (taxIn > 100) {
      this.alertService.infoAlert({
        content: 'Tax percentage should be less than 100'
      });
      return;
    }
    if (taxIn === '0') {
      this.alertService.warningAlert({ content: 'Enter valid Tax percentage' });
      return;
    }

    this.isSubmitting = true;
    this.invoiceService
      .updateTax(this.data.id, this.buildBody())
      .pipe(finalize(() => {this.isSubmitting = false;}),takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
            this.dialogRef.close();
            this.alertService
              .successAlert({
                content:'Tax updated successfully.',
                close:true
              });
          }
        }
      });
  }
}
