import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IApiResMesssage } from 'src/app/models/api';
import {
  AddinvoiceItem,
  IEditInvoice
} from 'src/app/modules/invoices/model/invoice';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

interface IAddInvoice {
  success: boolean;
  message: string;
  data: { Id: string };
}
/**
 * @description Modal component for adding invoice item.
 */
@Component({
  selector: 'app-add-invoice-item',
  templateUrl: './add-invoice-item.component.html',
  styleUrls: ['./add-invoice-item.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    NgIf,
    MatDialogActions
  ]
})
export class AddInvoiceItemComponent implements OnInit, OnDestroy {
  itemForm!: UntypedFormGroup;

  Instock = false;
  editMode: boolean;
  subscriptions: Subscription[] = [];
  err_msg: string;
  isClicked: boolean = false;
  utils = Utils;

  private fb = inject(UntypedFormBuilder);
  public dialog = inject(MatDialog);
  private invoice = inject(InvoiceService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<AddInvoiceItemComponent>);
  public data: IEditInvoice = inject(MAT_DIALOG_DATA);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  ngOnInit(): void {
    this.initFromGroup();
    this.setEditData();
  }

  /**
   * @description Initializes item form.
   */
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

  /**
   * @description Creates and returns item body object for submitting or updating.
   * @returns item body object.
   */
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

  /**
   * @description Returns required field value of `itemForm`.
   * @param name - name of field.
   * @returns - field value.
   */
  getFormValue(name: string) {
    return this.itemForm.get(name)?.value;
  }

  /**
   * @description Sets `instock` form field value in accordance with checkbox status.
   * @param event - checkbox input event.
   */
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

  /**
   * @description Updates item form values.
   */
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

  /**
   * @description Method to add an invoice item. Creates the data body and posts it to `addInvoiceItem` method of invoice service.
   */
  submit() {
    if (this.isClicked) {
      return;
    }
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
      this.isClicked = true;
      this.subscriptions.push(
        this.invoice
          .addInvoiceItem(body)
          .pipe(
            catchError((error) => {
              this.err_msg = error.error.errorMsg;
              return of(false);
            }),
            finalize(() => {
              this.isClicked = false;
            })
          )
          .subscribe((res) => {
            const data = {
              title: 'Success',
              content: 'Invoice item added',
              close: true,
              timeout: 2000
            };
            const response = res as IAddInvoice;
            if (response.success) {
              this.alertService.successAlert(data);
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

  /**
   * @description Method to update an invoice item. Creates the data body and posts it to `updateInvoiceItem` method of invoice service.
   */
  update() {
    if (this.isClicked) {
      return;
    }
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
      this.isClicked = true;
      this.subscriptions.push(
        this.invoice
          .updateInvoiceItem(this.data.id, datas)
          .pipe(
            catchError((error) => {
              this.err_msg = error.error.errorMsg;
              return of(false);
            }),
            finalize(() => {
              this.isClicked = false;
            })
          )
          .subscribe((res) => {
            const data = {
              title: 'Success',
              content: 'Invoice Item Updated ',
              close: true,
              timeout: 2000
            };
            const response = res as IApiResMesssage;
            if (response.success === true) {
              const close = this.alertService.successAlert(data);

              close.afterClosed().subscribe((result) => {
                if (result) {
                  this.dataTableService.setRefreshStatus(true);
                  this.refreshDataTable();
                  this.dialogRef.close();
                }
              });
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
