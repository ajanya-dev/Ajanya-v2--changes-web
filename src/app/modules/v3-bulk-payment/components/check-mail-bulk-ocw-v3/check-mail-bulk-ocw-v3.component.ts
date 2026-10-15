import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { debounceTime, finalize } from 'rxjs/operators';
import {
  IAddressValidity,
  ICheckMailData,
  ICheckMailResponse
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { MatDialog } from '@angular/material/dialog';
import { AddMailAddressModalComponent } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal/add-mail-address-modal.component';
import { CheckAddAttachmentModalComponent } from 'src/app/modules/check/modal/check-add-attachment-modal/check-add-attachment-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IApiRes } from 'src/app/models/api';
import {
  ICheckShipingTypes,
  IMailShippingCalculations,
  IMailBulkShippingAddress,
  IMailSingleShippingAddress,
  IShipingCheckPaperType,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { UpdatePayeeModalComponent } from 'src/app/modules/check/modal/mail-modals/update-payee-modal/update-payee-modal.component';
import { UpdateBankModalComponent } from 'src/app/modules/check/modal/mail-modals/update-bank-modal/update-bank-modal.component';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { MatBadge } from '@angular/material/badge';
import { V35ControlMessageComponent } from '../../../../shared/v3/control-message-v35/control-message-v35.component';
import { NewPhoneInputComponent } from '../../../../shared/components/new-phone-input/new-phone-input.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment } from '@fortawesome/pro-regular-svg-icons';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { ActivatedRoute } from '@angular/router';
import { ICheckCommentInterface } from 'src/app/models/common';

/**
 * @description Interface for check mail form.
 */
interface ICheckMailForm {
  sourceType: string;
  payee: string;
  amount: string;
  shippingType: string;
  checkPaper: string;
  checkNo: string;
  sms: string;
  email: string;
  cost: string;
  enc_id: string;
  country: string;
  is_existing_attach: number;
  informed_payee_sms: boolean;
  informed_payee_email: boolean;
  mailNowPayLoad: IMailShippingCalculations;
  comments: string[];
}

/**
 * @description Component for check mailing in bulk payment.
 */
@Component({
  selector: 'app-check-mail-bulk-ocw-v3',
  templateUrl: './check-mail-bulk-ocw-v3.component.html',
  styleUrls: ['./check-mail-bulk-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    MatTooltip,
    NewPhoneInputComponent,
    V35ControlMessageComponent,
    MatBadge,
    AsyncPipe,
    FontAwesomeModule
  ]
})
export class CheckMailBulkOcwV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private checkService = inject(CheckService);
  private formBuilder = inject(FormBuilder);
  private rootFormGroup = inject(FormGroupDirective);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  private activatedRoute = inject(ActivatedRoute);

  dynamicForm: FormGroup;
  selectedItem = '';
  isAPILoaded = false;
  subscriptions: Subscription[] = [];
  ShippingCostRes: IShippingCostCalculation;
  checkDetails: ICheckMailResponse[];
  envId = environment.env_id;
  attachments: { [key: string]: string[] | string; fileName: string };
  comments:{[key: string]: string[]};
  costCalculation: IMailShippingCalculations;
  shippingCalculation: IShippingCostCalculation;
  subTotal: string;
  total: string;
  shippingFee: string;
  paperType: IShipingCheckPaperType[];
  shippingType: ICheckShipingTypes[];
  disabled = false;
  shipDisabled = false;
  customAddress = false;
  shippingAddressFrom: IMailBulkShippingAddress[];
  shippingAddressTo: IMailBulkShippingAddress[];
  shippingVar: ICheckShipingTypes[];
  mailFromId: string;
  mailToId: string;
  isMailFromEditable = false;
  isMailToEditable = false;
  isRefreshed: boolean;
  country: string;
  loading = false;
  isDisable = false;
  smsValue: boolean;
  informed_payee_sms: boolean;
  invalidAddress = false;
  isPhoneNumberRequired: boolean[] = [];
  selectedIndex: number;
  subjectKeyUp = new Subject();
  isFedex = false;
  selectedShippingType: number;
  selectedPayeeId: string;
  showUpdatePayeeModal = false;
  currentMailFrom = ' ';
  currentMailTo = ' ';
  faCircleQuestion = faCircleQuestion;
  isEnvelopeChecked = false;
  isFromGroupMailDashboard = signal(false);
  faComment = faComment;

  ngOnInit(): void {
    this.getQueryParams();
    this.initForm();
    this.setFormData();
    this.getShippingType();
    this.getPaperType();
    this.loadShippingAddressFrom(false);
    this.loadShippingAddressTo();
    this.FormControl.markAllAsTouched();
    this.checkPhoneNumber();
    this.v3BulkPaymentService.isBulkPayProcessing = true;
  }

  patchCheckPaperType(index: number) {
    index;
    this.dynamicForm;
  }

  /**
  * Retrieves query parameters from the route.
  */
  getQueryParams() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.isFromGroupMailDashboard.set(params?.type === 'check');
      })
    );
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkMailFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Getter method for dynamic form controls.
   * @returns dynamicForm controls.
   */
  get FormControl(): FormArray<FormGroup> {
    return this.dynamicForm.get('checkMailFormArray') as FormArray;
  }

  /**
   * @description Method to create check mail form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  checkMailFormBody(paymentListData: ICheckMailResponse) {
    return this.formBuilder.group({
      sourceType: [paymentListData?.payee_name],
      payee: [paymentListData?.payee_name],
      accountName: [paymentListData?.account_name],
      bankAccount: [paymentListData?.bank_account],
      amount: [paymentListData?.cheque_amount],
      shippingType: [this.sortedOption(paymentListData?.payee_country)[0]?.id],
      checkPaper: [this.paperType[0].id],
      checkNo: [paymentListData?.cheque_serial_number],
      sms: [paymentListData?.payee_phone, ValidationService.phoneMinLength],
      email: [paymentListData?.payee_email, ValidationService.emailValidator],
      cost: [0],
      enc_id: [paymentListData?.enc_id],
      country: [paymentListData?.payee_country],
      toAddressValidity: [paymentListData?.toAddressValidity],
      fromAddressValidity: [paymentListData?.fromAddressValidity],
      enc_bank_account_id: [paymentListData?.enc_bank_account_id],
      enc_payee_id: [paymentListData?.enc_payee_id],
      cheque_serial_number: [paymentListData?.cheque_serial_number],
      is_existing_attach: [paymentListData.is_exisiting_attach],
      informed_payee_sms: false,
      informed_payee_email: [paymentListData.payee_email ? true : false],
      mailNowPayLoad: [undefined]
    });
  }

  /**
   * @description Method to set the data to the form.
   */
  setFormData() {
    let checkUuidList: string[] = [];
    const ids: { cheque_ids: string[]; shipping_type: number[] } = {
      cheque_ids: [],
      shipping_type: []
    };
    const ids2: { ids: string[] } = { ids: [] };
    let toAddressValidityData: { [key: string]: IAddressValidity };
    let fromAddressValidityData: { [key: string]: IAddressValidity };
    this.subscriptions.push(
      this.v3BulkPaymentService.checkMailPayments.subscribe({
        next: (res) => {
          checkUuidList = [];
          ids.cheque_ids = [];
          ids2.ids = [];
          ids.shipping_type = [];
          ids.shipping_type.push(1);
          if (res.length === 0) {
            return;
          }
          res?.forEach((rowData) => {
            if (rowData.transferTypeCode === 'check') {
              checkUuidList.push(rowData.transferId);
              ids.cheque_ids.push(rowData.transferId);
              ids2.ids.push(rowData.transferId);
              ids.shipping_type.push(1);
            }
          });
          const payeeValidation = this.checkService.payeevalidation(ids);
          const bankValidation = this.checkService.bankvalidation(ids2);
          forkJoin([payeeValidation, bankValidation]).subscribe(
            ([res1, res2]) => {
              toAddressValidityData = res1.data;
              fromAddressValidityData = res2.data;
              this.v3BulkPaymentService
                .getCheckMailDetails({ ids: checkUuidList, is_signature: 1 })
                .pipe(
                  finalize(() => {
                    this.isAPILoaded = true;
                  })
                )
                .subscribe({
                  next: (response: IApiRes<ICheckMailData>) => {
                    const checkMailResponseData = response.data.datas;
                    this.checkDetails = response.data.datas;
                    checkMailResponseData.forEach(
                      (checkData: ICheckMailResponse) => {
                        const existingIndex =
                          this.FormControl.controls.findIndex(
                            (control) =>
                              control.value.enc_id === checkData.enc_id
                          );

                        if (existingIndex !== -1) {
                          this.FormControl.removeAt(existingIndex);
                        }

                        checkData.toAddressValidity =
                          toAddressValidityData[checkData.enc_id];
                        checkData.fromAddressValidity =
                          fromAddressValidityData[checkData.enc_id];
                        this.FormControl.push(
                          this.checkMailFormBody(checkData)
                        );
                      }
                    );
                    this.calculateInitialShipping();
                    this.setMailPayLoad();
                    if(this.isFromGroupMailDashboard()){
                      this.setCommentsData();
                    }
                  }
                });
            }
          );
        }
      })
    );
  }

  setCommentsData(){
  this.checkDetails.forEach((checkData) => {
    if(checkData.comments){
      const commentData = checkData.comments;
      const commentIds: string[] = [];
      commentData.forEach((id) => {
        commentIds.push(id);
      });
      this.comments = {
        ...this.comments,
        [checkData.enc_id]: commentIds
      };
      this.costCalculation[checkData.enc_id] = {
        ...this.costCalculation[checkData.enc_id],
        comments: commentIds
      };
    }
  });
  }

  /**
   * @description Method to calculate the shipping cost initially. Creates the costCalculation object initially as well.
   */
  calculateInitialShipping(): void {
    this.costCalculation = {
      mail_check_ids: [],
      all_check_ids: [],
      shipping_rate_warning: 0,
      sent_to_customer_address: 0,
      Single_mail_options: 3,
      individual_envelope: 0
    };

    for (let i = 0; i < this.checkDetails.length; i += 1) {
      const ids2 = this.checkDetails[i].enc_id;
      this.costCalculation.mail_check_ids.push(this.checkDetails[i].enc_id);
      const payeeCountry =
        this.checkDetails[i]?.payee_country?.toLocaleLowerCase();
      if (payeeCountry === 'canada' || payeeCountry === 'ca') {
        this.costCalculation[ids2] = this.getobject(
          this.checkDetails[i].payee_email,
          this.checkDetails[i].payee_phone,
          14
        );
      } else if (
        payeeCountry === 'united states' ||
        payeeCountry === 'usa' ||
        payeeCountry === 'us' ||
        !payeeCountry
      ) {
        this.costCalculation[ids2] = this.getobject(
          this.checkDetails[i].payee_email,
          this.checkDetails[i].payee_phone,
          1
        );
      } else {
        this.costCalculation[ids2] = this.getobject(
          this.checkDetails[i].payee_email,
          this.checkDetails[i].payee_phone,
          17
        );
      }
    }

    this.costCalculation.mail_check_ids = [
      ...new Set(this.costCalculation.mail_check_ids)
    ];
    this.setExistingAttachment();
    if(!this.isFromGroupMailDashboard()){
      this.calculateShippingCost(this.costCalculation);
    }
  }

  /**
   * @description Creates the check object.
   * @param payee_email - payee email.
   * @param payee_phone - payee phone
   * @param mail_type - mail type
   * @returns check object
   */
  getobject(payee_email: string, payee_phone: string, mail_type: number) {
    return {
      mail_type,
      check_paper: 7,
      informed_payee_sms: 0,
      informed_payee_email: 0,
      payee_phone,
      payee_email,
      file_hidden: []
    };
  }

  /**
   * @description Method to calculate paper cost and update cost.
   * @param event - event from option selection.
   * @param id - check id.
   */
  ShippingPapercostchange(event: Event, id: string) {
    Object.keys(this.costCalculation).forEach((property) => {
      if (property === id) {
        this.costCalculation[id] = this.createCheckObject(
          id,
          (event.target as HTMLInputElement).value,
          'paper_type'
        );
      }
    });

    this.calculateShippingCost(this.costCalculation);
  }

  /**
   * @description Method to create check object for both shipping paper and shipping type change.
   * @param id - check id.
   * @param value - Pre-assigned numerical value for paper type or shipping type.
   * @param type - type for which the method is invoked - 'paper_type' or 'shipping_type'
   * @returns check object
   */
  createCheckObject(
    id: string,
    value: string,
    type: 'paper_type' | 'shipping_type'
  ) {
    const data = this.costCalculation[id];
    let email: string | undefined;
    let phone: string | undefined;
    this.FormControl.value.forEach((formValues: ICheckMailForm) => {
      if (formValues.enc_id === id) {
        phone = formValues.sms;
        email = formValues.email;
      }
    });
    return {
      check_paper: type === 'paper_type' ? Number(value) : data.check_paper,
      file_hidden: this.attachments ? this.attachments[id] : [],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: data.informed_payee_sms,
      mail_type: type === 'shipping_type' ? Number(value) : data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  /**
   * @description Method to get available paper types.
   */
  getPaperType(): void {
    this.subscriptions.push(
      this.checkService
        .getpaperType()
        .subscribe((res: IApiRes<IShipingCheckPaperType[]>) => {
          this.paperType = res.data;
        })
    );
  }

  /**
   * @description Method to get available shipping types.
   */
  getShippingType(): void {
    this.subscriptions.push(
      this.checkService
        .getShippingType()
        .subscribe((res: IApiRes<ICheckShipingTypes[]>) => {
          this.shippingType = res.data;
        })
    );
  }

  /**
   * @description Method to calculate shipping type cost and update cost.
   * @param event - event from option selection.
   * @param id - check id.
   */
  ShippingTypecostchange(event: Event, id: string, i: number, type: string) {
    this.onCheckShippingType(
      Number((event.target as HTMLInputElement).value),
      i,
      type
    );
    Object.keys(this.costCalculation).forEach((property) => {
      if (property === id) {
        this.costCalculation[id] = this.createCheckObject(
          id,
          (event.target as HTMLInputElement).value,
          'shipping_type'
        );
      }
    });

    this.calculateShippingCost(this.costCalculation);
  }

  /**
   * @description Applies validation to phone number based on the selected shipping type.
   * @param {number} shippingTypeId - The ID of the selected shipping type.
   * @param {number} i - Index representing the position in the form controls array.
   * @param {string} countryType - selected address country type.
   */
  onCheckShippingType(shippingTypeId: number, i: number, countryType: string) {
    const shippingType = this.sortedOption(countryType);
    const selectedShippingType = shippingType.filter(
      (item) => Number(item.id) === Number(shippingTypeId)
    );
    this.selectedShippingType = selectedShippingType[0]?.carrier_id;
    if (this.selectedShippingType === 2 && !this.phoneNumIsValid(true, i)) {
      this.isPhoneNumberRequired[i] = true;
      this.isFedex = true;
      this.FormControl.controls[i].controls.sms.setValidators([
        Validators.required,
        ValidationService.phoneMinLength
      ]);
      this.FormControl.controls[i].controls.sms.updateValueAndValidity();
      this.FormControl.controls[i].controls.sms.markAsTouched();
    } else {
      this.FormControl.controls[i].controls.sms.clearValidators();
      this.FormControl.controls[i].controls.sms.updateValueAndValidity();
      this.FormControl.controls[i].controls.sms.markAsUntouched();
      this.isPhoneNumberRequired[i] = false;
      this.isFedex = false;
    }
  }

  /**
   * @description Selects available shipping types for the corresponding country.
   * @param countryName - Name of the country.
   * @returns An array of available shipping types.
   */
  sortedOption(countryName: string): ICheckShipingTypes[] {
    const USA = ['united states', 'us', 'usa'];
    const ca = ['canada', 'ca'];

    const country = countryName?.toLowerCase();
    let selectCountry;

    if (USA.includes(country) || !country) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    }

    if (selectCountry === 'Canada') {
      return this.shippingType?.filter(
        (type: ICheckShipingTypes) => type.country === countryName
      );
    }
    if (selectCountry === 'United States') {
      return this.shippingType?.filter(
        (type: ICheckShipingTypes) =>
          type.country !== 'Canada' && type.country !== 'International'
      );
    }

    return this.shippingType?.filter(
      (type: ICheckShipingTypes) => type.country === 'International'
    );
  }

  /**
   * @description method for cost calculation and updation on shipping address change
   * @param event - radio input change event
   */
  onShippingAddressChange(event: Event) {
    if (
      (event.target as HTMLInputElement).checked === true &&
      (event.target as HTMLInputElement).id === 'to-custom-address'
    ) {
      this.customAddress = true;
      this.shipDisabled = true;
      this.v3BulkPaymentService.isCustomAddress.next(this.customAddress);
      this.costCalculation.sent_to_customer_address = 1;
      this.costCalculation.custom_address_shipping_type = 1;
      this.calculateShippingCost(this.costCalculation);
    } else {
      this.customAddress = false;
      this.shipDisabled = false;
      this.isEnvelopeChecked = false;
      this.costCalculation.sent_to_customer_address = 0;
      this.costCalculation.custom_address_shipping_type = undefined;

      this.calculateShippingCost(this.costCalculation);
    }
  }

  /**
   * @description Method to invoke when from address changes.
   * @param type - type of address
   * @param mailFromId - id for 'mail-from'
   * @param event - selection event
   */
  onMailFromChange(type: string, mailFromId: string, event?: Event) {
    const mailId = (event?.target as HTMLInputElement)?.value;
    if (type === 'mail-from') {
      this.mailFromId = mailFromId;
      this.isMailFromEditable = true;
    } else if (mailId === ' ') {
      this.isMailFromEditable = false;
    } else {
      this.mailFromId = mailId;
      this.isMailFromEditable = true;
    }
    this.subscriptions.push(
      this.checkService
        .getFromSingleId(this.mailFromId)
        .subscribe((res: IApiRes<IMailSingleShippingAddress>) => {
          this.costCalculation.shipping_from = res.data.id;
          if(this.costCalculation.shipping_to){
            this.setShippingType(this.country);
          }
        })
    );
  }

  /**
   * @description Opens modal window for adding mail address and updates the address.
   * @param event - button click event
   */
  openAddMailAddressModal(selectedAddressType: string) {
    const addMailAddress = this.dialog.open(AddMailAddressModalComponent, {
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      data: {
        dataKey: selectedAddressType,
        isForUpdate: this.isForUpdate(selectedAddressType),
        id: selectedAddressType === 'mail-to' ? this.mailToId : this.mailFromId
      }
    });

    addMailAddress.afterClosed().subscribe((data) => {
      if (data && data.type !== 'delete' && data.mode !== 'update') {
        if (data.type === 'mail-from') {
          this.isRefreshed = this.loadShippingAddressFrom(true);
          this.currentMailFrom = data.id;
        } else {
          this.loadShippingAddressTo();
          this.currentMailTo = data.id;
        }

        if (
          this.isRefreshed &&
          data.type === 'mail-from' &&
          data.mode !== 'update'
        ) {
          this.mailFromId = data.id;
          this.isMailFromEditable = true;
          this.onMailFromChange('mail-from', data.id);
        } else if (data.type === 'mail-to') {
          this.mailToId = data.id;
          this.isMailToEditable = true;
          if (data.data.country === 'Canada') {
            this.shippingVar = this.shippingType?.filter(
              (type: ICheckShipingTypes) => type.country === data.data.country
            );
            this.country = 'Canada';
            this.costCalculation.custom_address_shipping_type =
              this.shippingVar[0].id;
            this.calculateShippingCost(this.costCalculation);
            this.onMailToChange('mail-to', this.mailToId);
          } else {
            this.shippingVar = this.shippingType?.filter(
              (shippingType: ICheckShipingTypes) =>
                shippingType.country === null
            );
            this.costCalculation.custom_address_shipping_type =
              this.shippingVar[0].id;
            this.calculateShippingCost(this.costCalculation);
            this.onMailToChange('mail-to', this.mailToId);
          }
        }
      } else if (data && data.mode === 'update' && data.type !== 'delete') {
        if (data.type === 'mail-from') {
          this.loadShippingAddressFrom(true);
          this.onMailFromChange('mail-from', data.id);
        } else if (data.type === 'mail-to') {
          this.loadShippingAddressTo();
          if (data.data.country === 'Canada') {
            this.shippingVar = this.shippingType?.filter(
              (shippingType: ICheckShipingTypes) =>
                shippingType.country === data.data.country
            );
            this.country = 'Canada';
            this.costCalculation.custom_address_shipping_type =
              this.shippingVar[0].id;
            this.calculateShippingCost(this.costCalculation);
          } else if (data.data.country === 'United States') {
            this.shippingVar = this.shippingType?.filter(
              (type: ICheckShipingTypes) => type.country === null
            );
            this.costCalculation.custom_address_shipping_type =
              this.shippingVar[0].id;
            this.calculateShippingCost(this.costCalculation);
          } else {
            this.shippingVar = this.shippingType?.filter(
              (type: ICheckShipingTypes) => type.country === 'International'
            );
            this.costCalculation.custom_address_shipping_type =
              this.shippingVar[0].id;
            this.calculateShippingCost(this.costCalculation);
          }
        }
      }
      if (data.type === 'delete' && data.mode === 'mail-from') {
        this.isMailFromEditable = false;
        this.loadShippingAddressFrom(true);
      }

      if (data.type === 'delete' && data.mode === 'mail-To') {
        this.isMailToEditable = false;
        this.loadShippingAddressTo();
      }
    });
  }

  /**
   * @description Returns a boolean for passing into add address modal window and sets whether address is editable or not.
   * @param mailAddressTracker - mail-from or mail-to
   * @returns boolean
   */
  isForUpdate(mailAddressTracker: string) {
    if (mailAddressTracker === 'mail-from') {
      if (this.isMailFromEditable === true) {
        return true;
      }
    }
    if (mailAddressTracker === 'mail-to') {
      if (this.isMailToEditable === true) {
        return true;
      }
    }
    return false;
  }

  /**
   * @description Method for loading from address for shipping
   * @param val - boolean
   * @returns boolean - equal to param val
   */
  loadShippingAddressFrom(val: boolean): boolean {
    this.subscriptions.push(
      this.checkService
        .getAddressFrom()
        .subscribe((res: IApiRes<IMailBulkShippingAddress[]>) => {
          this.shippingAddressFrom = res.data;
        })
    );
    if (val) {
      return val;
    }
    return false;
  }

  /**
   * @description Method to load to address for shipping.
   */
  loadShippingAddressTo() {
    this.subscriptions.push(
      this.checkService
        .getAddressTo()
        .subscribe((res: IApiRes<IMailBulkShippingAddress[]>) => {
          this.shippingAddressTo = res.data;
          if (res.data.length === 0) {
            this.shipDisabled = true;
            this.invalidAddress = true;
          } else {
            this.invalidAddress = false;
          }
        })
    );
  }

  /**
   * @description Method to be invoked when to address for mailing changes.
   * @param type - type of address.
   * @param mailToid - id of type pf to address for shipping.
   * @param event - select event.
   */
  onMailToChange(type: string, mailToid: string, event?: Event) {
    const mailId = (event?.target as HTMLInputElement)?.value;
    if (type === 'mail-to') {
      this.mailToId = mailToid;
      this.isMailToEditable = true;
    } else if (mailId === ' ') {
      this.isMailToEditable = false;
    } else {
      this.mailToId = mailId;
      this.isMailToEditable = true;
    }
    this.subscriptions.push(
      this.checkService
        .getToSingleId(this.mailToId)
        .subscribe((res: IApiRes<IMailSingleShippingAddress>) => {
          this.country = res.data.country;
          this.costCalculation.shipping_to = res.data.id;
          if(this.costCalculation.shipping_from){
            this.setShippingType(this.country);
          }
        })
    );
  }

  setShippingType(country :string){
    if (country === 'Canada') {
      this.shippingVar = this.shippingType?.filter(
        (shippingType: ICheckShipingTypes) => shippingType.id === 16
      );
      this.costCalculation.custom_address_shipping_type =
        this.shippingVar[0].id;
      this.calculateShippingCost(this.costCalculation);
    } else if (country === 'United States') {
      this.shippingVar = this.shippingType?.filter(
        (shippingType: ICheckShipingTypes) => 
          shippingType.id === 4 || shippingType.id === 5 || shippingType.id === 12
      );
      this.costCalculation.custom_address_shipping_type =
        this.shippingVar[0].id;
      this.calculateShippingCost(this.costCalculation);
    } else {
      this.shippingVar = this.shippingType?.filter(
        (shippingType: ICheckShipingTypes) => shippingType.country === 'International' && shippingType.id === 18
      );
      this.costCalculation.custom_address_shipping_type =
        this.shippingVar[0].id;
      this.calculateShippingCost(this.costCalculation);
    }
  }

  /**
   * @description Method for setting the 'shipping cost calculation response' to the component properties. Also updates the totalShippingFee in the bulk payment service.
   * @param res - Data fetched by shipping cost calculation method.
   */
  shippingRes(res: IApiRes<IShippingCostCalculation>) {
    this.shippingCalculation = res.data;
    this.subTotal = this.shippingCalculation.subTotal;
    this.total = this.shippingCalculation.total;
    this.v3BulkPaymentService.bankCheckMailShippingFeeSubject.next(res.data.total);
    this.v3BulkPaymentService.setTotalShippingFee();
    this.shippingFee = this.shippingCalculation?.group_shipping_fee;
  }

  /**
   * @description Method for setting custom shipping type and to update the shipping cost.
   * @param event - selection event.
   */
  customShipingTypeChange(event: Event) {
    this.costCalculation.custom_address_shipping_type = (
      event.target as HTMLSelectElement
    ).value;
    this.calculateShippingCost(this.costCalculation);
  }

  openAddComment(checkId: string) {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: {
        id: checkId,

      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        const commentsId = res.existingData.map((comment: ICheckCommentInterface) => comment.id);
        this.comments = {
          [checkId]: commentsId || []
        };
      }
    });
  }

  /**
   * @description Opens modal window for attachments and sets the attachments and updates cost.
   * @param checkId - Id of the check.
   * @param smsValue - boolean value for whether sms opted or not.
   */
  openAttachmentModal(checkId: string, smsValue: boolean) {
    let value: number;
    if (smsValue) {
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
        attachId: this.attachments ? this.attachments[checkId] : [],
        type: 'mail',
        cost: this.shippingCalculation.page_cost
      }
    });
    attachmentModal
      .afterClosed()
      .subscribe(
        (data: { checkId: string; ids: string[]; fileName: string }) => {
          if (data) {
            if (this.attachments === undefined) {
              this.attachments = {
                [data.checkId]: data.ids,
                fileName: data.fileName
              };
            } else if (this.attachments[data.checkId]) {
              for (const attachmentId of data.ids) {
                let verifyId = true;
                for (const duplicateId of this.attachments[data.checkId]) {
                  if (attachmentId === duplicateId) {
                    verifyId = false;
                    break;
                  }
                }
                if (verifyId === true) {
                  (this.attachments[data.checkId] as string[]).push(
                    attachmentId
                  );
                }
              }
            } else {
              this.attachments[data.checkId] = data.ids;
              this.attachments.fileName = data.fileName;
            }

            for (const currentAttachmentId of this.attachments[data.checkId]) {
              const currIndex = (
                this.attachments[data.checkId] as string[]
              ).indexOf(currentAttachmentId);
              let idExist = false;
              for (const attachmentId of data.ids) {
                if (attachmentId === currentAttachmentId) {
                  idExist = true;
                  break;
                }
              }
              if (!idExist) {
                (this.attachments[data.checkId] as string[]).splice(
                  currIndex,
                  1
                );
              }
            }

            Object.keys(this.costCalculation).forEach((property) => {
              if (property === checkId) {
                this.costCalculation[checkId] = this.getAttachmentObject(
                  checkId,
                  this.attachments[checkId] as string[],
                  value
                );
              }
            });

            this.calculateShippingCost(this.costCalculation);
          }
        }
      );
  }

  /**
   * @description Method for creating attachment object.
   * @param checkId - ID of the check.
   * @param value - Array of attachments for the given check ID.
   * @param smsValue - boolean value for whether sms opted or not.
   * @returns Attachment object.
   */
  getAttachmentObject(checkId: string, value: string[], smsValue: number) {
    const data = this.costCalculation[checkId];

    let email: string | undefined;
    let phone: string | undefined;
    this.FormControl.value.forEach((formValues: ICheckMailForm) => {
      if (formValues.enc_id === checkId) {
        phone = formValues.sms;
        email = formValues.email;
      }
    });

    return {
      check_paper: data.check_paper,
      file_hidden: value,
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: smsValue,
      mail_type: data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  /**
   * @description Handles the input event when a phone number is being entered for a specific payee.
   * @param {Event} event - The input event triggered by user interaction.
   * @param {number} i - Index representing the position in the form controls array.
   * @param {string} payeeId - The ID of the selected payee for whom the phone number is being entered.
   */
  getPhoneNumber(event: Event, i: number, payeeId: string) {
    this.selectedIndex = i;
    this.selectedPayeeId = payeeId;
    if (this.selectedShippingType === 2) {
      this.subjectKeyUp.next((event.target as HTMLInputElement).value);
    }
  }

  /**
   * @description Checks the validity of a phone number entered and update payload.
   */
  checkPhoneNumber() {
    this.subscriptions.push(
      this.subjectKeyUp.pipe(debounceTime(500)).subscribe(() => {
        if (
          !this.phoneNumIsValid(true, this.selectedIndex) ||
          this.FormControl.controls[this.selectedIndex].value.sms ===
            (undefined || '')
        ) {
          this.isPhoneNumberRequired[this.selectedIndex] = true;
          this.isFedex = true;
        } else {
          this.costCalculation[this.selectedPayeeId] = this.getSmsObject(
            this.selectedPayeeId,
            false
          );
          this.isPhoneNumberRequired[this.selectedIndex] = false;
          this.isFedex = false;
        }
      })
    );
  }

  /**
   * @description Method for verifying whether phone number is valid or not while toggling the checkbox. If not, shows alert.
   * @param event - checkbox input event.
   * @param i - index.
   */
  smscheck(event: Event, i: number) {
    if (!this.phoneNumIsValid((event.target as HTMLInputElement).checked, i)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      (event.target as HTMLInputElement).checked = false;
    }
  }

  /**
   * @description Method for phone number validation.
   * @param val - boolean
   * @param index - index
   * @returns boolean indicating valid or invalid.
   */
  phoneNumIsValid(val: boolean, index: number) {
    if (
      val &&
      ((this.FormControl.controls[index] as FormGroup).controls.sms.errors ||
        (this.FormControl.controls[index].value.sms === (undefined || '') &&
          this.FormControl.controls[index].value.sms.length !== 10))
    ) {
      return false;
    }
    return true;
  }

  /**
   *
   * @param event - Method to set whether sms option is selected or not and update the cost.
   * @param id - ID of the check.
   */
  smscheckchange(event: Event, id: string) {
    if ((event.target as HTMLInputElement).checked) {
      this.smsValue = true;
    } else {
      this.smsValue = false;
    }

    Object.keys(this.costCalculation).forEach((property) => {
      if (property === id) {
        this.costCalculation[id] = this.getSmsObject(
          id,
          (event.target as HTMLInputElement).checked
        );
      }
    });

    this.calculateShippingCost(this.costCalculation);
  }

  /**
   * @description Method for creating the sms object.
   * @param id - ID of the check.
   * @param checkedState - sms checkbox status.
   * @returns sms object.
   */
  getSmsObject(id: string, checkedState: boolean) {
    const data = this.costCalculation[id];

    let email: string | undefined;
    let phone: string | undefined;
    this.FormControl.value.forEach((formValues: ICheckMailForm) => {
      if (formValues.enc_id === id) {
        phone = formValues.sms;
        email = formValues.email;
      }
    });

    if (checkedState) {
      return {
        check_paper: data.check_paper,
        file_hidden: this.attachments ? this.attachments[id] : [],
        informed_payee_email: data.informed_payee_email,
        informed_payee_sms: 10,
        mail_type: data.mail_type,
        payee_email: email,
        payee_phone: phone
      };
    }
    return {
      check_paper: data.check_paper,
      file_hidden: this.attachments ? this.attachments[id] : [],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: 0,
      mail_type: data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  /**
   * @description Opens up an alert window and set the checkbox to unchecked, if email is not valid.
   * @param event - checkbox input event.
   * @param i - index
   */
  emailcheck(event: Event, i: number) {
    if (!this.emailIsValid((event.target as HTMLInputElement).checked, i)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid email'
      });
      (event.target as HTMLInputElement).checked = false;
    }
  }

  /**
   * @description Validates email input.
   * @param checkedState - state of checkbox.
   * @param index - index
   * @returns boolean value representing valid or invalid email.
   */
  emailIsValid(checkedState: boolean, index: number) {
    if (
      checkedState &&
      ((this.FormControl.controls[index] as FormGroup).controls.email.errors ||
        this.FormControl.controls[index].value.email === null ||
        this.FormControl.controls[index].value.email === '')
    ) {
      return false;
    }
    return true;
  }

  /**
   * @description Method for setting payload for check mailing to the form. (For accessing in bulk payment main component).
   */
  setMailPayLoad() {
    (
      this.FormControl.controls[0] as FormGroup
    ).controls.mailNowPayLoad.setValue(this.costCalculation);
  }

  /**
   * @description Looks for existing attachments and sets it to attachments, if found.
   */
  setExistingAttachment() {
    let value: number;
    if (this.smsValue) {
      value = 10;
    } else {
      value = 0;
    }
    this.checkDetails?.forEach((el) => {
      let attachmentids: string[] = [];
      if (el.is_exisiting_attach === 1) {
        attachmentids = (el.attachments as string[]).map((id: string) => id);
      }
      if(this.attachments === undefined){
        this.attachments = {
          [el.enc_id]: attachmentids,
          fileName: ''
        };
      }
      this.attachments[el.enc_id] = attachmentids;
      Object.keys(this.costCalculation).forEach((property) => {
        if (property === el.enc_id) {
          this.costCalculation[el.enc_id] = this.getAttachmentObject(
            el.enc_id,
            this.attachments[el.enc_id] as string[],
            value
          );
        }
      });
    });
    if(this.isFromGroupMailDashboard()){
      this.calculateShippingCost(this.costCalculation);
    }
  }

  /**
   *
   * @description Opens the update bank modal for the specified payee ID.
   * @param id -The ID of the bank.
   * @param checkNo -The check number.
   * @param index -The index of the row in the form array
   */
  InvFromAddress(id: string, checkNo: string) {
    const dialog = this.dialog.open(UpdateBankModalComponent, {
      maxWidth: '1100px',
      width: '100%',
      data: {
        id,
        checkNo
      }
    });
    dialog.afterClosed().subscribe((res) => {
      this.setFormData();
      if (res) {
        this.dynamicForm.value.checkMailFormArray.forEach(
          (rowData: ICheckMailResponse) => {
            if (rowData.enc_bank_account_id === id) {
              rowData.fromAddressValidity.success = true;
            }
          }
        );
      }
    });
  }

  /**
   *
   * @description Opens the update payee modal for the specified payee ID
   * @param id The ID of the payee
   * @param checkNo The check number
   * @param checkid The check ID
   * @param index The index of the row in the form array
   */

  openEditPayeeAdress(id: string, checkNo: string, checkid: string) {
    if (this.showUpdatePayeeModal) return;
    this.showUpdatePayeeModal = true;
    this.subscriptions.push(
      this.payeeService
        .showPayee(id)
        .pipe(
          finalize(() => {
            this.showUpdatePayeeModal = false;
          })
        )
        .subscribe((re) => {
          const EditPayeeData: IViewPayee = re.data;
          if (EditPayeeData) {
            const dialog = this.dialog.open(UpdatePayeeModalComponent, {
              maxWidth: '95%',
              width: '1000px',
              data: {
                checkNo,
                EditPayeeData,
                id,
                checkid
              }
            });
            dialog.afterClosed().subscribe((res) => {
              this.setFormData();
              if (res) {
                this.dynamicForm.value.checkMailFormArray.forEach(
                  (rowData: ICheckMailResponse) => {
                    if (rowData.enc_payee_id === id) {
                      rowData.toAddressValidity.success = true;
                    }
                  }
                );
              }
            });
          }
        })
    );
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

  calculateShippingCost(payload: IMailShippingCalculations) {
    this.subscriptions.push(
      this.v3BulkPaymentService
        .checkMailShippingCostCalculation(payload)
        .subscribe((res: IApiRes<IShippingCostCalculation>) => {
          if (res.success) {
            this.shippingRes(res);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
