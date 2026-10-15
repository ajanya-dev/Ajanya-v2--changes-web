import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { CurrencyPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  X,
  Trash2,
  Paperclip,
  TriangleAlert
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddAttachmentModalV4Component } from 'src/app/shared/modal/attachment-modal/add-attachment-modal-v4/add-attachment-modal-v4.component';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { V4PaymentLinksCreateComponent } from 'src/app/modules/v4-pages/v4-payment-links/components/v4-payment-links-create/v4-payment-links-create.component';
import { IApiResMesssage } from 'src/app/models/api';
import {
  IEmailSmsAttachment,
  IEmailSmsDialogData,
  IEmailSmsItems,
  IEvent,
  Invoicedata
} from 'src/app/modules/invoices/model/invoice';

/**
 * Dialog data for this modal. `isPayByLink` is set when the modal is launched
 * from the "Pay by Link" send option — the payable link column is then hidden
 * and every invoice is submitted with the custom link already enabled.
 */
interface IV4EmailSmsDialogData extends IEmailSmsDialogData {
  isPayByLink?: boolean;
}

@Component({
  selector: 'app-v4-email-sms',
  templateUrl: './v4-email-sms.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogClose,
    MatTooltip,
    CurrencyPipe,
    LucideAngularModule,
    CommonButtonV4Component,
    PhoneInputV4Component,
    CommonInputFieldV4Component
  ]
})
export class V4EmailSmsComponent implements OnInit {
  private dialog = inject(MatDialog);
  data: IV4EmailSmsDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  dialogRef = inject(MatDialogRef<V4EmailSmsComponent>);
  private router = inject(Router);
  private v3dataTableService = inject(V3DataTableService);
  private bankService = inject(BankService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly Trash2Icon = Trash2;
  readonly PaperclipIcon = Paperclip;
  readonly TriangleAlertIcon = TriangleAlert;

  emaildata!: FormGroup;
  transactions: Invoicedata[] = [];
  total = 0;
  isSubmitting = false;
  nonEmail = false;
  /** Launched from the "Pay by Link" send option. */
  isPayByLink = false;
  /** Invoice whose payment link is being generated, so only that row spins. */
  linkLoadingId: string | null = null;
  NonEmail: string[] = [];
  Attachment: IEmailSmsAttachment = {};
  indexofsms = 0;

  items: IEmailSmsItems = {
    invoicesIds: [],
    sendPayeeEmail: {},
    sms_checkbox: {},
    send_with_custom_link: {},
    sendPayeePhone: {}
  };

  private arr: Invoicedata[] = [];

  ngOnInit(): void {
    this.isPayByLink = !!this.data?.isPayByLink;
    this.initFormGroup();
    this.transactions = this.data.invoice_data as Invoicedata[];
    this.NonEmail = this.data.nonEmailInvoice;
    this.setCreditData();
    if (this.data.nonEmailInvoice.length > 0) {
      this.nonEmail = true;
    }
  }

  nonemailinvoice(): string {
    return this.NonEmail.toString();
  }

  initFormGroup(): void {
    this.emaildata = this.fb.group({
      item: this.fb.array([this.createEmailCtrl()])
    });
  }

  createEmailCtrl(): FormGroup {
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

  setCreditData(): void {
    if (this.data != null) {
      this.transactions.forEach((el: Invoicedata) => {
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
      this.emaildata.patchValue({ item: this.arr });
    }
  }

  get userFormGroups(): FormArray {
    return this.emaildata.get('item') as FormArray;
  }

  addCtrl(): void {
    this.userFormGroups.push(this.createEmailCtrl());
  }

  removeCtrl(i: number): void {
    this.userFormGroups.removeAt(i);
  }

  removeRow(i: number, id: string): void {
    if (this.emaildata.value.item[i].payeePhone) {
      const phone = this.userFormGroups.controls[i].value.payeePhone.length;
      const sms = document.getElementById(`sms_${id}`) as HTMLInputElement;
      if ((phone === 10 || phone === 14) && sms?.checked) {
        this.total -= 0.5;
        delete this.items.sms_checkbox[id];
      }
    }
    this.userFormGroups.removeAt(i);
    if (this.emaildata.value.item.length === 0) {
      this.dialogRef.close();
    }
  }

  openAddAttachmentModal(id: number): void {
    const invoiceattach = this.dialog.open(AddAttachmentModalV4Component, {
      width: '630px',
      maxWidth: '93%',
      disableClose: true,
      data: {
        id,
        type: 'invoices',
        acceptFormats: '.pdf',
        attachId: this.Attachment[id]
      },
      panelClass: 'paddingless-modal-rounded'
    });
    invoiceattach
      .afterClosed()
      .subscribe((res: { listData: any[]; refresh: boolean }) => {
        if (res) {
          this.Attachment = { ...this.Attachment, [id]: res.listData ?? [] };
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  /** *** SMS Logic *** */

  phoneNumberMask(phone: string): string {
    const num = String(phone);
    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    return `(${num1}) ${num2}-${num3}`;
  }

  smschecks(event: IEvent, i: number): boolean {
    const str = this.phoneNumberMask(
      String(this.emaildata.value.item[i].payeePhone)
    );
    if (event.target.checked === true && str.length !== 14) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      const target = event.target as HTMLInputElement;
      target.checked = false;
      return false;
    }
    return true;
  }

  smscheck(event: IEvent, a: number): void {
    this.phoneNumberMask(String(this.emaildata.value.item[a].payeePhone));
    const sms = document.getElementById('sms') as HTMLInputElement;
    if (this.smschecks(event, a)) {
      if (event.target?.checked === true && this.emaildata.value.item) {
        for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
          const id2 = this.emaildata.value.item[i].id;
          const sms1 = document.getElementById(
            `sms_${id2}`
          ) as HTMLInputElement;
          this.items.sms_checkbox[id2] = sms1.checked ? '1' : '';
        }
        this.total += 0.5;
        this.indexofsms += 1;
        if (this.indexofsms === this.emaildata.value.item.length) {
          sms.checked = true;
        }
      } else {
        for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
          const id2 = this.emaildata.value.item[i].id;
          const sms1 = document.getElementById(
            `sms_${id2}`
          ) as HTMLInputElement;
          if (!sms1.checked) {
            delete this.items.sms_checkbox[id2];
          } else {
            this.items.sms_checkbox[id2] = '1';
          }
        }
        this.total -= 0.5;
        this.indexofsms -= 1;
        sms.checked = false;
      }
    }
  }

  checkAllSms(event: IEvent): void {
    const sms = document.getElementById('sms') as HTMLInputElement;
    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const phone = this.emaildata.value.item[i].payeePhone;
      if (!phone || phone.length < 10) {
        sms.checked = false;
        this.alertService.warningAlert({
          content: `Please enter a valid phone number ${i + 1}`
        });
        return;
      }
    }
    if (event.target.checked === true) {
      for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
        const id2 = this.emaildata.value.item[i].id;
        const phone = this.emaildata.value.item[i].payeePhone;
        const sms1 = document.getElementById(`sms_${id2}`) as HTMLInputElement;
        if (phone !== '' && phone.length > 10 && !sms1.checked) {
          const smsEl = document.querySelector<HTMLInputElement>(`#sms_${id2}`);
          if (smsEl) smsEl.checked = sms.checked;
          this.items.sms_checkbox[id2] = '1';
          this.total += 0.5;
        }
      }
      this.indexofsms = this.emaildata.value.item.length;
    } else {
      for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
        const id2 = this.emaildata.value.item[i].id;
        const phone = this.emaildata.value.item[i].payeePhone;
        const sms1 = document.getElementById(`sms_${id2}`) as HTMLInputElement;
        if (phone !== '' && phone.length > 10 && sms1.checked) {
          const smsEl = document.querySelector<HTMLInputElement>(`#sms_${id2}`);
          if (smsEl) smsEl.checked = false;
          this.items.sms_checkbox = {};
          this.total -= 0.5;
        }
      }
    }
  }

  /** *** Payable Link Logic *** */

  checkAllPayableLinks(): void {
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

  paycheck(): void {
    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const id2 = this.emaildata.value.item[i].id;
      const el = document.getElementById(`pay_${id2}`) as HTMLInputElement;
      this.items.send_with_custom_link[id2] = el.checked ? 'on' : '';
    }
  }

  /** *** Bulk Pay by Link *** */

  /**
   * True while at least one listed invoice still has no payable link. The
   * `payableLinkId` values come from `/invoices/mail`, so no per-invoice check
   * call is needed when the modal opens.
   */
  get hasMissingPaymentLink(): boolean {
    if (!this.isPayByLink) return false;
    return this.emaildata.value.item.some(
      (row: { payableLinkId: string }) => !row.payableLinkId
    );
  }

  /** Number of invoices still waiting for a payable link. */
  get missingPaymentLinkCount(): number {
    return this.emaildata.value.item.filter(
      (row: { payableLinkId: string }) => !row.payableLinkId
    ).length;
  }

  /**
   * Creates a payable link for the bank account behind the given row. The mail
   * payload carries no bank account id, so it is read from the invoice itself —
   * a single call made only when the user asks for a link.
   */
  createPaymentLink(index: number): void {
    const row = this.userFormGroups.at(index)?.value;
    if (!row?.id || this.linkLoadingId) return;

    this.linkLoadingId = row.id;
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
        switchMap((ready) => (ready ? this.refreshPayableLinks() : of(false))),
        catchError(() => of(false)),
        finalize(() => {
          this.linkLoadingId = null;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Resolves to true when the bank account already has a payable link, or when
   * the user generates one through the prompt.
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

  /** Confirms, opens the create-link modal, then re-checks the account once. */
  private promptGeneratePaymentLink(
    bankAccountId: string
  ): Observable<boolean> {
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
            .open(V4PaymentLinksCreateComponent, {
              data: { selectedBankId: bankAccountId },
              panelClass: 'paddingless-modal-rounded',
              width: '600px'
            })
            .afterClosed()
            .pipe(
              switchMap((created) =>
                created?.success
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

  /** *** Submit *** */

  submit(): void {
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

    this.isSubmitting = true;
    for (let i = 0; i < this.emaildata.value.item.length; i += 1) {
      const id2 = this.emaildata.value.item[i].id;
      this.items.invoicesIds.push(id2);
      this.items.sendPayeeEmail[id2] = this.emaildata.value.item[i].payeeEmail;
      this.items.sendPayeePhone[id2] = this.emaildata.value.item[i].payeePhone;
      // Pay by link hides the payable link column, so send it as always checked.
      if (this.isPayByLink) {
        this.items.send_with_custom_link[id2] = 'on';
      }
    }

    this.invoiceService
      .sendEmail(this.items)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          const { errorCode } = error.error;
          const errMsg = error.error.errorMsg;
          this.isSubmitting = false;
          this.items.invoicesIds = [];
          if (errorCode === 122) {
            const warningAlert = this.alertService.warningAlert({
              content: errMsg,
              doneMsg: 'Generate',
              isCancel: true
            });
            warningAlert.afterClosed().subscribe((response) => {
              if (response) {
                this.router.navigate(['/v4/manage/payment-links/create']);
              }
            });
          }
          return of(false);
        })
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.v3dataTableService.refreshV3DataTable();
          const close = this.alertService.successAlert({
            title: 'Success',
            content: 'Emailed successfully',
            close: true,
            timeout: 2000
          });
          close.afterClosed().subscribe(() => {
            this.dialogRef.close({ status: true });
          });
        } else {
          this.isSubmitting = false;
          this.items.invoicesIds = [];
        }
      });
  }
}
