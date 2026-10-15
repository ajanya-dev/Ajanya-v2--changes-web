import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IApiResMesssage } from 'src/app/models/api';
import {
  AddinvoiceItem,
  IEvent,
  INumberOnlyEvent
} from 'src/app/modules/invoices/model/invoice';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';

/**
 * This component is responsible for adding an item to an invoice.
 */
@Component({
  selector: 'app-add-invoice-item',
  templateUrl: './add-invoice-item.component.html',
  styleUrls: ['./add-invoice-item.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    NgIf,
    MatDialogActions,
    MatDialogClose
  ]
})
export class AddInvoiceItemComponent implements OnInit, OnDestroy {
  /**
   * FormGroup for the item form.
   */
  itemForm: UntypedFormGroup;

  /**
   * Indicates whether the item is in stock.
   */
  Instock = false;

  /**
   * Indicates whether the component is in edit mode.
   */
  editMode: boolean;

  /**
   * Array to hold subscriptions for cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Error message for handling API errors.
   */
  err_msg: string;

  /**
   * Utility methods.
   */
  utils = Utils;

  /**
   * Constructor for the AddInvoiceItemComponent.
   *
   * @param fb - UntypedFormBuilder for creating the form group.
   * @param __dialog - MatDialog for displaying dialogs.
   * @param _invoice - InvoiceService for interacting with the invoice service.
   * @param _alertService - AlertService for displaying alerts.
   * @param dialogRef - MatDialogRef for referencing the dialog.
   * @param data - Data passed to the dialog.
   * @param _dataTableService - DataTableService for managing data tables.
   */
  constructor(
    private fb: UntypedFormBuilder,
    public __dialog: MatDialog,
    private _invoice: InvoiceService,
    private _alertService: AlertService,
    public dialogRef: MatDialogRef<AddInvoiceItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _dataTableService: DataTableService
  ) {}

  /**
   * Lifecycle hook called after the component is initialized.
   * Initializes the form group and sets edit data if provided.
   */
  ngOnInit(): void {
    this.initFromGroup();
    this.setEditData();
  }

  //*********************** initFormGroup ************************** //

  /**
   * Initializes the form group for the item.
   */
  initFromGroup() {
    this.itemForm = this.fb.group({
      product_name: ['', Validators.required],
      unit_price: ['', Validators.required],
      description: [''],
      private_note: [''],
      track: [false],
      instock: [0, Validators.required]
    });
  }

  //*********************** create a body function *********************//

  /**
   * Creates a body for adding an item.
   *
   * @returns Body for adding an item.
   */
  CreateAddItemBody() {
    return {
      product_name: this.getFormValue('product_name'),
      unit_price: this.getFormValue('unit_price'),
      note: this.getFormValue('description'),
      private_note: this.getFormValue('private_note'),
      track: this.getFormValue('track'),
      stock: this.getFormValue('instock')
    };
  }

  /**
   * Gets the value of a form control by name.
   *
   * @param name - Name of the form control.
   * @returns The value of the specified form control.
   */
  getFormValue(name: string) {
    return this.itemForm.get(name)?.value;
  }

  // ********************** Instock product ************************* //

  /**
   * Handles the checkbox event for instock products.
   *
   * @param event - Checkbox change event.
   */
  checked(event: IEvent) {
    if (event.target.checked) {
      this.Instock = true;
    } else {
      this.Instock = false;
    }
  }

  // ******************** number only function in text  ********************* //

  /**
   * Handles number-only input validation.
   *
   * @param event - Key press event.
   * @returns True if the input is a number, false otherwise.
   */
  numberOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Sets edit data if provided when opening the dialog.
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
        private_note: this.data.note,
        instock: this.data.stock
      });
    }
  }

  // ********************** add item ************************* //

  /**
   * Submits the item form, adds the item to the invoice, and handles the response.
   */
  submit() {
    this.itemForm.markAllAsTouched();
    const data: AddinvoiceItem = this.CreateAddItemBody();
    if (this.itemForm.valid) {
      this.subscriptions.push(
        this._invoice
          .addInvoiceItem(data)
          .pipe(
            catchError((error) => {
              this.err_msg = error.error.errorMsg;
              return of(false);
            })
          )
          .subscribe((res) => {
            const data = {
              title: 'Success',
              content: 'Invoice item added ',
              close: true,
              timeout: 2000
            };

            if ((res as IApiResMesssage).success) {
              const close = this._alertService.successAlert(data);

              close.afterClosed().subscribe((result) => {
                if (result) {
                  this._dataTableService.setRefreshStatus(true);
                  this.dialogRef.close();
                }
              });
            }
          })
      );
    }
  }
  // ********************** Update ************************* //

  update() {
    this.itemForm.markAllAsTouched();

    const datas: AddinvoiceItem = this.CreateAddItemBody();

    // if (this.itemForm.valid) {
    this.subscriptions.push(
      this._invoice
        .updateInvoiceItem(this.data.id, datas)
        .pipe(
          catchError((error) => {
            this.err_msg = error.error.errorMsg;
            return of(false);
          })
        )
        .subscribe((res) => {
          const data = {
            title: 'Success',
            content: 'Item updated ',
            close: true,
            timeout: 2000
          };

          if ((res as IApiResMesssage).success) {
            const close = this._alertService.successAlert(data);

            close.afterClosed().subscribe((result) => {
              if (result) {
                this._dataTableService.setRefreshStatus(true);
                this.dialogRef.close();
              }
            });
          }
        })
    );
    // }
  }

  /**
   * Handles input validation for allowing only numbers and decimals.
   *
   * @param event - Key press event.
   * @returns True if the input is a number or decimal point, false otherwise.
   */
  amountOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
