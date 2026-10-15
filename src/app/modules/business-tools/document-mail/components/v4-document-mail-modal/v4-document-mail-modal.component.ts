import { Component, DestroyRef, OnInit, inject, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom, forkJoin } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Minus,
  Plus,
  Paperclip,
  Trash2,
  Pencil
} from 'lucide-angular';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IInvoiceRowData,
  Invoicedata
} from 'src/app/modules/invoices/model/invoice';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CurrencyPipe } from '@angular/common';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { DocumentMailService } from '../../services/document-mail.service';
import {
  IDocumentMailFromAddress,
  IDocumentMailShippingType,
  IDocumentMailUpload
} from '../../models/document-mail.model';
import { AddAddressModalV4Component } from '../../v4-document-mail/modals/add-address-modal-v4/add-address-modal-v4.component';
import { CommonButtonV4Component } from '../../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from '../../../../../shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PayeeDropdownV4Component } from '../../../../../shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from '../../../../../shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from '../../../../../shared/V4/control-message-v4/control-message-v4.component';

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
  selector: 'app-v4-document-mail-modal',
  templateUrl: './v4-document-mail-modal.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent,
    PayeeDropdownV4Component,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    CurrencyPipe,
    LucideAngularModule,
    V4ControlMessageComponent,
    MatTooltipModule
  ]
})
export class V4DocumentMailModalComponent implements OnInit {
  private documentMailService = inject(DocumentMailService);
  private alertService = inject(V4AlertService);
  private matDialogRef = inject(MatDialogRef<V4DocumentMailModalComponent>);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3dataTableService = inject(V3DataTableService);
  private payeeModalService = inject(PayeeModalService);
  private destroyRef = inject(DestroyRef);

  private dialogData: {
    type: 'normal' | 'bulk' | 'invoice' | 'added-invoice';
    invalidIds?: string[];
    documents:
      | Omit<IDocumentMailUpload, 'message'>[]
      | IInvoiceRowData[]
      | Invoicedata[];
  } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly MinusIcon = Minus;
  readonly PlusIcon = Plus;
  readonly PaperclipIcon = Paperclip;
  readonly Trash2Icon = Trash2;
  readonly PencilIcon = Pencil;

  addressList: IDocumentMailFromAddress[] = [];
  shippingTypes: IDocumentMailShippingType[] = [];
  type: 'normal' | 'bulk' | 'invoice' | 'added-invoice';
  numberOfMails = 5;

  addresLoading = false;
  shippingTypeLoading = false;

  mailForm: FormArray<FormGroup<IMailFormGroup>>;

  payeeDropdowns = viewChildren(PayeeDropdownV4Component);

  closeAllPayeeDropdowns(): void {
    this.payeeDropdowns().forEach((dropdown) => dropdown.close());
  }

  commonFrom?: IDocumentMailFromAddress | string;
  commonPayee?: IPayeeDropdown;
  commonShippingType?: IDocumentMailShippingType;
  selectedPayeeCtrl = new FormControl<IPayeeDropdown | null>(null);
  mailing = false;
  commonFile?: File;
  commonFileName = '';
  shippingCost = 0;
  invalidIds?: string[];
  newAddressPayeeName = '';
  newAddressIndexNo: number | undefined;

