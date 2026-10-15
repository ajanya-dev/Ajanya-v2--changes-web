import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatTooltip } from '@angular/material/tooltip';
import { MatBadge } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideAngularModule,
  Mail,
  ChevronDown,
  Landmark,
  Paperclip,
  Phone,
  Pencil,
  Plus,
  CircleHelp
} from 'lucide-angular';
import { NgSelectModule } from '@ng-select/ng-select';

import {
  IZilPyamentLists,
  ICheckMailResponse,
  IAddressValidity
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { V4BulkPaymentService } from 'src/app/modules/v4-bulk-payment/services/v4-bulk-payment.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import {
  ICheckShipingTypes,
  IMailShippingCalculations,
  IMailBulkShippingAddress,
  IMailSingleShippingAddress,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { IApiRes } from 'src/app/models/api';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { UpdateBankModalV4Component } from 'src/app/modules/check/modal/mail-modals/update-bank-modal-v4/update-bank-modal-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CheckAddAttachmentModalComponent } from 'src/app/modules/check/modal/v4-check-add-attachment-modal/v4-check-add-attachment-modal.component';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';
import { UpdatePayeeModalV4Component } from 'src/app/modules/check/modal/mail-modals/update-payee-modal-v4/update-payee-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

interface ICheckMailForm {
  sourceType: string;
  payee: string;
  amount: string;
  shippingType: string;
  checkPaper: string;
  checkNo: string;
  payee_phone: string;
  payee_email: string;
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
 * @description V4 component for Check Mail from Bank in bulk payment modal.
 */
@Component({
  selector: 'app-v4-check-mail-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    MatBadge,
    LucideAngularModule,
    NgSelectModule,
    PhoneInputV4Component,
    CommonInputFieldV4Component,
    DecimalPipe
  ],
  templateUrl: './v4-check-mail-bulk.component.html',
  styleUrl: './v4-check-mail-bulk.component.scss'
})
export class V4CheckMailBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private v4BulkPaymentService = inject(V4BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);

  /** Payments data from parent (check-mode-select: Check Mail group). */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;
  private readonly LOADER_KEY = 'check-mail-bulk';
  private _isAPILoaded = false;
  get isAPILoaded(): boolean {
    return this._isAPILoaded;
  }
  set isAPILoaded(value: boolean) {
    this._isAPILoaded = value;
    if (value) {
      this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
    }
  }

  checkMailData: ICheckMailResponse[] = [];
  userSmsEnabled = false;
  isAutoAttachmentEnabled = 0;

  shippingTypes: ICheckShipingTypes[] = [];
  shippingCalculation: IShippingCostCalculation | null = null;
  totalShippingFee = '0.00';

  /** Cost calculation state object (same shape as v3) */
  costCalculation!: IMailShippingCalculations;

  /** Attachment tracking per check: { [enc_id]: string[] } */
  attachments:
    | { [key: string]: string[] | string; fileName: string }
    | undefined;

  /** Custom address shipping state */
  customAddress = false;
  shipDisabled = false;
  shippingAddressFrom: IMailBulkShippingAddress[] = [];
  shippingAddressTo: IMailBulkShippingAddress[] = [];
  shippingVar: ICheckShipingTypes[] = [];
  mailFromId = '';
  mailToId = '';
  isMailFromEditable = false;
  isMailToEditable = false;
  currentMailFrom = ' ';
  currentMailTo = ' ';
  isEnvelopeChecked = false;
  country = '';

  /** FedEx phone number required tracking per row */
  isPhoneNumberRequired: boolean[] = [];
  showUpdatePayeeModal = false;
  smsValue = false;

  readonly MailIcon = Mail;
  readonly ChevronDownIcon = ChevronDown;
  readonly LandmarkIcon = Landmark;
  readonly PaperclipIcon = Paperclip;
  readonly PhoneIcon = Phone;
  readonly PencilIcon = Pencil;
  readonly PlusIcon = Plus;
  readonly CircleHelpIcon = CircleHelp;

  ngOnInit(): void {
    this.v4BulkPaymentService.registerChildLoading(this.LOADER_KEY);
    this.initForm();
    this.loadCheckMailDetails();
    this.loadShippingAddressFrom();
    this.loadShippingAddressTo();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkMailFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for check mail entries.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkMailFormArray') as FormArray;
  }

  /**
   * @description Loads check mail details with address validation via forkJoin.
   */
  private loadCheckMailDetails(): void {
    const checkIds = this.payments()
      .map((p) => p.transferId)
      .filter((r) => r);

    if (!checkIds.length) {
      this.isAPILoaded = true;
      return;
    }

    const ids = {
      cheque_ids: checkIds,
      shipping_type: [1, ...checkIds.map(() => 1)]
    };
    const ids2 = { ids: checkIds };

    const payeeValidation = this.checkService.payeevalidation(ids);
    const bankValidation = this.checkService.bankvalidation(ids2);
    const shippingTypes = this.checkService.getShippingType();

    this.subscription.push(
      forkJoin([payeeValidation, bankValidation, shippingTypes]).subscribe({
        next: ([payeeRes, bankRes, shippingRes]) => {
          const toAddressValidityData: { [key: string]: IAddressValidity } =
            payeeRes.data;
          const fromAddressValidityData: { [key: string]: IAddressValidity } =
            bankRes.data;
          if (shippingRes?.data) {
            this.shippingTypes = shippingRes.data;
          }

          this.subscription.push(
            this.v3BulkPaymentService
              .getCheckMailDetails({ ids: checkIds, is_signature: 1 })
              .pipe(
                finalize(() => {
                  this.isAPILoaded = true;
                })
              )
              .subscribe({
                next: (res) => {
                  this.checkMailData = res?.data?.datas || [];
                  this.userSmsEnabled =
                    res?.data?.message?.user_sms_enabled || false;
                  this.isAutoAttachmentEnabled =
                    res?.data?.message?.is_auto_attachment_enabled || 0;

                  // Apply address validity to each check
                  this.checkMailData.forEach((checkData, i) => {
                    this.checkMailData[i].toAddressValidity =
                      toAddressValidityData[checkData.enc_id];
                    this.checkMailData[i].fromAddressValidity =
                      fromAddressValidityData[checkData.enc_id];
                  });
                  this.setFormData();
                }
              })
          );
        },
        error: () => {
          // Fallback: load without validation but still load shipping types
          this.subscription.push(
            forkJoin([
              this.v3BulkPaymentService.getCheckMailDetails({
                ids: checkIds,
                is_signature: 1
              }),
              this.checkService.getShippingType()
            ])
              .pipe(
                finalize(() => {
                  this.isAPILoaded = true;
                })
              )
              .subscribe({
                next: ([res, shippingRes]) => {
                  if (shippingRes?.data) {
                    this.shippingTypes = shippingRes.data;
                  }
                  this.checkMailData = res?.data?.datas || [];
                  this.userSmsEnabled =
                    res?.data?.message?.user_sms_enabled || false;
                  this.isAutoAttachmentEnabled =
                    res?.data?.message?.is_auto_attachment_enabled || 0;
                  this.setFormData();
                }
              })
          );
        }
      })
    );
  }

  /**
   * @description Creates a form group for a single check mail payment.
   */
  checkMailFormBody(mailData: ICheckMailResponse): FormGroup {
    const defaultShippingType = this.getDefaultShippingType(
      mailData.payee_country
    );
    return this.formBuilder.group({
      payee: [mailData.payee_name],
      amount: [mailData.cheque_amount],
      checkNo: [mailData.cheque_serial_number],
      enc_id: [mailData.enc_id],
      payee_email: [mailData.payee_email, ValidationService.emailValidator],
      send_sms: [false],
      payee_phone: [mailData.payee_phone, ValidationService.phoneMinLength],
      shippingType: [defaultShippingType, Validators.required],
      cost: [0],
      attachments: [mailData.attachments || []],
      added_attachments: [mailData.added_attachments || []],
      is_exisiting_attach: [mailData.is_exisiting_attach],
      informed_payee_email: [!!mailData.payee_email],
      informed_payee_sms: [false],
      accountName: [mailData.account_name],
      country: [mailData.payee_country],
      enc_payee_id: [mailData.enc_payee_id],
      enc_bank_account_id: [mailData.enc_bank_account_id],
      toAddressValidity: [mailData.toAddressValidity],
      fromAddressValidity: [mailData.fromAddressValidity],
      mailNowPayLoad: [null]
    });
  }

  /**
   * @description Returns the default shipping type ID based on country.
   */
  private getDefaultShippingType(country: string): number | string {
    const sorted = this.sortedOption(country);
    return sorted?.length ? sorted[0].id : '';
  }

  /**
   * @description Populates the FormArray with entries from check mail details.
   */
  setFormData(): void {
    const formArray = this.getFormControl();

    this.checkMailData.forEach((mailData) => {
      const existingIndex = formArray.controls.findIndex(
        (control) =>
          (control as FormGroup).get('enc_id')?.value === mailData.enc_id
      );
      if (existingIndex !== -1) {
        formArray.removeAt(existingIndex);
      }
      formArray.push(this.checkMailFormBody(mailData));
    });

    this.calculateInitialShipping();
    this.setMailPayLoad();
  }

  /**
   * @description Initializes the costCalculation object and calculates initial shipping.
   */
  private calculateInitialShipping(): void {
    this.costCalculation = {
      mail_check_ids: [],
      all_check_ids: [],
      shipping_rate_warning: 0,
      sent_to_customer_address: 0,
      Single_mail_options: 3,
      individual_envelope: 0
    };

    for (let i = 0; i < this.checkMailData.length; i += 1) {
      const encId = this.checkMailData[i].enc_id;
      this.costCalculation.mail_check_ids.push(encId);

      const payeeCountry = this.checkMailData[i]?.payee_country?.toLowerCase();
      let mailType: number;
      if (payeeCountry === 'canada' || payeeCountry === 'ca') {
        mailType = 14;
      } else if (
        payeeCountry === 'united states' ||
        payeeCountry === 'usa' ||
        payeeCountry === 'us' ||
        !payeeCountry
      ) {
        mailType = 1;
      } else {
        mailType = 17;
      }

      this.costCalculation[encId] = {
        mail_type: mailType,
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: this.checkMailData[i].payee_phone,
        payee_email: this.checkMailData[i].payee_email,
        file_hidden: []
      };
    }

    this.costCalculation.mail_check_ids = [
      ...new Set(this.costCalculation.mail_check_ids)
    ];

    this.setExistingAttachment();
    this.calculateShippingCost(this.costCalculation);
  }

  /**
   * @description Looks for existing attachments and sets them.
   */
  private setExistingAttachment(): void {
    this.checkMailData?.forEach((el) => {
      let attachmentIds: string[] = [];
      if (el.is_exisiting_attach === 1) {
        attachmentIds =
          (el.attachments as string[])?.map((id: string) => id) || [];
      }
      if (this.attachments === undefined) {
        this.attachments = {
          [el.enc_id]: attachmentIds,
          fileName: ''
        };
      }
      this.attachments[el.enc_id] = attachmentIds;

      if (this.costCalculation[el.enc_id]) {
        const data = this.costCalculation[el.enc_id];
        this.costCalculation[el.enc_id] = {
          ...data,
          file_hidden: attachmentIds
        };
      }
    });
  }

  /**
   * @description Gets sorted shipping options based on country (matching v3 logic).
   */
  sortedOption(countryName: string): ICheckShipingTypes[] {
    if (!this.shippingTypes?.length) return [];

    const USA = ['united states', 'us', 'usa'];
    const CA = ['canada', 'ca'];
    const country = countryName?.toLowerCase();

    if (CA.includes(country)) {
      return this.shippingTypes.filter((type) => type.country === countryName);
    }
    if (USA.includes(country) || !country) {
      return this.shippingTypes.filter(
        (type) => type.country !== 'Canada' && type.country !== 'International'
      );
    }

    return this.shippingTypes.filter(
      (type) => type.country === 'International'
    );
  }

  /**
   * @description Handles shipping type change for a row.
   */
  onShippingTypeChange(index: number): void {
    const formArray = this.getFormControl();
    const formGroup = formArray.controls[index] as FormGroup;
    const encId = formGroup.get('enc_id')?.value;
    const shippingTypeId = formGroup.get('shippingType')?.value;
    const country = formGroup.get('country')?.value;

    // Update costCalculation
    if (this.costCalculation && this.costCalculation[encId]) {
      this.costCalculation[encId] = this.createCheckObject(
        encId,
        String(shippingTypeId)
      );
    }

    // FedEx phone validation
    this.onCheckShippingType(Number(shippingTypeId), index, country);

    this.calculateShippingCost(this.costCalculation);
    this.setMailPayLoad();
  }

  /**
   * @description Validates phone number for FedEx shipping types (carrier_id === 2).
   */
  onCheckShippingType(
    shippingTypeId: number,
    index: number,
    countryType: string
  ): void {
    const options = this.sortedOption(countryType);
    const selected = options.find(
      (item) => Number(item.id) === Number(shippingTypeId)
    );
    const formGroup = this.getFormControl().controls[index] as FormGroup;
    const phoneControl = formGroup.get('payee_phone');
    if (selected?.carrier_id === 2 && !this.phoneNumIsValid(true, index)) {
      this.isPhoneNumberRequired[index] = true;
      phoneControl?.setValidators([
        Validators.required,
        ValidationService.phoneMinLength
      ]);
      phoneControl?.updateValueAndValidity();
      phoneControl?.markAsTouched();
    } else {
      this.isPhoneNumberRequired[index] = false;
      phoneControl?.clearValidators();
      phoneControl?.updateValueAndValidity();
      phoneControl?.markAsUntouched();
    }
  }

  /**
   * @description Validates phone number.
   */
  phoneNumIsValid(val: boolean, index: number): boolean {
    const formGroup = this.getFormControl().controls[index] as FormGroup;
    const phoneControl = formGroup.get('payee_phone');
    if (
      val &&
      (phoneControl?.errors ||
        !phoneControl?.value ||
        phoneControl?.value === '')
    ) {
      return false;
    }
    return true;
  }

  /**
   * @description Creates a check cost object for shipping type changes.
   */
  private createCheckObject(id: string, value: string) {
    const data = this.costCalculation[id];
    let email: string | undefined;
    let phone: string | undefined;

    this.getFormControl().value.forEach((formValues: ICheckMailForm) => {
      if (formValues.enc_id === id) {
        phone = formValues.payee_phone;
        email = formValues.payee_email;
      }
    });

    return {
      check_paper: data.check_paper,
      file_hidden: this.attachments ? this.attachments[id] : [],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: data.informed_payee_sms,
      mail_type: Number(value),
      payee_email: email,
      payee_phone: phone
    };
  }

  /**
   * @description Calculates shipping cost via API.
   */
  calculateShippingCost(payload: IMailShippingCalculations): void {
    if (!payload) return;
    if (
      payload.sent_to_customer_address === 1 &&
      !payload.custom_address_shipping_type
    ) {
      return;
    }

    this.subscription.push(
      this.v3BulkPaymentService
        .checkMailShippingCostCalculation(payload)
        .subscribe({
          next: (res: IApiRes<IShippingCostCalculation>) => {
            if (res?.data) {
              this.shippingCalculation = res.data;
              this.totalShippingFee = res.data.total || '0.00';

              // Update individual row costs
              const formArray = this.getFormControl();
              formArray.controls.forEach((control) => {
                const formGroup = control as FormGroup;
                const encId = formGroup.get('enc_id')?.value;
                if (encId && res.data.single_items?.[encId] !== undefined) {
                  formGroup
                    .get('cost')
                    ?.setValue(res.data.single_items[encId], {
                      emitEvent: false
                    });
                }
              });

              // Update service subject
              this.v3BulkPaymentService.bankCheckMailShippingFeeSubject.next(
                this.totalShippingFee
              );
              this.v3BulkPaymentService.setTotalShippingFee();
            }
          }
        })
    );
  }

  /**
   * @description Sets mail payload on the form for processing.
   */
  setMailPayLoad(): void {
    const formArray = this.getFormControl();
    if (!formArray.controls.length || !this.costCalculation) return;

    formArray.controls.forEach((control) => {
      const formGroup = control as FormGroup;
      formGroup.get('mailNowPayLoad')?.setValue(this.costCalculation, {
        emitEvent: false
      });
    });
  }

  /**
   * @description Handles email checkbox toggle with validation.
   */
  onEmailToggle(index: number): void {
    const formArray = this.getFormControl();
    const formGroup = formArray.controls[index] as FormGroup;
    const emailChecked = formGroup.get('informed_payee_email')?.value;

    if (emailChecked) {
      const emailControl = formGroup.get('payee_email');
      if (
        emailControl?.errors ||
        !emailControl?.value ||
        emailControl?.value === ''
      ) {
        this.alertService.warningAlert({
          content: 'Please enter a valid email'
        });
        formGroup
          .get('informed_payee_email')
          ?.setValue(false, { emitEvent: false });
        return;
      }
    }

    const encId = formGroup.get('enc_id')?.value;
    if (this.costCalculation && this.costCalculation[encId]) {
      this.costCalculation[encId] = {
        ...this.costCalculation[encId],
        informed_payee_email: emailChecked ? 1 : 0
      };
    }

    this.calculateShippingCost(this.costCalculation);
  }

  /**
   * @description Handles SMS checkbox toggle with validation and cost recalculation.
   */
  onSmsToggle(index: number): void {
    const formArray = this.getFormControl();
    const formGroup = formArray.controls[index] as FormGroup;
    const smsEnabled = formGroup.get('send_sms')?.value;

    if (smsEnabled) {
      const phone = formGroup.get('payee_phone')?.value;
      if (!phone || phone.length < 10) {
        this.alertService.warningAlert({
          content: 'Please enter a valid phone number'
        });
        formGroup.get('send_sms')?.setValue(false, { emitEvent: false });
        return;
      }
      formGroup.get('informed_payee_sms')?.setValue(true);
      this.smsValue = true;
    } else {
      formGroup.get('informed_payee_sms')?.setValue(false);
      this.smsValue = false;
    }

    // Update costCalculation with SMS cost (10 for enabled, 0 for disabled)
    const encId = formGroup.get('enc_id')?.value;
    if (this.costCalculation && this.costCalculation[encId]) {
      this.costCalculation[encId] = this.getSmsObject(encId, smsEnabled);
    }

    this.calculateShippingCost(this.costCalculation);
    this.setMailPayLoad();
  }

  /**
   * @description Creates SMS cost object.
   */
  private getSmsObject(id: string, checkedState: boolean) {
    const data = this.costCalculation[id];
    let email: string | undefined;
    let phone: string | undefined;

    this.getFormControl().value.forEach((formValues: ICheckMailForm) => {
      if (formValues.enc_id === id) {
        phone = formValues.payee_phone;
        email = formValues.payee_email;
      }
    });

    return {
      check_paper: data.check_paper,
      file_hidden: this.attachments ? this.attachments[id] : [],
      informed_payee_email: data.informed_payee_email,
      informed_payee_sms: checkedState ? 10 : 0,
      mail_type: data.mail_type,
      payee_email: email,
      payee_phone: phone
    };
  }

  /**
   * @description Gets the attachment count for a specific row.
   */
  getAttachmentCount(encId: string): number {
    if (this.attachments && this.attachments[encId]) {
      return (this.attachments[encId] as string[])?.length || 0;
    }
    return 0;
  }

  /**
   * @description Opens the attachment modal for a check.
   */
  openAttachmentModal(checkId: string, index: number): void {
    const smsVal = this.smsValue ? 10 : 0;

    const attachmentModal = this.dialog.open(V4CheckAddAttachmentModalComponent, {
      disableClose: true,
      maxWidth: '1010px',
      width: '630px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        checkId,
        acceptFormats: '.pdf',
        attachId: this.attachments ? this.attachments[checkId] : [],
        type: 'mail',
        cost: this.shippingCalculation?.page_cost
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
            } else {
              this.attachments[data.checkId] = data.ids;
            }

            // Update costCalculation with new attachments
            if (this.costCalculation && this.costCalculation[data.checkId]) {
              const costData = this.costCalculation[data.checkId];
              let email: string | undefined;
              let phone: string | undefined;
              this.getFormControl().value.forEach(
                (formValues: ICheckMailForm) => {
                  if (formValues.enc_id === data.checkId) {
                    phone = formValues.payee_phone;
                    email = formValues.payee_email;
                  }
                }
              );

              this.costCalculation[data.checkId] = {
                check_paper: costData.check_paper,
                file_hidden: this.attachments[data.checkId] as string[],
                informed_payee_email: costData.informed_payee_email,
                informed_payee_sms: smsVal,
                mail_type: costData.mail_type,
                payee_email: email,
                payee_phone: phone
              };
            }

            this.calculateShippingCost(this.costCalculation);
          }
        }
      );
  }

  /**
   * @description Opens the update payee modal for invalid To address.
   */
  openEditPayeeAddress(
    payeeId: string,
    checkNo: string,
    checkId: string
  ): void {
    if (this.showUpdatePayeeModal) return;
    this.showUpdatePayeeModal = true;

    this.subscription.push(
      this.payeeService
        .showPayee(payeeId)
        .pipe(
          finalize(() => {
            this.showUpdatePayeeModal = false;
          })
        )
        .subscribe((re) => {
          const editPayeeData: IViewPayee = re.data;
          if (editPayeeData) {
            const dialog = this.dialog.open(UpdatePayeeModalV4Component, {
              maxWidth: '95%',
              width: '700px',
              panelClass: 'paddingless-modal-rounded',
              data: {
                checkNo,
                EditPayeeData: editPayeeData,
                id: payeeId,
                checkid: checkId
              }
            });
            dialog.afterClosed().subscribe((res) => {
              if (res) {
                // Mark the To address as valid in the form
                this.getFormControl().controls.forEach((control) => {
                  const fg = control as FormGroup;
                  if (fg.get('enc_payee_id')?.value === payeeId) {
                    fg.get('toAddressValidity')?.setValue({ success: true });
                  }
                });
              }
              // Reload the data
              this.reloadCheckMailDetails();
            });
          }
        })
    );
  }

  /**
   * @description Opens the update bank modal for invalid From address.
   */
  openEditBankAddress(bankAccountId: string, checkNo: string): void {
    const dialog = this.dialog.open(UpdateBankModalV4Component, {
      maxWidth: '95%',
      width: '600px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: bankAccountId,
        checkNo
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.getFormControl().controls.forEach((control) => {
          const fg = control as FormGroup;
          if (fg.get('enc_bank_account_id')?.value === bankAccountId) {
            fg.get('fromAddressValidity')?.setValue({ success: true });
          }
        });
      }
      this.reloadCheckMailDetails();
    });
  }

  /**
   * @description Reloads check mail details after address edits.
   */
  private reloadCheckMailDetails(): void {
    const checkIds = this.payments()
      .map((p) => p.transferId)
      .filter((r) => r);
    if (!checkIds.length) return;

    const ids = {
      cheque_ids: checkIds,
      shipping_type: [1, ...checkIds.map(() => 1)]
    };
    const ids2 = { ids: checkIds };

    this.subscription.push(
      forkJoin([
        this.checkService.payeevalidation(ids),
        this.checkService.bankvalidation(ids2)
      ]).subscribe({
        next: ([payeeRes, bankRes]) => {
          const toData = payeeRes.data;
          const fromData = bankRes.data;

          this.subscription.push(
            this.v3BulkPaymentService
              .getCheckMailDetails({ ids: checkIds, is_signature: 1 })
              .subscribe({
                next: (res) => {
                  this.checkMailData = res?.data?.datas || [];
                  this.checkMailData.forEach((checkData) => {
                    const currentCheck = this.checkMailData.find(
                      (c) => c.enc_id === checkData.enc_id
                    );
                    if (currentCheck) {
                      currentCheck.toAddressValidity = toData[checkData.enc_id];
                      currentCheck.fromAddressValidity =
                        fromData[checkData.enc_id];
                    }
                  });
                  this.setFormData();
                }
              })
          );
        }
      })
    );
  }

  // ─── Custom Address Shipping Section ─────────────────────────────────

  /**
   * @description Handles radio button change for payee vs custom address.
   */
  onShippingAddressChange(type: 'payee' | 'custom'): void {
    if (type === 'custom') {
      this.customAddress = true;
      this.shipDisabled = true;
      this.v3BulkPaymentService.isCustomAddress.next(this.customAddress);
      this.costCalculation.sent_to_customer_address = 1;
      this.costCalculation.custom_address_shipping_type = undefined;
      this.toggleShippingTypeControls(true);
    } else {
      this.customAddress = false;
      this.shipDisabled = false;
      this.isEnvelopeChecked = false;
      this.costCalculation.sent_to_customer_address = 0;
      this.costCalculation.custom_address_shipping_type = undefined;
      this.toggleShippingTypeControls(false);
      this.calculateShippingCost(this.costCalculation);
    }
  }

  private toggleShippingTypeControls(disable: boolean): void {
    this.getFormControl().controls.forEach((control) => {
      const shippingType = (control as FormGroup).get('shippingType');
      if (disable) {
        shippingType?.disable();
      } else {
        shippingType?.enable();
      }
    });
  }

  /**
   * @description Loads Mail From addresses.
   */
  loadShippingAddressFrom(): void {
    this.subscription.push(
      this.checkService
        .getAddressFrom()
        .subscribe((res: IApiRes<IMailBulkShippingAddress[]>) => {
          if (res?.data) {
            this.shippingAddressFrom = res.data;
          }
        })
    );
  }

  /**
   * @description Loads Mail To addresses.
   */
  loadShippingAddressTo(): void {
    this.subscription.push(
      this.checkService
        .getAddressTo()
        .subscribe((res: IApiRes<IMailBulkShippingAddress[]>) => {
          if (res?.data) {
            this.shippingAddressTo = res.data;
          }
        })
    );
  }

  /**
   * @description Handles Mail From dropdown change.
   */
  onMailFromChange(mailFromId?: string): void {
    const id = mailFromId || this.currentMailFrom;
    if (!id || id === ' ') {
      this.isMailFromEditable = false;
      return;
    }
    this.mailFromId = id;
    this.isMailFromEditable = true;

    this.subscription.push(
      this.checkService
        .getFromSingleId(this.mailFromId)
        .subscribe((res: IApiRes<IMailSingleShippingAddress>) => {
          this.costCalculation.shipping_from = res.data.id;
          if (this.costCalculation.shipping_to) {
            this.setShippingType(this.country);
          }
        })
    );
  }

  /**
   * @description Handles Mail To dropdown change.
   */
  onMailToChange(mailToId?: string): void {
    const id = mailToId || this.currentMailTo;
    if (!id || id === ' ') {
      this.isMailToEditable = false;
      return;
    }
    this.mailToId = id;
    this.isMailToEditable = true;

    this.subscription.push(
      this.checkService
        .getToSingleId(this.mailToId)
        .subscribe((res: IApiRes<IMailSingleShippingAddress>) => {
          this.country = res.data.country;
          this.costCalculation.shipping_to = res.data.id;
          if (this.costCalculation.shipping_from) {
            this.setShippingType(this.country);
          }
        })
    );
  }

  /**
   * @description Sets the shipping type options based on the Mail To country.
   */
  private setShippingType(country: string): void {
    if (country === 'Canada') {
      this.shippingVar = this.shippingTypes.filter((type) => type.id === 16);
    } else if (country === 'United States') {
      this.shippingVar = this.shippingTypes.filter(
        (type) => type.id === 4 || type.id === 5 || type.id === 12
      );
    } else {
      this.shippingVar = this.shippingTypes.filter(
        (type) => type.country === 'International' && type.id === 18
      );
    }
    if (this.shippingVar?.length) {
      this.costCalculation.custom_address_shipping_type =
        this.shippingVar[0].id;
      this.calculateShippingCost(this.costCalculation);
    }
  }

  /**
   * @description Opens the Add Mail Address modal.
   */
  openAddMailAddressModal(selectedAddressType: string): void {
    const addMailAddress = this.dialog.open(AddMailAddressModalV4Component, {
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        dataKey: selectedAddressType,
        isForUpdate:
          selectedAddressType === 'mail-from'
            ? this.isMailFromEditable
            : this.isMailToEditable,
        id: selectedAddressType === 'mail-to' ? this.mailToId : this.mailFromId
      }
    });

    addMailAddress.afterClosed().subscribe((data) => {
      if (!data) return;

      if (data.type !== 'delete' && data.mode !== 'update') {
        if (data.type === 'mail-from') {
          this.loadShippingAddressFrom();
          this.currentMailFrom = data.id;
          this.mailFromId = data.id;
          this.isMailFromEditable = true;
          this.onMailFromChange(data.id);
        } else {
          this.loadShippingAddressTo();
          this.currentMailTo = data.id;
          this.mailToId = data.id;
          this.isMailToEditable = true;
          this.handleMailToCountry(data.data?.country);
          this.onMailToChange(this.mailToId);
        }
      } else if (data.mode === 'update' && data.type !== 'delete') {
        if (data.type === 'mail-from') {
          this.loadShippingAddressFrom();
          this.onMailFromChange(data.id);
        } else if (data.type === 'mail-to') {
          this.loadShippingAddressTo();
          this.handleMailToCountry(data.data?.country);
        }
      }

      if (data.type === 'delete' && data.mode === 'mail-from') {
        this.isMailFromEditable = false;
        this.loadShippingAddressFrom();
      }
      if (data.type === 'delete' && data.mode === 'mail-To') {
        this.isMailToEditable = false;
        this.loadShippingAddressTo();
      }
    });
  }

  /**
   * @description Handles filtering shipping types based on Mail To country.
   */
  private handleMailToCountry(country: string): void {
    if (!country) return;
    if (country === 'Canada') {
      this.shippingVar = this.shippingTypes.filter(
        (type) => type.country === country
      );
      this.country = 'Canada';
    } else if (country === 'United States') {
      this.shippingVar = this.shippingTypes.filter(
        (type) => type.country === null
      );
    } else {
      this.shippingVar = this.shippingTypes.filter(
        (type) => type.country === 'International'
      );
    }
    if (this.shippingVar?.length) {
      this.costCalculation.custom_address_shipping_type =
        this.shippingVar[0].id;
      this.calculateShippingCost(this.costCalculation);
    }
  }

  /**
   * @description Handles custom shipping type dropdown change.
   */
  onCustomShippingTypeChange(): void {
    this.calculateShippingCost(this.costCalculation);
  }

  /**
   * @description Handles individual envelope checkbox toggle.
   */
  onChangeEnvelope(): void {
    this.costCalculation.individual_envelope = this.isEnvelopeChecked ? 1 : 0;
    this.calculateShippingCost(this.costCalculation);
  }

  ngOnDestroy(): void {
    this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
