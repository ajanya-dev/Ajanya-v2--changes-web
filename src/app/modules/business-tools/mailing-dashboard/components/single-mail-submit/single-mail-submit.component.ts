import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, take, takeUntil } from 'rxjs';
import {
  ICheckAttachmentData,
  ICheckShipingTypes,
  IChequedata,
  IMailShippingCalculations,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HttpErrorResponse } from '@angular/common/http';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPaperclip } from '@fortawesome/pro-thin-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UpdatePayeeModalComponent } from 'src/app/modules/check/modal/mail-modals/update-payee-modal/update-payee-modal.component';
import { UpdateBankModalComponent } from 'src/app/modules/check/modal/mail-modals/update-bank-modal/update-bank-modal.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  faArrowUpRightFromSquare,
  faSpinner
} from '@fortawesome/pro-solid-svg-icons';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';

// Data models for the session form data

interface IAddress {
  bank_account_account_name: string;
  bank_account_address_line_1: string;
  bank_account_address_line_2: string;
  bank_account_city: string;
  bank_account_state: string;
  bank_account_zip: string;
  bank_account_country: string;
  enc_id: string;
}
interface BankAccountModel {
  id?: string;
  accountNumber?: string;
  fullAccountNumber?: string;
  bankName?: string;
  bankId?: string;
  routingNumber?: string;
  statusDescription?: string;
  address?: IAddress;
}