  ngOnInit(): void {
    this.type = this.dialogData.type;
    this.invalidIds = this.dialogData.invalidIds;
    this.getFromAddress();
    this.getShippingType();
    this.initForm();

    // Bridge the new FormControl-based payee selector into the existing
    // row-propagation logic so each recipient's payee_id is auto-filled.
    this.selectedPayeeCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.commonPayee = val ?? undefined;
        this.onCommonPayeeChange(val);
      });
  }

  autoPopulatePayee(_event: IV3DropDownOnReady): void {
    // Payee dropdown is ready — nothing to auto-populate here.
  }

  onClearPayee(): void {
    this.commonPayee = undefined;
    this.mailForm.controls.forEach((control) => {
      control.controls.payee_id.setValue(null);
    });
  }

  close(): void {
    this.matDialogRef.close();
  }

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
                  ? ({
                      id: val.payee_id,
                      name: val.payee_name || ''
                    } as IPayeeDropdown)
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
                  ? ({
                      id: val.payee_id,
                      name: val.payeeName || ''
                    } as IPayeeDropdown)
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
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.calculateShippingCost();
          });
      }
    });

    this.mailForm.controls.forEach((control) => {
      if (control) {
        control.controls.payee_id.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
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

  changeRowCount(type: 'inc' | 'dec') {
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
        document_title: new FormControl({ value: null, disabled: true })
      });
      if (this.type === 'bulk') {
        form.addControl('file', new FormControl(null, Validators.required));
      }
      this.mailForm.push(form);
      if (this.type === 'bulk' && this.commonFile) {
        form.controls.file?.setValue(this.commonFile);
        form.controls.document_title.setValue(this.commonFile.name);
      }
      form.controls.shipping_type.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.calculateShippingCost();
        });
      this.numberOfMails += 1;
    } else {
      this.mailForm.controls.pop();
      this.numberOfMails -= 1;
    }
  }

  immediateRowCountChange() {
    const value = Number(this.numberOfMails);
    if (value < 1 || value > 10 || value === this.mailForm.length) {
      return;
    }

    if (value > this.mailForm.length) {
      const limit = value - this.mailForm.length;
      for (let i = 0; i < limit; i += 1) {
        const form = new FormGroup<IMailFormGroup>({
          id: new FormControl(null),
          payee_id: new FormControl(null, Validators.required),
          validPayee: new FormControl(false, [Validators.requiredTrue]),
          reply_to_id: new FormControl(null, Validators.required),
          document_memo: new FormControl(''),
          shipping_type: new FormControl(null, Validators.required),
          document_title: new FormControl({ value: null, disabled: true })
        });
        if (this.type === 'bulk') {
          form.addControl('file', new FormControl(null, Validators.required));
        }
        this.mailForm.push(form);
        if (this.type === 'bulk' && this.commonFile) {
          form.controls.file?.setValue(this.commonFile);
          form.controls.document_title.setValue(this.commonFile.name);
        }
        form.controls.shipping_type.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.calculateShippingCost();
          });
      }
    } else {
      this.mailForm.controls.length = value;
    }
  }

  getShippingType() {
    this.shippingTypeLoading = true;
    this.documentMailService
      .getShippingType()
      .pipe(
        finalize(() => {
          this.shippingTypeLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.shippingTypes = res;
        const firstClass = res.find((val) => val.id === 1);
        this.mailForm.controls.forEach((form) => {
          form.controls.shipping_type.setValue(JSON.stringify(firstClass));
        });
      });
  }

  getFromAddress(): void {
    this.addresLoading = true;
    this.documentMailService
      .getAllFromAddress()
      .pipe(
        finalize(() => {
          this.addresLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
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
              this.onCommonFromChange(this.commonFrom as string);
            }
          }
          this.newAddressPayeeName = '';
        }
      });
  }

  async deleteRow(index: number) {
    const result = await firstValueFrom(
      this.alertService.confirmAlert({ content: 'Are you sure?' }).afterClosed()
    );
    if (result) {
      this.mailForm.controls.splice(index, 1);
      this.numberOfMails -= 1;
      this.mailForm.updateValueAndValidity();
      this.calculateShippingCost();
      if (!this.mailForm.controls.length) this.matDialogRef.close();
    }
  }

  onCommonFromChange(val: string) {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.reply_to_id.setValue(val);
      });
    }
  }

  onCommonShippingChange(val: string) {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.shipping_type.setValue(val);
      });
    }
  }

  onCommonPayeeChange(val: IPayeeDropdown | null) {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.payee_id.setValue(val);
      });
    }
  }

  clickFileAttachment(element: HTMLInputElement) {
    if (this.type === 'normal') return;
    element.click();
  }

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

  onSubmit() {
    // Guard against rapid double-clicks: a request is already in flight.
    if (this.mailing) return;

    if (this.mailForm.invalid) {
      this.mailForm.markAllAsTouched();
      return;
    }

    // Lock immediately so every downstream path (including bulkMail's
    // upload step) is protected, not just the final sendMail call.
    this.mailing = true;

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

    this.documentMailService
      .sendMail(payload)
      .pipe(
        finalize(() => {
          this.mailing = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.afterSuccess();
        }
      });
  }

  calculateShippingCost() {
    this.shippingCost = this.mailForm.controls.reduce((total, val) => {
      let valObj: IDocumentMailShippingType | undefined;
      try {
        valObj = JSON.parse(val.controls.shipping_type.value as string);
      } catch (e) {
        valObj = undefined;
      }
      return total + (Number(valObj?.amount) || 0);
    }, 0);
  }

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (val) => {
          const mailPayload: unknown[] = [];
          val.forEach((res, i) => {
            if (res.success) {
              this.mailForm.controls[i].controls.document_title.enable();
              const values = this.mailForm.controls[i].value;
              mailPayload.push({
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

          this.documentMailService
            .sendMail(mailPayload)
            .pipe(
              finalize(() => {
                this.mailing = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if (res.success) {
                this.afterSuccess();
              }
            });
        },
        error: () => {
          // Upload step failed — release the lock so the user can retry.
          this.mailing = false;
        }
      });
  }

  invoiceMail() {
    const payload = this.mailForm.value.map((val) => ({
      id: val.id ?? '',
      shipping_type: JSON.parse(val.shipping_type as string).id ?? ''
    }));

    this.documentMailService
      .invoiceMail(payload)
      .pipe(
        finalize(() => {
          this.mailing = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        if (val.success) {
          this.afterSuccess();
        }
      });
  }

  addFromAddress(index?: number | undefined) {
    const dialogRef = this.dialog.open(AddAddressModalV4Component, {
      width: '500px',
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val?.success) {
          this.newAddressPayeeName = val.data.payee_name;
          if (index !== undefined && index !== null) {
            this.newAddressIndexNo = index;
          }
          this.getFromAddress();
        }
      });
  }

  editPayee(
    control: FormControl<IPayeeDropdown | null>,
    group: FormGroup<IMailFormGroup>
  ) {
    if (
      !(control.value && typeof control.value === 'object' && control.value?.id)
    ) {
      return;
    }

    this.payeeModalService
      .openEditPayee(
        control.value.id,
        'addPayeeModal',
        {
          edit: true,
          id: control.value.id,
          page: 'addAddress'
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((val) => {
              if (val?.success) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { success, payeeTypeId, ...payee } = val;
                group.controls.payee_id.setValue({ ...payee });
              }
            });
        }
      });
  }

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
    this.payeeModalService
      .getPayeeById(payeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const payeeData = res.data;
          const isValid = Boolean(
            payeeData &&
              payeeData.payeeZip &&
              payeeData.payeeAddressLine1 &&
              payeeData.payeeState &&
              payeeData.payeeCountry
          );
          this.mailForm.controls.forEach((control) => {
            if (control.controls.payee_id.value?.id === payeeId) {
              control.controls.validPayee.setValue(isValid);
            }
          });
        }
      });
  }

  afterSuccess() {
    this.v3dataTableService.refreshV3DataTable();
    this.dataTableService.setRefreshStatus(true);
    const close = this.alertService.successAlert({
      title: 'Success',
      content: 'Successfully mailed.'
    });
    close.afterClosed().subscribe(() => {
      this.matDialogRef.close({ status: true });
    });
  }
}
