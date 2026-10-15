import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';
import { Utils } from 'src/app/data/utils';
import { IApiResMesssage } from 'src/app/models/api';
import {
  AddinvoiceItem,
  IEditInvoice
} from 'src/app/modules/invoices/model/invoice';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

interface IAddInvoice {
  success: boolean;
  message: string;
  data: { Id: string };
}

@Component({
  selector: 'app-add-invoice-item-v4',
  templateUrl: './add-invoice-item-v4.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent
  ]
})
export class AddInvoiceItemV4Component implements OnInit, OnDestroy {
  private fb = inject(UntypedFormBuilder);
  public dialog = inject(MatDialog);
  private invoice = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  public dialogRef = inject(MatDialogRef<AddInvoiceItemV4Component>);
  public data: IEditInvoice = inject(MAT_DIALOG_DATA);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  readonly XIcon = X;

  itemForm!: UntypedFormGroup;
  Instock = false;
  editMode = false;
  subscriptions: Subscription[] = [];
  err_msg: string;
  submitting = signal(false);
  utils = Utils;

  ngOnInit(): void {
    this.initFromGroup();
    this.setEditData();
  }

  initFromGroup() {
    this.itemForm = this.fb.group({
      product_name: ['', Validators.required],
      unit_price: ['', Validators.required],
      description: [''],
      private_note: [''],
      track: [false],
      instock: ['']
    });
  }

  CreateAddItemBody() {
    if (this.Instock) {
      return {
        product_name: this.getFormValue('product_name'),
        unit_price: this.getFormValue('unit_price'),
        note: this.getFormValue('description'),
        private_note: this.getFormValue('private_note'),
        track: this.getFormValue('track'),
        stock: this.getFormValue('instock')
      };
    }
    return {
      product_name: this.getFormValue('product_name'),
      unit_price: this.getFormValue('unit_price'),
      note: this.getFormValue('description'),
      private_note: this.getFormValue('private_note')
    };
  }

  getFormValue(name: string) {
    return this.itemForm.get(name)?.value;
  }

  checked(event: Event) {
    if ((event.target as HTMLInputElement).checked === true) {
      this.Instock = true;
      this.itemForm.controls.instock.setValue('');
      this.itemForm.controls.instock.setValidators([Validators.required]);
    } else {
      this.Instock = false;
      this.itemForm.controls.instock.setValidators([]);
      this.itemForm.controls.instock.setValue('');
    }
  }

  setEditData() {
    if (this.data) {
      if (this.data.stock != null) {
        this.Instock = true;
        this.itemForm.controls.track.setValue(true);
      } else {
        this.Instock = false;
        this.itemForm.controls.track.setValue(false);
      }
      this.editMode = true;

      this.itemForm.patchValue({
        product_name: this.data.item_name,
        unit_price: this.data.unit_price,
        description: this.data.note,
        private_note: this.data.private_note,
        instock: this.data.stock
      });
    }
  }

  submit() {
    if (this.submitting()) return;
    this.itemForm.markAllAsTouched();
    const body: AddinvoiceItem = this.CreateAddItemBody();

    if (
      this.itemForm.value.instock === '0' &&
      this.itemForm.value.instock !== ''
    ) {
      this.alertService.warningAlert({ content: 'Enter valid quantity' });
    } else if (
      this.itemForm.value.unit_price === 0 &&
      this.itemForm.value.unit_price !== ''
    ) {
      this.alertService.warningAlert({ content: 'Enter valid unit price' });
    } else if (this.itemForm.valid) {
      this.submitting.set(true);
      this.subscriptions.push(
        this.invoice
          .addInvoiceItem(body)
          .pipe(
            catchError((error) => {
              this.err_msg = error.error.errorMsg;
              return of(false);
            }),
            finalize(() => {
              this.submitting.set(false);
            })
          )
          .subscribe((res) => {
            const response = res as IAddInvoice;
            if (response.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Invoice item added',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              this.refreshDataTable();
              this.dialogRef.close({
                id: response.data.Id,
                name: body.product_name,
                unitPrice: body.unit_price,
                description: body.note
              });
            }
          })
      );
    }
  }

  update() {
    if (this.submitting()) return;
    this.itemForm.markAllAsTouched();
    const datas: AddinvoiceItem = this.CreateAddItemBody();
    if (
      this.itemForm.value.instock === '0' &&
      this.itemForm.value.instock !== ''
    ) {
      this.alertService.warningAlert({ content: 'Enter valid quantity' });
    } else if (this.itemForm.value.unit_price === 0) {
      this.alertService.warningAlert({ content: 'Enter valid unit price' });
    } else if (this.itemForm.valid) {
      this.submitting.set(true);
      this.subscriptions.push(
        this.invoice
          .updateInvoiceItem(this.data.id, datas)
          .pipe(
            catchError((error) => {
              this.err_msg = error.error.errorMsg;
              return of(false);
            }),
            finalize(() => {
              this.submitting.set(false);
            })
          )
          .subscribe((res) => {
            const response = res as IApiResMesssage;
            if (response.success === true) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Invoice item updated',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              this.refreshDataTable();
              this.dialogRef.close();
            }
          })
      );
    }
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
