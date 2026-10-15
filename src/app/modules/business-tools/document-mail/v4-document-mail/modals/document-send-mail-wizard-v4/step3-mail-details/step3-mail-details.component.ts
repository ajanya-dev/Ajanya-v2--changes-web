import { Component, DestroyRef, OnInit, inject, input, output, signal, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { finalize, firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  IDocumentMailFromAddress,
  IDocumentMailShippingType,
  IPdfDocument
} from '../../../../models/document-mail.model';
import { DocumentMailService } from '../../../../services/document-mail.service';
import { AddAddressModalV4Component } from '../../../modals/add-address-modal-v4/add-address-modal-v4.component';

interface IMailFormGroup {
  document_id: FormControl<string | null>;
  file_name: FormControl<string | null>;
  shipping_type: FormControl<string | null>;
  payee_id: FormControl<IPayeeDropdown | null>;
  validPayee: FormControl<boolean | null>;
  reply_to_id: FormControl<string | null>;
  document_memo: FormControl<string | null>;
  selected_pages: FormControl<number[] | null>;
}

@Component({
  selector: 'app-step3-mail-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
    CurrencyPipe,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    PayeeDropdownV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './step3-mail-details.component.html'
})
export class Step3MailDetailsComponent implements OnInit {
  private alertService = inject(V4AlertService);
  private documentMailService = inject(DocumentMailService);
  private dialog = inject(MatDialog);
  private payeeModalService = inject(PayeeModalService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  pdfDocuments = input.required<IPdfDocument[]>();
  selectedPagesByPdf = input.required<Map<number, number[]>>();
  stepBack = output<void>();
  submitSuccess = output<void>();

  addressList = signal<IDocumentMailFromAddress[]>([]);
  shippingTypes = signal<IDocumentMailShippingType[]>([]);
  addressLoading = signal(false);
  shippingTypeLoading = signal(false);
  mailing = signal(false);
  shippingCost = signal(0);

  mailForm!: FormArray<FormGroup<IMailFormGroup>>;

  payeeDropdowns = viewChildren(PayeeDropdownV4Component);

  closeAllPayeeDropdowns(): void {
    this.payeeDropdowns().forEach((dropdown) => dropdown.close());
  }

  commonFrom?: IDocumentMailFromAddress | string;
  commonShippingType?: IDocumentMailShippingType | string;
  newAddressPayeeName = '';
  newAddressIndexNo: number | undefined;

  get displaySelectedPagesCount(): number {
    const allPages: number[] = [];
    this.selectedPagesByPdf().forEach((pages) => allPages.push(...pages));
    return allPages.length;
  }

  ngOnInit(): void {
    this.getFromAddress();
    this.getShippingType();
    this.initForm();
  }

  initForm(): void {
    this.mailForm = new FormArray<FormGroup<IMailFormGroup>>([]);
    const docs = this.pdfDocuments();
    const defaultFileName = docs.length === 1 ? docs[0].file.name : '';

    this.mailForm.push(
      new FormGroup<IMailFormGroup>({
        document_id: new FormControl(null),
        file_name: new FormControl(defaultFileName, Validators.required),
        payee_id: new FormControl(null, Validators.required),
        validPayee: new FormControl(false, [Validators.requiredTrue]),
        reply_to_id: new FormControl(null, Validators.required),
        document_memo: new FormControl(''),
        shipping_type: new FormControl(null, Validators.required),
        selected_pages: new FormControl<number[] | null>(null)
      })
    );

    this.setupFormListeners(this.mailForm.controls[0]);
  }

  private setupFormListeners(control: FormGroup<IMailFormGroup>): void {
    control.controls.shipping_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateShippingCost());

    control.controls.payee_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        control.controls.validPayee.markAsTouched();
        const payee = control.controls.payee_id.value;
        control.controls.validPayee.setValue(
          Boolean(payee && payee.zip && payee.addressLine1 && payee.state && payee.country)
        );
        this.calculateShippingCost();
      });
  }

  getFromAddress(): void {
    this.addressLoading.set(true);
    this.documentMailService
      .getAllFromAddress()
      .pipe(
        finalize(() => this.addressLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          this.addressList.set(res.data);
          const foundAddress = res.data.find(
            (item) => item.payee_name === this.newAddressPayeeName
          );
          if (foundAddress) {
            const newValue = JSON.stringify(foundAddress);
            if (this.newAddressIndexNo !== undefined && this.newAddressPayeeName !== '') {
              this.mailForm.controls[this.newAddressIndexNo].controls.reply_to_id.setValue(newValue);
              this.newAddressIndexNo = undefined;
            } else if (this.newAddressPayeeName !== '') {
              this.commonFrom = newValue;
              this.onCommonFromChange(this.commonFrom);
            }
          }
          this.newAddressPayeeName = '';
        }
      });
  }

  getShippingType(): void {
    this.shippingTypeLoading.set(true);
    this.documentMailService
      .getShippingType()
      .pipe(
        finalize(() => this.shippingTypeLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.shippingTypes.set(res);
        const firstClass = res.find((val) => val.id === 1);
        this.mailForm.controls.forEach((form) => {
          form.controls.shipping_type.setValue(JSON.stringify(firstClass));
        });
      });
  }

  onCommonFromChange(val: string): void {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.reply_to_id.setValue(val);
      });
    }
  }

  onCommonShippingChange(val: string): void {
    if (val) {
      this.mailForm.controls.forEach((control) => {
        control.controls.shipping_type.setValue(val);
      });
    }
  }

  calculateShippingCost(): void {
    const cost = this.mailForm.controls.reduce((total, val) => {
      let valObj: IDocumentMailShippingType | undefined;
      try {
        valObj = JSON.parse(val.controls.shipping_type.value as string);
      } catch {
        valObj = undefined;
      }
      return total + (Number(valObj?.amount) || 0);
    }, 0);
    this.shippingCost.set(cost);
  }

  addFromAddress(index?: number): void {
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
          if (index !== undefined) {
            this.newAddressIndexNo = index;
          }
          this.getFromAddress();
        }
      });
  }

  addRow(): void {
    let fileName = '';
    if (this.mailForm.controls.length > 0) {
      fileName = this.mailForm.controls[0].controls.file_name.value || '';
    }
    if (!fileName) {
      const docs = this.pdfDocuments();
      fileName = docs.length === 1 ? docs[0].file.name : '';
    }

    const newForm = new FormGroup<IMailFormGroup>({
      document_id: new FormControl(null),
      file_name: new FormControl(fileName, Validators.required),
      payee_id: new FormControl(null, Validators.required),
      validPayee: new FormControl(false, [Validators.requiredTrue]),
      reply_to_id: new FormControl(null, Validators.required),
      document_memo: new FormControl(''),
      shipping_type: new FormControl(null, Validators.required),
      selected_pages: new FormControl<number[] | null>(null)
    });

    this.setupFormListeners(newForm);

    const types = this.shippingTypes();
    if (types.length > 0) {
      const firstClass = types.find((val) => val.id === 1);
      if (firstClass) {
        newForm.controls.shipping_type.setValue(JSON.stringify(firstClass));
      }
    }

    if (this.commonFrom) {
      newForm.controls.reply_to_id.setValue(this.commonFrom as string);
    }

    if (this.commonShippingType) {
      const shippingValue = typeof this.commonShippingType === 'string'
        ? this.commonShippingType
        : JSON.stringify(this.commonShippingType);
      newForm.controls.shipping_type.setValue(shippingValue);
    }

    this.mailForm.push(newForm);
  }

  async deleteRow(index: number): Promise<void> {
    if (this.mailForm.controls.length === 1) {
      this.alertService.warningAlert({ content: 'At least one recipient is required.' });
      return;
    }

    const result = await firstValueFrom(
      this.alertService.confirmAlert({ content: 'Are you sure you want to remove this recipient?' }).afterClosed()
    );

    if (result) {
      this.mailForm.removeAt(index);
      this.calculateShippingCost();
    }
  }

  editPayeeAddress(payeeControl: FormControl<IPayeeDropdown | null>): void {
    const payee = payeeControl.value;
    if (!payee?.id) {
      this.alertService.warningAlert({ content: 'Please select a payee first.' });
      return;
    }

    this.payeeModalService
      .openEditPayee(
        payee.id,
        undefined,
        { edit: true, id: payee.id, page: 'addAddress' },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result?.success) {
                const { success: _s, payeeTypeId: _p, ...updatedPayee } = result;
                payeeControl.setValue({ ...payee, ...updatedPayee } as IPayeeDropdown);

                const formGroup = payeeControl.parent as FormGroup<IMailFormGroup>;
                if (formGroup) {
                  const updated = payeeControl.value;
                  formGroup.controls.validPayee.setValue(
                    Boolean(updated && updated.zip && updated.addressLine1 && updated.state && updated.country)
                  );
                }

                this.alertService.successAlert({ content: 'Payee address updated.', close: true, timeout: 2000 });
              }
            });
        }
      });
  }

  async onSubmit(): Promise<void> {
    if (this.mailForm.invalid) {
      this.mailForm.markAllAsTouched();
      this.alertService.warningAlert({ content: 'Please fill all required fields.' });
      return;
    }

    const confirmed = await firstValueFrom(
      this.alertService.confirmAlert({
        content: 'Are you sure you want to proceed with mailing the documents?',
        doneMsg: 'Yes'
      }).afterClosed()
    );

    if (!confirmed) return;

    this.mailing.set(true);
    const uploadedDocId = await this.uploadDocument();

    if (!uploadedDocId) {
      this.mailing.set(false);
      return;
    }

    this.sendMail(uploadedDocId);
  }

  private async uploadDocument(): Promise<string | null> {
    const arr = new Uint32Array(2);
    const additionalData = {
      idempotency_key: window.crypto.getRandomValues(arr).join(''),
      document_title: this.mailForm.controls[0].controls.file_name.value as string
    };

    const docs = this.pdfDocuments();
    let payload: FormData;

    if (docs.length > 0) {
      // Store docs temporarily so createMultiPdfFormData can access them
      this.documentMailService.setPdfDocuments(docs, this.selectedPagesByPdf());
      payload = this.documentMailService.createMultiPdfFormData(additionalData);
    } else {
      return null;
    }

    try {
      const res = await firstValueFrom(this.documentMailService.uploadDocument(payload));
      if (res?.success) {
        return res.data.id;
      }
      this.alertService.failedAlert({ content: 'Failed to upload document.' });
      return null;
    } catch {
      this.alertService.failedAlert({ content: 'Error uploading document.' });
      return null;
    }
  }

  private sendMail(documentId: string): void {
    const payload = this.mailForm.controls.map((control) => ({
      id: documentId,
      shipping_type: JSON.parse(control.controls.shipping_type.value as string).id,
      payee_id: control.controls.payee_id.value?.id,
      reply_to_id: JSON.parse(control.controls.reply_to_id.value as string).id,
      document_memo: control.controls.document_memo.value || '',
      document_title: control.controls.file_name.value || ''
    }));

    this.documentMailService
      .sendMail(payload)
      .pipe(
        finalize(() => this.mailing.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.v3DataTableService.refreshV3DataTable();
          this.dataTableService.setRefreshStatus(true);
          this.alertService.successAlert({
            title: 'Success',
            content: `Document mailed successfully to ${this.mailForm.controls.length} recipient${this.mailForm.controls.length > 1 ? 's' : ''}.`,
            timeout: 2000,
            close: true
          });
          this.documentMailService.clearTempData();
          this.submitSuccess.emit();
        } else {
          this.alertService.failedAlert({ content: 'Failed to send mail.' });
        }
      });
  }
}
