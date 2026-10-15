import { DatePipe, NgClass, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProcessCardService } from 'src/app/shared/service/provess-card/process-card.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { Utils } from 'src/app/data/utils';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  IProcessCardForm,
  IProcessCardFormBody
} from '../../models/process-card';
import { MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-process-card',
  templateUrl: './process-card.component.html',
  styleUrls: ['./process-card.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    MatDialogActions,
    MatDialogClose
  ]
})
export class ProcessCardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private processCardService = inject(ProcessCardService);
  private router = inject(Router);
  private googleAddressService = inject(GoogleAddressService);
  private datePipe = inject(DatePipe);
  private bankAccService = inject(BankAccountsService);

  step = 1;
  form: FormGroup<IProcessCardForm>;
  subscriptions: Subscription[] = [];
  btnDisabled = false;
  newDate: string | number;
  id = 'business';
  applicationStatus = 0;
  isProcessCardEligble = 0;
  formInvalid = false;
  dateInvalid = false;
  dobInvalid = false;

  utils = Utils;

  ngOnInit(): void {
    this.initForm();
    this.getDate();
    this.checkStatus();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  upRoutingNumber(event: Event) {
    const routNo = (event.target as HTMLInputElement).value;

    if (routNo.length >= 9) {
      this.subscriptions.push(
        this.bankAccService.getroutingNumber(routNo).subscribe((res) => {
          const bankDetails = res.data;

          this.form.patchValue({
            bankName: bankDetails.name?.trim(),
            bankAccountStreetAddress: bankDetails.address?.trim(),
            bankCity: bankDetails.city?.trim(),
            bankState: bankDetails.state?.trim(),
            bankZip: bankDetails.zip?.toString()
          });
        })
      );
    } else {
      this.form.patchValue({
        bankName: '',
        bankAccountStreetAddress: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  initForm() {
    this.form = this.fb.group({
      businessName: ['', [Validators.required]],
      dbaName: ['', [Validators.required]],
      businessAddress: ['', [Validators.required]],
      businessCity: ['', [Validators.required]],
      businessState: ['', [Validators.required]],
      businessZip: ['', [Validators.required]],
      businessPhone: [
        '',
        [Validators.required, ValidationService.phoneNumberValidator]
      ],
      businessFax: [''],
      businessEmail: [
        '',
        [Validators.required, ValidationService.emailValidator]
      ],
      requestedServiceStartDate: ['', [Validators.required]],
      dateFlexible: ['', [Validators.required]],

      productsSold: ['', [Validators.required]],
      fedTaxId: ['', [Validators.required]],
      fedIdStarted: ['', [Validators.required]],
      faxFillinType: ['', [Validators.required]],

      taxExemptOrganization: ['', [Validators.required]],
      numberOfEmployees: ['', [Validators.required]],
      totalGrossAnnualSales: ['', [Validators.required]],
      estimatedAnnualCreditCardSales: ['', [Validators.required]],
      estimatedAverageCreditCardSaleAmount: ['', [Validators.required]],
      estimatedHeighestCreditCardSaleAmount: ['', [Validators.required]],

      signorName: [''],
      signorTitle: [''],
      signorEmail: [''],
      signorPercentageOwnership: [''],
      signorSocialSecurity: [''],
      signorDateOfBirth: [''],
      signorPhone: [''],
      signorAddress: [''],
      signorCity: [''],
      signorState: [''],
      signorZip: [''],

      BankName: [''],
      BankAccountNo: [''],
      BankRoutingNo: [''],
      BankPhone: [''],
      attachment: ['']
    }) as unknown as FormGroup<IProcessCardForm>;
  }

  fomBody() {
    const formData = new FormData();
    const data = this.form.value;
    const formValues: IProcessCardFormBody = {
      businessLegalName: data.businessName,
      dbaName: data.dbaName,
      businessAddress: data.businessAddress,
      businessCity: data.businessCity,
      businessState: data.businessState,
      businessZip: data.businessZip,
      businessPhone: data.businessPhone,
      businessFax: data.businessFax,
      businessEmail: data.businessEmail,
      serviceStartDate: data.requestedServiceStartDate,
      isDateFlexible: data.dateFlexible,

      productSold: data.productsSold,
      fedTaxId: data.fedTaxId,
      fedStarted: data.fedIdStarted,
      taxFillingType: data.faxFillinType,

      taxExemptOrganization: data.taxExemptOrganization,
      numberOfEmployees: data.numberOfEmployees,
      totalGross: data.totalGrossAnnualSales,
      estimatedCreditCardSales: data.estimatedAnnualCreditCardSales,
      avgCreditCardSale: data.estimatedAverageCreditCardSaleAmount,
      highestCreditCardSale: data.estimatedHeighestCreditCardSaleAmount,

      signorOwner: data.signorName,
      signorTitle: data.signorTitle,
      signorEmail: data.signorEmail,
      signorOwnership: data.signorPercentageOwnership,
      signorSsn: data.signorSocialSecurity,
      signorDob: data.signorDateOfBirth,
      signorPhone: data.signorPhone,
      signorAddress: data.signorAddress,
      signorCity: data.signorCity,
      signorState: data.signorState,
      signorZip: data.signorZip,

      depositBankName: data.BankName,
      depositBankAccount: data.BankAccountNo,
      depositBankRouting: data.BankRoutingNo,
      depositBankPhone: data.BankPhone,

      providerStatementAttachment: data.attachment
    } as IProcessCardFormBody;

    Object.keys(formValues).forEach((key) => {
      const value = formValues[key as keyof IProcessCardFormBody];
      formData.append(key, value as string);
    });

    return formData;
  }

  checkStatus() {
    this.subscriptions.push(
      this.processCardService.processCardStstus().subscribe((res) => {
        if (res.success) {
          this.applicationStatus = res?.data?.applicationStatus;
          this.isProcessCardEligble = res?.data?.isProcessCardEligble;
          this.goToApplication();
        }
      })
    );
  }

  goToApplication() {
    if (this.isProcessCardEligble && this.applicationStatus === 0) {
      this.router.navigateByUrl(
        '/manage/business-tools/process-card/process'
      );
    } else if (this.isProcessCardEligble && this.applicationStatus === 1) {
      this.router.navigate(['/manage/business-tools/process-card/success'], {
        queryParams: { status: 'submitted' }
      });
    } else if (this.isProcessCardEligble && this.applicationStatus === 2) {
      this.router.navigate(['/manage/business-tools/process-card/success'], {
        queryParams: { status: 'approved' }
      });
    }
  }

  next(ev: number) {
    if (ev === 2) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        if (
          (this.form.controls.requestedServiceStartDate.value as string) >
          this.newDate
        ) {
          this.dateInvalid = true;
          return;
        }
        this.dateInvalid = false;

        this.formInvalid = true;
        return;
      }
      if (this.form.valid) {
        if (
          (this.form.controls.requestedServiceStartDate.value as string) >
          this.newDate
        ) {
          this.dateInvalid = true;
          return;
        }
        this.dateInvalid = false;
      }

      if (this.form.valid || !this.dateInvalid) {
        this.id = 'signor';
        this.step = ev;

        this.formInvalid = false;
      }
    }

    if (ev === 1) {
      this.formFields2.forEach((el) => {
        this.form.controls[el as keyof IProcessCardForm].clearValidators();
        this.form.controls[
          el as keyof IProcessCardForm
        ].updateValueAndValidity();
      });
      this.id = 'business';
      this.step = ev;
    }

    if (ev === 3) {
      this.id = 'success';
      this.form.markAllAsTouched();
      this.formFields2.forEach((el) => {
        this.form.controls[el as keyof IProcessCardForm].setValidators(
          Validators.required
        );
        this.form.controls[
          el as keyof IProcessCardForm
        ].updateValueAndValidity();
        if (el === 'signorEmail') {
          this.form.controls.signorEmail.setValidators([
            Validators.required,
            ValidationService.emailValidator
          ]);
          this.form.controls.signorEmail.updateValueAndValidity();
        }
        if (el === 'signorPhone') {
          this.form.controls.signorPhone.setValidators([
            Validators.required,
            ValidationService.phoneNumberValidator
          ]);
          this.form.controls.signorPhone.updateValueAndValidity();
        }
        if (el === 'BankRoutingNo') {
          this.form.controls.BankRoutingNo.setValidators([
            Validators.required,
            ValidationService.routingNumberValidator
          ]);
          this.form.controls.BankRoutingNo.updateValueAndValidity();
        }
        if (el === 'BankPhone') {
          this.form.controls.BankPhone.setValidators([
            Validators.required,
            ValidationService.phoneNumberValidator
          ]);
          this.form.controls.BankPhone.updateValueAndValidity();
        }
      });

      if (this.form.valid) {
        if (
          (this.form.controls.signorDateOfBirth.value as string) > this.newDate
        ) {
          this.dobInvalid = true;
          return;
        }
        this.dobInvalid = false;
        this.btnDisabled = true;
        this.subscriptions.push(
          this.processCardService
            .sendCloverForm(this.fomBody())
            .pipe(
              finalize(() => {
                this.btnDisabled = false;
              })
            )
            .subscribe((res) => {
              this.processCardService.setProcessCardStratus(true);
              if (res.success) {
                this.router.navigate(
                  ['/manage/business-tools/process-card/success'],
                  { queryParams: { status: 'submitted' } }
                );
              }
            })
        );
      }
    }
  }

  fileInput(ev: Event) {
    this.form.controls.attachment.setValue(
      ((ev.target as HTMLInputElement).files as FileList)[0]
    );
  }

  formFields1 = [
    'businessName',
    'dbaName',
    'businessAddress',
    'businessCity',
    'businessState',
    'businessZip',
    'businessPhone',
    'businessFax',
    'businessEmail',
    'requestedServiceStartDate',
    'dateFlexible',

    'productsSold',
    'fedTaxId',
    'fedIdStarted',
    'faxFillinType',

    'taxExemptOrganization',
    'numberOfEmployees',
    'totalGrossAnnualSales',
    'estimatedAnnualCreditCardSales',
    'estimatedAverageCreditCardSaleAmount',
    'estimatedHeighestCreditCardSaleAmount'
  ];

  formFields2 = [
    'signorName',
    'signorTitle',
    'signorEmail',
    'signorPercentageOwnership',
    'signorSocialSecurity',
    'signorDateOfBirth',
    'signorPhone',
    'signorAddress',
    'signorCity',
    'signorState',
    'signorZip',

    'BankName',
    'BankAccountNo',
    'BankRoutingNo',
    'BankPhone',
    'attachment'
  ];

  addressField = [
    {
      address: this.formFields1[2],
      city: this.formFields1[3],
      state: this.formFields1[4],
      zip: this.formFields1[5]
    },
    {
      address: this.formFields2[7],
      city: this.formFields2[8],
      state: this.formFields2[9],
      zip: this.formFields2[10]
    }
  ];

  // Load Google Address API
  loadGoogleAddress(address: HTMLInputElement, addressInstances: number) {
    const addressFieldType = this.addressField;

    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us'],
      addressInstance: addressInstances
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.form.controls[
          addressFieldType[addressInstances].address as keyof IProcessCardForm
        ].patchValue(res.address as string & File);
        this.form.controls[
          addressFieldType[addressInstances].city as keyof IProcessCardForm
        ].patchValue(res.city as string & File);
        this.form.controls[
          addressFieldType[addressInstances].state as keyof IProcessCardForm
        ].patchValue(res.state as string & File);
        this.form.controls[
          addressFieldType[addressInstances].zip as keyof IProcessCardForm
        ].patchValue(res.zip as string & File);

        googleAddressSubscription.unsubscribe();
      });
  }

  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  enableDot(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (
      charCode !== 45 &&
      charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      charCode !== 46
    ) {
      return false;
    }
    return true;
  }

  getDate() {
    const today = new Date();
    this.newDate = this.datePipe.transform(today, 'yyyy-MM-dd') as string;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
