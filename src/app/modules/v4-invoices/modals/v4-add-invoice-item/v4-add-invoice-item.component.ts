import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { IEditInvoice } from 'src/app/modules/invoices/model/invoice';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-v4-add-invoice-item',
  templateUrl: './v4-add-invoice-item.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent
  ]
})
export class V4AddInvoiceItemComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  public dialogRef = inject(MatDialogRef<V4AddInvoiceItemComponent>);
  public data: IEditInvoice = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  itemForm!: FormGroup;
  instock = false;
  editMode = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.itemForm = this.fb.group({
      product_name: ['', Validators.required],
      unit_price: ['', [Validators.required, Validators.min(0.01)]],
      description: [''],
      private_note: [''],
      track: [false],
      instock: ['']
    });

    this.setEditData();
  }

  setEditData(): void {
    if (this.data) {
      if (this.data.stock != null) {
        this.instock = true;
        this.itemForm.controls.track.setValue(true);
      } else {
        this.instock = false;
        this.itemForm.controls.track.setValue(false);
      }
      this.editMode = true;

      this.itemForm.patchValue({
        product_name: this.data.item_name,
        unit_price: this.data.unit_price,
        description: this.data.note,
        private_note: this.data.note,
        instock: this.data.stock
      });
    }
  }

  onTrackChange(event: Event): void {
    this.instock = (event.target as HTMLInputElement).checked;
    if(this.instock){
      this.itemForm.controls.instock.setValidators([Validators.required, Validators.min(1)]);
    }else {
      this.itemForm.controls.instock.clearValidators();
    }
    this.itemForm.controls.instock.updateValueAndValidity();
  }

  private buildBody() {
    const track = this.itemForm.get('track')?.value;
    const body = {
      product_name: this.itemForm.get('product_name')?.value,
      unit_price: this.itemForm.get('unit_price')?.value,
      note: this.itemForm.get('description')?.value,
      private_note: this.itemForm.get('private_note')?.value
    };

    // Only send track/stock when inventory tracking is enabled.
    if (track) {
      return {
        ...body,
        track,
        stock: this.itemForm.get('instock')?.value
      };
    }

    return body;
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.itemForm.markAllAsTouched();
    if (!this.itemForm.valid) return;

    this.isSubmitting = true;
    this.invoiceService
      .addInvoiceItem(this.buildBody())
      .pipe(finalize(() => {this.isSubmitting = false;}),takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.dialogRef.close({success:true,Id:res.data.Id});
            this.alertService
              .successAlert({
                content:'Invoice item added successfully.',
                close:true
            });
          }
        }
      });
  }

  update(): void {
    this.itemForm.markAllAsTouched();
    if (!this.itemForm.valid) return;

    this.isSubmitting = true;
    this.invoiceService
      .updateInvoiceItem(this.data.id, this.buildBody())
      .pipe(finalize(() => {this.isSubmitting = false;}),takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.dialogRef.close(true);
            this.alertService
              .successAlert({
                content:'Invoice item updated successfully.',
                close:true
            });
          }
        }
      });
  }
}
