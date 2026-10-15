import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  ValidatorFn,
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
  AddinvoiceTaxInterface,
  IAddTaxModalRes,
  IAddTaxRes,
  IEvent,
  INumberOnlyEvent
} from 'src/app/modules/invoices/model/invoice';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { NgIf } from '@angular/common';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from '../../../../shared/v3/control-message-v35/control-message-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * This component is responsible for adding or editing tax information for an invoice.
 */
@Component({
  selector: 'app-add-invoice-tax',
  templateUrl: './add-invoice-tax.component.html',
  styleUrls: ['./add-invoice-tax.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    FaIconComponent,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    MatDialogActions,
    CommonButtonV35Component,
    NgIf
  ]
})
export class AddInvoiceTaxComponent implements OnInit, OnDestroy {
  /**
   * FormGroup for the tax form.
   */
  taxForm!: UntypedFormGroup;

  /**
   * Array to hold subscriptions for cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Indicates whether the item is in stock.
   */
  Instock = false;

  /**
   * Error message for handling API errors.
   */
  err_msg: string;

  /**
   * Indicates whether the component is in edit mode.
   */
  editMode = false;

  /* The `savingLoading` variable is used to track the loading state of the form submission. It is
  initially set to `false` to indicate that the form submission is not in progress. When the form is
  submitted, `savingLoading` is set to `true` to indicate that the submission is in progress. This
  variable can be used to show a loading spinner or disable the submit button while the form is
  being submitted. */
  savingLoading = false;

  /**
   * Utility methods.
   */
  utils = Utils;

  /**
   * Constructor for the AddInvoiceTaxComponent.
   *
   * @param fb - UntypedFormBuilder for creating the form group.
   * @param invoice - InvoiceService for interacting with the invoice service.
   * @param alertService - AlertService for displaying alerts.
   * @param dialogRef - MatDialogRef for referencing the dialog.
   * @param dialog - MatDialog for displaying dialogs.
   * @param data - Data passed to the dialog.
   * @param dataTableService - DataTableService for managing data tables.
   */

  private fb = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<AddInvoiceTaxComponent>);
  public dialog = inject(MatDialog);
  public data: IAddTaxModalRes = inject(MAT_DIALOG_DATA);
  private dataTableService = inject(DataTableService);
  private invoice = inject(InvoiceService);
  private v3DataTableService = inject(V3DataTableService);

  /**
   * Lifecycle hook called after the component is initialized.
   * Initializes the form group and sets edit data if provided.
   */
  ngOnInit(): void {
    this.initFormGroup();
    this.setEditData();
  }

  //* ***************************** initFormGroup************************* *//

  /**
   * Initializes the form group for tax information.
   */
  initFormGroup() {
    this.taxForm = this.fb.group({
      tax_name: ['', Validators.required],
      tax_in: ['', Validators.required, this.decimalValidator()],
      note: ['']
    });
  }

  //* ************************ create a function **************************//

  /**
   * Creates tax information for adding or updating.
   *
   * @returns Tax information for adding or updating.
   */
  CreateInvoiceTaxBody() {
    return {
      tax_name: this.getFormValue('tax_name'),
      tax_percentage: this.getFormValue('tax_in'),
      note: this.getFormValue('note')
    };
  }

  /**
   * Gets the value of a form control by name.
   *
   * @param name - Name of the form control.
   * @returns The value of the specified form control.
   */
  getFormValue(name: string) {
    return this.taxForm.get(name)?.value;
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

  // ********************** edit tax ************************* //

  /**
   * Sets edit data if provided when opening the dialog.
   */
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

  /**
   * Validates the tax percentage input to ensure it is less than or equal to 100.
   *
   * @param ev - Input event containing the value.
   */
  validation(ev: IEvent) {
    const value = parseFloat(ev.target.value);
    if (value > 100) {
      this.taxForm.patchValue({
        tax_in: 100
      });
    }
  }

  decimalValidator(): ValidatorFn {
    return (control) => {
      const isValid = /^-?\d*\.?\d+$/.test(control.value);
      return of(isValid ? null : { invalidDecimal: true });
    };
  }

  //* ******************** sumbit the  Invoice Tax ******************************//

  /**
   * Submits the tax form, adds the tax information to the invoice, and handles the response.
   */
  submit() {
    this.taxForm.markAllAsTouched();

    const data: AddinvoiceTaxInterface = this.CreateInvoiceTaxBody();

    if (this.taxForm.valid) {
      if (this.taxForm.value.tax_in > 100) {
        this.alertService.infoAlert({
          content: 'Tax percentage should be less than 100'
        });
      } else if (this.taxForm.value.tax_in === '0') {
        this.alertService.warningAlert({
          content: 'Enter valid Tax percentage'
        });
      } else {
        this.savingLoading = true;
        this.subscriptions.push(
          this.invoice
            .addtax(data)
            .pipe(
              catchError((error) => {
                this.err_msg = error.error.errorMsg;
                return of(false);
              }),
              finalize(() => {
                this.savingLoading = false;
              })
            )
            .subscribe((res) => {
              const successData = {
                title: 'Success',
                content: 'Tax added ',
                close: true,
                timeout: 2000
              };

              if ((res as IAddTaxRes).success) {
                const close = this.alertService.successAlert(successData);
                this.dataTableService.setRefreshStatus(true);
                this.v3DataTableService.refreshV3DataTable();
                close.afterClosed().subscribe((result) => {
                  this.dialogRef.close((res as IAddTaxRes).data);
                  if (result && this.data.mode !== 'NOT-TAX') {
                    this.v3DataTableService.refreshV3DataTable();
                    this.dataTableService.setRefreshStatus(true);
                  }
                });
              }
            })
        );
      }
    }
  }

  // ********************** Update ************************* //

  /**
   * Updates the tax information in the invoice and handles the response.
   */
  update() {
    this.taxForm.markAllAsTouched();
    const datas: AddinvoiceTaxInterface = this.CreateInvoiceTaxBody();

    if (this.taxForm.valid) {
      if (this.taxForm.value.tax_in > 100) {
        this.alertService.infoAlert({
          content: 'Tax percentage should be less than 100'
        });
      } else if (this.taxForm.value.tax_in === '0') {
        this.alertService.warningAlert({
          content: 'Enter valid Tax percentage'
        });
      } else {
        this.savingLoading = true;
        this.subscriptions.push(
          this.invoice
            .updateTax(this.data.id, datas)
            .pipe(
              catchError((error) => {
                this.err_msg = error.error.errorMsg;
                return of(false);
              }),
              finalize(() => {
                this.savingLoading = false;
              })
            )
            .subscribe((res) => {
              const data = {
                title: 'Success',
                content: 'Tax Updated successfully',
                close: true,
                timeout: 2000
              };

              if ((res as IApiResMesssage).success) {
                const close = this.alertService.successAlert(data);

                close.afterClosed().subscribe((result) => {
                  if (result) {
                    this.dataTableService.setRefreshStatus(true);
                    this.v3DataTableService.refreshV3DataTable();
                    this.dialogRef.close();
                  }
                });
              }
            })
        );
      }
    }
  }

  /**
   * The close function closes the current dialog.
   */
  close(): void {
    this.dialogRef.close();
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
