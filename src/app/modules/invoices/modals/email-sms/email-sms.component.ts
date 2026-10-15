import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
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
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { IApiResMesssage } from 'src/app/models/api';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgFor, NgClass, CurrencyPipe } from '@angular/common';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { GetPaidByLinkComponent } from 'src/app/modules/payment-link/pages/get-paid-by-link/get-paid-by-link.component';
import { InvoiceAddAttachmentModalComponent } from '../invoice-add-attachment/invoice-add-attachment.component';
import {
  IEmailSmsAttachment,
  IEmailSmsDialogData,
  IEmailSmsItems,
  IEvent,
  IIds,
  INumberOnlyEvent,
  ITransaction,
  Invoicedata
} from '../../model/invoice';
import { NewPhoneInputComponent } from '../../../../shared/components/new-phone-input/new-phone-input.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

/**
 * Dialog data for this modal. `isPayByLink` is set when the modal is launched
 * from the "Pay by Link" send option — the payable link column is then hidden
 * and every invoice is submitted with the custom link already enabled.
 */
interface IEmailSmsPayByLinkDialogData extends IEmailSmsDialogData {
  isPayByLink?: boolean;
}

/**
 * Component responsible for handling email and SMS sending functionality for invoices.
 */
@Component({
  selector: 'app-email-sms',
  templateUrl: './email-sms.component.html',
  styleUrls: ['./email-sms.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    NgIf,
    NgFor,
    NgClass,
    MatTooltip,
    NewPhoneInputComponent,
    MatDialogActions,
    CurrencyPipe
  ]
})
export class EmailSmsComponent implements OnInit, OnDestroy {