interface PayeeModel {
  id?: string;
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

interface CustomShippingTypeModel {
  id?: number;
  name?: string;
  amount?: string | number;
  country?: string;
  short_code?: string;
  page_count_limit?: number;
}

interface ShippingAddressModel {
  name?: string;
  id?: string;
  country?: string;
  dec_id?: number;
}

interface FormDataModel {
  bankAc?: BankAccountModel;
  payee?: PayeeModel;
  shippingType?: ICheckShipingTypes;
  shippingAddressFrom?: ShippingAddressModel;
  shippingAddressTo?: ShippingAddressModel;
  customShippingType?: CustomShippingTypeModel | ICheckShipingTypes;
  amount?: string | number;
  memo?: string;
  invoiceNumber?: string;
  checkNumber?: number;
  issueDate?: string;
  shippingAddressOption?: string;
}

@Component({
  selector: 'app-single-mail-submit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    ReactiveFormsModule,
    TruncatePipe,
    MatTooltip,
    CommonBackButtonV35Component,
    DatePipe
  ],
  templateUrl: './single-mail-submit.component.html',
  styleUrl: './single-mail-submit.component.scss'
})
export class SingleMailSubmitComponent implements OnInit, OnDestroy {
  private activateRoute = inject(ActivatedRoute);
  private checkService = inject(CheckService);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private commonOnInitService = inject(CommonOnInitService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject();

  // ==================== GLOBAL VARIABLES ====================

  // UI State
  isLoading = signal(false);
  isSendingMail = signal(false);
  isAttachmentLoading = signal({});

  // Data Models
  formData = signal<FormDataModel | null>(null);
  checkDetailsResponse = signal<IChequedata | undefined>(undefined);
  attachments = signal<ICheckAttachmentData[]>([]);
  shippingCalculation = signal<IShippingCostCalculation | undefined>(undefined);

  // Form Controls
  selectedShippingType = new FormControl<string | null>(null);

  // Data Arrays
  shippingList = signal<ICheckShipingTypes[]>([]);
  sortedShippingList = signal<ICheckShipingTypes[]>([]);

  // Validation States
  isInvalidBank = signal(false);
  isInvalidPayee = signal(false);

  // Calculation Objects
  costCalculation: IMailShippingCalculations;
  isQbAutoSubAccountMapping = signal(false);

  // Icons
  faCircleInfo = faCircleInfo;
  faPaperclip = faPaperclip;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faSpinner = faSpinner;

  // ==================== END GLOBAL VARIABLES ====================

  ngOnInit(): void {
    const data = JSON.parse(
      sessionStorage.getItem('formData') || 'null'
    ) as FormDataModel | null;
    this.formData.set(data);

    // Ensure session storage is up to date
    if (data) {
      this.updateSessionStorage(data);
    }

    this.getHeaderData();
    this.shippingType();
    const checkId = this.activateRoute.snapshot.params?.id;
    if (checkId) {
      this.checkDetails(checkId);
    }
    this.changeShippingType();
  }

  getHeaderData() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res && res.enabledPlugins.includes('qb-auto-sub-account-mapping')) {
        this.isQbAutoSubAccountMapping.set(true);
      }
    });
  }

  changeShippingType(): void {
    this.selectedShippingType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        let selectedType;

        if (value) {
          try {
            // Try to parse as JSON first (if it's the full object)
            selectedType = JSON.parse(value);
          } catch (e) {
            // If parsing fails, it's just the name string, so find the object from the list
            selectedType = this.sortedShippingList().find(
              (type) => type.name === value
            );
          }
        }

        if (selectedType) {
          const updatedFormData = {
            ...this.formData(),
            shippingType: selectedType
          };
          this.formData.set(updatedFormData);
          this.updateSessionStorage(updatedFormData);
          this.claculateShippingCost();
        } else {
          const updatedFormData = {
            ...this.formData(),
            shippingType: undefined
          };
          this.formData.set(updatedFormData);
          this.updateSessionStorage(updatedFormData);
          this.shippingCalculation.set(undefined);
        }
      });
  }

  shippingType(): void {
    this.checkService
      .getShippingType()
      .pipe(take(1))
      .subscribe((res) => {
        this.shippingList.set(res.data);
      });
  }

  getPaymentAmount(): number {
    const fd = this.formData();
    const amount = fd?.amount ? Number(fd.amount) : 0;
    return Number.isNaN(amount) ? 0 : amount;
  }

  getShippingAmount(): number {
    const fd = this.formData();
    const custom = fd?.customShippingType?.amount;
    const asNum = custom !== undefined ? Number(custom) : 0;
    return Number.isNaN(asNum) ? 0 : asNum;
  }

  getTotal(): number {
    return this.getPaymentAmount() + this.getShippingAmount();
  }

  formatAccountNumber(full?: string): string {
    if (!full) return '';
    const visible = full.slice(-4);
    return `•••• ${visible}`;
  }

  checkDetails(checkId: string) {
    this.isLoading.set(true);
    const payload: { ids: string[]; is_signature: 1 } = {
      ids: [checkId],
      is_signature: 1
    };
    this.checkService
      .getChequeDetails(payload)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          // this.getPayeeDetails(res.data?.datas?.[0]?.enc_payee_id);
          this.checkDetailsResponse.set(res.data);
          this.bankValidation(res.data?.datas?.[0]?.enc_id as string);
          this.getBankDetails(
            res.data?.datas?.[0]?.enc_bank_account_id as string
          );
          if (this.formData()?.shippingAddressOption === 'to-payee-address') {
            this.payeeValidation(res.data?.datas?.[0]?.enc_id as string);
            this.getShippingType(res.data?.datas?.[0]?.payee_country as string);
          }
          if (res.data?.datas?.[0]?.is_exisiting_attach) {
            this.getAttachments(res.data?.datas?.[0]?.enc_id as string);
          } else {
            this.claculateShippingCost();
          }
        }
      });
  }

  getAttachments(checkId: string) {
    this.checkService
      .getCheckAttachment(checkId as string)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.attachments.set(res.data);
            this.claculateShippingCost();
          }
        }
      });
  }

  getShippingType(payeeCountry: string) {
    const USA = ['united states', 'us', 'usa', 'united states of america'];
    const ca = ['canada', 'ca'];

    if (this.isInvalidPayee()) {
      this.sortedShippingList.set([]);
      return;
    }

    const country = payeeCountry?.toLowerCase();
    let selectCountry;
    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry = payeeCountry;
    }
    if (selectCountry === 'Canada') {
      this.sortedShippingList.set(
        this.shippingList().filter((type) => type.country === 'Canada')
      );
      if (!this.formData()?.shippingType?.id) {
        this.updateShippingType();
      }
    } else if (selectCountry === 'United States') {
      this.sortedShippingList.set(
        this.shippingList().filter(
          (type) =>
            type.country !== 'Canada' && type.country !== 'International'
        )
      );
      if (!this.formData()?.shippingType?.id) {
        this.updateShippingType();
      }
    } else {
      this.sortedShippingList.set(
        this.shippingList().filter((type) => type.country === 'International')
      );
      if (!this.formData()?.shippingType?.id) {
        this.updateShippingType();
      }
    }

    this.selectedShippingType.setValue(
      (this.sortedShippingList().find(
        (type) => type.id === this.formData()?.shippingType?.id
      )?.name as string) ?? null
    );
  }

  updateShippingType() {
    this.formData.set({
      ...this.formData(),
      shippingType: this.sortedShippingList()[0]
    });
    this.updateSessionStorage({
      ...this.formData(),
      shippingType: this.sortedShippingList()[0]
    });
  }

  bankValidation(checkId: string) {
    this.checkService
      .bankvalidation({ ids: [checkId] })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (!res) return;
          const { data } = res;
          const has731Error = [checkId].some(
            (el: string) => !data[el].success && data[el].error_code === 731
          );
          if (has731Error) {
            this.handleError731(res);
          }
          if (!data[checkId].success) {
            this.isInvalidBank.set(true);
          } else {
            this.isInvalidBank.set(false);
          }
        }
      });
  }

  private handleError731(error: HttpErrorResponse) {
    this.alertService
      .warningAlert({
        title: 'No Bank Account Found',
        content: error.error.errorMsg,
        doneMsg: 'Add Bank Account',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.router.navigate(['/manage/users/add-bank-account']);
        }
      });
  }

  payeeValidation(checkId: string, isUpdateShippingList: boolean = false) {
    const invalidPayeeAddress =
      this.formData()?.payee?.country === null ||
      this.formData()?.payee?.zip === null ||
      this.formData()?.payee?.country === '';
    this.checkService
      .payeevalidation({ cheque_ids: [checkId], shipping_type: [1] })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (!res) return;
          const { data } = res;
          if (!data[checkId].success || invalidPayeeAddress) {
            this.shippingCalculation.set(undefined);
            this.isInvalidPayee.set(true);
            if (data[checkId].error_code === 1) {
              this.alertService.warningAlert({
                content:
                  'Fill the Payee street address instead of the PO box for FedEx mailing'
              });
            }
            this.selectedShippingType.setValue(null);
            this.sortedShippingList.set([]);
          } else {
            this.isInvalidPayee.set(false);
            if (isUpdateShippingList) {
              this.getShippingType(this.formData()?.payee?.country as string);
            }
          }
        }
      });
  }

  claculateShippingCost(): void {
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    const attachmentsIds = this.attachments().map(
      (attachment) => attachment.id
    );
    this.costCalculation = {
      mail_check_ids: [checkId],
      all_check_ids: [],
      Single_mail_options: this.formData()?.shippingType?.id ?? 1,
      sent_to_customer_address:
        this.formData()?.shippingAddressOption === 'to-custom-address' ? 1 : 0,
      shipping_rate_warning: 0,
      individual_envelope: 0,
      custom_address_shipping_type:
        this.formData()?.shippingAddressOption === 'to-custom-address'
          ? (this.formData()?.customShippingType?.id ?? 0)
          : 0,
      [checkId]: {
        mail_type: this.formData()?.shippingType?.id ?? 1,
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: this.formData()?.payee?.phone ?? '',
        payee_email: this.formData()?.payee?.email ?? '',
        file_hidden: attachmentsIds
      }
    };
    if( this.formData()?.shippingAddressOption === 'to-custom-address'){
      this.costCalculation.shipping_to = this.formData()?.shippingAddressTo?.dec_id ?? '';
      this.costCalculation.shipping_from = this.formData()?.shippingAddressFrom?.dec_id ?? '';
    }
    this.checkService
      .ShippingCostCalculationGroup(this.costCalculation)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.shippingCalculation.set(res.data);
          if (this.isInvalidPayee()) {
            this.shippingCalculation.set(undefined);
          }
        }
      });
  }

  sendMail(): void {
    if (this.isInvalidBank()) {
      this.alertService.warningAlert({
        content: 'Bank Address is invalid'
      });
      return;
    }

    if (this.isInvalidPayee()) {
      this.alertService.warningAlert({
        content: 'Payee Address is invalid'
      });
      return;
    }

    if (
      this.selectedShippingType.value === null &&
      this.formData()?.shippingAddressOption === 'to-payee-address'
    ) {
      this.alertService.warningAlert({
        content: 'Please select the shipping type'
      });
      return;
    }
    this.isSendingMail.set(true);
    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const payload = {
      schedule_date: currentDate,
      recurring_include_check: true,
      frequency: 1,
      start_date: currentDate,
      end_select: 1,
      count: 1,
      until: ''
    };

    const mailData = this.addBankAccountIdToMailData({ ...this.costCalculation, ...payload });

    this.checkService
      .sendmail(mailData, '')
      .pipe(
        finalize(() => {
          this.isSendingMail.set(false);
        }),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Mail has been sent successfully'
            });
            this.router.navigate(['manage/business-tools/mail-dashboard/single-mail-history']);
          }
        },
        error: (err) => {
          if (err.error.errorCode === 731) {
            this.handleError731(err);
          }
          if (err.error.errorCode === 'plaid_virtual_account') {
            const notification = this.alertService.infoAlert({
              content: err.error.errorMsg,
              doneMsg: 'Update',
              isCancel: true
            });
            notification.afterClosed().subscribe((res) => {
              if (res) {
                const confirmationDialog = this.dialog.open(
                  VirtualAccountConfirmationModalComponent,
                  {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: err.error
                  }
                );
                confirmationDialog.afterClosed().subscribe((resp) => {
                  if (resp.success) {
                    this.sendMail();
                  }
                });
              }
            });
          }
          if (err.error.errorCode === 1) {
            this.sendMail();
          }
          if (err.error.errorCode === 516) {
            this.commonOnInitService.contactAlert(
              'Please contact our customer support to enable international mail.'
            );
          }
        }
      });
  }

  openEditPayeeAdress(isUpdate: boolean = false) {
    const payeeId = this.checkDetailsResponse()?.datas?.[0]
      ?.enc_payee_id as string;
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    const checkNumber = this.checkDetailsResponse()?.datas?.[0]
      ?.cheque_serial_number as string;
    this.payeeService
      .showPayee(payeeId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const payeeData = res.data;
          if (isUpdate) {
            this.updatePayeeData(payeeData);
            this.payeeValidation(checkId, true);
            return;
          }
          if (payeeData) {
            const dialogRef = this.dialog.open(UpdatePayeeModalComponent, {
              disableClose: true,
              maxWidth: '95%',
              width: '1000px',
              data: {
                checkNo: checkNumber,
                EditPayeeData: payeeData,
                id: payeeId,
                checkid: checkId
              }
            });
            dialogRef.afterClosed().subscribe((resp) => {
              if (resp) {
                this.openEditPayeeAdress(true);
              }
            });
          }
        }
      });
  }

  updatePayeeData(payeeData: IViewPayee) {
    const updatedFormData = { ...this.formData(), payee: payeeData };
    this.formData.set(updatedFormData);
    this.updateSessionStorage(updatedFormData);
  }

  updateSessionStorage(formData: FormDataModel) {
    sessionStorage.setItem('formData', JSON.stringify(formData));
  }

  openEditBankAddress() {
    const bankAccountId = this.checkDetailsResponse()?.datas?.[0]
      ?.enc_bank_account_id as string;
    const checkNumber = this.checkDetailsResponse()?.datas?.[0]
      ?.cheque_serial_number as string;
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    const lastTransitionDialodg = this.dialog.open(UpdateBankModalComponent, {
      maxWidth: '1100px',
      width: '100%',
      data: {
        id: bankAccountId,
        checkNo: checkNumber
      }
    });
    lastTransitionDialodg.afterClosed().subscribe((data) => {
      if (data) {
        this.bankValidation(checkId);
        this.getBankDetails(bankAccountId);
      }
    });
  }

  getBankDetails(bankAccountId: string) {
    this.checkService
      .getbank({ ids: [bankAccountId] })
      .pipe(take(1))
      .subscribe((res) => {
        const updatedBankAc = {
          ...this.formData()?.bankAc,
          address: res?.data[0]
        };
        if (res.success) {
          this.formData.set({ ...this.formData(), bankAc: updatedBankAc });
        }
        this.updateSessionStorage({
          ...this.formData(),
          bankAc: updatedBankAc
        });
      });
  }

  openAttachment(attachmentId: string) {
    this.isAttachmentLoading.set({
      ...this.isAttachmentLoading(),
      [attachmentId]: true
    });
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    this.checkService
      .openCheckAttachment(checkId, attachmentId)
      .pipe(
        finalize(() => {
          this.isAttachmentLoading.set({
            ...this.isAttachmentLoading(),
            [attachmentId]: false
          });
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          const urlLoaded = window.open(res.data);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            this.alertService.warningAlert({
              content:
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
            });
          }
        }
      });
  }

  onBack() {
    this.router.navigate(['manage/business-tools/mail-dashboard/single-mail']);
  }

  /**
   * @description Adds bank_account_id to each check object when file_hidden is empty and isQbAutoSubAccountMapping is true
   * @param maildata - The mail payload object
   */
  addBankAccountIdToMailData(maildata: Record<string, any>) {
    if (!this.isQbAutoSubAccountMapping()) return maildata;

    const mailCheckIds = maildata.mail_check_ids || [];
    mailCheckIds.forEach((checkId: string) => {
      const checkData = maildata[checkId];
      if (checkData && (!checkData.file_hidden || checkData.file_hidden.length === 0)) {
        const checkItem = this.checkDetailsResponse()?.datas?.[0];
        if (checkItem?.enc_bank_account_id) {
          checkData.bank_account_id = checkItem.enc_bank_account_id;
        }
      }
    });
    return maildata;
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('formData');
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
