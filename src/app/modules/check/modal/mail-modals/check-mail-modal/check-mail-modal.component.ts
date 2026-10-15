import { DatePipe, NgIf, NgClass, NgFor, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, ViewChild } from '@angular/core';
import {
  FormArray,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
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
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, filter, finalize, take, takeUntil } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Utils } from 'src/app/data/utils';
import { MailChecks } from 'src/app/data/data/check';
import { ScriptService } from 'src/app/core/services/script.service';
import { IShowPayeeDetails, IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  ICheckCustomAddress,
  ICheckCustomMetaData,
  IMailBulkShippingAddress,
  IMailCheck,
  IMailShippingCalculations,
  IPayeeEdit,
  IShippingType
} from 'src/app/modules/check/model/check';
import { IApiRes } from 'src/app/models/api';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  faCircleDollarToSlot,
  faCircleExclamation,
  faCircleQuestion,
  faEnvelope,
  faGear,
  faMessage,
  faMoneyCheckDollar,
  faPaperclip,
  faPencil,
  faPlus,
  faTimes,
  faWarning
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ConfirmAlertComponent } from 'src/app/shared/alert/components/confirm-alert/confirm-alert.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { IBankValidation } from 'src/app/models/bank';
import { UserService } from 'src/app/shared/service/user/user.service';
import { AddMailAddressModalComponent } from '../add-mail-address-modal/add-mail-address-modal.component';
import { CheckAddAttachmentModalComponent } from '../../check-add-attachment-modal/check-add-attachment-modal.component';
import { LastTransactionModalComponent } from '../last-transaction-modal/last-transaction-modal.component';
import { UpdateBankModalComponent } from '../update-bank-modal/update-bank-modal.component';
import { UpdatePayeeModalComponent } from '../update-payee-modal/update-payee-modal.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { NewPhoneInputComponent } from '../../../../../shared/components/new-phone-input/new-phone-input.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { FedexSaturdayConfirmationComponent } from '../../fedexSaturdayConfirmation/fedexSaturdayConfirmation.component';
import { CheckMailSettingsModalComponent } from '../../check-mail-settings-modal/check-mail-settings-modal.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { MatSelectModule } from '@angular/material/select';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { RefillCreditRechargeModalComponent } from 'src/app/modules/refill-credit/modals/refill-credit-recharge-modal/refill-credit-recharge-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';

interface MailRow {
  mail_type: number;
  check_paper: number;
  informed_payee_sms: boolean;
  payee_phone: string;
  informed_payee_email: boolean;
  payee_email: string;
  success: boolean;
  payee_name: string;
  cheque_serial_number: string;
  cheque_amount: string;
  enc_payee_id: string;
  enc_id: string;
  is_exisiting_attach: number;
  subtotal: number;
  total: number;
  shippingFee: number;
  scheduleDate: string;
  enc_bank_account_id: string;
  payee_country: string;
  payee_zip: string;
  added_attachments: number;
  attachments: string[];
}

interface IFmailType {
  enc_id: string;
  enc_payee_id: string;
  cheque_amount: string;
  cheque_serial_number: string;
  payee_name: string;
  payee_email: string;
  informed_payee_email: boolean;
  informed_payee_sms: boolean;
  payee_phone: string;
  is_exisiting_attach: number;
  subtotal: string;
  total: string;
  shippingFee: string;
  enc_bank_account_id: string;
  country: string;
  zip: string;
  added_attachments: number;
  existingAttachments: unknown[];
}

