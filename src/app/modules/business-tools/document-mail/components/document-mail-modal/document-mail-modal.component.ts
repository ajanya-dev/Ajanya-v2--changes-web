import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  faMinus,
  faPaperclip,
  faPenToSquare,
  faPlus,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  Subject,
  Subscription,
  finalize,
  firstValueFrom,
  forkJoin,
  takeUntil
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  IPayeeDropdown,
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IInvoiceRowData,
  Invoicedata
} from 'src/app/modules/invoices/model/invoice';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CurrencyPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DocumentMailService } from '../../services/document-mail.service';
import {
  IDocumentMailFromAddress,
  IDocumentMailShippingType,
  IDocumentMailUpload
} from '../../models/document-mail.model';
import { AddAddressModalComponent } from '../add-address-modal/add-address-modal.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { PayeeDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { V35CommonDropDownSelectorComponent } from '../../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';

interface IMailFormGroup {
  id: FormControl<string | null>;
  shipping_type: FormControl<string | null>;
  payee_id: FormControl<IPayeeDropdown | null>;
  validPayee: FormControl<boolean | null>;
  reply_to_id: FormControl<string | null>;
  document_title: FormControl<string | null>;
  document_memo: FormControl<string | null>;
  file?: FormControl<File | null>;
}

@Component({
  selector: 'app-document-mail-modal',
  templateUrl: './document-mail-modal.component.html',
  styleUrls: ['./document-mail-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    V35CommonDropDownSelectorComponent,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    PayeeDropdownV3Component,
    CommonButtonV35Component,
    CurrencyPipe
  ]
})
export class DocumentMailModalComponent implements OnInit, OnDestroy {
  private documentMailService = inject(DocumentMailService);
  private alertService = inject(AlertService);
  private matDialogRef = inject(MatDialogRef<DocumentMailModalComponent>);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3dataTableService = inject(V3DataTableService);
  private payeeModalService = inject(PayeeModalService);

  private dialogData: {
    type: 'normal' | 'bulk' | 'invoice' | 'added-invoice';
    invalidIds?: string[];
    documents:
      | Omit<IDocumentMailUpload, 'message'>[]
      | IInvoiceRowData[]
      | Invoicedata[];
  } = inject(MAT_DIALOG_DATA);

  addressList: IDocumentMailFromAddress[] = [];
  shippingTypes: IDocumentMailShippingType[] = [];
  type: 'normal' | 'bulk' | 'invoice' | 'added-invoice';
  numberOfMails = 5;

  destroy$ = new Subject<boolean>();
  addresLoading = false;
  shippingTypeLoading = false;
  subscriptions: Subscription[] = [];

  faXmark = faXmark;
  faMinus = faMinus;
  faPlus = faPlus;
  faPaperclip = faPaperclip;
  faTrash = faTrash;
  faPenToSquare = faPenToSquare;
  mailForm: FormArray<FormGroup<IMailFormGroup>>;

  commonFrom?: IDocumentMailFromAddress | string;
  commonPayee?: IPayeeDropdown;
  commonShippingType?: IDocumentMailShippingType;
  mailing = false;
  commonFile?: File;
  commonFileName = '';
  shippingCost = 0;
  invalidIds?: string[];
  newAddressPayeeName: string = '';
  newAddressIndexNo: number | undefined;

  ngOnInit(): void {
    this.type = this.dialogData.type;
    this.invalidIds = this.dialogData.invalidIds;
    this.getFromAddress();
    this.getShippingType();
    this.initForm();
  }

