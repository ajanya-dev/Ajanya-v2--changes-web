import { environment } from 'src/environments/environment';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  inject
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane, faQuestionCircle, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NonNullableFormValue } from 'src/app/models/api';

@Component({
  selector: 'app-get-paid-by-link',
  templateUrl: './get-paid-by-link.component.html',
  styleUrls: ['./get-paid-by-link.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgFor,
    DropDownBankComponent,
    MatTooltip,
    NgIf,
    MatCheckbox,
    NgClass,
    FontAwesomeModule,
    CommonButtonV35Component,
    MatDialogClose
  ]
})
export class GetPaidByLinkComponent implements OnInit, OnDestroy {
  private sharedService = inject(SharedService);
  private route = inject(ActivatedRoute);
  private paymentLinkService = inject(PaymentLinkService);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef, { optional: true });
  private dialogData = inject<{ selectedBankId: string }>(MAT_DIALOG_DATA, {
    optional: true
  });

  @ViewChild('toggleButton') toggleButton: ElementRef;
  @ViewChild('menu') menu: ElementRef;

  @ViewChild('click') click: ElementRef;
  @ViewChild('isactive') isactive: ElementRef;

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  faQuestionCircle = faQuestionCircle;
  faXmark = faXmark;
  stripe = false;
  paypal = false;
  stripeCheckout = false;
  bitpay = false;
  subscriptions: Subscription[] = [];
  selectedId!: any;
  shortUrl = '6205ec7d';
  imagePath: any;
  imgURL!: string | ArrayBuffer | null;
  imgVisisble = false;
  imgName = 'Choose file';
  showAdvance = false;
  showLink = false;
  getUrls: any;
  selectedLink = '';
  isActive = 0;
  isCall = false;
  resMsg: string | undefined;
  colorClass: string;
  template: any;
  paymentOptions: any;
  selectedPaymentOptions: { [k: number]: any } = {};
  logo: any;
  generateLink = false;
  isClick = false;
  isLoading = false;
  environment = environment;
  redirectUrl: string;
  isUpdateLink: boolean;
  faPaperPlane = faPaperPlane;

  createLinkForm = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    formTempleteId: new FormControl<number | null>(null, [Validators.required]),
    bankAccountId: new FormControl<string | null>(null, [Validators.required]),
    company_name: new FormControl<string | null>(null),
    bottomText: new FormControl<string | null>(null),
    shortUrl: new FormControl<string | null>(null),
    redirectUrl: new FormControl<string | null>(null),
    autoRedirect: new FormControl<boolean | null>(null),
    isBankVerifyRequired: new FormControl<boolean | null>(null),
    is_payee_company_required: new FormControl<boolean | null>(null),
    deduct_service_fee_from_main_amount: new FormControl<boolean | null>(null),
    address_needed: new FormControl<boolean | null>(null),
    photo: new FormControl<string | null>(null),
    allow_check_number: new FormControl<boolean | null>(null)
  });

  currentUrl: string;

  constructor() {
    this.route.queryParams.subscribe((data) => {
      this.redirectUrl = data.redirectUrl;

      if (data.from) {
        this.generateLink = false;
      } else {
        this.generateLink = true;
      }
    });

    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        e.target !== this.toggleButton.nativeElement &&
        e.target !== this.menu?.nativeElement
      ) {
        this.showLink = false;
      }
    });

    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        e.target !== this.click.nativeElement &&
        e.target !== this.isactive.nativeElement
      ) {
        if (this.isCall && this.shortUrl !== '' && this.isActive != 1) {
          this.checkAvailabilityUrl(this.shortUrl);
        }
      }
    });
  }

  ngOnInit(): void {
    this.selectedId =
      this.dialogData?.selectedBankId ?? this.route.snapshot.paramMap.get('id');

    if (this.selectedId != null && !this.generateLink) {
      this.getPaymentData(this.selectedId);
    }

    this.getTemplate();
    this.getRedirectUrl();
    this.getPaymentOptionsData();

    if (this.generateLink) {
      this.sharedService.setNewBankCreatedData({
        bankAccountId: this.selectedId
      });
      this.createLinkForm.controls.bankAccountId.setValue(this.selectedId);
    }
  }

  advanceToggle() {
    this.showAdvance = !this.showAdvance;
  }

  onsubmit(): void {
    this.createLinkForm.markAllAsTouched();
    this.isClick = true;

    if (this.createLinkForm.invalid) {
      return;
    }
    if (
      this.selectedLink === '' &&
      this.createLinkForm.controls.autoRedirect.value
    ) {
      return;
    }
    if (
      (this.stripe && this.selectedPaymentOptions[1] == undefined) ||
      (this.paypal && this.selectedPaymentOptions[2] == undefined) ||
      (this.bitpay && this.selectedPaymentOptions[3] == undefined) ||
      (this.stripeCheckout && this.selectedPaymentOptions[4] == undefined)
    ) {
      return;
    }
    if (this.createLinkForm.value.redirectUrl) {
      if (
        this.createLinkForm.value.redirectUrl?.indexOf('http://') == 0 ||
        this.createLinkForm.value.redirectUrl?.indexOf('https://') == 0
      ) {
        this.createLinkForm.controls.redirectUrl.setValue(
          this.createLinkForm.value.redirectUrl
        );
      } else {
        this.createLinkForm.controls.redirectUrl.setValue(
          'https://' + this.createLinkForm.value.redirectUrl
        );
      }
    }
    const data = this.setFormData();

    if (this.selectedId == null || this.generateLink) {
      this.createPaymentLink(data);
    } else {
      this.isUpdateLink = true;
      this.checkAvailabilityUrl(this.shortUrl);
    }
  }

  patchLinkName(name: any) {
    this.isCall = true;
    this.shortUrl = name;
  }

  paymentOption(_env: any, number: number) {
    if (number == 1) {
      this.stripe = !this.stripe;
      if (!this.stripe) {
        delete this.selectedPaymentOptions[number];
      }
    } else if (number == 2) {
      this.paypal = !this.paypal;
      if (!this.paypal) {
        delete this.selectedPaymentOptions[number];
      }
    } else if (number == 4) {
      this.stripeCheckout = !this.stripeCheckout;
      if (!this.stripeCheckout) {
        delete this.selectedPaymentOptions[number];
      }
    } else if (number == 3) {
      this.bitpay = !this.bitpay;
      if (!this.bitpay) {
        delete this.selectedPaymentOptions[number];
      }
    }
  }

  getName(name: any) {
    const urlArr = name?.toLowerCase()?.trim().replace(/\s\s+/g, ' ').split('');

    for (let i = 0; i < urlArr.length; i++) {
      if (urlArr[i] === ' ' && i !== urlArr.length - 1) {
        urlArr[i] = '-';
      }
    }

    this.shortUrl = urlArr.join('');

    this.isCall = true;
  }

  getSelectedBank(env: any) {
    this.isClick = false;
    if (env == undefined) {
      this.createLinkForm.controls.bankAccountId.setValue('');
      this.createLinkForm.controls.company_name.patchValue('');
    } else {
      this.createLinkForm.controls.bankAccountId.setValue(env.id);
      this.createLinkForm.controls.company_name.patchValue(env.name);
    }
  }

  getValue(env: any) {
    this.shortUrl = env.target.value;
  }

  getFile(files: any) {
    if (files.length === 0) {
      return;
    }

    const mimeType = files[0].type;
    const size = Math.round(files[0].size / 1024);

    if (mimeType.match(/image\/*/) == null) {
      this.imgVisisble = false;
      this.errorMsg('Sorry, could not upload this file');
      return;
    }
    if (size > 2048) {
      this.imgVisisble = false;
      this.errorMsg(
        `${this.imgName} file size exceeds maximum limit. Maximum allowed file size is 2 MB`
      );
      return;
    }

    this.imgName = files[0].name;

    const reader = new FileReader();
    this.imagePath = files;
    reader.readAsDataURL(files[0]);
    reader.onload = () => {
      this.imgURL = reader.result;
      this.imgVisisble = true;
    };

    this.logo = files[0];
    this.createLinkForm.controls.photo.setValue(files[0]);
  }

  deleteLogo(selectedId: any) {
    const res = this.confirmAlert('Are you sure you want to delete?');
    res.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.paymentLinkService
            .deletePaymentLogo(selectedId)
            .subscribe((res: any) => {
              if (res.success) {
                this.imgVisisble = false;
                this.createLinkForm.controls.photo.setValue('');
                this.imgName = 'Choose file';
              }
            })
        );
      }
    });
  }

  // }

  close() {
    this.imgVisisble = false;
    this.createLinkForm.controls.photo.setValue('');
    this.imgName = 'Choose file';
  }

  confirmAlert(content: string) {
    const data = {
      title: 'Alert!',
      content: content,
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, delete it!',
      isCancel: true
    };
    return this.alertService.warningAlert(data);
  }

  errorMsg(msg: string) {
    const data = {
      title: 'Upload failed',
      content: msg,
      isCancel: false,
      okMsg: 'Ok'
    };

    this.alertService.warningAlert(data);
  }

  checkAvailabilityUrl(name: string) {
    if (
      this.currentUrl === name &&
      !(this.selectedId == null || this.generateLink)
    ) {
      this.updatePaymentLink(this.setFormData(), this.selectedId);
      return;
    }

    this.createLinkForm.controls.shortUrl.setValue(name);
    this.isActive = 1;
    this.subscriptions.push(
      this.paymentLinkService
        .shortUrlCheck(name)
        .pipe(
          catchError((err) => {
            this.isActive = 2;
            this.isCall = false;
            if (!this.isUpdateLink) {
              this.colorClass = 'text-danger';
              this.resMsg = err.error.errorMsg;
            } else {
              this.resMsg = undefined;
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isActive = 2;
            this.isCall = false;
            this.colorClass = 'text-active';
            this.resMsg = res.message;
            if (this.isUpdateLink) {
              this.updatePaymentLink(this.setFormData(), this.selectedId);
              this.isUpdateLink = false;
            }
          }
        })
    );
  }

  open() {
    this.showLink = true;
  }

  selectedPaymentOption(value: any, type: number) {
    this.isClick = false;
    const values = {
      status: 1,
      id: value
    };
    this.selectedPaymentOptions[type] = values;
  }

  getRedirectUrl() {
    this.subscriptions.push(
      this.paymentLinkService.getRedirectUrl().subscribe((res) => {
        if (res.success) {
          this.getUrls = res.data;
        }
      })
    );
  }

  getPaymentData(id: string) {
    this.subscriptions.push(
      this.paymentLinkService.getPaymentLinkData(id).subscribe((res) => {
        if (res.success) {
          const response = res.data;
          if (
            response.isPayeeCompanyRequired === '1' ||
            response.addressNeeded === '1' ||
            response.allowCheckNumber === '1'
          ) {
            this.showAdvance = true;
          }
          document.getElementById('small')?.classList.add('active');
          document.getElementById('hello')?.classList.add('hidden');

          this.sharedService.setNewBankCreatedData({
            bankAccountNickName: response.bankAccount.bankAccountNickName
          });

          const checkIsOne = (param: string | number) => {
            return param === 1 || param === '1';
          };

          this.createLinkForm.patchValue({
            name: response.name,
            formTempleteId: response.formTemplateId,
            bankAccountId: response.bankAccountId,
            bottomText: response.bottomText != null ? response.bottomText : '',
            autoRedirect: checkIsOne(response.autoRedirect),
            isBankVerifyRequired: checkIsOne(response.bankVerificationRequired),
            address_needed: checkIsOne(response.addressNeeded),
            allow_check_number: checkIsOne(response.allowCheckNumber),
            shortUrl: response.shortUrl,
            redirectUrl: response.redirectUrl ?? '',
            deduct_service_fee_from_main_amount: checkIsOne(
              response.deductServiceFeeFromMainAmount
            ),
            is_payee_company_required: checkIsOne(
              response.isPayeeCompanyRequired
            )
          });

          this.createLinkForm.controls.company_name.patchValue(
            response.companyName
          );
          this.selectedLink = response.redirectUrl;
          this.shortUrl = response.shortUrl;
          this.currentUrl = response.shortUrl;

          if (response.logoUrl) {
            this.imgURL = response.logoUrl;
            this.imgVisisble = true;
          }

          this.selectedPaymentOptions = response.paymentOption;
          if (this.selectedPaymentOptions) {
            if (this.selectedPaymentOptions[1]) {
              this.stripe = true;
            }
            if (this.selectedPaymentOptions[2]) {
              this.paypal = true;
            }
            if (this.selectedPaymentOptions[3]) {
              this.bitpay = true;
            }
            if (this.selectedPaymentOptions[4]) {
              this.stripeCheckout = true;
            }
          }
        }
      })
    );
  }

  getTemplate() {
    this.subscriptions.push(
      this.paymentLinkService.getTemplate().subscribe((res) => {
        if (res.success) {
          this.template = res.data;
        }
      })
    );
  }

  getSelected(item: string) {
    this.selectedLink = item;
    this.createLinkForm.controls.redirectUrl.patchValue(this.selectedLink);
  }

  createPaymentlinkBody() {
    return <NonNullableFormValue<typeof this.createLinkForm.value>>(
      this.createLinkForm.value
    );
  }

  setFormData() {
    const formData = new FormData();
    const body = this.createPaymentlinkBody();
    for (const key in body) {
      const typedKey = key as keyof typeof this.createLinkForm.value;
      const value =
        this.createLinkForm.value[
          typedKey as keyof typeof this.createLinkForm.value
        ];
      if (
        typedKey !== 'company_name' &&
        typedKey !== 'is_payee_company_required' &&
        typedKey !== 'address_needed' &&
        typedKey !== 'allow_check_number' &&
        typedKey !== 'deduct_service_fee_from_main_amount'
      ) {
        formData.append(typedKey, `${value ?? ''}`);
      }
    }
    formData.append(
      'autoRedirect',
      this.createPaymentlinkBody().autoRedirect == true ? '1' : '0'
    );
    formData.append(
      'isBankVerifyRequired',
      this.createPaymentlinkBody().isBankVerifyRequired == true ? '1' : '0'
    );

    const setting = {
      company_name: body.company_name,
      is_payee_company_required:
        body.is_payee_company_required === true ? '1' : '0',
      address_needed: body.address_needed === true ? '1' : '0',
      allow_check_number: body.allow_check_number === true ? '1' : '0',
      deduct_service_fee_from_main_amount:
        body.deduct_service_fee_from_main_amount === true ? '1' : '0'
    };

    for (const key in setting) {
      const value = setting[key as keyof typeof setting];
      formData.append(`settings[${key}]`, value);
    }

    for (const keys in this.selectedPaymentOptions) {
      for (const key in this.selectedPaymentOptions[keys]) {
        const value = this.selectedPaymentOptions[keys][key];
        formData.append(`paymentOption[${keys}][${key}]`, value);
      }
    }

    return formData;
  }

  enteredLink(value: any) {
    this.selectedLink = value;
    if (value === '') {
      this.showLink = true;
    } else {
      this.showLink = false;
    }
    this.createLinkForm.controls.redirectUrl.patchValue(this.selectedLink);
  }

  createPaymentLink(data: any) {
    this.isLoading = true;
    this.subscriptions.push(
      this.paymentLinkService
        .createLink(data)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          this.isLoading = false;
          if (res.success) {
            this.successAlert('Payment link created');
            if (this.dialogData?.selectedBankId) {
              this.dialogRef?.close(true);
            } else if (this.generateLink && this.selectedId == null) {
              this.router.navigateByUrl('manage/payment-links/index');
            } else if (this.redirectUrl) {
              this.router.navigateByUrl(this.redirectUrl);
            } else {
              this.router.navigateByUrl('manage/receivedchecks/requestcheck');
            }
          }
        })
    );
  }

  updatePaymentLink(data: any, id: string) {
    this.isLoading = true;
    this.subscriptions.push(
      this.paymentLinkService
        .updateLink(data, id)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          this.isLoading = false;
          if (res.success) {
            this.successAlert('Payment link updated');
            this.router.navigateByUrl('manage/payment-links/index');
          }
        })
    );
  }

  successAlert(msg: string) {
    const data = {
      title: 'Success',
      content: msg,
      close: true
    };
    this.alertService.successAlert(data);
  }

  getPaymentOptionsData() {
    this.subscriptions.push(
      this.paymentLinkService.paymentOptions().subscribe((res) => {
        if (res.success) {
          this.paymentOptions = res.data;
        }
      })
    );
  }

  preventBackSlash(event: KeyboardEvent) {
    if (event.key === '/' || event.key === '\\') {
      event.preventDefault();
    }
  }

  onClose() {
    if (this.dialogData?.selectedBankId) {
      this.dialogRef?.close(false);
    } else {
      this.router.navigateByUrl('/manage/payment-links/index');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