@Component({
  selector: 'app-check-mail-modal',
  templateUrl: './check-mail-modal.component.html',
  styleUrls: ['./check-mail-modal.component.scss'],
  standalone: true,
  imports: [
    DemoVideoComponent,
    MatDialogClose,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    MatTooltip,
    NewPhoneInputComponent,
    V35ControlMessageComponent,
    MatDialogActions,
    CurrencyPipe,
    FontAwesomeModule,
    TruncatePipe,
    MatSelectModule,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    NgOptimizedImage
  ]
})
export class CheckMailModalComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<CheckMailModalComponent>);
  private router = inject(Router);
  private checkMail = inject(CheckService);
  private recurringRedirect = inject(RecurringRedirectService);
  public datas = inject(MAT_DIALOG_DATA);
  private payeeService = inject(PayeeService);
  private fb = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private datePipe = inject(DatePipe);
  private dataTableService = inject(DataTableService);
  private refillCredit = inject(RefillCreditService);
  private headerservice = inject(HeaderService);
  private scriptService = inject(ScriptService);
  private v3DataTableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private commonOnInitService = inject(CommonOnInitService);
  private localStorageService = inject(LocalStorageService);
  private UserServicu = inject(UserService);

  isDisabled = false;
  recurring = false;
  scheduleIt = false;
  trans = true;
  checksWithAttachments: { chequeNo: string; encId: string }[] = [];
  bottomSection = true;
  isAttachmentsAvailable = false;
  disabled = false;
  isProceedMailing = false;
  hasDemoAccountError = false; // Track if demo account error 731 was detected
  payeeall = false;
  bankall = false;
  skipprocess = false;
  nonmail = false;
  editDisable = false;
  fromValid = false;
  customAddress = true;
  shipdisabled = false;
  shippingTypes: any;
  mailChecks: any[] = MailChecks.checks();
  loading = false;
  invalidMailTypeChecks: string[] = []; // Stores check IDs with null mail_type

  checkdata: any = [];
  nonMail: any = [];
  ids: any = [];
  Pids: any = [];
  checkNo: any = [];
  mindate: any;
  invalidbank: any = [];
  invalidPayee: any = [];
  shippingtype: any = {};
  subscriptions: Subscription[] = [];
  shippingAddressFrom: any = [];
  shippingAddressTo: IMailBulkShippingAddress[] = [];
  isMailFromEditable = false;
  isMailToEditable = false;
  mailFromId: any;
  mailToId: any;

  // ViewChild references for dropdown components
  @ViewChild('mailFromDropdown') mailFromDropdown: V35CommonDropDownSelectorComponent;
  @ViewChild('mailToDropdown') mailToDropdown: V35CommonDropDownSelectorComponent;
  shipping: IShippingType[] = [];
  checkAmount: number;

  mailForm: UntypedFormGroup;
  emailChecksData: any = {};
  attachments: any = {};

  subtotal: any = 0;
  total: any = 0;
  shippingFee: any = 0;
  shippingCalculation: any;
  costArray: any = [];
  customShippingType: number | undefined = undefined;
  currentShippingType: number | undefined = undefined;

  idlist = {
    mail_type: 1,
    check_paper: 1,
    informed_payee_sms: 10,
    informed_payee_email: 1,
    payee_phone: '',
    payee_email: '',
    file_hidden: []
  };

  caldata: any = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3,
    custom_address_shipping_type: 1
  };

  shippingvalue: any;
  Papervalue: any;
  costCalculation: IMailShippingCalculations;
  country: any;
  Bids: any = [];
  BcheckNo: any = [];
  errorCode: any;
  err_msg: any;
  isRefreshed: boolean;
  currentCredit: any;
  phoneverified = 0;
  emailverified = 0;
  isSubscribed = 0;
  visibleLoading = true;
  isQbAutoSubAccountMapping = signal(false);

  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right'
  ];

  position = new UntypedFormControl(this.positionOptions[2]);
  Fromdata: any;
  Todata: any;
  smsvalue: boolean;
  canada: boolean;
  us = true;
  shippingvar: any[];
  customShipping: any;
  indexofsms = 0;
  indexofmail = 0;
  utils = Utils;
  checkIfId: { id: string; check_No: string }[] = [];
  encyptedIds: string[] = [];
  afterModal: IPayeeEdit;
  checkNumberArray: (string | undefined)[] = [];
  isDisable = false;
  autoAttachmentForMail = false;
  checkCustomMetaData: ICheckCustomMetaData[] = [];
  isPhoneNumberRequired: boolean[] = [];
  phoneNumber: boolean;
  selectedIndex: number;
  subjectKeyUp = new Subject();
  isFedex = false;
  selectedShippingType: number;
  currentMailFrom = '';
  currentMailTo = '';
  faPencil = faPencil;

  // V35 Dropdown configurations
  mailFromConfig = {
    placeholder: 'Select',
    displayField: 'name',
    outputField: 'id',
    enableAddNew: true,
    style: {
      size: 2
    },
    extraStyles: 'w-full'
  };

  mailToConfig = {
    placeholder: 'Select',
    displayField: 'name',
    outputField: 'id',
    enableAddNew: true,
    style: {
      size: 2
    }
  };
  faCircleQuestion = faCircleQuestion;
  faRequired = faCircleExclamation;
  isEnvelopeChecked = false;
  validatedBankIds: string[] = [];
  selectedCheksBankInfo: { [key: string]: IBankValidation };
  /** Payee-validation response keyed by cheque enc_id. Mirrors selectedCheksBankInfo. */
  selectedChecksPayeeInfo: { [key: string]: { success: boolean } };

  destroy$ = new Subject<boolean>();
  selectedType = 'mail now';
  faGear = faGear;
  selctedShippingType: { [x: string]: any } = {};
  isChangeMailType = signal(false);
  individualShippingTypes: boolean[] = [];
  isAllPayeeSame = false;
  isPayeeLoading = false;
  payeeData: IShowPayeeDetails;
  showCheckMailNotification = signal(false);
  faPlus = faPlus;
  faCreditCard = faMoneyCheckDollar;
  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faCircleDollarToSlot = faCircleDollarToSlot;
  faPaperclip = faPaperclip;
  faTimes = faTimes;
  faWarning = faWarning;

  ngOnInit(): void {
    this.checkPhoneNumber();
    this.paymentsService.isPaymentProcessingSubject.next(false);
    if (this.datas.type === 'Checkprocess') {
      this.skipprocess = true;
    }

    this.datas.caldata = {
      ...this.datas.caldata,
      sent_to_customer_address: 0
    };
    this.costCalculation = this.datas.caldata;
    this.checkdata = this.datas.data.chequedata.datas;

    this.nonMail = this.datas.data.chequedata.message.non_mailiable_checks;
    this.shipping = this.datas.data.shipping;
    if (this.nonMail.length > 0) {
      this.nonmail = true;
      this.nonmailcheck();
    }

    if (this.checkdata != null) {
      this.initmailForm();
      this.getmails();
      this.mailcredit();
    }

    if (this.checkdata.length > 1) {
      this.trans = false;
      this.bottomSection = false;
    }

    if (this.datas.ShippingCost){
      this.shippingCalculation = this.datas.ShippingCost; // added condition
    }


    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    this.mindate = this.datePipe.transform(futureDate, 'yyyy-MM-dd');
    this.mailForm.get('scheduleDate')?.setValue(this.mindate);
    this.mailForm.get('start_date')?.setValue(this.mindate);

    this.loadShippingAddressFrom(false);
    this.loadShippingAddressTo();
    const toCustomAddress = this.querySelector('#to-custom-address');
    const toCustomAddressOptionsDiv = this.querySelector(
      '.custom-shipping-option'
    );
    if (toCustomAddress.checked) {
      if(toCustomAddressOptionsDiv){
      toCustomAddressOptionsDiv.style.opacity = '1';
      toCustomAddressOptionsDiv.style.pointerEvents = 'auto';
      }
    } else {
      if(toCustomAddressOptionsDiv){
      toCustomAddressOptionsDiv.style.opacity = '0.5';
      toCustomAddressOptionsDiv.style.pointerEvents = 'none';
      }
    }
    this.checkAllPayeeSame()
    // get credit check data from header service to setup credit refill flow
    this.getCreditCheckData();
    this.getUserOverallData();
  }

  getUserOverallData() {
    this.subscriptions.push(
      this.UserServicu.userOverallData.subscribe((res) => {
        if (res !== undefined) {
          this.showCheckMailNotification.set(res?.checkMailExist === 0);
        }
      })
    );
  }

  /**
   * @description Used to get the credit check data.
   * @returns void
   */
  getCreditCheckData(){
    this.subscriptions.push(
      this.headerservice.headerData().subscribe((res) => {
        this.isSubscribed = res.data.isSubscribed || 0;
        this.phoneverified = res.data.userInfo.phone_verified || 0;
        this.emailverified = res.data.userInfo.email_verified || 0;
        if(res.data.enabledPlugins.includes('qb-auto-sub-account-mapping')){
          this.isQbAutoSubAccountMapping.set(true);
        }
      })
    );
  }


  checkAllPayeeSame(){
    const payeeIds = this.checkdata.map((check: {enc_payee_id: string}) => check.enc_payee_id);
    const allIdsSame = payeeIds.every((id:string) => id === payeeIds[0]);
    this.isAllPayeeSame = allIdsSame;
  }

  nonmailcheck() {
    return this.nonMail.toString();
  }

  initmailForm() {
    this.mailForm = this.fb.group({
      scheduleDate: [''],
      recurring_include_check: true,
      frequency: [1],
      start_date: [''],
      end_select: [1],
      count: [1],
      until: [''],
      mails: this.fb.array([])
    });
  }

  createCreditMemobody() {
    const data = this.mailForm.value;
    return {
      schedule_date: data.scheduleDate,
      recurring_include_check: data.recurring_include_check,
      frequency: data.frequency,
      start_date: data.start_date,
      end_select: data.end_select,
      count: data.count,
      until: data.until
    };
  }


  get fmails() {
    return <UntypedFormArray>this.mailForm.controls.mails;
  }

  /**
   * Column count of the mail table: 9 fixed columns, plus the row-select column
   * (hidden for a single check) and the bank account column. The footer row's
   * colspans are derived from this so they never invent a phantom column.
   */
  get mailTableColumnCount(): number {
    return 9 + (this.fmails.length > 1 ? 1 : 0) + (this.fromValid ? 1 : 0);
  }

  /** ************************** Row Selection *********************************************** */

  /**
   * Checks the user has excluded from mailing. Kept outside the FormArray because
   * the array is torn down and rebuilt after a payee/bank address edit.
   */
  private unselectedEncIds = new Set<string>();

  get selectedMailRows() {
    return this.fmails.controls.filter((c) => c.value.isSelectedForPayment);
  }

  getSelectedEncIds(): string[] {
    return this.selectedMailRows.map((c) => c.value.enc_id);
  }

  get hasSelectedRows(): boolean {
    return this.selectedMailRows.length > 0;
  }

  get isAllRowsSelected(): boolean {
    return (
      this.fmails.length > 0 &&
      this.selectedMailRows.length === this.fmails.length
    );
  }

  private get mailConfirmMessage(): string {
    const count = this.selectedMailRows.length;
    // With a single check there is no row checkbox, so nothing was "selected".
    return count === 1
      ? 'You are about to mail this check. Do you want to continue?'
      : `You have selected ${count} checks to mail. Do you want to continue?`;
  }

  private warnAtLeastOneRow() {
    // WarningAlertComponent titles itself 'Error' unless a title is supplied.
    this.alertService.warningAlert({
      title: 'Warning',
      content: 'At least one check should be selected.'
    });
  }

  selectAllRowsForMailing(checked: boolean) {
    // Unchecking the header keeps the first row selected - never mail nothing.
    this.fmails.controls.forEach((c, i) =>
      (c as UntypedFormGroup).controls.isSelectedForPayment.setValue(
        checked || i === 0
      )
    );
    if (!checked) {
      this.warnAtLeastOneRow();
    }
    this.syncUnselectedEncIds();
    this.calculateShippingCost(this.costCalculation);
  }

  toggleRowForMailing(checked: boolean, index: number) {
    const control = (this.fmails.at(index) as UntypedFormGroup).controls[
      'isSelectedForPayment'
    ];
    const othersSelected = this.fmails.controls.some(
      (c, i) => i !== index && c.value.isSelectedForPayment
    );
    if (!checked && !othersSelected) {
      control.setValue(true);
      this.warnAtLeastOneRow();
      return;
    }
    control.setValue(checked);
    this.syncUnselectedEncIds();
    this.calculateShippingCost(this.costCalculation);
  }

  private syncUnselectedEncIds() {
    this.unselectedEncIds = new Set(
      this.fmails.value
        .filter((row: { isSelectedForPayment: boolean }) => !row.isSelectedForPayment)
        .map((row: { enc_id: string }) => row.enc_id)
    );
  }

  /**
   * Returns a clone of the shipping/mail payload containing only the checks whose
   * row checkbox is ticked. Never mutates `costCalculation` / `datas.caldata` -
   * that object is owned by the component that opened this modal.
   */
  private buildSelectedPayload(
    payload: IMailShippingCalculations
  ): IMailShippingCalculations {
    if (!this.fmails?.length) {
      // Form not built yet (first calculation) - nothing to filter against.
      return payload;
    }
    const selectedIds = this.getSelectedEncIds();
    const allIds: string[] = payload?.mail_check_ids || [];
    const filtered = { ...payload } as IMailShippingCalculations;
    filtered.mail_check_ids = allIds.filter((id) => selectedIds.includes(id));
    allIds
      .filter((id) => !selectedIds.includes(id))
      .forEach((id) => delete filtered[id]);
    return filtered;
  }

  /** ************************** Set Data in the Modal *********************************************** */

  pushmailRow(emailArr: MailRow[], isUpdateAdrees = false) {
    emailArr.forEach((data) => {
      if (data) {
        this.fmails.push(
          this.fb.group({
            enc_id: data.enc_id,
            enc_payee_id: data.enc_payee_id,
            cheque_amount:
              this.shippingCalculation?.single_items?.[data.enc_id]?.toFixed(
                2
              ) || '0.00',
            cheque_serial_number: data.cheque_serial_number,
            payee_name: data.payee_name,
            payee_email: [data.payee_email, [ValidationService.emailValidator]],
            informed_payee_email: !!data.payee_email,
            informed_payee_sms: false,
            payee_phone: [data.payee_phone, [ValidationService.phoneMinLength]],
            is_exisiting_attach: data.is_exisiting_attach,
            subtotal: this.shippingCalculation?.subtotal ?? '0.00',
            total: this.shippingCalculation?.total,
            shippingFee: this.shippingCalculation?.group_shipping_fee,
            enc_bank_account_id: data.enc_bank_account_id,
            country: data.payee_country,
            zip: data?.payee_zip,
            added_attachments: data.added_attachments,
            existingAttachments: [data.attachments],
            isSelectedForPayment: [!this.unselectedEncIds.has(data.enc_id)]
          })
        );
        if (data.is_exisiting_attach > 0) {
          this.checksWithAttachments.push({
            chequeNo: data.cheque_serial_number,
            encId: data.enc_id
          });
        }
        this.total = this.shippingCalculation?.total;
      }
      if (isUpdateAdrees) {
        this.costCalculation.mail_check_ids.forEach((id: string) => {
          if (data.enc_id === id && this.costCalculation[id]) {
            this.selctedShippingType[data.enc_id] =
              this.costCalculation[id].mail_type;
          }
        });
      } else {
        const shippingTypes = this.sortedoption(data.payee_country);
        const defaultType = this.getSelectedShippingType(shippingTypes);
        this.selctedShippingType[data.enc_id] = defaultType;
        // Only set mail_type in costCalculation if a default type is found
        if (defaultType !== null && this.costCalculation[data.enc_id]) {
          this.costCalculation[data.enc_id].mail_type = defaultType;
        }
      }
    });
    this.checkTheExistingAttachments();
    let count = 0;

    this.fmails.value.forEach((el: { informed_payee_email: string }) => {
      if (el.informed_payee_email) {
        count += 1;
      }
      if (count == this.fmails.length) {
        this.querySelector('#email').checked = true;
      }
    });

    this.bankvalidation();
    this.payeevalidation('', '');
    this.allselectbox();
    this.fmails.markAllAsTouched();
  }

  //* ******************************************** Shipping Cost Calculation in  Shipping type *****************************/

  shippingTypecostchange(
    event: Event,
    id: string,
    i: number,
    type: string,
    needLoader = false
  ) {
    this.individualShippingTypes[i] = true;
    const selectedValue = Number((event.target as HTMLInputElement).value);

    this.onCheckShippingType(selectedValue, i, type);
    this.payeevalidation(id, (event.target as HTMLInputElement).value);

    for (const property in this.datas.caldata) {
      if (property == id) {
        this.datas.caldata[id] = this.getCheckObject(
          id,
          (event.target as HTMLInputElement).value
        );
      }
    }
    this.calculateShippingCost(this.costCalculation, needLoader);
    this.invalidMailTypeChecks = this.invalidMailTypeChecks.filter(
      (checkId) => checkId !== id
    );
  }

  /**
   * @description Used to find selected shipping type is fedEx or not.
   * If shiping type is fedEx then add validation to payee phone number.
   *
   * @param {number} shippingTypeId - The selected Id representing the shipping type.
   * @param {number} i - The index of the shipping type in the options array.
   * @param {string} countryType - selected country.
   */
  onCheckShippingType(shippingTypeId: number, i: number, countryType: string) {
    const shippingType = this.sortedoption(countryType);
    const selectedShippingType = shippingType.filter(
      (item) => Number(item.id) === Number(shippingTypeId)
    );
    this.selectedShippingType = selectedShippingType[0]?.carrier_id;
    
    // Update the selctedShippingType for the current check
    const currentCheck = this.fmails.at(i);
    if (currentCheck && currentCheck.value.enc_id) {
      this.selctedShippingType[currentCheck.value.enc_id] = Number(shippingTypeId);
      
      // Remove from invalid checks if it was there
      this.invalidMailTypeChecks = this.invalidMailTypeChecks.filter(
        (checkId) => checkId !== currentCheck.value.enc_id
      );
    }
    
    const phone = (this.fmails as FormArray<FormGroup>).controls[i].controls
      .payee_phone;

    if (this.selectedShippingType === 2) {
      // Attach unconditionally. The old code only attached these when the phone
      // was already invalid, and it judged that by reading control.errors — which
      // the else branch below had just wiped with clearValidators(). So after
      // FedEx -> USPS the control looked valid, and FedEx -> USPS -> FedEx
      // silently dropped the rule. Re-attaching every time makes it idempotent.
      phone.setValidators([
        Validators.required,
        ValidationService.phoneMinLength
      ]);
      phone.updateValueAndValidity();
      phone.markAsTouched();
      this.isPhoneNumberRequired[i] = phone.invalid;
    } else {
      phone.clearValidators();
      phone.updateValueAndValidity();
      phone.markAsUntouched();
      this.isPhoneNumberRequired[i] = false;
    }
  }

  getChange(valid: boolean, i: number) {
    if (!valid) {
      this.fmails.controls[i].get('informed_payee_sms')?.patchValue(true);
      return 1;
    }
    return 0;
  }

  getCheckObject(id: any, value: any) {
    const data = this.costCalculation[id];

    let email;
    let phone;
    this.fmails.value.forEach((e: any) => {
      if (e.enc_id == id) {
        phone = e.payee_phone;
        email = e.payee_email;
      }
    });

    return {
      check_paper: data.check_paper,
      file_hidden: this.attachments[id],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: data.informed_payee_sms,
      mail_type: value === null || value === undefined ? null : Number(value),
      payee_email: email,
      payee_phone: phone
    };
  }

  sortedoption(value: string) {
    const USA = ['united states', 'us', 'usa','united states of america'];
    const ca = ['canada', 'ca'];

    const country = value?.toLowerCase();
    let selectCountry;
    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry = value;
    }
    if (selectCountry === 'Canada') {
      return (
        this.shipping?.filter(
          (type: IShippingType) => type.country === 'Canada'
        ) || []
      );
    }
    if (selectCountry === 'United States') {
      return (
        this.shipping?.filter(
          (type: IShippingType) =>
            type.country !== 'Canada' && type.country !== 'International'
        ) || []
      );
    }

    return (
      this.shipping?.filter(
        (type: IShippingType) => type.country === 'International'
      ) || []
    );
  }

  getSelectedShippingType(shippingTypes: IShippingType[]): number | null {
    // Check if any shipping type has is_default_mailing_type set to true
    const defaultMailingType = shippingTypes.find(
      (type) => type.is_default_mailing_type
    );

    if (defaultMailingType) {
      // If a default mailing type is found, return its id
      return defaultMailingType.id;
    }

    // Return null to force user selection - no automatic selection
    return null;
  }

  /** ***************************** Shipping cost calculation in Check paper **************************** */

  ShippingPapercostchange(event: any, id: string) {
    for (const property in this.datas.caldata) {
      if (property == id) {
        this.datas.caldata[id] = this.getPaperObject(id, event.target.value);
      }
    }
    this.calculateShippingCost(this.datas.caldata);
  }

  getPaperObject(id: any, value: any) {
    const data = this.costCalculation[id];
    let email = '';
    let phone = '';
    this.fmails.value.forEach((e: any) => {
      if (e.enc_id == id) {
        phone = e.payee_phone;
        email = e.payee_email;
      }
    });
    return {
      check_paper: Number(value),
      file_hidden: this.attachments[id],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: data.informed_payee_sms,
      mail_type: data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  getView() {
    return 1;
  }

  /** ************************************* Shipping Calculation in sms ********************************* */

  smscheckchange(event: any, id: string) {
    if (event.target.checked) {
      this.smsvalue = true;
    } else {
      this.smsvalue = false;
    }

    for (const property in this.datas.caldata) {
      if (property == id) {
        this.datas.caldata[id] = this.getSmsObject(id, event.target.checked);
      }
    }
    this.calculateShippingCost(this.datas.caldata);

    if (event.target.checked) {
      if (this.indexofsms !== this.mailForm.value.mails.length) {
        this.indexofsms += 1;
      }
      if (this.indexofsms == this.mailForm.value.mails.length) {
        const Allsms = document.getElementById(`sms`) as HTMLInputElement;
        Allsms.checked = true;
      }
    } else {
      this.indexofsms -= 1;
      const Allsms = document.getElementById(`sms`) as HTMLInputElement;
      Allsms.checked = false;
    }
  }

  allselectbox() {
    const Allsms = document.getElementById(`email`) as HTMLInputElement;
    let j = 0;
    for (const property in this.mailForm.value.mails) {
      if (this.mailForm.value.mails[property].informed_payee_email == false) {
        j += 1;
      }
    }

    if (j == 0) {
      Allsms.checked = true;
      this.indexofmail = this.mailForm.value.mails.length;
    } else {
      Allsms.checked = false;
    }
  }

  getSmsObject(id: any, event: boolean) {
    const data = this.costCalculation[id];

    let email = '';
    let phone = '';
    this.fmails.value.forEach((e: any) => {
      if (e.enc_id == id) {
        phone = e.payee_phone;
        email = e.payee_email;
      }
    });

    if (event) {
      return {
        check_paper: data.check_paper,
        file_hidden: this.attachments[id],
        informed_payee_email: data.informed_payee_email,
        informed_payee_sms: 10,
        mail_type: data.mail_type,
        payee_email: email,
        payee_phone: phone
      };
    }
    return {
      check_paper: data.check_paper,
      file_hidden: this.attachments[id],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: 0,
      mail_type: data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  getmails(isUpdateAdrees = false) {
    const ids: any = { ids: [], is_signature: 1 };
    this.checkdata.forEach((element: any) => {
      ids.ids.push(element.enc_id);
      this.ids.push(element.enc_id);
    });

    this.checkMail
      .getChequeDetails(ids)
      .pipe(
        finalize(() => {
          this.removeLoadedSkelton();
        })
      )
      .subscribe((data) => {
        if (data?.success) {
          this.emailChecksData = data.data;
          this.checkAmount = Number(data.data?.datas[0].cheque_amount) ?? 0;
          if (data.data?.message?.has_pdf_attachment) {
            this.isAttachmentsAvailable = true;
          }
          this.selctedShippingType = this.emailChecksData.datas?.reduce(
            (acc: { [x: string]: number | null }, item: { enc_id: string | number; payee_country: string }) => {
              if (item?.enc_id) {
                const shippingTypes = this.sortedoption(item.payee_country);
                const defaultType = this.getSelectedShippingType(shippingTypes);
                acc[item.enc_id] = defaultType;

                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[item.enc_id]) {
                  this.costCalculation[item.enc_id].mail_type = defaultType;
                }
              }
              return acc;
            },
            {}
          );
          this.pushmailRow(this.emailChecksData.datas, isUpdateAdrees);
          this.getCheckCustomData();
          /** auto attachment along with mail is enable/disable value */
          if (data.data?.message?.is_auto_attachment_enabled === 1) {
            this.autoAttachmentForMail = false;
          } else {
            this.autoAttachmentForMail = true;
          }
          if (this.datas?.openRecurringModal) {
            this.selectedType = 'recurring';
            this.mailTypeChange(this.selectedType);
          } else {
            this.selectedType = 'mail now';
          }
        }
      });
  }

  /**
   * @description Getting Check Custom Data for each check we selected from backend. Some check may have custom meta data in our data base . so if there is any metadata, we can populate it to corresponding fields
   */
  getCheckCustomData() {
    const ids: string[] = [];
    this.checkdata.forEach((element: Record<string, string>) => {
      ids.push(element.enc_id);
    });
    const body = { cheque_ids: ids };
    this.loading = true;
    this.checkMail
      .getChequeCustomDetails(body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((res) => {
        if (res.success) {
          this.checkCustomMetaData = res.data;
          this.setCheckCustomData(res.data);
        }
      });
  }

  /**
   * @description After getting all meta data of checks, we need to set those data to correspoding filds. populating fields happening here. Some Operations may have normialized to other functions
   * @param data
   */
  setCheckCustomData(data: ICheckCustomMetaData[]) {
    this.fmails.value.forEach((formGroup: IFmailType) => {
      const customData = data.find((el) => el.check_id === formGroup.enc_id);
      
      if (customData && customData.mail_type) {
        // Use the custom mail type from the database
        this.setShippingCostAndType(customData.mail_type, formGroup.enc_id);
      } else if (!this.selctedShippingType[formGroup.enc_id] || this.selctedShippingType[formGroup.enc_id] === null) {
        const shippingTypes = this.sortedoption(formGroup.country);
        const defaultType = this.getSelectedShippingType(shippingTypes);
        this.selctedShippingType[formGroup.enc_id] = defaultType;
        // Only set mail_type in costCalculation if a default type is found
        if (defaultType !== null && this.costCalculation[formGroup.enc_id]) {
          this.costCalculation[formGroup.enc_id].mail_type = defaultType;
        }
      }
    });
  }

  /**
   * @description  Setting Check Shipping Cost and Mail Type for each check if there is any
   * @param value
   * @param id
   */
  setShippingCostAndType(value: number, id: string) {
    this.payeevalidation(id, value);

    for (const property in this.datas.caldata) {
      if (property === id) {
        this.datas.caldata[id] = this.getCheckObject(id, value);
      }
    }
    this.calculateShippingCost(this.costCalculation);
  }

  removeLoadedSkelton(): void {
    const payee_skelton: NodeListOf<HTMLElement> =
      document.querySelectorAll('.skelton');
    payee_skelton.forEach((item) => item.classList.remove('skelton'));
    this.visibleLoading = false;
  }

  /** *********************************** Payee Validation ************************************* */

  payeevalidation(id: string, type: string | number) {
    const ids: any = { cheque_ids: [], shipping_type: [] };
    let data: any;
    if (id) {
      ids.cheque_ids.push(id);
      ids.shipping_type.push(type);
    } else {
      this.checkdata.forEach((el: Record<string, string>) => {
        ids.cheque_ids.push(el.enc_id);
        ids.shipping_type.push(1);
      });
      // Full re-validation - drop the previous run's results so a payee whose
      // address has since been fixed stops being reported as invalid.
      this.Pids = [];
      this.encyptedIds = [];
      this.checkNo = [];
      this.invalidPayee = [];
    }
    this.isDisable = true;
    this.subscriptions.push(
      this.checkMail
        .payeevalidation(ids)
        .pipe(
          finalize(() => {
            this.isDisable = false;
          })
        )
        .subscribe((res: any) => {
          data = res.data;

          // Keyed by cheque enc_id. A single-check re-validation only carries that
          // one check, so merge rather than replace or the other rows lose theirs.
          this.selectedChecksPayeeInfo = {
            ...(id ? this.selectedChecksPayeeInfo : {}),
            ...res.data
          };

          ids.cheque_ids.forEach((el: any) => {
            if (!data[el].success) {
              this.Pids.push(res.data[el].data.id);
              this.encyptedIds.push(res.data[el].data.id);

              this.checkNo.push(res.data[el].data.cheque?.cheque_serial_number);
              this.invalidPayee.push(res.data[el].data);
              this.shippingtype[el] = type;
              if (data[el].error_code == 1) {
                this.alertService.warningAlert({
                  content:
                    'Fill the Payee street address instead of the PO box for FedEx mailing'
                });
              }
            }

            // The "Invalid To Address" badge now binds straight to
            // selectedChecksPayeeInfo[enc_id].success, so there is no flag to
            // flip or DOM node to hide here.
          });

          // A single-check re-validation only sends that check's id, so its
          // enable_all_payee_edit says nothing about the other rows - let it
          // turn the Edit Payee Address button on, never off.
          this.payeeall = id
            ? this.payeeall || !!res.data.enable_all_payee_edit
            : !!res.data.enable_all_payee_edit;
        })
    );
    return data;
  }

  /** ************************************ Bank Validation ******************************************* */

  bankvalidation() {
    const ids: any = { ids: [] };

    this.checkdata.forEach((el: any) => {
      ids.ids.push(el.enc_id);
    });

    // These are rebuilt from every response - clear them first, otherwise a check
    // whose from-address has since been fixed stays flagged forever and the edit
    // modal receives duplicated ids.
    this.Bids = [];
    this.BcheckNo = [];
    this.invalidbank = [];
    this.validatedBankIds = [];
    this.fromValid = false;

    this.subscriptions.push(
      this.checkMail.bankvalidation(ids)
      .pipe(
        finalize(() => {
        this.isDisable = false;
      }
    )
    )
      .subscribe((res) => {
        if (!res) return; // Exit if error occurred

        const { data } = res;
        this.selectedCheksBankInfo = data;

        // Check if any check has error 731
        const has731Error = ids.ids.some(
          (el: string) => !data[el].success && data[el].error_code === 731
        );

        if (has731Error) {
          this.hasDemoAccountError = true; // Set flag to indicate demo account error
          this.isProceedMailing = true; // Skip confirmation popup for demo accounts
          this.alertService
            .warningAlert({
              title: 'No Bank Account',
              content: 'Add your first bank account to send payments',
              doneMsg: 'Add Bank Account',
              cancelMsg: 'Cancel',
              isCancel: true
            })
            .afterClosed()
            .subscribe((result) => {
              if (result) {
                this.dialogRef.close();
                this.router.navigate(['/manage/users/add-bank-account']);
              }
            });
          return; // Exit early, don't process other checks
        }

        ids.ids.forEach((el: any) => {
          const invFrom = document.querySelector(
            `#invalidFrom_${el}`
          ) as HTMLDivElement;

          if (!data[el].success) {
            this.Bids.push(data[el].bank_account_id);
            this.BcheckNo.push(data[el].cheque.cheque_serial_number);
            this.invalidbank.push(data[el]);
            this.validatedBankIds.push(data[el].id);        
          }
          if (data[el].success) {
            if (invFrom) {
              invFrom.style.display = 'none';
              this.fromValid = false;
            }
          } else if (!data[el].success) {
            this.fromValid = true;
          }
          if (res.data.enabele_all_bank_edit) {
            this.bankall = true;
          } else {
            this.bankall = false;
          }
        });
      })
    );
  }

  InvFromAddress(id: string, checkNo: string) {
    const lastTransitionDialodg = this.dialog.open(UpdateBankModalComponent, {
      maxWidth: '1100px',
      width: '100%',
      data: {
        id,
        checkNo
      }
    });
    lastTransitionDialodg.afterClosed().subscribe((data) => {
      if (data) {
        this.hasDemoAccountError = false; // Reset demo account error flag
        this.bankvalidation();
      }
    });
  }

  //* ******************************** last 10 Transaction ********************************/

  openLastTrans() {
    this.dialog.open(LastTransactionModalComponent, {
      maxWidth: '1010px',
      width: '90%',
      data: this.checkdata[0].enc_id
    });
  }

  //* ******************************** Edit payee Address ********************************/

  openEditPayeeAdress(id: any, checkNo: any, checkid: any) {
    this.editDisable = true;

    this.subscriptions.push(
      this.payeeService.showPayee(id).subscribe((re: any) => {
        const EditPayeeData: IViewPayee = re.data;

        if (EditPayeeData) {
          const lastTransitionDialodgS = this.dialog.open(
            UpdatePayeeModalComponent,
            {
              maxWidth: '95%',
              width: '1000px',
              data: {
                checkNo,
                EditPayeeData,
                id,
                checkid
              }
            }
          );

          lastTransitionDialodgS.afterClosed().subscribe((res) => {
            this.editDisable = false;

            if (res) {
              this.afterModal = res.data.forEach((ele: IPayeeEdit) => {
                this.encyptedIds = [];
                this.checkNumberArray = [];
                this.encyptedIds.push(ele.enc_id);
              });
              this.payeevalidation('', '');
              this.costCalculation[checkid].mail_type = null;

              if (res.data[0].country == 'Canada') {
                this.shippingvar = this.shipping?.filter(
                  (type: IShippingType) => type.country === res.data[0].country
                );
                // Check for default mailing type instead of forcing null
                const shippingTypes = this.sortedoption(res.data[0].country);
                const defaultType = this.getSelectedShippingType(shippingTypes);
                this.selctedShippingType[checkid] = defaultType;
                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[checkid]) {
                  this.costCalculation[checkid].mail_type = defaultType;
                }
                this.country = 'Canada';
              } else if (res.data[0].country === 'United States') {
                this.shippingvar = this.shipping?.filter(
                  (type: IShippingType) =>
                    type.country === 'United States' || type.country === null
                );
                // Check for default mailing type instead of forcing null
                const shippingTypes = this.sortedoption(res.data[0].country);
                const defaultType = this.getSelectedShippingType(shippingTypes);
                this.selctedShippingType[checkid] = defaultType;
                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[checkid]) {
                  this.costCalculation[checkid].mail_type = defaultType;
                }
              } else {
                this.shippingvar = this.shipping?.filter(
                  (type: IShippingType) => type.country === 'International'
                );
                // Check for default mailing type instead of forcing null
                const shippingTypes = this.sortedoption('International');
                const defaultType = this.getSelectedShippingType(shippingTypes);
                this.selctedShippingType[checkid] = defaultType;
                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[checkid]) {
                  this.costCalculation[checkid].mail_type = defaultType;
                }
              }

              this.syncUnselectedEncIds();
              this.mailForm.controls.mails = this.fb.array([]);
              this.getmails(true);
            }

            if (!res) {
              this.editDisable = false;
            }
          });
        }
      })
    );
  }

  //* ******************************** Open Attachment ********************************/

  openAttachmentModal(_i: any, checkId: string, smsvalue: boolean) {
    let value: any;
    if (smsvalue) {
      value = 10;
    } else {
      value = 0;
    }
    const attachmentModal = this.dialog.open(CheckAddAttachmentModalComponent, {
      disableClose: true,
      maxWidth: '1010px',
      width: '630px',
      data: {
        checkId,
        acceptFormats: '.pdf',
        attachId: this.attachments[checkId],
        type: 'mail',
        cost: this.shippingCalculation?.page_cost
      }
    });
    attachmentModal.afterClosed().subscribe((data) => {
      if (data) {
        if (this.checksWithAttachments?.length) {
          this.checksWithAttachments = this.checksWithAttachments.filter(
            (checkAttachment) => checkAttachment.encId !== checkId
          );
        }
        this.attachments[data.checkId] = data.ids;
        this.attachments.fileName = data.fileName;
        for (const property in this.datas.caldata) {
          if (property == checkId) {
            this.datas.caldata[checkId] = this.getAttachmentObject(
              checkId,
              this.attachments[checkId],
              value
            );
          }
        }
        this.calculateShippingCost(this.datas.caldata);
      }
    });
  }

  /** *
   * when the attachment open the existing attachments will be checked.
   *
   */
  checkTheExistingAttachments() {
    if (Object.keys(this.attachments).length === 0) {
      this.fmails.controls?.forEach((mailData) => {
        if (mailData.value.added_attachments > 0) {
          // when it open first time this will work.
          this.attachments[mailData.value.enc_id] =
            mailData.value.existingAttachments;
          this.datas.caldata[mailData.value.enc_id] = this.getAttachmentObject(
            mailData.value.enc_id,
            mailData.value.existingAttachments,
            0
          );
        }
      });
        this.calculateShippingCost(this.datas.caldata);
    }
  }

  getAttachmentObject(id: string, value: string, smsvalue: any) {
    const data = this.costCalculation[id];

    let email = '';
    let phone = '';
    this.fmails.value.forEach((e: any) => {
      if (e.enc_id == id) {
        phone = e.payee_phone;
        email = e.payee_email;
      }
    });

    return {
      check_paper: data.check_paper,
      file_hidden: value,
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: smsvalue,
      mail_type: data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  //* ******************************** Open to edit Address Modal ********************************/

  updateAllPayeeAddressModal() {
    const payeeupdate = this.dialog.open(UpdatePayeeModalComponent, {
      maxWidth: '1100px',
      width: '100%',
      data: {
        checkNo: this.checkNo,
        id: this.Pids,
        type: 'multi-update',
        invalidpayee: this.invalidPayee,
        shippingType: this.shippingtype
      }
    });

    payeeupdate.afterClosed().subscribe((data) => {
      if (data) {
        this.payeeall = false;
        this.payeevalidation('', '');
        this.syncUnselectedEncIds();
        this.mailForm.controls.mails = this.fb.array([]);

        const ids: { ids: string[]; is_signature: 0 | 1 } = {
          ids: [],
          is_signature: 1
        };

        this.checkdata.forEach((element: any) => {
          ids.ids.push(element.enc_id);
          this.ids.push(element.enc_id);
        });

        this.checkMail.getChequeDetails(ids).subscribe((dat) => {
          if (dat?.success) {
            this.emailChecksData = dat.data;

            this.pushmailRow(this.emailChecksData.datas);

            this.emailChecksData.datas.forEach((el: any) => {
              if (el.payee_country == 'Canada') {
                this.shippingvar = this.shipping?.filter(
                  (type: IShippingType) => type.country === el.payee_country
                );
                // Check for default mailing type instead of forcing null
                const shippingTypes = this.sortedoption(el.payee_country);
                const defaultType = this.getSelectedShippingType(shippingTypes);
                this.selctedShippingType[el.enc_id] = defaultType;
                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[el.enc_id]) {
                  this.costCalculation[el.enc_id].mail_type = defaultType;
                }
                this.country = 'Canada';
              } else if (el.payee_country === 'United States') {
                this.shippingvar = this.shipping?.filter(
                  (type: IShippingType) => type.country === 'United states'
                );
                // Check for default mailing type instead of forcing null
                const shippingTypes = this.sortedoption(el.payee_country);
                const defaultType = this.getSelectedShippingType(shippingTypes);
                this.selctedShippingType[el.enc_id] = defaultType;
                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[el.enc_id]) {
                  this.costCalculation[el.enc_id].mail_type = defaultType;
                }
              } else {
                this.shippingvar = this.shipping?.filter(
                  (type: IShippingType) => type.country === 'International'
                );
                // Check for default mailing type instead of forcing null
                const shippingTypes = this.sortedoption('International');
                const defaultType = this.getSelectedShippingType(shippingTypes);
                this.selctedShippingType[el.enc_id] = defaultType;
                // Only set mail_type in costCalculation if a default type is found
                if (defaultType !== null && this.costCalculation[el.enc_id]) {
                  this.costCalculation[el.enc_id].mail_type = defaultType;
                }
              }
            });
          }
        });
      }
    });
  }

  updateAllBankAddressModal() {
    const lastTransitionDialodg = this.dialog.open(UpdateBankModalComponent, {
      maxWidth: '1100px',
      width: '100%',
      data: {
        checkNo: this.BcheckNo,
        id: this.Bids,
        type: 'multi-update',
        invalidbank: this.invalidbank
      }
    });
    lastTransitionDialodg.afterClosed().subscribe((data) => {
      if (data) {
        this.bankall = false;
        this.hasDemoAccountError = false; // Reset demo account error flag
        this.bankvalidation();
      }
    });
  }

  //* ******************************** Add Mail Address Modal open ********************************/

  openAddMailAddressModal(event: string) {
    if (event == 'mail-to' || event == 'mail-from') {
      const addMailAddress = this.dialog.open(AddMailAddressModalComponent, {
        maxWidth: '700px',
        width: '98%',
        autoFocus: false,
        disableClose: true,
        data: {
          dataKey: event,
          isForUpdate: this.isForUpdate(event),
          id: event == 'mail-to' ? this.mailToId : this.mailFromId
        }
      });

      addMailAddress.afterClosed().subscribe((data) => {
        if (data && data != 'delete' && data.mode != 'update') {
          if (data.type == 'mail-from') {
            this.isRefreshed = this.loadShippingAddressFrom(true);
            this.currentMailFrom = data.id;
          } else {
            this.loadShippingAddressTo(data.id,data?.data?.name,data?.data?.country);
            this.currentMailTo = data.id;
          }

          setTimeout(() => {
            if (
              this.isRefreshed &&
              data.type == 'mail-from' &&
              data.mode != 'update'
            ) {
              this.mailFromId = data.id;
              this.currentMailFrom = data.id;
              this.isMailFromEditable = true;
              this.onMailFromChange(data.id, 'mail-from');
            }
          }, 2000);
        }

        if (data && data.mode == 'update') {
          if (data.type == 'mail-from') {
            this.isRefreshed = this.loadShippingAddressFrom(true);
          } else {
            this.loadShippingAddressTo();
          }

          setTimeout(() => {
            if (this.isRefreshed == true && data.type == 'mail-from') {
              const optionsList =
                document.querySelectorAll('#mail-from option');
              optionsList.forEach((element: any) => {
                if (element.innerText == data.data.name) {
                  this.mailFromId = data.id;
                  element.selected = true;
                  this.currentMailFrom = data.id;
                  this.isMailFromEditable = true;
                } else {
                  this.isMailFromEditable = true;
                }
              });
            } else if (data.type == 'mail-to') {
              const optionsList = document.querySelectorAll('#mail-to option');
              optionsList.forEach((element: any) => {
                if (element.innerText == data.data.name) {
                  this.mailToId = data.id;
                  element.selected = true;
                  this.isMailToEditable = true;

                  if (data.data.country === 'Canada') {
                    this.shippingvar = this.shipping?.filter(
                      (type: IShippingType) => type.id === 16
                    );
                    this.country = 'Canada';
                    this.costCalculation.custom_address_shipping_type =
                      this.shippingvar[0].id;
                    this.calculateShippingCost(this.costCalculation);
                  } else if (data.data.country === 'United States') {
                    this.shippingvar = this.shipping?.filter(
                      (typed: IShippingType) =>
                        typed.id === 4 || typed.id === 5 || typed.id === 12
                    );

                    this.costCalculation.custom_address_shipping_type =
                      this.shippingvar[0].id;
                    this.calculateShippingCost(this.costCalculation);
                  } else {
                    this.shippingvar = this.shipping?.filter(
                      (typed: IShippingType) =>
                        typed.country === 'International' && typed.id === 18
                    );

                    this.costCalculation.custom_address_shipping_type =
                      this.shippingvar[0].id;
                    this.calculateShippingCost(this.costCalculation);
                  }
                } else {
                  this.isMailToEditable = true;
                }
              });
            }
          }, 1800);
        }

        if (data.type == 'delete' && data.mode == 'mail-from') {
          // Clear the dropdown selection using the component's clearSelection method
          if (this.mailFromDropdown) {
            this.mailFromDropdown.clearSelection();
          }
          // Clear the ngModel values for the common dropdown
          this.currentMailFrom = '';
          this.mailFromId = '';
          this.isMailFromEditable = false;
          this.loadShippingAddressFrom(true);
        }

        if (data.type == 'delete' && data.mode == 'mail-To') {
          // Clear the dropdown selection using the component's clearSelection method
          if (this.mailToDropdown) {
            this.mailToDropdown.clearSelection();
          }
          // Clear the ngModel values for the common dropdown
          this.currentMailTo = '';
          this.mailToId = '';
          this.isMailToEditable = false;
          this.costCalculation.shipping_to = undefined as any;
          this.costCalculation.sent_to_customer_address = 0 as any;
          this.loadShippingAddressTo();
        }
      });
    }
  }

  isForUpdate(mailAddressTracker: any) {
    if (mailAddressTracker == 'mail-from') {
      if (this.isMailFromEditable === true) {
        return true;
      }
    }
    if (mailAddressTracker == 'mail-to') {
      if (this.isMailToEditable === true) {
        return true;
      }
    }
    return false;
  }

  //* ******************************** Phone Validation ********************************/

  phoneNumIsValid(val: boolean, index: number) {
    if (!val) return true;
    const control = (this.fmails.controls[index] as UntypedFormGroup).controls
      .payee_phone;
    // Same rule as before — invalid if the control reports an error or is empty.
    // Rewritten only to stop `null.length` throwing on a payee with no phone.
    return !control.errors && control.value != null && control.value !== '';
  }

  smscheck(event: any, i: number) {
    if (!this.phoneNumIsValid(event.target.checked, i)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      event.target.checked = false;
      // return;
    }
  }

  //* ******************************** Email Validation ********************************/

  emailIsValid(val: boolean, index: number) {
    if (
      val &&
      ((this.fmails.controls[index] as UntypedFormGroup).controls.payee_email
        .errors ||
        this.fmails.controls[index].value.payee_email == null ||
        this.fmails.controls[index].value.payee_email == '')
    ) {
      return false;
    }

    return true;
  }

  emailcheck(event: any, i: number, id: string) {
    if (!this.emailIsValid(event.target.checked, i)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid email'
      });
      event.target.checked = false;
      return;
    }

    if (event.target.checked) {
      if (this.indexofmail !== this.mailForm.value.mails.length) {
        this.indexofmail += 1;
        this.costCalculation[id].informed_payee_email = 1;
      }
      if (this.indexofmail == this.mailForm.value.mails.length) {
        const Allsms = document.getElementById(`email`) as HTMLInputElement;
        Allsms.checked = true;
      }
    } else {
      this.indexofmail -= 1;
      const Allsms = document.getElementById(`email`) as HTMLInputElement;
      Allsms.checked = false;
      this.costCalculation[id].informed_payee_email = 0;
    }
  }

  /** ***************************************** Checkbox sms All ***************************** */

  checkAllSms(event: any) {
    const phones = this.fmails.value;

    let Isphone: any;
    this.fmails.controls.forEach((_e, index) => {
      if (!this.phoneNumIsValid(event, index) && event.target.checked) {
        this.alertService.warningAlert({
          content: `Please enter  valid phone number on row ${index + 1}`
        });
        this.querySelector('#sms').checked = false;
        const var1 = document.getElementById(
          `sms_${index}`
        ) as HTMLInputElement;
        var1.checked = false;
      } else {
        this.indexofsms = this.mailForm.value.mails.length;
      }
    });

    phones.forEach((ele: any, i: number) => {
      if (
        (ele.payee_phone == '' || ele.payee_phone == null) &&
        event.target.checked
      ) {
        Isphone = false;
        this.alertService.warningAlert({
          content: 'Please enter a valid phone number'
        });
        this.querySelector('#sms').checked = false;
        const var1 = document.getElementById(`sms_${i}`) as HTMLInputElement;
        var1.checked = false;
      } else if (ele.payee_phone != null && event.target.checked) {
        Isphone = true;
        const var1 = document.getElementById(`sms_${i}`) as HTMLInputElement;
        var1.checked = true;
      } else {
        Isphone = true;
        const var1 = document.getElementById(`sms_${i}`) as HTMLInputElement;
        var1.checked = false;
        this.indexofsms = 0;
      }
    });

    if (Isphone) {
      this.checkdata.map(() => {
        // let validationerr = (this.fmails.controls[index] as FormGroup).controls
        //   .payee_phone.errors;

        // const phone = this.querySelector(`#phone_${index}`);
        // const eror_msg = this.querySelector(`#phone_err_msg${index}`);

        if (event.target.checked) {
          this.ids.forEach((ele: any) => {
            this.datas.caldata[ele].informed_payee_sms = 10;
            this.datas.caldata[ele].payee_phone = this.fmails.value.payee_phone;
          });
        } else {
          this.ids.forEach((ele: any) => {
            this.datas.caldata[ele].informed_payee_sms = 0;
          });
        }
      });
      this.calculateShippingCost(this.datas.caldata);
    }
  }

  /** ***************************************** Checkbox email All ***************************** */

  checkAllEmail(event: any) {
    const target = event.target as HTMLInputElement;

    // Get rows with invalid/empty emails
    const invalidRows = this.getInvalidEmailRows();

    // If there are invalid rows, show dialog with 2 options
    if (invalidRows.length > 0) {
      const dialogRef = this.alertService.confirmAlert({
        content: this.formatInvalidRowsMessage(invalidRows),
        doneMsg: 'Continue',
        cancelMsg: 'Unselect All',
        isOk: true,
        isCancel: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          // User clicked "Ok" - close silently, no action needed
          target.checked = false;
        } else if (result === false) {
          // User clicked "Unselect All" - unselect ALL email checkboxes
          target.checked = false;
          this.unselectAllEmails();
        }
      });

      return;
    }

    // If all emails are valid, proceed with normal select/unselect logic
    this.indexofmail = this.mailForm.value.mails.length;

    this.checkdata.map((data: any, i: number) => {
      const validationerr = (this.fmails.controls[i] as UntypedFormGroup)
        .controls.payee_email.errors;

      if (target.checked && validationerr == null) {
        const smsBox = this.querySelector(`#email_checkBox_${i}`);
        smsBox.checked = true;
        target.checked = true;
        this.costCalculation[data.enc_id].informed_payee_email = 1;
      }
      if (!target.checked && validationerr == null) {
        const smsBox = this.querySelector(`#email_checkBox_${i}`);
        smsBox.checked = false;
        this.indexofmail = 0;
        this.costCalculation[data.enc_id].informed_payee_email = 0;
      }
    });
  }

  /**
   * Gets the row indices (1-indexed) with invalid or empty email addresses
   */
  private getInvalidEmailRows(): number[] {
    const invalidRows: number[] = [];
    for (let i = 0, len = this.fmails.controls.length; i < len; i += 1) {
      const validationerr = (this.fmails.controls[i] as UntypedFormGroup)
        .controls.payee_email.errors;

      if (
        this.fmails.controls[i].value.payee_email === '' ||
        this.fmails.controls[i].value.payee_email === null ||
        validationerr?.invalidEmailAddress
      ) {
        invalidRows.push(i + 1);
      }
    }
    return invalidRows;
  }

  /**
   * Converts a number to its ordinal form (1st, 2nd, 3rd, etc.)
   */
  private getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /**
   * Formats row numbers into a readable message with proper grammar
   */
  private formatInvalidRowsMessage(rows: number[]): string {
    const ordinalRows = rows.map(r => this.getOrdinal(r));

    if (rows.length === 1) {
      return `An invalid or missing email address was found in the ${ordinalRows[0]} row. Please update it to continue or unselect all to proceed without email notifications.`;
    } 
      const lastRow = ordinalRows.pop();
      return `The ${ordinalRows.join(', ')} and ${lastRow} rows contain empty or invalid email addresses. Please enter valid email addresses to continue or unselect all to proceed without email notifications.`;
  }

  /**
   * Unselects all email checkboxes regardless of email validity
   */
  private unselectAllEmails(): void {
    this.checkdata.forEach((data: any, i: number) => {
      const emailCheckbox = this.querySelector(`#email_checkBox_${i}`);
      if (emailCheckbox) {
        emailCheckbox.checked = false;
      }
      this.costCalculation[data.enc_id].informed_payee_email = 0;
    });
    this.indexofmail = 0;
  }

  /** ***************************************** Shipping to custom Address ***************************** */

  onShippingAddressChange(event: any) {
    const toCustomAddressOptionsDiv = this.querySelector(
      '.custom-shipping-option'
    );
    if (
      event.target.checked === true &&
      event.target.id === 'to-custom-address'
    ) {   
      this.customAddress = false;
      this.shipdisabled = true;
      if (this.checkdata.length > 1) {
        this.bottomSection = false;
      } else {
        this.recurring = false;
        this.scheduleIt = false;
        const var1 = document.getElementById('mail-now') as HTMLInputElement;
        var1.checked = true;
      }

      if(toCustomAddressOptionsDiv){
      toCustomAddressOptionsDiv.style.opacity = '1';
      toCustomAddressOptionsDiv.style.pointerEvents = 'auto';
      }
      this.costCalculation.sent_to_customer_address = 0;
      this.costCalculation.custom_address_shipping_type = 0;
      this.updateShippingCalculations();
      
      if(this.isAllPayeeSame){
        this.showPayeeData();
      }
      
    } else {
      this.customAddress = true;
      this.shipdisabled = false;
      this.customShippingType = undefined;
      this.costCalculation.custom_address_shipping_type = undefined;
      if (this.isEnvelopeChecked) {
        this.isEnvelopeChecked = false;
        this.costCalculation.individual_envelope = 0;
      }
      if (this.checkdata.length > 1) {
        this.bottomSection = false;
      } else {
        this.bottomSection = true;
      }
      if(toCustomAddressOptionsDiv){
      toCustomAddressOptionsDiv.style.opacity = '0.5';
      toCustomAddressOptionsDiv.style.pointerEvents = 'none';
      }
      this.costCalculation.sent_to_customer_address = 0;
      this.costCalculation.custom_address_shipping_type = 0;
      this.calculateShippingCost( this.datas.caldata);
    }
  }

  updateShippingCalculations() {
    this.emailChecksData.datas.forEach((item: MailRow) => {
      this.shippingCalculation.single_items[item.enc_id] = 0.0;
    });
    this.subtotal = 0.0;
    this.total = 0.0;
  }

  /** ***************************************** Shipping cost Calculation Custom Shipping TYpe ***************************** */

  customShipingTypeChange(event: any) {
    this.currentShippingType = event;
    this.costCalculation.custom_address_shipping_type = event;
    this.costCalculation.sent_to_customer_address = 1;
    this.customShippingType = Number(event);
    this.calculateShippingCost(this.costCalculation);
  }

  mailTypeChange(type: string) {
    if (type === 'recurring') {
      this.recurring = true;
      this.scheduleIt = false;
      this.mailForm.value.scheduleDate = '';
      this.costCalculation.schedule_date = this.mindate;

      if (this.scheduleIt) {
        this.scheduleIt = false;
      }
    } else if (type === 'schedule-it') {
      this.scheduleIt = true;
      this.recurring = false;
    } else {
      this.recurring = false;
      this.scheduleIt = false;
    }
  }

  Recurring(event: any) {
    const specdate = document.getElementById(
      'specific_date_value'
    ) as HTMLInputElement;
    const transaction = document.getElementById(
      'transaction_count'
    ) as HTMLInputElement;

    if (event.target.value === 'transaction') {
      transaction.disabled = false;
      specdate.disabled = true;
      this.mailForm.value.until = null;
      this.mailForm.get('end_select')?.setValue(1);
    } else if (event.target.value === 'Specific-date') {
      this.mailForm.controls.count.patchValue('');
      this.mailForm.value.count = 0;
      specdate.disabled = false;
      transaction.disabled = true;
      this.mailForm.get('end_select')?.setValue(2);
    } else if (event.target.value === 'until') {
      specdate.disabled = true;
      transaction.disabled = true;
      this.mailForm.get('end_select')?.setValue(3);
      this.mailForm.value.count = '';
    }
  }

  goToRefillCredit() {
    this.dialogRef.close();
    this.router.navigateByUrl('/manage/refill-credit/show-refillform');
  }

  loadShippingAddressFrom(val: any): any {
    this.subscriptions.push(
      this.checkMail.getAddressFrom().subscribe((res: any) => {
        this.shippingAddressFrom = res.data;
      })
    );
    if (val) {
      return val;
    }
    return false;
  }

  loadShippingAddressTo(toId?:string,mailToName?:string,mailToCountry?:string) {
    this.subscriptions.push(
      this.checkMail.getAddressTo().subscribe((res: any) => {
        this.shippingAddressTo = res.data;
        if(toId){
          this.currentMailTo = toId;
          this.setCurrentMailTo(
            {result:true,data:{name:mailToName ?? this.payeeData.addressLine1,country:mailToCountry ?? this.payeeData.country} as ICheckCustomAddress,id:toId,type:'mail-to'}
          );
        }
      })
    );
  }

  // ===== THIS WILL STRIP THE DATA INTO  A DATA WITH LENGTH 15 AND APPEND A TAIL (...)
  getStripedOptions(options: any) {
    const strippedOptions: any[] = [];
    const tail = '...';
    options.map((option: any) => {
      if (option.name.length > 15) {
        option.name = option.name.slice(0, 15) + tail;
        strippedOptions.push(option);
      } else {
        strippedOptions.push(option);
      }
    });
    return strippedOptions;
  }

  querySelector(element: string) {
    return document.querySelector(element) as HTMLInputElement;
  }

  // emailValidator(elId: string, errId: string): any {

  //   this.mailChecks.map((_data, index) => {
  //     const element = this.querySelector(`#${elId + index}`);
  //     const eror_msg = this.querySelector(`#${errId + index}`);

  //     let value = element?.value;
  //     if (!value.match(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/)) {
  //       eror_msg.innerText = `Enter valid Email Address`;
  //     }
  //   });
  // }

  /**
   * @description Checks the validity of the phone number based on user input.
   * `subjectKeyUp` emit the a value when selected shipping type is fedEx.
   * So this function call when selected shpping type is FedEx.
   *
   */
  checkPhoneNumber() {
    this.subscriptions.push(
      this.subjectKeyUp.pipe(debounceTime(500)).subscribe(() => {
        if (
          !this.phoneNumIsValid(this.phoneNumber, this.selectedIndex) ||
          this.fmails.controls[this.selectedIndex].value.payee_phone === null ||
          this.fmails.controls[this.selectedIndex].value.payee_phone === ''
        ) {
          this.isPhoneNumberRequired[this.selectedIndex] = true;
        } else {
          this.isPhoneNumberRequired[this.selectedIndex] = false;
        }
      })
    );
  }

  onValidateError(event: Event, i: number, type: string, id: string) {
    this.phoneNumber = !!(event.target as HTMLInputElement).value;
    this.selectedIndex = i;
    const var1 = document.getElementById(`sms_${i}`) as HTMLInputElement;
    const Allsms = document.getElementById(`sms`) as HTMLInputElement;
    if (type === 'phone' && this.selectedShippingType === 2) {
      this.subjectKeyUp.next((event.target as HTMLInputElement).value);
    }
    if (type == 'phone') {
      this.datas.caldata[id] = this.getEmailPhone(
        id,
        (event.target as HTMLInputElement).value,
        'phone'
      );
    } else {
      this.datas.caldata[id] = this.getEmailPhone(
        id,
        (event.target as HTMLInputElement).value,
        'email'
      );
    }

    if (type == 'phone' && var1.checked) {
      if (
        !this.phoneNumIsValid(!!(event.target as HTMLInputElement).value, i) ||
        ((event.target as HTMLInputElement).value.length == 0 &&
          type == 'phone')
      ) {
        var1.checked = false;
        Allsms.checked = false;
        this.datas.caldata[id] = this.getSmsObject(id, false);
        this.calculateShippingCost(this.datas.caldata);
      }
    } else if (
      !this.emailIsValid(!!(event.target as HTMLInputElement).value, i) ||
      ((event.target as HTMLInputElement).value.length == 0 && type == 'email')
    ) {
      const var2 = document.getElementById(
        `email_checkBox_${i}`
      ) as HTMLInputElement;
      var2.checked = false;
      const Allemail = document.getElementById('email') as HTMLInputElement;
      Allemail.checked = false;
    }
  }

  onMailToChange(event: any, type: string) {
    const value = type === 'mail-to' ? event : event?.target?.value;
    this.mailToId = value;

    // Hide edit when cleared and avoid API calls for empty/null/0
    const hasValidValue = value !== '' && value !== 0 && value !== null && value !== undefined;
    this.isMailToEditable = hasValidValue;  

    if (!hasValidValue) {
      this.costCalculation.shipping_to = undefined as any;
      this.costCalculation.sent_to_customer_address = 0 as any;
      return;
    }

    this.checkMail
      .getToSingleId(this.mailToId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.country = res.data.country;
        this.costCalculation.shipping_to = res.data.id;
        this.costCalculation.sent_to_customer_address = 1;
        if (res.data.country == 'Canada') {
          this.shippingvar = this.shipping?.filter(
            (types: IShippingType) =>
              types.country === res.data.country && types.id === 16
          );
          this.costCalculation.custom_address_shipping_type = this.shippingvar[0].id;
          this.customShippingType = Number(this.shippingvar[0].id);
          this.calculateShippingCost(this.costCalculation);
        } else if (res.data.country == 'United States') {
          this.shippingvar = this.shipping?.filter(
            (typed: IShippingType) => typed.id === 4 || typed.id === 5 || typed.id === 12
          );
          this.costCalculation.custom_address_shipping_type = this.shippingvar[0].id;
          this.customShippingType = Number(this.shippingvar[0].id);
          this.calculateShippingCost(this.costCalculation);
        } else {
          this.shippingvar = this.shipping?.filter(
            (typed: IShippingType) => typed.country === 'International' && typed.id === 18
          );
          this.costCalculation.custom_address_shipping_type = this.shippingvar[0].id;
          this.customShippingType = Number(this.shippingvar[0].id);
          this.calculateShippingCost(this.costCalculation);
        }

        this.costCalculation.custom_address_shipping_type = this.shippingvar[0].id;
        this.checkMail
          .ShippingCostCalculationGroup(
            this.buildSelectedPayload(this.costCalculation)
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe((rese) => {
            if (rese.success) {
              this.shippingCalculation = rese.data;
              this.subtotal = this.shippingCalculation?.subtotal;
              this.total = this.shippingCalculation?.total;
              this.shippingFee = this.shippingCalculation?.group_shipping_fee;
            }
          });
      });
  }

  onMailFromChange(event: any, type: string) {
    const value = type === 'mail-from' ? event : event?.target?.value;
    this.mailFromId = value;

    // Hide edit when cleared and avoid API calls for empty/null/0
    const hasValidValue = value !== '' && value !== 0 && value !== null && value !== undefined;
    this.isMailFromEditable = hasValidValue;

    if (!hasValidValue) {
      this.costCalculation.shipping_from = undefined as any;
      return;
    }

    this.subscriptions.push(
      this.checkMail.getFromSingleId(this.mailFromId).subscribe((res: any) => {
        this.costCalculation.shipping_from = res.data.id;
      })
    );
  }

  navigateByUrl(url: string) {
    this.router.navigateByUrl(url);
  }

  getEmailPhone(id: string, value: string, type: string) {
    const data = this.costCalculation[id];

    let email = '';
    let phone = '';
    this.fmails.value.forEach((e: any) => {
      if (e.enc_id == id) {
        phone = e.payee_phone;
        email = e.payee_email;
      }
    });
    if (type == 'phone') {
      return {
        check_paper: data.check_paper,
        file_hidden: this.attachments[id],
        informed_payee_email: data.informed_payee_email,
        informed_payee_sms: data.informed_payee_sms,
        mail_type: data.mail_type,
        payee_email: email,
        payee_phone: phone
      };
    }
    return {
      check_paper: data?.check_paper,
      file_hidden: this.attachments[id],
      informed_payee_email: data?.informed_payee_email,
      informed_payee_sms: data?.informed_payee_sms,
      mail_type: data?.mail_type,
      payee_email: value,
      payee_phone: phone
    };
  }

  /**
   * @description Refreshes the data tables.
   */
  refreshTables() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.dataTableService.setRefreshStatus(true);
  }

  //* *********************************** Mail Now ****************************************** */

  MailNow(type: string) {
    if (!this.hasSelectedRows) {
      this.alertService.warningAlert({
        content: 'Please select at least one check to mail.'
      });
      return;
    }

    const selectedIds = this.getSelectedEncIds();

    this.isFedex = this.fmails.controls.some(
      (control, index) =>
        control.value.isSelectedForPayment &&
        this.isPhoneNumberRequired[index] === true
    );
    if (this.isFedex) {
      return;
    }

    const selectedChecksWithAttachments = this.checksWithAttachments.filter(
      (item) => selectedIds.includes(item.encId)
    );

    if (this.isAttachmentsAvailable && selectedChecksWithAttachments.length) {
      const checkNumbers = selectedChecksWithAttachments
        .map((item) => item.chequeNo)
        .join(',');
      const data = {
        content: `Check No.${checkNumbers} has attachment. Do you want to proceed without attaching the document?`,
        doneMsg: 'Yes',
        cancelMsg: 'Cancel',
        isOk: true,
        isCancel: true
      };
      const confirm = this.alertService.confirmAlert(data);

      confirm.afterClosed().subscribe((result) => {
        if (result) {
          this.isProceedMailing = true;
          this.isAttachmentsAvailable = false;
          this.MailNow(type);
        }
      });
      return;
    }

    if (this.customAddress) {
      const invalidMailTypes = selectedIds.filter(
        (check_id: string) =>
          this.datas.caldata[check_id]?.mail_type === null || 
          this.datas.caldata[check_id]?.mail_type === 0 ||
          this.selctedShippingType[check_id] === null ||
          this.selctedShippingType[check_id] === undefined
      );

      if (invalidMailTypes.length > 0) {
        this.invalidMailTypeChecks = invalidMailTypes;
        return;
      }
    }

    const invalidAddressChecks = [];
    this.fmails.value
      .filter(
        (element: { isSelectedForPayment: boolean }) =>
          element.isSelectedForPayment
      )
      .forEach((element: { country: string | null }) => {
        if (element.country === null || element.country === '') {
          invalidAddressChecks.push(element);
        }
      });

    if (invalidAddressChecks.length > 0 && this.customAddress) {
      this.alertService.warningAlert({
        content: 'Please select a valid shipping address .'
      });
      this.isProceedMailing = false;
      return;
    }

    if (!this.customShippingType && !this.customAddress) {
      this.alertService.warningAlert({
        content: 'Please select a valid shipping Type.'
      });
      this.isProceedMailing = false;
      return;
    }

    this.checkNumberArray = [];
    this.checkIfId = [];
    if (this.shipdisabled === false) {
      this.mailForm?.value?.mails
        ?.filter((el: IMailCheck) => el.isSelectedForPayment)
        .forEach((el: IMailCheck) => {
          this.checkIfId.push({
            id: el.enc_id,
            check_No: el.cheque_serial_number
          });
        });

      const array10 = [];
      for (const value of this.encyptedIds) {
        const match = this.checkIfId.find((ele) => ele.id === value);
        if (match) {
          array10.push(match);
        }
      }
      array10.forEach((el) => {
        if (this.checkNumberArray.indexOf(el?.check_No) === -1) {
          this.checkNumberArray.push(el?.check_No);
        }
      });
    }

    if (this.costCalculation.sent_to_customer_address === Number('0')) {
      this.bankvalidation();
      // If demo account error was detected, stop processing
      if (this.hasDemoAccountError) {
        return;
      }
    }
    // checkprocess

    // Only the checks that are ticked may block the send. `bankall` / `payeeall`
    // are bulk-edit affordance flags from the backend (enabele_all_bank_edit /
    // enable_all_payee_edit), not per-check verdicts, so they must not gate
    // submission. `=== false` keeps a check that was never validated from blocking.
    const hasInvalidSelectedBank = selectedIds.some(
      (id) => this.selectedCheksBankInfo?.[id]?.success === false
    );
    const hasInvalidSelectedPayee = selectedIds.some(
      (id) => this.selectedChecksPayeeInfo?.[id]?.success === false
    );

    if (
      hasInvalidSelectedBank &&
      this.costCalculation.sent_to_customer_address === Number('0')
    ) {
      this.alertService.warningAlert({ content: 'Bank Address is invalid' });
      this.isProceedMailing = false;
      return;
    }
    // Shipping to a custom address mails every check to the single Mail To
    // address, so a check's own payee address cannot block the send.
    // (customAddress === true means "ship to payee address")
    if (
      hasInvalidSelectedPayee &&
      this.customAddress &&
      this.checkNumberArray.length === 0
    ) {
      this.alertService.warningAlert({
        content: 'Payee Address is invalid'
      });
      this.isProceedMailing = false;
      return;
    }
    if (this.checkNumberArray.length > 0) {
      this.alertService.warningAlert({
        content: `Mail is not deliverable to the selected address on check#  ${this.checkNumberArray.join(
          ', '
        )}`
      });
    } else if (this.datas.type === 'Checkprocess') {
      const data = {
        title: 'Oops',
        content: 'please select a valid date',
        doneMsg: 'OK'
      };

      this.mailForm.markAllAsTouched();
      if (
        new Date(this.mailForm.value.scheduleDate) < new Date() &&
        type === 'schedule'
      ) {
        this.alertService.warningAlert(data);
      } else if (
        new Date(this.mailForm.value.start_date) < new Date() &&
        type === 'recurring'
      ) {
        this.alertService.warningAlert(data);
      } else if (
        new Date(this.mailForm.value.until) < new Date() &&
        type === 'recurring'
      ) {
        this.alertService.warningAlert(data);
      } else {
        const mailbody = this.createCreditMemobody();

        const maildata = {
          ...mailbody,
          ...this.buildSelectedPayload(this.costCalculation)
        };
        this.addBankAccountIdToMailData(maildata);

        if (!this.isProceedMailing) {
          const data = {
            content: this.mailConfirmMessage
          };

          const confirm = this.alertService.confirmAlert(data);

          confirm.afterClosed().subscribe((result) => {
            if (result) {
              this.proceedMail(maildata, type);
            }
          });
        } else {
          this.proceedMail(maildata, type);
        }
      }
    } else {
      const data = {
        title: 'Oops',
        content: 'please select a valid date',
        doneMsg: 'OK'
      };

      this.mailForm.markAllAsTouched();
      if (
        new Date(this.mailForm.value.scheduleDate) < new Date() &&
        type === 'schedule'
      ) {
        this.alertService.warningAlert(data);
      } else if (
        new Date(this.mailForm.value.start_date) < new Date() &&
        type === 'recurring'
      ) {
        this.alertService.warningAlert(data);
      } else if (
        new Date(this.mailForm.value.until) < new Date() &&
        type === 'recurring'
      ) {
        this.alertService.warningAlert(data);
      } else if (
        (this.mailForm.value.count <= 0 || this.mailForm.value.count === '') &&
        type === 'recurring' &&
        this.mailForm.value.end_select === 1
      ) {
        const data = {
          title: 'Oops',
          content: 'please select a valid count',
          doneMsg: 'OK'
        };
        this.alertService.warningAlert(data);
      } else if (
        (this.mailForm.value.until == null ||
          this.mailForm.value.until === '') &&
        type === 'recurring' &&
        this.mailForm.value.end_select === 2
      ) {
        const data = {
          title: 'Oops',
          content: 'please select specific date',
          doneMsg: 'OK'
        };
        this.alertService.warningAlert(data);
      } else {
        const mailbody = this.createCreditMemobody();

        const maildata = {
          ...mailbody,
          ...this.buildSelectedPayload(this.costCalculation)
        };
        maildata.fedex_cutoff_time_warning = 0;
        this.addBankAccountIdToMailData(maildata);

        if (!this.isProceedMailing) {
          const data = {
            content: this.mailConfirmMessage
          };

          const confirm = this.alertService.confirmAlert(data);

          confirm.afterClosed().subscribe((result) => {
            if (result) {
              this.processCheckMailing(maildata, type);
            }
          });
        } else {
          this.processCheckMailing(maildata, type);
        }
      }
    }
    // }
  }

  proceedMail(maildata: unknown, type: string) {
    this.loading = true;
    this.disabled = true;
    this.mailForm.disable();
    this.checkMail.activeMailPayeeId = this.checkdata?.[0]?.enc_payee_id ?? null;
    this.subscriptions.push(
      this.checkMail
        .sendmail(maildata, type)
        .pipe(
          catchError((error) => {
            // Handle error 731 - No bank account
            if (error.error.errorCode === 731) {
              return this.handleError731(error);
            }
            
            if (error.error.errorCode === "plaid_virtual_account"){
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if(res){
                  const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  });
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                    this.proceedMail(maildata, type);
                    }
                  });
                }
              });
            }

            if(error.error.errorCode === 215) {
              this.alertService.warningAlert({
                content: error.error.errorMsg,
                doneMsg: 'OK'
              });
            }

            this.handleAttachmentPageLimitError(error);

            this.errorCode = error.error.errorCode;

            this.err_msg = error.error.errorMsg;
            return of(false);
          })
        )
        .subscribe((res) => {
          const reponse = res as IApiRes<string>;
          if (reponse.success) {
            this.refreshTables();
            if (type === '') {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Mail Sent successfully',
                close: true,
                timeout: 2000
              });
            }
            if (type === 'schedule') {
              this.alertService.successAlert({
                title: 'Success',
                content: 'check mail Scheduled successfully',
                close: true,
                timeout: 2000
              });
            }
            if (type === 'recurring') {
              this.alertService.successAlert({
                title: 'Success',
                content:
                  'Your mail has set for recurring, You can manage them on recurring list',
                close: true,
                timeout: 2000
              });
            }
            if (type === 'recurring' || type === 'schedule') {
              this.recurringRedirect.mark('mail', type === 'recurring');
            }
            this.checkMail.setCheckMailEvents({ isSuccess: true });
            this.dialogRef.close({
              success: true,
              processData: this.datas.processData,
              rowData: this.datas.rowData
            });
            if (this.datas.processData) {
              this.datas.processData.processable_data.mailChequeIds = [];
            } else {
              this.datas.processData = {
                processable_data: {
                  mailChequeIds: []
                }
              };
            }
          }

          if (!res) {
            this.loading = false;
            this.disabled = false;
            this.mailForm.enable();
          }

          if (!res && this.errorCode === 1) {
            const dialogRef = this.alertService.confirmAlert({
              content: this.err_msg
            });

            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.subscriptions.push(
                  this.checkMail.sendmail(result, type)
                  .pipe(
                    catchError((error) => {
                      // Handle error 731 - No bank account
                      if (error.error.errorCode === 731) {
                        return this.handleError731(error);
                      }
                      
                      if (error.error.errorCode === "plaid_virtual_account"){
                        const notification = this.alertService.infoAlert({
                          content: error.error.errorMsg,
                          doneMsg: 'Update',
                          isCancel: true
                        });
                        notification.afterClosed().subscribe((res) => {
                          if(res){
                            const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                              maxWidth: '1200px',
                              width: '100%',
                              disableClose: true,
                              data: error.error
                            });
                            confirmationDialog.afterClosed().subscribe((res) => {
                              if (res.success) {
                              this.proceedMail(maildata, type);
                              }
                            });
                          }
                        });
                      }

                      if(error.error.errorCode === 215) {
                        this.alertService.warningAlert({
                          content: error.error.errorMsg,
                          doneMsg: 'OK'
                        });
                      }

                      this.handleAttachmentPageLimitError(error);

                      return of(error)
                    })
                  )
                  .subscribe((res) => {
                    if (res.success === true) {
                      this.refreshTables();
                      this.scriptService.gtagEventScript('check-mailed');
                      if (type === '') {
                        this.alertService.successAlert({
                          title: 'Success',
                          content: 'Mail Sent successfully',
                          close: true,
                          timeout: 2000
                        });
                      }
                      if (type === 'schedule') {
                        this.alertService.successAlert({
                          title: 'Success',
                          content: 'check mail Scheduled successfully',
                          close: true,
                          timeout: 2000
                        });
                      }
                      if (type === 'recurring') {
                        this.alertService.successAlert({
                          title: 'Success',
                          content:
                            'Your mail has set for recurring, You can manage them on recurring list',
                          close: true,
                          timeout: 2000
                        });
                      }
                      this.checkMail.setCheckMailEvents({
                        isSuccess: false
                      });
                      
                      this.dialogRef.close();



                    }
                  })
                );
              }

              if (!result) {
                this.disabled = false;
                this.mailForm.enable();
              }
            });
          }
          if (!res && this.errorCode === 516) {
            this.commonOnInitService.contactAlert(
              'Please contact our customer support to enable international mail.'
            );
          }
        })
    );
  }

  /**
   * @description Adds bank_account_id to each check object when file_hidden is empty and isQbAutoSubAccountMapping is true
   * @param maildata - The mail payload object
   */
  addBankAccountIdToMailData(maildata: Record<string, any>) {
    if (!this.isQbAutoSubAccountMapping()) return;

    const mailCheckIds = maildata.mail_check_ids || [];
    mailCheckIds.forEach((checkId: string) => {
      const checkData = maildata[checkId];
      if (checkData && (!checkData.file_hidden || checkData.file_hidden.length === 0)) {
        const formItem = this.fmails.value.find((item: any) => item.enc_id === checkId);
        if (formItem?.enc_bank_account_id) {
          checkData.bank_account_id = formItem.enc_bank_account_id;
        }
      }
    });
  }

  processCheckMailing(maildata: Record<string, unknown>, type: string) {
    this.loading = true;
    this.disabled = true;
    this.mailForm.disable();
    this.checkMail.activeMailPayeeId = this.checkdata?.[0]?.enc_payee_id ?? null;
    this.subscriptions.push(
      this.checkMail
        .sendmail(maildata, type)
        .pipe(
          catchError((error) => {
            // Handle error 731 - No bank account
            if (error.error.errorCode === 731) {
              return this.handleError731(error);
            }
            
            if (error.error.errorCode === "plaid_virtual_account"){
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if(res){
                  const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  });
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                    this.processCheckMailing(maildata, type);
                    }
                  });
                }
              });
            }

            if(error.error.errorCode === 215) {
              this.alertService.warningAlert({
                content: error.error.errorMsg,
                doneMsg: 'OK'
              });
            }

            this.handleAttachmentPageLimitError(error);

            this.errorCode = error.error.errorCode;

            this.err_msg = error.error.errorMsg;

            return of(false);
          })
        )
        .subscribe((res) => {
          const reponse = res as IApiRes<string>;
          if (reponse.success) {
            if (this.checkdata.length === 1) {
              this.scriptService.gtagEventScript('check-mailed', {
                amount: this.checkAmount
              });
            } else {
              this.scriptService.gtagEventScript('check-mailed');
            }
            this.headerservice.setHeaderValueChanged(true);
            this.refreshTables();
            if (type === '') {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Mail Sent successfully',
                close: true,
                timeout: 2000
              });
            }
            if (type === 'schedule') {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Check mail Scheduled successfully',
                close: true,
                timeout: 2000
              });
            }
            if (type === 'recurring') {
              this.alertService.successAlert({
                title: 'Success',
                content:
                  'Your mail has set for recurring, You can manage them on recurring list',
                close: true,
                timeout: 2000
              });
            }
            
            this.dialogRef.close();
            if (type === 'recurring' || type === 'schedule') {
              this.recurringRedirect.mark('mail', type === 'recurring');
            }
            this.checkMail.setCheckMailEvents({ isSuccess: true });
            if (!this.datas.isDisableNavigation) {
              this.navigateByUrl('/manage/cheque');
            }
          }

          if (!res) {
            this.loading = false;
            this.disabled = false;
            this.mailForm.enable();
          }

          if (
            (!res && this.errorCode === 1) ||
            this.errorCode === 8 ||
            this.errorCode === 9
          ) {
            let dialogRef:
              | MatDialogRef<ConfirmAlertComponent>
              | MatDialogRef<FedexSaturdayConfirmationComponent>;
            if (this.errorCode === 9) {
              dialogRef = this.dialog.open(FedexSaturdayConfirmationComponent, {
                maxWidth: '550px',
                width: '98%',
                autoFocus: false,
                disableClose: true,
                data: {
                  message: this.err_msg
                }
              });
            } else {
              dialogRef = this.alertService.confirmAlert({
                content: this.err_msg
              });
            }
            dialogRef.afterClosed().subscribe((resul) => {
              if (resul) {
                this.loading = true;
                this.disabled = true;
                if (this.errorCode === 9) {
                  if (resul.process === 'Monday') {
                    maildata.fedex_cutoff_time_warning = 1;
                  } else {
                    maildata.fedex_cutoff_time_warning = 2;
                  }
                } else if (this.errorCode === 8) {
                  maildata.fedex_cutoff_time_warning = 1;
                } else {
                  maildata.shipping_rate_warning = 1;
                }
                this.subscriptions.push(
                  this.checkMail
                    .sendmail(maildata, type)
                    .pipe(
                      finalize(() => {
                        this.loading = false;
                      }),
                      catchError((error) => {
                        // Handle error 731 - No bank account
                        if (error.error.errorCode === 731) {
                          return this.handleError731(error);
                        }
                        
                        if (error.error.errorCode === "plaid_virtual_account"){
                          const notification = this.alertService.infoAlert({
                            content: error.error.errorMsg,
                            doneMsg: 'Update',
                            isCancel: true
                          });
                          notification.afterClosed().subscribe((res) => {
                            if(res){
                              const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                                maxWidth: '1200px',
                                width: '100%',
                                disableClose: true,
                                data: error.error
                              });
                              confirmationDialog.afterClosed().subscribe((res) => {
                                if (res.success) {
                                this.processCheckMailing(maildata, type);
                                }
                              });
                            }
                          });
                        }
                        if(error.error.errorCode === 215) {
                          this.alertService.warningAlert({
                            content: error.error.errorMsg,
                            doneMsg: 'OK'
                          });
                          return of(false);
                        }
                        if (this.handleAttachmentPageLimitError(error)) {
                          return of(false);
                        }
                        return of(error);
                      })
                    )
                    .subscribe({
                      next: (res) => {
                        if (res.success) {
                          this.refreshTables();
                          if (this.checkdata.length === 1) {
                            this.scriptService.gtagEventScript('check-mailed', {
                              amount: this.checkAmount
                            });
                          } else {
                            this.scriptService.gtagEventScript('check-mailed');
                          }
                          if (type === '') {
                            this.alertService.successAlert({
                              title: 'Success',
                              content: 'Mail Sent successfully',
                              close: true,
                              timeout: 2000
                            });
                          }
                          if (type === 'schedule') {
                            this.alertService.successAlert({
                              title: 'Success',
                              content: 'check mail Scheduled successfully',
                              close: true,
                              timeout: 2000
                            });
                          }
                          if (type === 'recurring') {
                            this.alertService.successAlert({
                              title: 'Success',
                              content:
                                'Your mail has set for recurring, You can manage them on recurring list',
                              close: true,
                              timeout: 2000
                            });
                          }

                          this.dialogRef.close();
                          this.checkMail.setCheckMailEvents({
                            isSuccess: true
                          });
                          if (!this.datas.isDisableNavigation) {
                            this.navigateByUrl('/manage/cheque');
                          }
                        }
                      },
                      error: (err: HttpErrorResponse) => {
                        this.errorCode = err.error?.errorCode;
                        this.err_msg = err.error?.errorMsg;
                        if (this.handleAttachmentPageLimitError(err)) {
                          return;
                        }
                        this.sendMailApi(maildata, type);
                      }
                    })
                );
              }

              if (!resul) {
                this.disabled = false;
                this.mailForm.enable();
              }
            });
          }

          if (!res && this.errorCode === 102) {
            this.alertService.warningAlert({
              content: this.err_msg
            });
          }
          if (!res && this.errorCode === 516) {
            this.commonOnInitService.contactAlert(
              'Please contact our customer support to enable international mail.'
            );
          }
        })
    );
  }

  /**
   * Making the checkmail api call and doing appropriate actions.
   * Note:- Only to be called from line 2313, Otherwise change conditions inside.
   * @param mailData - API payload.
   * @param type - type of check mail.
   */
  sendMailApi(mailData: Record<string, unknown>, type: string) {
    if (this.errorCode === 1) {
      mailData.shipping_rate_warning = mailData.fedex_cutoff_time_warning = 1;
      let alertMessage: string;

      if (type == '') {
        alertMessage = 'Mail Sent successfully';
      }
      if (type == 'schedule') {
        alertMessage = 'check mail Scheduled successfully';
      }
      if (type == 'recurring') {
        alertMessage =
          'Your mail has set for recurring, You can manage them on recurring list';
      }

      const dialogRef = this.alertService.confirmAlert({
        content: this.err_msg
      });

      dialogRef.afterClosed().subscribe((val) => {
        if (val) {
          this.subscriptions.push(
            this.checkMail.sendmail(mailData, type)
            .pipe(
              catchError((error) => {
                // Handle error 731 - No bank account
                if (error.error.errorCode === 731) {
                  return this.handleError731(error);
                }

                if(error.error.errorCode === 215) {
                  this.alertService.warningAlert({
                    content: error.error.errorMsg,
                    doneMsg: 'OK'
                  });
                }

                this.handleAttachmentPageLimitError(error);

                if (error.error.errorCode === "plaid_virtual_account"){
                  const notification = this.alertService.infoAlert({
                    content: error.error.errorMsg,
                    doneMsg: 'Update',
                    isCancel: true
                  });
                  notification.afterClosed().subscribe((res) => {
                    if(res){
                      const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                        maxWidth: '1200px',
                        width: '100%',
                        disableClose: true,
                        data: error.error
                      });
                      confirmationDialog.afterClosed().subscribe((res) => {
                        if (res.success) {
                        this.sendMailApi(mailData, type);
                        }
                      });
                    }
                  });
                }
                return of(error)
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.refreshTables();

                if (this.checkdata.length == 1) {
                  this.scriptService.gtagEventScript('check-mailed', {
                    amount: this.checkAmount
                  });
                } else {
                  this.scriptService.gtagEventScript('check-mailed');
                }

                this.alertService.successAlert({
                  title: 'Success',
                  content: alertMessage,
                  close: true,
                  timeout: 2000
                });

                this.dialogRef.close();
                if (type === 'recurring' || type === 'schedule') {
                  this.recurringRedirect.mark('mail', type === 'recurring');
                }
                this.checkMail.setCheckMailEvents({ isSuccess: true });

                if (!this.datas.isDisableNavigation) {
                  this.navigateByUrl('/manage/cheque');
                }
              }
            })
          );
        }
      });
    }
  }

  onChangeEnvelope(event: Event) {
    if ((event.target as HTMLInputElement).checked) {
      this.costCalculation.individual_envelope = 1;
      this.isEnvelopeChecked = true;
    } else {
      this.costCalculation.individual_envelope = 0;
      this.isEnvelopeChecked = false;
    }
    this.calculateShippingCost(this.costCalculation);
  }

  calculateShippingCost(
    payload: IMailShippingCalculations,
    needLoader = false
  ) {
    // Only price the checks whose row checkbox is ticked
    payload = this.buildSelectedPayload(payload);

    // Only calculate costs if there are valid shipping selections
    const hasValidSelections = this.hasValidShippingSelections(payload);
    
    if (!hasValidSelections) {
      // Reset costs when no valid selections
      this.subtotal = 0;
      this.total = 0;
      this.shippingFee = 0;
      this.shippingCalculation = null;
      return;
    }

    this.subscriptions.push(
      this.checkMail
        .ShippingCostCalculationGroup(payload)
        .pipe(
          finalize(() => {
            if (needLoader) {
              this.isChangeMailType.set(false);
            }
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.shippingCalculation = res.data;
            this.subtotal = this.shippingCalculation?.subtotal;
            this.total = this.shippingCalculation?.total;
            this.shippingFee = this.shippingCalculation?.group_shipping_fee;
          }
        })
    );
  }

  private hasValidShippingSelections(payload: IMailShippingCalculations): boolean {
    // Check if there are any valid shipping type selections
    const mailCheckIds = payload.mail_check_ids || [];
    
    for (const checkId of mailCheckIds) {
      const checkData = payload[checkId];
      if (checkData && checkData.mail_type && checkData.mail_type !== null && checkData.mail_type !== 0) {
        return true;
      }
    }
    
    // Check custom address shipping type
    if (payload.custom_address_shipping_type && payload.custom_address_shipping_type !== 0) {
      return true;
    }
    
    return false;
  }

  close() {
    this.dialogRef.close();
    this.checkMail.setCheckMailEvents({ isSuccess: false });
    if (!this.datas.isDisableNavigation) {
      this.navigateByUrl('/manage/cheque');
    }
  }

  mailcredit() {
    this.subscriptions.push(
      this.refillCredit.getCurrentCredit().subscribe((res: any) => {
        this.currentCredit = res.data.credit;
      })
    );
  }

  skip() {
    if (this.datas.processData) {
      this.datas.processData.processable_data.mailChequeIds = [];
    } else {
      this.datas.processData = {
        processable_data: {
          mailChequeIds: []
        }
      };
    }
    this.dialogRef.close({
      success: true,
      processData: this.datas.processData,
      rowData: this.datas.rowData,
      isDisableNavigation: this.datas.isDisableNavigation
    });
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  goToSetting() {
    const dialog = this.dialog.open(CheckMailSettingsModalComponent, {
      maxWidth: '675px',
      width: '98%',
      autoFocus: false,
      disableClose: true
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.shippingType();
      }
    });
  }

  selectShippingTypeForAll() {
    const data = {
      id: 'select-shipping'
    };

    const invalidToAddress = this.selectedMailRows?.some(
      (mailData) => !mailData.value.country || !mailData.value.zip
    );

    if (this.customAddress) {
      if (!invalidToAddress) {
        const dialog = this.dialog.open(CheckMailSettingsModalComponent, {
          maxWidth: '675px',
          width: '98%',
          autoFocus: false,
          disableClose: true,
          data: data
        });

        dialog.afterClosed().subscribe((res) => {
          if (res) {
            this.shippingTypeForAll(res);
          }
        });
      } else {
        this.alertService.warningAlert({
          content:
            'Some checks have an invalid address. Please update the address and try again.'
        });
      }
    }
  }

  shippingTypeForAll(shippingTypeId: number): void {
    this.isChangeMailType.set(true);
    this.subscriptions.push(
      this.checkMail.getShippingType()
      .pipe(
        finalize(() => {
          this.isChangeMailType.set(false);
        })
      )
      .subscribe((res) => {
        this.shipping = res.data;
        const selectedIds = this.getSelectedEncIds();
        this.emailChecksData.datas.forEach((item: MailRow, index: number) => {
          if (!selectedIds.includes(item.enc_id)) {
            return;
          }
          const shippingTypes = this.sortedoption(item.payee_country);
          if (shippingTypes[0]?.country === 'Canada') {
            return;
          }
          this.selctedShippingType[item.enc_id] = Number(shippingTypeId);
          this.invalidMailTypeChecks = this.invalidMailTypeChecks.filter(
            (checkId) => checkId !== item.enc_id
          );

          this.costCalculation[item.enc_id].mail_type =
            this.selctedShippingType[item.enc_id];
          const isFedexShipping = Object.values(this.costCalculation).some(
            (calc) => {
              const mailType = Number(calc.mail_type);
              return [12, 14, 16].includes(mailType);
            }
          );
          if (isFedexShipping && item.payee_country) {
            // const shippingTypes = this.sortedoption(item.payee_country);

            const selectedType = shippingTypeId;

            const mockEvent = {
              target: { value: selectedType }
            } as unknown as Event;

            this.shippingTypecostchange(
              mockEvent,
              item.enc_id,
              index,
              item.payee_country
            );
          } else {
            this.isPhoneNumberRequired[index] = false;
          }
        });
        this.calculateShippingCost(this.costCalculation, true);
      })
    );
  }

  shippingType(): void {
    this.isChangeMailType.set(true);
    this.subscriptions.push(
      this.checkMail.getShippingType()
      .pipe(
        finalize(() => {
          this.isChangeMailType.set(false);
        })
      )
      .subscribe((res) => {
        this.shipping = res.data;
        this.emailChecksData.datas.forEach((item: MailRow, index: number) => {
          if (!this.selctedShippingType[item.enc_id]) {
            const shippingTypes = this.sortedoption(item.payee_country);
            const defaultType = this.getSelectedShippingType(shippingTypes);
            this.selctedShippingType[item.enc_id] = defaultType;
            // Only set mail_type in costCalculation if a default type is found
            if (defaultType !== null && this.costCalculation[item.enc_id]) {
              this.costCalculation[item.enc_id].mail_type = defaultType;
            }
          }
          this.isPhoneNumberRequired[index] = false;
        });
        this.calculateShippingCost(this.costCalculation, true);
      })
    );
  }

  showPayeeData(){
    this.isPayeeLoading = true;
    this.payeeService.showPayee(this.checkdata[0].enc_payee_id)
    .pipe(
      take(1)
    )
    .subscribe((res) => {
      if(res.success){
        this.payeeData = res.data;
        this.autoCreateMailToAddress(res.data)
      }
    })
  }

  autoCreateMailToAddress(payeeData: IShowPayeeDetails){
    // Check if required address fields are missing
    if (!payeeData.addressLine1 || !payeeData.city || !payeeData.state || !payeeData.zip || !payeeData.country) {
      this.isPayeeLoading = false;
      return;
    }

    const USA = ['united states', 'us', 'usa','united states of america'];
    const CANADA = ['canada', 'ca', 'can'];
    const country = payeeData.country?.toLowerCase();
    let selectCountry = '';

    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (CANADA.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry =  payeeData.country;
    }

    const payload = {
      name: payeeData.addressLine1,
      company_name: payeeData.company,
      address_line_1: payeeData.addressLine1,
      address_line_2: payeeData.addressLine2,
      city: payeeData.city,
      state: payeeData.state,
      zip: payeeData.zip,
      country: selectCountry,
      phone: payeeData.phone,
      email: payeeData.email,
      note: ''
    }

    this.checkMail.addMailTo(payload)
    .pipe(
      finalize(() => {
        this.isPayeeLoading = false;
      }),
      take(1)
    )
    .subscribe({
      next: (res) => {
        if(res.success){
          this.loadShippingAddressTo(res.data);
        }
      },
      error: (err) => {
        if(err.error.errorCode == 391 && err.error.errorMsg){
          this.loadShippingAddressTo(err.error.errorMsg);
        }
      }
    })
  }

  setCurrentMailTo(data:{result:boolean,data:ICheckCustomAddress,id:string,type:string}){
    this.shippingAddressTo.forEach((element) => {
      if (element.name == data.data.name) {
        this.mailToId = data.id;
        this.isMailToEditable = true;
        this.onMailToChange(this.mailToId, 'mail-to');
      }
    }); 
  }

  /**
   * Handles error 731 - No Bank Account Found
   * Shows a warning alert and navigates to add bank account page if user confirms
   * @param error - The HttpErrorResponse containing error details
   * @returns Observable that emits the error
   */
  private handleError731(error: HttpErrorResponse) {
    this.alertService.warningAlert({
      title: 'No Bank Account Found',
      content: error.error.errorMsg,
      doneMsg: 'Add Bank Account',
      cancelMsg: 'Cancel',
      isCancel: true
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.dialogRef.close();
        this.router.navigate(['/manage/users/add-bank-account']);
      }
    });
    return of(error);
  }

  /**
   * Handles error 517 - the shipping type's attachment page limit was exceeded.
   * Shows the api message and re-enables the form so the user can remove the
   * attachments and retry, with an action to turn off the auto attachment setting.
   * @param error - The HttpErrorResponse containing error details
   * @returns true when the error was a 517 and has been handled
   */
  private handleAttachmentPageLimitError(error: HttpErrorResponse): boolean {
    if (Number(error?.error?.errorCode) !== 517) {
      return false;
    }
    this.loading = false;
    this.disabled = false;
    this.mailForm.enable();
    this.alertService
      .warningAlert(
        {
          content: error.error.errorMsg,
          doneMsg: 'Disable Auto Attachment',
          cancelMsg: 'Cancel',
          isCancel: true
        },
        '420px'
      )
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.disableAutoAttachment();
        }
      });
    return true;
  }

  /**
   * Turns off the 'Auto Add Attachments' advanced setting so the user can send
   * the mail without the auto attached pages.
   */
  private disableAutoAttachment() {
    this.subscriptions.push(
      this.UserServicu.uploadAdavanceStatus({
        status_id: '5',
        status: 0
      }).subscribe((res) => {
        this.autoAttachmentForMail = true;
        this.headerservice.setHeaderValueChanged(true);
        this.alertService.successAlert({
          content: res?.message ?? 'Auto Add Attachments disabled successfully',
          close: true,
          timeout: 2000
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.localStorageService.removeItem('preferredShippingType');
  }

  openRechargeModal() {
    if (!this.isSubscribed) {
      const alertData = {
        content: 'Kindly subscribe to a plan.',
        isCancel: true,
        doneMsg: 'Subscribe Now',
        cancelMsg: 'Not Now'
      };
      const alert = this.alertService.warningAlert(alertData);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.goToSubscription();
        }
      });
      return;
    }
    const dRef = this.dialog.open(RefillCreditRechargeModalComponent, {
      width: '450px',
      maxWidth: '93%',
      autoFocus: false,
      disableClose: true,
    });

    dRef.afterClosed().subscribe((res) => {
      if(res?.add){
        this.getCredit();
      }
    });
  }

  getCredit() {
    this.subscriptions.push(
      this.refillCredit
        .getCurrentCredit()
        .pipe(
          finalize(() => {
            this.removeLoadedSkelton();
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.currentCredit = String(data.data.credit);
          }
        })
    );
  }


  /**
   * @description Navigates to the subscription page based on the user verification status.
   *
   * If both the email and phone are verified, it navigates to the subscription page.
   *
   * If either the email or phone is not verified, it navigates to the verify email and phone page.
   */
    goToSubscription(): void {
      if (
        this.emailverified === 1 &&
        this.phoneverified === 1
      ) {
        this.onNavigation(['manage/subscription'], {
          state: { returnUrl: this.router.url }
        });
      } else {
        this.onNavigation(['/manage/users/verify-email-phone'], {
          queryParams: { returnUrl: '/manage/refill-credit/show-refillform' }
        });
      }
    }

    onNavigation(path:string[], extras?: NavigationExtras) {
      // Set up NavigationEnd listener BEFORE navigation to avoid race condition
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        take(1)
      ).subscribe(() => {
        this.dialogRef.close();
      });
      
      // Then trigger navigation
      this.router.navigate(path, extras).catch(() => {
        // If navigation fails, still close the dialog
        this.dialogRef.close();
      });
    }
}