  /**
   * Initializes the mail form based on the specified type (normal or bulk).
   */
  initForm() {
    this.mailForm = new FormArray<FormGroup>([]);
    if (this.type === 'normal') {
      (
        this.dialogData.documents as Omit<IDocumentMailUpload, 'message'>[]
      ).forEach((val) => {
        this.mailForm.push(
          new FormGroup<IMailFormGroup>({
            id: new FormControl(val.id, Validators.required),
            payee_id: new FormControl(null, Validators.required),
            validPayee: new FormControl(false, [Validators.requiredTrue]),
            reply_to_id: new FormControl(null, Validators.required),
            document_memo: new FormControl(''),
            shipping_type: new FormControl(null, Validators.required),
            document_title: new FormControl({
              value: val.document_title,
              disabled: true
            })
          })
        );
      });
    } else if (this.type === 'bulk') {
      for (let i = 0; i < this.numberOfMails; i += 1) {
        this.mailForm.push(
          new FormGroup<IMailFormGroup>({
            id: new FormControl(null),
            payee_id: new FormControl(null, Validators.required),
            validPayee: new FormControl(false, [Validators.requiredTrue]),
            reply_to_id: new FormControl(null, Validators.required),
            document_memo: new FormControl(''),
            shipping_type: new FormControl(null, Validators.required),
            document_title: new FormControl({ value: null, disabled: true }),
            file: new FormControl(null, Validators.required)
          })
        );
      }
    } else if (this.type === 'invoice') {
      (this.dialogData.documents as IInvoiceRowData[]).forEach((val) => {
        this.mailForm.push(
          new FormGroup<IMailFormGroup>({
            id: new FormControl(val.action, Validators.required),
            payee_id: new FormControl(
              {
                value: val.payee_id
                  ? ({ id: val.payee_id, name: val.payee_name || '' } as IPayeeDropdown)
                  : null,
                disabled: true
              },
              Validators.required
            ),
            validPayee: new FormControl(false, [Validators.requiredTrue]),
            reply_to_id: new FormControl(''),
            document_memo: new FormControl(''),
            shipping_type: new FormControl(null, Validators.required),
            document_title: new FormControl({
              value: `Invoice: ${val.invoice_no}`,
              disabled: true
            })
          })
        );
        this.isValidPayee(val.payee_id);
      });
    } else if (this.type === 'added-invoice') {
      (this.dialogData.documents as Invoicedata[]).forEach((val) => {
        this.mailForm.push(
          new FormGroup<IMailFormGroup>({
            id: new FormControl(val.id, Validators.required),
            payee_id: new FormControl(
              {
                value: val.payee_id
                  ? ({ id: val.payee_id, name: val.payeeName || '' } as IPayeeDropdown)
                  : null,
                disabled: true
              },
              Validators.required
            ),
            validPayee: new FormControl(false, [Validators.requiredTrue]),
            reply_to_id: new FormControl(''),
            document_memo: new FormControl(''),
            shipping_type: new FormControl(null, Validators.required),
            document_title: new FormControl({
              value: `Invoice: ${val.invoiceNo}`,
              disabled: true
            })
          })
        );
      this.isValidPayee(val.payee_id);
      });
    }

    this.mailForm.controls.forEach((control) => {
      if (control) {
        control.controls.shipping_type.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.calculateShippingCost();
          });
      }
    });

    this.mailForm.controls.forEach((control) => {
      if (control) {
        control.controls.payee_id.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            control.controls.validPayee.markAsTouched();
            const payee = control.controls.payee_id.value;
            control.controls.validPayee.setValue(
              Boolean(
                payee &&
                  payee.zip &&
                  payee.addressLine1 &&
                  payee.state &&
                  payee.country
              )
            );
            this.calculateShippingCost();
          });
      }
    });
  }

  /**
   * Changes the number of rows in the mail form based on the specified type (increase, decrease, immediate).
   *
   * @param {('inc' | 'dec' | 'immediate')} type - Type of row count change.
   */
  changeRowCount(type: 'inc' | 'dec' | 'immediate') {
    if (this.mailForm.length === 1 && type === 'dec') return;
    if (this.mailForm.length === 10 && type === 'inc') return;

    if (type === 'inc') {
      const form = new FormGroup<IMailFormGroup>({
        id: new FormControl(null),
        validPayee: new FormControl(false, [Validators.requiredTrue]),
        payee_id: new FormControl(null, Validators.required),
        reply_to_id: new FormControl(null, Validators.required),
        document_memo: new FormControl(''),
        shipping_type: new FormControl(null, Validators.required),
        document_title: new FormControl(null)
      });
      if (this.type === 'bulk') {
        form.addControl('file', new FormControl(null, Validators.required));
      }
      this.mailForm.push(form);
      form.controls.shipping_type.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculateShippingCost();
        });
      this.numberOfMails += 1;
    } else {
      this.mailForm.controls.pop();
      this.numberOfMails -= 1;
    }
  }

  /**
   * Changes the row count immediately based on the input value.
   *
   * @param {HTMLInputElement} input - HTML input element containing the new row count.
   */
  immediateRowCountChange(input: HTMLInputElement) {
    if (
      Number(input.value) < 1 ||
      Number(input.value) > 10 ||
      Number(input.value) === this.mailForm.length
    ) {
      return;
    }

    if (Number(input.value) > this.mailForm.length) {
      const limit = Number(input.value) - this.mailForm.length;
      for (let i = 0; i < limit; i += 1) {
        const form = new FormGroup<IMailFormGroup>({
          id: new FormControl(null),
          payee_id: new FormControl(null, Validators.required),
          validPayee: new FormControl(false, [Validators.requiredTrue]),
          reply_to_id: new FormControl(null, Validators.required),
          document_memo: new FormControl(''),
          shipping_type: new FormControl(null, Validators.required),
          document_title: new FormControl(null)
        });
        if (this.type === 'bulk') {
          form.addControl('file', new FormControl(null, Validators.required));
        }
        this.mailForm.push(form);
        form.controls.shipping_type.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.calculateShippingCost();
          });
      }
    } else {
      this.mailForm.controls.length = Number(input.value);
    }
  }

  /**
   * Fetches the available shipping types from the DocumentMailService.
   */
  getShippingType() {
    this.shippingTypeLoading = true;
    this.documentMailService
      .getShippingType()
      .pipe(
        finalize(() => {
          this.shippingTypeLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.shippingTypes = res;
        const firstClass = res.find((val) => val.id === 1);
        this.mailForm.controls.forEach((form) => {
          form.controls.shipping_type.setValue(JSON.stringify(firstClass));
        });
      });
  }

  /**
   * Fetches the available from addresses from the DocumentMailService.
   */
  getFromAddress(): void {
    this.addresLoading = true;
    this.documentMailService
      .getAllFromAddress()
      .pipe(
        finalize(() => {
          this.addresLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res) {
          this.addressList = res.data;
          const foundAddress = this.addressList.find(
            (item) => item.payee_name === this.newAddressPayeeName
          );
          if (foundAddress) {
            const newValue = JSON.stringify(foundAddress);
            if (
              this.newAddressIndexNo !== undefined &&
              this.newAddressPayeeName !== ''
            ) {
              this.mailForm.controls[
                this.newAddressIndexNo
              ].controls.reply_to_id.setValue(newValue);
              this.newAddressIndexNo = undefined;
            } else if (
              this.newAddressIndexNo === undefined &&
              this.newAddressPayeeName !== ''
            ) {
              this.commonFrom = newValue;
              this.onCommonFromChange(this.commonFrom);
            }
          }
          this.newAddressPayeeName = '';
        }
      });
  }

  /**
   * Deletes a row from the mail form at the specified index after confirming with the user.
   * @param {number} index - Index of the row to be deleted.
   */
  async deleteRow(index: number) {
    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({ content: 'Are you sure? ' })
        .afterClosed()
    );
    if (result) {
      this.mailForm.controls.splice(index, 1);
      this.mailForm.updateValueAndValidity();
      this.calculateShippingCost();
      if (!this.mailForm.controls.length) this.matDialogRef.close();
    }
  }

  /**
   * Handles the change event when a common from address is selected.
   *
   * @param {string} val - Selected common from address value.
   */
  onCommonFromChange(val: string) {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.reply_to_id.setValue(val);
      });
    }
  }

  /**
   * Handles the change event when a common shipping type is selected.
   *
   * @param {string} val - Selected common shipping type value.
   */
  onCommonShippingChange(val: string) {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.shipping_type.setValue(val);
      });
    }
  }

  /**
   * Handles the click event for the file attachment element.
   *
   * @param {HTMLInputElement} element - HTML input element for file attachment.
   */
  clickFileAttachment(element: HTMLInputElement) {
    if (this.type === 'normal') return;
    element.click();
  }

  /**
   * Handles the file pick event for the common file attachment.
   *
   * @param {Event & { target: HTMLInputElement }} event - File pick event.
   */
  onCommonFilePick(event: Event & { target: HTMLInputElement }) {
    if (!event.target.files?.length) {
      this.commonFile = undefined;
      this.commonFileName = '';
      return;
    }

    this.commonFile = event.target.files[0];
    this.commonFileName = this.commonFile.name;

    this.mailForm.controls.forEach((control) => {
      if (control.controls.file) {
        control.controls.file.setValue(this.commonFile as File);
        control.controls.document_title.setValue(
          this.commonFile?.name as string
        );
      }
    });
  }

  /**
   * Handles the file pick event for individual file attachments.
   *
   * @param {Event & { target: HTMLInputElement }} event - File pick event.
   * @param {number} index - Index of the row in the mail form.
   */
  onIndividualFilePick(
    event: Event & { target: HTMLInputElement },
    index: number
  ) {
    this.commonFile = undefined;
    this.commonFileName = '';

    if (event.target.files?.length) {
      this.mailForm.controls[index].controls.file?.setValue(
        event.target.files[0]
      );
      this.mailForm.controls[index].controls.document_title.setValue(
        event.target.files[0].name
      );
    } else {
      this.mailForm.controls[index].controls.file?.setValue(null);
      this.mailForm.controls[index].controls.document_title.setValue(null);
    }
  }

  /**
   * Submits the mail form and sends individual or bulk mails based on the specified type.
   */
  onSubmit() {
    if (this.mailForm.invalid) {
      this.mailForm.markAllAsTouched();
      return;
    }

    if (this.type === 'bulk') {
      this.bulkMail();
      return;
    }

    if (this.type === 'invoice' || this.type === 'added-invoice') {
      this.invoiceMail();
      return;
    }

    this.documentMail();
  }

  /**
   * Calling docment mail api with avaiable data from the form.
   */
  documentMail() {
    this.mailForm.controls.forEach((val) =>
      val.controls.document_title.enable()
    );

    const payload = this.mailForm.value.map((val) => ({
      ...val,
      shipping_type: JSON.parse(val.shipping_type as string).id,
      payee_id: val.payee_id?.id,
      reply_to_id: JSON.parse(val.reply_to_id as string).id
    }));

    this.mailForm.controls.forEach((val) =>
      val.controls.document_title.disable()
    );

    this.mailing = true;
    this.documentMailService
      .sendMail(payload)
      .pipe(
        finalize(() => {
          this.mailing = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.afterSuccess();
        }
      });
  }

  /**
   * Calculating shipping cost whenver there is a change in shipping type
   */
  calculateShippingCost() {
    this.shippingCost = this.mailForm.controls.reduce((total, val) => {
      let valObj: IDocumentMailShippingType | undefined;
      try {
        valObj = JSON.parse(val.controls.shipping_type.value as string);
      } catch (e) {
        valObj = undefined;
      }
      // eslint-disable-next-line no-return-assign, no-param-reassign
      return (total += Number(valObj?.amount) || 0 || 0);
    }, 0);
  }

  /**
   * Sends bulk mails by uploading documents and then sending mail for each document.
   */
  bulkMail() {
    forkJoin(
      this.mailForm.controls.map((control) => {
        const arr = new Uint32Array(2);

        const payload = new FormData();

        payload.append('file', control.value.file as File);

        payload.append(
          'idempotency_key',
          window.crypto.getRandomValues(arr).join('')
        );

        control.controls.document_title.enable();
        payload.append(
          'document_title',
          control.value.document_title as string
        );
        control.controls.document_title.disable();

        return this.documentMailService.uploadDocument(payload);
      })
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        const payload: unknown[] = [];

        val.forEach((res, i) => {
          if (res.success) {
            this.mailForm.controls[i].controls.document_title.enable();
            const values = this.mailForm.controls[i].value;
            payload.push({
              ...values,
              id: res.data.id,
              file: undefined,
              shipping_type: JSON.parse(values.shipping_type as string).id,
              payee_id: values.payee_id?.id as string,
              reply_to_id: JSON.parse(values.reply_to_id as string).id
            });
            this.mailForm.controls[i].controls.document_title.disable();
          }
        });

        this.mailing = true;
        this.documentMailService
          .sendMail(payload)
          .pipe(
            finalize(() => {
              this.mailing = false;
            }),
            takeUntil(this.destroy$)
          )
          .subscribe((res) => {
            if (res.success) {
              this.afterSuccess();
            }
          });
      });
  }

  /**
   * Calling  invoice mail api with available data from the form.
   */
  invoiceMail() {
    const payload = this.mailForm.value.map((val) => ({
      id: val.id ?? '',
      shipping_type: JSON.parse(val.shipping_type as string).id ?? ''
    }));

    this.mailing = true;
    this.documentMailService
      .invoiceMail(payload)
      .pipe(
        finalize(() => {
          this.mailing = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        if (val.success) {
          this.afterSuccess();
        }
      });
  }

  /**
   * Opens the add address modal using MatDialog for adding a new from address.
   */
  addFromAddress(index?: number | undefined) {
    const dialogRef = this.dialog.open(AddAddressModalComponent, {
      width: '500px'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val.success) {
          this.newAddressPayeeName = val.data.payee_name;
          if (index !== undefined && index !== null) {
            this.newAddressIndexNo = index;
          }
          this.getFromAddress();
        }
      });
  }

  /**
   * Method to edit the payee if the payee address is invalid.
   * if editing is success, we get the new payee address from the modal as return value.
   * and we setting the new value to the form and revalidating it.
   */
  editPayee(
    control: FormControl<IPayeeDropdown | null>,
    group: FormGroup<IMailFormGroup>
  ) {
    if (
      !(control.value && typeof control.value === 'object' && control.value?.id)
    ) {
      return;
    }

    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(control.value.id, 'addPayeeModal', {
          edit: true,
          id: control.value.id
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((val) => {
                if (val?.success) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { success, payeeTypeId, ...payee } = val;
                  group.controls.payee_id.setValue({ ...payee });
                }
              })
            );
          }
        })
    );
  }

  /**
   * Method to auto populate dropdowns.
   * Used in payee dropdown and etc..
   */
  autoPopulateDropdown(
    ev: IV3DropDownOnReady,
    control: FormControl<IPayeeDropdown | null>
  ) {
    if (
      ev.setItemWithId &&
      control.value?.id &&
      (this.type === 'invoice' || this.type === 'added-invoice')
    ) {
      ev.setItemWithId(control.value.id);
    }
  }

  isValidPayee(payeeId: string | undefined) {
    if (!payeeId) {
      return;
    }
    this.subscriptions.push(this.payeeModalService.getPayeeById(payeeId).subscribe((res) => {
      if (res.success) {
        const payeeData = res.data;
        const isValid = Boolean(payeeData && payeeData.payeeZip && payeeData.payeeAddressLine1 && payeeData.payeeState && payeeData.payeeCountry);
        this.mailForm.controls.forEach((control) => {
          if (control.controls.payee_id.value?.id === payeeId) {
            control.controls.validPayee.setValue(isValid);
          }
        });
      }
    }));
  }

  /**
   * Method to be called once any of the mail operations gets success.
   *
   * it will send the refresh signal to the data table services.
   * and it will close this modal with return `status` as `true`.
   *
   * ``` ts
   * this.v3dataTableService.refreshV3DataTable();
   * ```
   */
  afterSuccess() {
    this.v3dataTableService.refreshV3DataTable();
    this.dataTableService.setRefreshStatus(true);
    this.alertService.successAlert({ content: 'Successfully mailed.' });
    this.matDialogRef.close({ status: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
