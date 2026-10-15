import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule,CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { Subject, finalize, takeUntil, firstValueFrom } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faTrash,
  faPenToSquare,
  faUserGroup,
  faDollarSign
} from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { MatDialog } from '@angular/material/dialog';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { AddAddressModalComponent } from '../add-address-modal/add-address-modal.component';
import {
  IDocumentMailFromAddress,
  IDocumentMailShippingType,
  IPdfDocument
} from '../../models/document-mail.model';
import { DocumentMailService } from '../../services/document-mail.service';

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
  selector: 'app-document-send-mail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FaIconComponent,
    V35CommonDropDownSelectorComponent,
    PayeeDropdownV3Component,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    CurrencyPipe
  ],
  templateUrl: './document-send-mail-page.component.html',
  styleUrl: './document-send-mail-page.component.scss'
})
export class DocumentSendMailPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private alertService = inject(AlertService);
  private documentMailService = inject(DocumentMailService);
  private dialog = inject(MatDialog);
  private payeeModalService = inject(PayeeModalService);
  private v3dataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  // FontAwesome icons
  faArrowLeft = faArrowLeft;
  faTrash = faTrash;
  faPenToSquare = faPenToSquare;
  faUserGroup = faUserGroup;
  faDollarSign = faDollarSign;

  destroy$ = new Subject<boolean>();

  pdfFile: File | null = null;
  selectedPages: number[] = [];
  pdfDocuments: IPdfDocument[] = [];
  selectedPagesByPdf: Map<number, number[]> = new Map();

  addressList: IDocumentMailFromAddress[] = [];
  shippingTypes: IDocumentMailShippingType[] = [];

  addresLoading = false;
  shippingTypeLoading = false;
  mailing = false;

  mailForm: FormArray<FormGroup<IMailFormGroup>>;

  commonFrom?: IDocumentMailFromAddress | string;
  commonShippingType?: IDocumentMailShippingType | string;
  shippingCost = 0;

  step = 3;
  totalSteps = 3;

  newAddressPayeeName: string = '';
  newAddressIndexNo: number | undefined;

  // Get display-friendly list of selected pages
  get displaySelectedPages(): number[] {
    if (this.pdfDocuments.length > 0) {
      // Multi-PDF mode: flatten all selected pages from all PDFs
      const allPages: number[] = [];
      this.selectedPagesByPdf.forEach((pages) => {
        allPages.push(...pages);
      });
      return allPages.sort((a, b) => a - b);
    }
    // Single-file mode
    return this.selectedPages;
  }

  get displaySelectedPagesCount(): number {
    return this.displaySelectedPages.length;
  }

  async ngOnInit(): Promise<void> {
    // Get PDF documents and selected pages from service
    this.pdfDocuments = this.documentMailService.getPdfDocuments();
    this.selectedPagesByPdf = this.documentMailService.getSelectedPagesByPdf();

    // If no data in memory, try to restore from storage
    if (this.pdfDocuments.length === 0 && !this.documentMailService.getTempFile()) {
      this.mailing = true; // Show loading state during restoration
      const restored = await this.documentMailService.restoreFromStorage();
      this.mailing = false;

      if (restored) {
        this.pdfDocuments = this.documentMailService.getPdfDocuments();
        this.selectedPagesByPdf = this.documentMailService.getSelectedPagesByPdf();
      }
    }

    // Fallback to old single-file approach for backward compatibility
    if (this.pdfDocuments.length === 0) {
      this.pdfFile = this.documentMailService.getTempFile();
      this.selectedPages =
        this.documentMailService.getSelectedPagesByPdf().get(0) || [];

      if (!this.pdfFile) {
        this.alertService.warningAlert({
          content: 'No file found. Please upload a document first.'
        });
        this.router.navigate([
          '/manage/business-tools/document-mail/add-attachment'
        ]);
        return;
      }
    }

    // Check if pages are selected (either in multi-PDF or single-file mode)
    const hasSelectedPages =
      this.pdfDocuments.length > 0
        ? this.selectedPagesByPdf.size > 0 &&
          Array.from(this.selectedPagesByPdf.values()).some(
            (pages) => pages.length > 0
          )
        : this.selectedPages && this.selectedPages.length > 0;

    if (!hasSelectedPages) {
      this.alertService.warningAlert({
        content: 'No pages selected. Please select pages first.'
      });
      this.router.navigate([
        '/manage/business-tools/document-mail/page-select'
      ]);
      return;
    }

    this.getFromAddress();
    this.getShippingType();
    this.initForm();
  }

  initForm(): void {
    this.mailForm = new FormArray<FormGroup>([]);
    const defaultFileName =
      this.pdfDocuments.length > 0 && this.pdfDocuments.length === 1
        ? this.pdfDocuments[0].file.name
        : '';
    
    this.mailForm.push(
      new FormGroup<IMailFormGroup>({
        document_id: new FormControl(null),
        file_name: new FormControl(defaultFileName, Validators.required),
        payee_id: new FormControl(null, Validators.required),
        validPayee: new FormControl(false, [Validators.requiredTrue]),
        reply_to_id: new FormControl(null, Validators.required),
        document_memo: new FormControl(''),
        shipping_type: new FormControl(null, Validators.required),
        selected_pages: new FormControl(this.selectedPages)
      })
    );

    // Setup value change listeners
    this.mailForm.controls.forEach((control) => {
      control.controls.shipping_type.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculateShippingCost();
        });

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

  getShippingType(): void {
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
    this.shippingCost = this.mailForm.controls.reduce((total, val) => {
      let valObj: IDocumentMailShippingType | undefined;
      try {
        valObj = JSON.parse(val.controls.shipping_type.value as string);
      } catch (e) {
        valObj = undefined;
      }
      const amount = Number(valObj?.amount) || 0;
      return total + amount;
    }, 0);
  }

  addFromAddress(index?: number | undefined): void {
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

  editPayee(
    control: FormControl<IPayeeDropdown | null>,
    group: FormGroup<IMailFormGroup>
  ): void {
    if (
      !(control.value && typeof control.value === 'object' && control.value?.id)
    ) {
      return;
    }

    this.payeeModalService
      .openEditPayee(control.value.id, 'addPayeeModal', {
        edit: true,
        id: control.value.id
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((val) => {
              if (val?.success) {
                const {
                  success: _success,
                  payeeTypeId: _payeeTypeId,
                  ...payee
                } = val;
                group.controls.payee_id.setValue({ ...payee });
              }
            });
        }
      });
  }

  autoPopulateDropdown(
    _ev: IV3DropDownOnReady,
    _control: FormControl<IPayeeDropdown | null>
  ): void {}

  addRow(): void {
    // Use the file name from the first recipient if it exists, otherwise get from pdfDocuments or pdfFile
    let fileName = '';

    if (this.mailForm.controls.length > 0) {
      // Get from first recipient's file name control
      fileName = this.mailForm.controls[0].controls.file_name.value || '';
    }

    // Fallback to original file name if not set
    if (!fileName) {
      fileName =
        this.pdfDocuments.length > 0
          ? this.pdfDocuments.length === 1
            ? this.pdfDocuments[0].name || this.pdfDocuments[0].file.name
            : ''
          : this.pdfFile?.name || '';
    }

    const newForm = new FormGroup<IMailFormGroup>({
      document_id: new FormControl(null),
      file_name: new FormControl(fileName, Validators.required),
      payee_id: new FormControl(null, Validators.required),
      validPayee: new FormControl(false, [Validators.requiredTrue]),
      reply_to_id: new FormControl(null, Validators.required),
      document_memo: new FormControl(''),
      shipping_type: new FormControl(null, Validators.required),
      selected_pages: new FormControl(this.selectedPages)
    });

    newForm.controls.shipping_type.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateShippingCost();
      });

    newForm.controls.payee_id.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        newForm.controls.validPayee.markAsTouched();
        const payee = newForm.controls.payee_id.value;
        newForm.controls.validPayee.setValue(
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

    if (this.shippingTypes.length > 0) {
      const firstClass = this.shippingTypes.find((val) => val.id === 1);
      if (firstClass) {
        newForm.controls.shipping_type.setValue(JSON.stringify(firstClass));
      }
    }

    if (this.commonFrom) {
      newForm.controls.reply_to_id.setValue(this.commonFrom as string);
    }

    if (this.commonShippingType) {
      const shippingValue =
        typeof this.commonShippingType === 'string'
          ? this.commonShippingType
          : JSON.stringify(this.commonShippingType);
      newForm.controls.shipping_type.setValue(shippingValue);
    }

    this.mailForm.push(newForm);
  }

  async deleteRow(index: number): Promise<void> {
    if (this.mailForm.controls.length === 1) {
      this.alertService.warningAlert({
        content: 'At least one recipient is required.'
      });
      return;
    }

    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({
          content: 'Are you sure you want to remove this recipient?'
        })
        .afterClosed()
    );

    if (result) {
      this.mailForm.removeAt(index);
      this.calculateShippingCost();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.mailForm.invalid) {
      this.mailForm.markAllAsTouched();
      this.alertService.warningAlert({
        content: 'Please fill all required fields.'
      });
      return;
    }

    // Check if we have PDF documents (either multi-PDF or single-file mode)
    const hasPdfFiles = this.pdfDocuments.length > 0 || !!this.pdfFile;

    if (!hasPdfFiles) {
      this.alertService.warningAlert({
        content: 'No file found.'
      });
      return;
    }

    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to proceed with mailing the documents?',
        doneMsg: 'Yes',
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res) {
          this.mailing = true;
          const uploadedDocId = await this.uploadDocument();

          if (!uploadedDocId) {
            this.mailing = false;
            return;
          }

          this.sendMail(uploadedDocId);
        }
      });
  }

  async uploadDocument(): Promise<string | null> {
    const arr = new Uint32Array(2);
    const additionalData = {
      idempotency_key: window.crypto.getRandomValues(arr).join(''),
      document_title: this.mailForm.controls[0].controls.file_name
        .value as string
    };

    let payload: FormData;

    // Check if we have multiple PDFs
    if (this.pdfDocuments.length > 0) {
      // Use new multi-PDF format
      payload = this.documentMailService.createMultiPdfFormData(additionalData);
    } else if (this.pdfFile) {
      payload = new FormData();
      payload.append('file', this.pdfFile);
      payload.append('idempotency_key', additionalData.idempotency_key);
      payload.append('document_title', additionalData.document_title);
      payload.append('selected_pages', this.selectedPages.join(','));
    } else {
      return null;
    }

    try {
      const res = await firstValueFrom(
        this.documentMailService.uploadDocument(payload)
      );
      if (res?.success) {
        return res.data.id;
      } 
        this.alertService.failedAlert({
          content: 'Failed to upload document.'
        });
        return null;
      
    } catch (error) {
      this.alertService.failedAlert({
        content: 'Error uploading document.'
      });
      return null;
    }
  }

  sendMail(documentId: string): void {
    const payload = this.mailForm.controls.map((control) => ({
      id: documentId,
      shipping_type: JSON.parse(control.controls.shipping_type.value as string)
        .id,
      payee_id: control.controls.payee_id.value?.id,
      reply_to_id: JSON.parse(control.controls.reply_to_id.value as string).id,
      document_memo: control.controls.document_memo.value || '',
      document_title: control.controls.file_name.value || ''
    }));

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
          this.v3dataTableService.refreshV3DataTable();
          this.dataTableService.setRefreshStatus(true);
          this.alertService.successAlert({
            content: `Document mailed successfully to ${this.mailForm.controls.length} recipient${this.mailForm.controls.length > 1 ? 's' : ''}.`
          });

          this.documentMailService.clearTempData();
          this.router.navigate(['/manage/business-tools/mail-dashboard/document-mail-history']);
        } else {
          this.alertService.failedAlert({
            content: 'Failed to send mail.'
          });
        }
      });
  }

  onBack(): void {
    this.router.navigate(['/manage/business-tools/document-mail/page-select']);
  }

  editPayeeAddress(
    payeeControl: FormControl<IPayeeDropdown | null>
  ): void {
    const payee = payeeControl.value;
    
    if (!payee || !payee.id) {
      this.alertService.warningAlert({
        content: 'Please select a payee first.'
      });
      return;
    }

    this.payeeModalService
      .openEditPayee(payee.id, undefined, {
        edit: true,
        id: payee.id,
        page: 'addAddress' 
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
              if (result?.success) {
                const {
                  success: _success,
                  payeeTypeId: _payeeTypeId,
                  ...updatedPayee
                } = result;

            
                payeeControl.setValue({ ...payee, ...updatedPayee } as IPayeeDropdown);
                
                // Re-validate the validPayee control
                const formGroup = payeeControl.parent as FormGroup<IMailFormGroup>;
                if (formGroup) {
                  const updatedPayeeValue = payeeControl.value;
                  formGroup.controls.validPayee.setValue(
                    Boolean(
                      updatedPayeeValue &&
                      updatedPayeeValue.zip &&
                      updatedPayeeValue.addressLine1 &&
                      updatedPayeeValue.state &&
                      updatedPayeeValue.country
                    )
                  );
                }

                this.alertService.successAlert({
                  content: 'Payee address updated successfully.',
                  close: true,
                  timeout: 2000
                });
              }
            });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