  public dialog = inject(MatDialog);
  public data: IEmailSmsPayByLinkDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(UntypedFormBuilder);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<EmailSmsComponent>);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private headerservice = inject(HeaderService);
  private v3dataTableService = inject(V3DataTableService);
  private bankService = inject(BankService);


  /**
   * Array to hold subscriptions for cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Error message displayed in case of an error.
   */
  err_msg: string;

  /**
   * Error code received from the server.
   */
  errorCode: number;

  /**
   *  Form group for email data.
   */
  emaildata!: UntypedFormGroup;

  /**
   * Displayed columns in the table.
   */
  displayedColumns: string[] = [
    'id',
    'pay_to',
    'pay_from',
    'email',
    'sms',
    'check',
    'amount',
    'attachment',
    'total'
  ];

  /**
   * Array of transaction data.
   */
  transactions: ITransaction[] | Invoicedata[] = [];

  /**
   *  Total amount for sending emails and SMS.
   */
  total = 0;

  /**
   * Loading indicator.
   */
  loading = false;

  /**
   * Object for storing email and SMS sending options.
   */
  items: IEmailSmsItems = {
    invoicesIds: [],
    sendPayeeEmail: {},
    sms_checkbox: {},
    send_with_custom_link: {},
    sendPayeePhone: {}
  };

  /**
   * Email address.
   */
  Email: string;

  arr: ITransaction[] = [];

  /**
   * Displayed columns in the table.
   */
  nonEmail: boolean;

  /**
   * Array of non-email invoices.
   */
  NonEmail: string[] = [];

  /**
   * ID data.
   */
  id: IIds = {
    ids: []
  };

  /**
   * Index of SMS options.
   */
  indexofsms = 0;

  /**
   * Attachment data.
   */
  Attachment: IEmailSmsAttachment = {};

  /**
   * Launched from the "Pay by Link" send option.
   */
  isPayByLink = false;

  /**
   * Id of the invoice whose payment link is currently being generated, so only
   * that row shows a spinner.
   */
  linkLoadingId: string | null = null;

  /**
   * Lifecycle hook called after the component is initialized.
   * Initializes the form group and retrieves transaction data.
   */
  ngOnInit(): void {
    this.isPayByLink = !!this.data?.isPayByLink;
    this.initFormGroup();
    this.transactions = this.data.invoice_data;
    this.NonEmail = this.data.nonEmailInvoice;
    this.setCreditData();
    if (this.data.nonEmailInvoice.length > 0) {
      this.nonEmail = true;
      this.nonemailinvoice();
    }
  }

  /**
   * Converts the non-email invoices to a string.
   */
  nonemailinvoice() {
    const string = this.NonEmail.toString();
    return string;
  }

  /**
   * Initializes the emaildata form group.
   */
  initFormGroup() {
    this.emaildata = this.fb.group({
      item: this.fb.array([this.createEmailCtrl()])
    });
  }

  /**
   * Creates an UntypedFormGroup for email data.
   */
  createEmailCtrl(): UntypedFormGroup {
    return this.fb.group({
      id: [''],
      payeeName: [''],
      invoiceNo: [''],
      bankAccountAccountName: [''],
      grandTotal: [''],
      payeeEmail: [''],
      payeePhone: [''],
      smscheck: [''],
      payeeDeleted: [''],
      bankAccountDeleted: [''],
      payableLinkId: ['']
    });
  }

  /**
   * Sets credit transaction data.
   */
  setCreditData() {
    if (this.data != null) {
      this.transactions.forEach((el: Invoicedata) => {
        this.id.ids.push(el.id);
        this.arr.push({
          id: el.id,
          payeeName: el.payeeName,
          invoiceNo: el.invoiceNo,
          bankAccountAccountName: el.bankAccountAccountName,
          grandTotal: el.grandTotal,
          payeeEmail: el.payeeEmail,
          payeePhone: el.payeePhone,
          payeeDeleted: el.payeeDeleted,
          bankAccountDeleted: el.bankAccountDeleted,
          payableLinkId: el.payableLinkId
        });
        this.addCtrl();
        this.removeCtrl(this.transactions.length);
      });

      this.emaildata.patchValue({
        item: this.arr
      });
    }
  }

  /**
   * Gets the UntypedFormArray control named 'item' from the 'emaildata' form group.
   * @returns {UntypedFormArray} The 'item' control.
   */
  getFormControl(): UntypedFormArray {
    return this.emaildata.get('item') as UntypedFormArray;
  }

  /**
   * Gets a specific form control by its name from the 'emaildata' form group.
   * @param {string} name - The name of the form control.
   * @returns {FormControl} The requested form control.
   */
  getFormControls(name: string) {
    return this.emaildata.get(name);
  }

  /**
   * Gets the UntypedFormArray control named 'item' from the 'emaildata' form group.
   * This method is an alias for 'getFormControl'.
   * @returns {UntypedFormArray} The 'item' control.
   */
  get userFormGroups() {
    // return this.creditmemo.get('item') as FormArray
    return this.emaildata.get('item') as UntypedFormArray;
  }

  /**
   * Adds a new control to the 'item' UntypedFormArray.
   */
  addCtrl() {
    this.userFormGroups.push(this.createEmailCtrl());
  }

  /**
   * Removes a control at the specified index from the 'item' UntypedFormArray.
   * @param {number} i - The index of the control to be removed.
   */
  removeCtrl(i: number) {
    this.userFormGroups.removeAt(i);
  }

  /**
   * Removes a row based on the specified index and ID, and updates the 'total'.
   * @param {number} i - The index of the row to be removed.
   * @param {string} id - The ID associated with the row.
   */
  removeRow(i: number, id: string) {
    if (this.emaildata.value.item[i].payeePhone) {
      const phone = this.userFormGroups.controls[i].value.payeePhone.length;

      const sms = document.getElementById(`sms_${  id}`) as HTMLInputElement;

      if ((phone === 10 || phone === 14) && sms.checked) {
        this.total -= 0.5;
        this.userFormGroups.removeAt(i);
        //  const Id=id as keyof typeof this.items.sms_checkbox
        delete this.items.sms_checkbox[id];
      } else if (phone === 0 || phone == null || phone !== 10 || phone !== 14) {
        this.userFormGroups.removeAt(i);
      }
    } else if (
      this.emaildata.value.item[i].payeePhone ==='' ||
      this.emaildata.value.item[i].payeePhone == null ||
      this.emaildata.value.item[i].payeePhone !== 10 ||
      this.emaildata.value.item[i].payeePhone !== 14
    ) {
      this.userFormGroups.removeAt(i);
    }

    if (this.emaildata.value.item.length === 0) {
      this.dialogRef.close();
    }
  }

  /**
   * Opens a modal dialog to add attachments to an invoice.
   * @param {number} id - The ID of the invoice.
   */
  openAddAttachmentModal(id: number) {
    const invoiceattach = this.dialog.open(InvoiceAddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      data: {
        id,
        type: 'invoices',
        acceptFormats: '.pdf',
        attachId: this.Attachment[id]
      }
    });
    invoiceattach
      .afterClosed()
      .subscribe((res: { ids: string; fileName: string }) => {
        this.Attachment[id] = res.ids;
        this.Attachment.fileName = res.fileName;
      });
  }

  /** ************************************ Check Sms ************************************ */

  /**
   * Handles the logic for checking/unchecking the SMS checkbox.
   * @param {IEvent} event - The event object.
   * @param {number} a - The index of the row.
   */
  smscheck(event: IEvent, a: number) {
    this.phoneNumberMask(String(this.emaildata.value.item[a].payeePhone));
    const sms = document.getElementById('sms') as HTMLInputElement;

    if (this.smschecks(event, a) === true) {
      if (event.target?.checked === true && this.emaildata.value.item) {
        for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
          const id2 = this.emaildata.value.item[i].id;
          // const Id=id2 as keyof typeof this.items.sms_checkbox
          const sms1 = document.getElementById(
            `sms_${  id2}`
          ) as HTMLInputElement;
          if ((this.items.sms_checkbox[id2] = sms1.checked)) {
            this.items.sms_checkbox[id2] = sms1.checked ? '1' : '';
          } else {
            delete this.items.sms_checkbox[id2];
          }
        }
        this.total += 0.5;

        if (this.indexofsms !== this.emaildata.value.item.length) {
          this.indexofsms += 1;
        }
        if (this.indexofsms == this.emaildata.value.item.length) {
          sms.checked = true;
        }
      } else {
        for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
          const id2 = this.emaildata.value.item[i].id;
          const sms1 = document.getElementById(
            `sms_${  id2}`
          ) as HTMLInputElement;
          // this.items.sms_checkbox[id2] = !sms1.checked ? '' : '1';
          if ((this.items.sms_checkbox[id2] = !sms1.checked)) {
            delete this.items.sms_checkbox[id2];
          } else {
            this.items.sms_checkbox[id2] = sms1.checked ? '1' : '';
          }

          // this.items.sms_checkbox = [];
        }
        this.total -= 0.5;
        this.indexofsms -= 1;
        sms.checked = false;
      }
    }
  }

  /**
   * Checks/unchecks all SMS checkboxes based on the 'event' value.
   * @param {IEvent} event - The event object.
   */
  checkAllSms(event: IEvent) {
    const sms = document.getElementById('sms') as HTMLInputElement;

    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const phone = this.emaildata.value.item[i].payeePhone;
      // let sms1 = document.getElementById('sms_' + id2) as HTMLInputElement;

      if (phone === '' || phone.length < 10) {
        sms.checked = false;
        this.alertService.warningAlert({
          content: `Please enter a valid phone number ${  i + 1}`
        });
        return;
      }
    }

    if (event.target.checked === true) {
      for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
        const id2 = this.emaildata.value.item[i].id;
        const phone = this.emaildata.value.item[i].payeePhone;

        const sms1 = document.getElementById(`sms_${  id2}`) as HTMLInputElement;

        if (phone !== '' && phone.length > 10 && sms1.checked === false) {
          document.querySelector<HTMLInputElement>(
            `#sms_${this.emaildata.value.item[i].id}`
          )!.checked = sms.checked;
          this.items.sms_checkbox[id2] = sms1.checked ? '1' : '';
          this.total += 0.5;
        }
      }

      this.indexofsms = this.emaildata.value.item.length;
    } else {
      for (let i = 0; i < this.emaildata.value.item.length; i++) {
        const id2 = this.emaildata.value.item[i].id;
        const phone = this.emaildata.value.item[i].payeePhone;

        const sms1 = document.getElementById(`sms_${  id2}`) as HTMLInputElement;

        if (phone !== '' && phone.length > 10 && sms1.checked) {
          document.querySelector<HTMLInputElement>(
            `#sms_${this.emaildata.value.item[i].id}`
          )!.checked = false;
          this.items.sms_checkbox = {};
          this.total -= 0.5;
        }
      }
    }
  }

  /**
   * Handles the input for the phone number and updates SMS checkboxes accordingly.
   * @param {IEvent} event - The event object.
   * @param {number} i - The index of the row.
   */
  phone(event: IEvent, i: number) {
    const sms = document.getElementById('sms') as HTMLInputElement;
    const id2 = this.emaildata.value.item[i].id;
    const var1 = document.getElementById(
      `sms_${this.emaildata.value.item[i].id}`
    ) as HTMLInputElement;
    if (event.target.value.length !== 14 && var1.checked) {
      var1.checked = false;
      const sms1 = document.getElementById(`sms_${  id2}`) as HTMLInputElement;
      this.items.sms_checkbox[id2] = sms1.checked ? '' : '1';
      sms.checked = false;
      this.total -= 0.5;

    }
  }

  /**
   * Checks/unchecks all payable link checkboxes.
   */
  checkAllPayableLinks() {
    const payableLink = document.getElementById(
      'payable-link'
    ) as HTMLInputElement;
    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const data = document.querySelector<HTMLInputElement>(
        `#pay_${this.emaildata.value.item[i].id}`
      );
      if (data?.disabled === false) {
        data.checked = payableLink.checked;
        this.items.send_with_custom_link[this.emaildata.value.item[i].id] =
          data.checked ? 'on' : '';
      }
    }
  }

  /**
   * Formats a phone number into a specific pattern.
   * @param {string} phone - The input phone number.
   * @returns {string} The formatted phone number.
   */
  phoneNumberMask(phone: string) {
    const num = String(phone);
    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    const number = `(${  num1  }) ${  num2  }-${  num3}`;
    return number;
  }

  /** ************************************ Pay check ************************************ */

  /**
   * Handles the logic for checking/unchecking the pay checkbox.
   */
  paycheck() {
    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const id2 = this.emaildata.value.item[i].id;
      const sms1 = document.getElementById(`pay_${  id2}`) as HTMLInputElement;
      this.items.send_with_custom_link[id2] = sms1.checked ? 'on' : '';
    }
  }

  /** ******************************* Bulk Pay by Link ******************************** */

  /**
   * True while at least one listed invoice still has no payable link. The
   * `payableLinkId` values come from `/invoices/mail`, so no per-invoice check
   * call is needed when the modal opens.
   * @returns {boolean} True when a payment link is still missing.
   */
  get hasMissingPaymentLink(): boolean {
    if (!this.isPayByLink) return false;
    return this.emaildata.value.item.some(
      (row: { payableLinkId: string }) => !row.payableLinkId
    );
  }

  /**
   * Number of invoices still waiting for a payable link.
   * @returns {number} The count of invoices without a payable link.
   */
  get missingPaymentLinkCount(): number {
    return this.emaildata.value.item.filter(
      (row: { payableLinkId: string }) => !row.payableLinkId
    ).length;
  }

  /**
   * Creates a payable link for the bank account behind the given row. The mail
   * payload has no bank account id, so it is read from the invoice itself — a
   * single call made only when the user asks for a link.
   * @param {number} index - The index of the row in the form array.
   */
  createPaymentLink(index: number) {
    const row = this.userFormGroups.at(index)?.value;
    if (!row?.id || this.linkLoadingId) return;

    this.linkLoadingId = row.id;
    this.subscriptions.push(
      this.invoiceService
        .getInvoiceData(row.id)
        .pipe(
          switchMap((res) => {
            const bankAccountId = res?.data?.bankAccount?.bankAccountId;
            if (!bankAccountId) {
              this.alertService.warningAlert({
                content: 'Bank account not found for this invoice.'
              });
              return of(false);
            }
            return this.ensurePaymentLink(bankAccountId);
          }),
          switchMap((ready) =>
            ready ? this.refreshPayableLinks() : of(false)
          ),
          catchError(() => of(false)),
          finalize(() => {
            this.linkLoadingId = null;
          })
        )
        .subscribe()
    );
  }

  /**
   * Resolves to true when the bank account already has a payable link, or when
   * the user generates one through the prompt.
   * @param {string} bankAccountId - The bank account behind the invoice.
   * @returns {Observable<boolean>} True when a link is available.
   */
  private ensurePaymentLink(bankAccountId: string): Observable<boolean> {
    return this.hasPaymentLink(bankAccountId).pipe(
      switchMap((result) => {
        if (result.hasLink) return of(true);
        if (!result.isMissing) return of(false);
        return this.promptGeneratePaymentLink(bankAccountId);
      })
    );
  }

  /**
   * Calls `/bank-accounts/{id}/payment-links`. Error code 110 means the account
   * simply has no link yet — any other failure is treated as "cannot continue".
   * @param {string} bankAccountId - The bank account behind the invoice.
   * @returns {Observable<{hasLink: boolean, isMissing: boolean}>} The link state.
   */
  private hasPaymentLink(
    bankAccountId: string
  ): Observable<{ hasLink: boolean; isMissing: boolean }> {
    const headers = new HttpHeaders().set('disablePermission', 'true');
    return this.bankService.qetQrCode(bankAccountId, headers).pipe(
      map((res) => ({
        hasLink: !!res?.success && !!res?.data?.length,
        isMissing: false
      })),
      catchError((err) =>
        of({ hasLink: false, isMissing: err?.error?.errorCode === 110 })
      )
    );
  }

  /**
   * Confirms, opens the create-link modal, then re-checks the account once.
   * @param {string} bankAccountId - The bank account behind the invoice.
   * @returns {Observable<boolean>} True when a link was created.
   */
  private promptGeneratePaymentLink(bankAccountId: string): Observable<boolean> {
    return this.alertService
      .confirmAlert({
        title: 'Link not found !',
        content: 'Please add a payment link to the bank account',
        doneMsg: 'Generate a link',
        cancelMsg: 'No, cancel'
      })
      .afterClosed()
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) return of(false);
          return this.dialog
            .open(GetPaidByLinkComponent, {
              data: { selectedBankId: bankAccountId }
            })
            .afterClosed()
            .pipe(
              switchMap((created) =>
                created
                  ? this.hasPaymentLink(bankAccountId).pipe(
                      map((result) => result.hasLink)
                    )
                  : of(false)
              )
            );
        })
      );
  }

  /**
   * Re-reads the mail details for the listed invoices and patches the payable
   * link ids. One call clears every row sharing the bank account just linked.
   * @returns {Observable<boolean>} True when the rows were refreshed.
   */
  private refreshPayableLinks(): Observable<boolean> {
    const ids: string[] = this.emaildata.value.item.map(
      (row: { id: string }) => row.id
    );
    if (!ids.length) return of(false);

    return this.invoiceService.getMaildetails({ ids }).pipe(
      map((res) => {
        const rows = (res?.data?.invoice_data ?? []) as Invoicedata[];
        rows.forEach((data) => {
          const control = this.userFormGroups.controls.find(
            (ctrl) => ctrl.value.id === data.id
          );
          control?.patchValue({ payableLinkId: data.payableLinkId ?? '' });
        });
        return true;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Checks if SMS is valid and returns a boolean result.
   * @param {IEvent} event - The event object.
   * @param {number} i - The index of the row.
   * @returns {boolean} True if SMS is valid; otherwise, false.
   */
  smschecks(event: IEvent, i: number): boolean {
    const str = this.phoneNumberMask(
      String(this.emaildata.value.item[i].payeePhone)
    );

    if (event.target.checked === true && str.length !== 14) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      // let sms1 = document.getElementById('sms_' + id2) as HTMLInputElement;
      // this.items.sms_checkbox[id2] = sms1.checked ? '' : '1';
      // this.total = this.total - 0.50;
      event.target.checked = false;
      return false;
    }
      return true;

  }

  /** ************************************ SMS & Email ************************************ */

  /**
   * Submits the email/SMS data for processing.
   */
  submit() {
    // Every invoice needs its own payable link before a bulk link can be sent.
    // The button stays enabled so the click explains why nothing was sent.
    if (this.hasMissingPaymentLink) {
      const count = this.missingPaymentLinkCount;
      this.alertService.warningAlert({
        title: 'Payment link missing',
        content: `${count} ${
          count === 1 ? 'invoice has' : 'invoices have'
        } no payment link. Use "Create Link" in the action column of the highlighted ${
          count === 1 ? 'row' : 'rows'
        }, then send.`
      });
      return;
    }

    this.loading = true;

    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const id2 = this.emaildata.value.item[i].id;
      const email = this.emaildata.value.item[i].payeeEmail;
      const phone = this.emaildata.value.item[i].payeePhone;

      this.items.invoicesIds.push(this.emaildata.value.item[i].id);
      this.items.sendPayeeEmail[id2] = email;
      this.items.sendPayeePhone[id2] = phone;
      // Pay by link hides the payable link column, so send it as always checked.
      if (this.isPayByLink) {
        this.items.send_with_custom_link[id2] = 'on';
      }
    }
    this.subscriptions.push(
      this.invoiceService
        .sendEmail(this.items)
        .pipe(
          catchError((error) => {
            this.errorCode = error.error.errorCode;
            this.err_msg = error.error.errorMsg;

            if (this.errorCode === 122) {
              const warningAlert = this.alertService.warningAlert({
                content: this.err_msg,
                doneMsg: 'Generate',
                isCancel: true
              });
              warningAlert.afterClosed().subscribe((response) => {
                if (response) {
                  this.router.navigate(['/manage/payment-links/create']);
                }
              });
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          const data = {
            title: 'Success',
            content: 'Emailed  successfully',
            close: true,
            timeout: 2000
          };

          if ((res as IApiResMesssage).success) {
            const close = this.alertService.successAlert(data);
            this.v3dataTableService.refreshV3DataTable();

            close.afterClosed().subscribe((result) => {
              if (result) {
                this.dataTableService.setRefreshStatus(true);
                this.dialogRef.close();
              }
            });
            this.headerservice.setHeaderValueChanged(true);
          } else {
            this.loading = false;
            this.items.invoicesIds = [];
          }
        })
    );
  }

  /**
   * Handles the input to allow only numeric values.
   * @param {INumberOnlyEvent} event - The event object.
   * @returns {boolean} True if the input is numeric; otherwise, false.
   */
  numberOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Closes the component and triggers a refresh in the data table.
   */
  close() {
    this.dataTableService.setRefreshStatus(true);
  }

  /**
   * Lifecycle hook: Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
