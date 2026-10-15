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
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';

import {
  AddPaymentInterface,
  INumberOnlyEvent
} from 'src/app/modules/invoices/model/invoice';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgxMaskDirective } from 'ngx-mask';

/**
 * This component is responsible for adding a payment for an invoice.
 */
@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class AddPaymentComponent implements OnInit, OnDestroy {
  /**
   * FormGroup for the payment form.
   */
  AddpaymentForm!: UntypedFormGroup;

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
   * Constructor for the AddPaymentComponent.
   *
   * @param fb - UntypedFormBuilder for creating the form group.
   * @param _invoice - InvoiceService for interacting with the invoice service.
   * @param __dialog - MatDialog for displaying dialogs.
   * @param id - Data containing the invoice ID.
   * @param _alert - AlertService for displaying alerts.
   * @param dialogRef - MatDialogRef for referencing the dialog.
   * @param _dataTableService - DataTableService for managing data tables.
   */
  constructor(
    private fb: UntypedFormBuilder,
    private _invoice: InvoiceService,
    public __dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public id: string,
    private _alert: AlertService,
    public dialogRef: MatDialogRef<AddPaymentComponent>,
    private _dataTableService: DataTableService
  ) {}

  /**
   * Lifecycle hook called after the component is initialized.
   * Initializes the form group.
   */
  ngOnInit(): void {
    this.initFormGroup();
  }

  //****************************** initFormGroup************************* *//

  /**
   * Initializes the form group for payment information.
   */
  initFormGroup() {
    this.AddpaymentForm = this.fb.group({
      Amount: ['', Validators.required],
      type: ['', Validators.required],
      paymentDate: [''],
      Reference: ['']
    });
  }

  //************************* create a function **************************//

  /**
   * Creates payment information for adding.
   *
   * @returns Payment information for adding.
   */
  CreateAddPaymentBody() {
    return {
      InvoicePaymentAmount: this.getFormValue('Amount'),
      InvoicePaymentType: this.getFormValue('type'),
      InvoicePaymentReference: this.getFormValue('Reference'),
      InvoicePaymentDate: this.getFormValue('paymentDate')
    };
  }

  /**
   * Gets the value of a form control by name.
   *
   * @param name - Name of the form control.
   * @returns The value of the specified form control.
   */
  getFormValue(name: string) {
    return this.AddpaymentForm.get(name)?.value;
  }

  // ******************** number only function in text  ********************* //

  /**
   * Handles number-only input validation.
   *
   * @param event - Key press event.
   * @returns True if the input is a number or decimal point, false otherwise.
   */
  numberOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode != 46) {
      return false;
    }
    return true;
  }

  //********************* sumbit the  Invoice Tax ******************************//

  /**
   * Submits the payment form, adds the payment to the invoice, and handles the response.
   */
  submit() {
    this.AddpaymentForm.markAllAsTouched();

    const data: AddPaymentInterface = this.CreateAddPaymentBody();

    if (this.AddpaymentForm.valid) {
      this.subscriptions.push(
        this._invoice.addpayement(this.id, data).subscribe((res) => {
          const data = {
            title: 'Success',
            content: 'Payment added successfully',
            close: true,
            timeout: 2000
          };

          if (res.success) {
            const close = this._alert.successAlert(data);

            close.afterClosed().subscribe((result) => {
              if (result) {
                this._dataTableService.setRefreshStatus(true);
                this.dialogRef.close(true);
              }
            });
          }
        })
      );
    }
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
