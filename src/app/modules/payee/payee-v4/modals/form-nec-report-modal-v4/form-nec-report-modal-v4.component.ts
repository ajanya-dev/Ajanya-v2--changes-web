import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';

import {
  IPayeeData,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  CVSourceType,
  IUserBusiness
} from 'src/app/modules/common-verification/model/common-verification';
import { IUserVerification } from 'src/app/models/user';
import {
  INecForm,
  IPayeeTotalPayementResponse
} from 'src/app/modules/more/model/all-reports';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { environment } from 'src/environments/environment';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { PayeeMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-multi-select-dropdown-v4/payee-multi-select-dropdown-v4.component';
import { V4DateRangeSelectorComponent } from 'src/app/shared/V4/v4-date-range-selector/v4-date-range-selector.component';
import { NecPayeeDetailsModalV4Component } from '../nec-payee-details-modal-v4/nec-payee-details-modal-v4.component';

@Component({
  selector: 'app-form-nec-report-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent,
    CommonInputFieldV4Component,
    NgxMaskDirective,
    V4DateRangeSelectorComponent,
    PayeeMultiSelectDropdownV4Component,
    CommonButtonV4Component,
    AddressAutocompleteV4Component
  ],
  template: `
    <div>
      <!-- modal header -->
      <div
        class="flex justify-between px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-v4-main-text-color font-funnel">
            Generate Form 1099-NEC
          </h1>
          <span class="text-xs text-v4-secondary-text-color font-peridot">
            Configure and export your report
          </span
          >
        </div>
        <div
          role="button"
          tabindex="0"
          (click)="dialogRef.close(false)"
          (keydown.enter)="dialogRef.close(false)"
          (keydown.space)="dialogRef.close(false); $event.preventDefault()"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon name="x" [size]="20" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- modal body -->
      <div
        class="p-6 bg-v4-tertiary-background-color flex flex-col gap-5 min-h-[35vh]"
      >
        <!-- Payee (only when no payees pre-selected) -->
        @if (!payeeData) {
          <div class="flex flex-col gap-1.5">
            <span
              class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
            >
              Payee
            </span>
            <app-payee-multi-select-dropdown-v4
              [placeholder]="'All Payees'"
              (selectionEvent)="payeeSelectionEvent($event)"
            />
            <app-control-message-v4 [control]="necForm.controls.payees" />
          </div>
        }

        <!-- Date Range -->
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            Date Range
          </span>
          <app-v4-date-range-selector
            (dateEmiter)="selectedRange($event)"
            selectDate="this-year"
          />
        </div>

        <!-- Business -->
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            Business
          </span>
          @if (!manualBusinessDetailsIsEnabled) {
            <app-v4-common-dropdown
              [config]="businessDropdownConfig"
              [listData]="businessList"
              [formControl]="necForm.controls.business"
              appendTo="body"
              (buttonClick)="onAddNewBusiness()"
              (scrollToEnd)="onBusinessScrollToEnd()"
            />
            <app-control-message-v4 [control]="necForm.controls.business" />
          }
          @if (manualBusinessDetailsIsEnabled) {
            <div [formGroup]="necForm" class="flex flex-col gap-3">
              <app-common-input-v4
                [inputId]="'nec-form-business'"
                [placeholder]="'Business Legal Name'"
                [maxLength]="40"
                [control]="necForm.controls.businessLegalName"
                formControlName="businessLegalName"
              />
              <div>
                <input
                  type="text"
                  class="w-full h-[38px] px-3 text-[13px] font-peridot text-v4-main-text-color bg-v4-input-background-color border border-v4-input-border-color rounded-lg outline-none focus:border-v4-primary-brand-color"
                  placeholder="EIN *"
                  maxlength="15"
                  formControlName="ein"
                  mask="00-0000000"
                />
                <app-control-message-v4 [control]="necForm.controls.ein" />
              </div>
              <app-address-autocomplete-v4
                [placeholder]="'Business Address'"
                [control]="necForm.controls.businessAddress"
                [allowedCountries]="['us']"
                (addressSelected)="onBusinessAddressSelected($event)"
              />
            </div>
          }
          <span
            class="text-xs font-medium text-v4-primary-brand-bold-color cursor-pointer mt-1 inline-block hover:underline"
            role="button"
            tabindex="0"
            (click)="enableManualBusinessDetails()"
            (keydown.enter)="enableManualBusinessDetails()"
            (keydown.space)="
              enableManualBusinessDetails(); $event.preventDefault()
            "
          >
            {{
              manualBusinessDetailsIsEnabled
                ? 'Select business from list'
                : 'Enter business details manually'
            }}
          </span>
        </div>
      </div>

      <!-- modal footer -->
      <div class="flex gap-3 px-6 pb-6 pt-2 bg-v4-tertiary-background-color">
        <app-common-button-v4
          class="flex-1"
          width="100%"
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          [customClasses]="'!py-2.5 !px-5'"
          [textClasses]="'!text-sm'"
          (clickEvent)="dialogRef.close(false)"
        />
        <app-common-button-v4
          class="flex-1"
          width="100%"
          [type]="{ style: 'primary', name: 'main' }"
          text="Next"
          lucideIcon="arrow-right"
          [lucideIconSize]="16"
          [customClasses]="'!py-2.5 !px-5'"
          [textClasses]="'!text-sm'"
          [disabled]="loading"
          [loading]="loading"
          (clickEvent)="onNext()"
        />
      </div>
    </div>
  `,
  styles: [``]
})
export class FormNecReportModalV4Component implements OnInit {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private reportService = inject(ReportsService);
  private alertService = inject(V4AlertService);
  private commonVerificationService = inject(CommonVerificationService);
  private userProfileService = inject(UserProfileService);
  private authDataService = inject(AuthDataService);
  private gettingStartedService = inject(GettingStartedService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  public dialogRef = inject(MatDialogRef<FormNecReportModalV4Component>);
  public payeeData = inject<IPayeeData[]>(MAT_DIALOG_DATA);

  manualBusinessDetailsIsEnabled = false;
  necForm: FormGroup;
  payeeIds: string[] = [];
  businessList: IUserBusiness[] = [];
  businessPage = 1;
  businessDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Business',
    displayField: 'businessName',
    outputField: 'id',
    enableAddNew: true,
    addNewLabel: 'New',
    addNewSubLabel: 'Add a new business'
  };

  businessAddressArray: IGoogleAddress;
  payeeTotalPayementResponse: IPayeeTotalPayementResponse;
  userStatus: IUserVerification;
  loading = false;

  ngOnInit(): void {
    this.setValidation();
    this.iniForm();
    this.calculateThisYear();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.loadBusinesses();
    this.userProfileService.UserVerification$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res) => {
      this.userStatus = res;
    });
    if (this.payeeData) {
      this.payeeData.forEach((payee) => {
        this.payeeIds.push(payee.encrypted_id);
      });
      this.necForm.controls.payees.setValue(this.payeeIds);
    }
  }

  iniForm(): void {
    this.necForm = this.formBuilder.group({
      payees: ['', Validators.required],
      business: [''],
      fromDate: [''],
      toDate: [''],
      businessLegalName: [''],
      businessAddress: [''],
      ein: ['']
    });
  }

  formBody(): INecForm {
    const formValues = this.necForm?.value;
    return {
      payeeIds: this.payeeIds,
      businessId: formValues?.business,
      fromDate: this.getFormatedDate(formValues?.fromDate),
      toDate: this.getFormatedDate(formValues?.toDate),
      businessAddress: this.businessAddressArray,
      businessLegalName: formValues?.businessLegalName,
      ein: this.formatEin(formValues?.ein)
    };
  }

  enableManualBusinessDetails(): void {
    this.setValidation();
    if (this.manualBusinessDetailsIsEnabled) {
      this.manualBusinessDetailsIsEnabled = false;
    } else {
      this.googleAddressService.resetGoogleAutocompleteAPI();
      this.manualBusinessDetailsIsEnabled = true;
    }
  }

  setValidation(): void {
    if (this.manualBusinessDetailsIsEnabled === true) {
      this.necForm?.controls?.business?.clearValidators();
      this.necForm?.controls?.business?.updateValueAndValidity();

      this.necForm?.controls?.businessLegalName?.clearValidators();
      this.necForm?.controls?.businessLegalName?.addValidators(
        Validators.required
      );
      this.necForm?.controls?.businessLegalName?.updateValueAndValidity();

      this.necForm?.controls?.businessAddress?.clearValidators();
      this.necForm?.controls?.businessAddress?.addValidators(
        Validators.required
      );
      this.necForm?.controls?.businessAddress?.updateValueAndValidity();

      this.necForm?.controls?.ein?.clearValidators();
      this.necForm?.controls?.ein?.addValidators([
        Validators.required,
        Validators.minLength(9)
      ]);
      this.necForm?.controls?.ein?.updateValueAndValidity();
    } else {
      this.necForm?.controls?.businessLegalName?.clearValidators();
      this.necForm?.controls?.businessLegalName?.updateValueAndValidity();
      this.necForm?.controls?.businessAddress?.clearValidators();
      this.necForm?.controls?.businessAddress?.updateValueAndValidity();
      this.necForm?.controls?.ein?.clearValidators();
      this.necForm?.controls?.ein?.updateValueAndValidity();

      this.necForm?.controls?.business?.clearValidators();
      this.necForm?.controls?.business?.addValidators(Validators.required);
      this.necForm?.controls?.business?.updateValueAndValidity();
    }
  }

  onNext(): void {
    this.setValidation();
    this.necForm.markAllAsTouched();
    if (this.necForm.invalid) {
      return;
    }
    const payeeData = {
      payeeIds: this.payeeIds,
      fromDate: this.formBody().fromDate,
      toDate: this.formBody().toDate
    };
    this.loading = true;
    this.reportService
      .payeeTotalPayments(payeeData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const errorContent = res.data as unknown as string;
        if (res.success === false) {
          this.alertService.warningAlert({
            title: 'Error',
            content: errorContent,
            doneMsg: 'Ok'
          });
        } else {
          this.payeeTotalPayementResponse = res?.data;
          const dialogRef = this.dialog.open(NecPayeeDetailsModalV4Component, {
            minWidth: '50%',
            maxHeight: '60%',
            disableClose: true,
            panelClass: 'paddingless-modal-rounded',
            data: {
              payeeDetails: this.payeeTotalPayementResponse,
              formDetails: this.formBody(),
              manualBusinessDetailsIsEnabled:
                this.manualBusinessDetailsIsEnabled,
              fromDate: this.formBody().fromDate,
              toDate: this.formBody().toDate
            }
          });
          dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result) {
                this.dialogRef.close();
                this.alertService.successAlert({
                  content: '1099 Form generated succesfully!',
                  close: true,
                  timeout: 4000
                });
              }
            });
        }
      });
  }

  loadBusinesses(): void {
    this.commonVerificationService
      .getUserBusinessesList(this.businessPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.businessList = res.data;
      });
  }

  onBusinessScrollToEnd(): void {
    this.businessPage += 1;
    this.commonVerificationService
      .getUserBusinessesList(this.businessPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.businessList = [...this.businessList, ...res.data];
      });
  }

  onAddNewBusiness(): void {
    this.dialogRef.close();
    if (
      this.userStatus?.email_verified === 0 ||
      this.userStatus?.phone_verified === 0
    ) {
      this.authDataService.verifyEmailAndMobile(
        this.authDataService.getVerificationMessage(this.userStatus)
      );
    } else if (environment.isV4Persona) {
      const isKycVerified =
        this.gettingStartedService.gettingStartedData.isKycStatusDone;
      if (!isKycVerified) {
        this.personaHelperService.openModal('kyc', CVSourceType['form-1099']);
      } else {
        this.personaHelperService.openModal('kyb', CVSourceType['form-1099']);
      }
    } else {
      this.router.navigate(['/v4/manage/users/verify-user-id'], {
        queryParams: {
          type: CVSourceType['form-1099'],
          returnUrl: 'v4/manage/more/report'
        }
      });
    }
  }

  payeeSelectionEvent(payeeEvent: IPayeeDropdown[]): void {
    this.payeeIds = [];
    payeeEvent.forEach((element) => {
      if (this.payeeIds?.indexOf(element?.id) === -1) {
        this.payeeIds?.push(element?.id);
      }
    });
    this.necForm?.controls?.payees?.setValue(this.payeeIds);
  }

  selectedRange(dateEvent: { end: string | null; start: string | null }): void {
    if (dateEvent?.start != null && dateEvent?.end != null) {
      this.necForm?.controls?.fromDate?.setValue(dateEvent?.start);
      this.necForm?.controls?.toDate?.setValue(dateEvent?.end);
    }
  }

  getFormatedDate(unformatedDate: Date): string {
    const fullDate = new Date(unformatedDate);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const date = fullDate?.getDate();
    return `${year}-${month}-${date}`;
  }

  calculateThisYear(): void {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    this.necForm?.patchValue({
      fromDate: this.getFormatedDate(startDate),
      toDate: this.getFormatedDate(endDate)
    });
  }

  onBusinessAddressSelected(res: IGoogleAddress): void {
    const addr = String(res.address ?? '');
    this.necForm.patchValue({
      businessAddress: addr.concat(
        ', ',
        res.city,
        ', ',
        res.state,
        ', ',
        res.zip,
        ', ',
        res.country
      )
    });
    this.businessAddressArray = {
      address: res.address,
      state: res.state,
      city: res.city,
      country: res.country,
      zip: res.zip
    };
  }

  formatEin(val: string): string {
    const splitEin = val.split('');
    splitEin.splice(2, 0, '-');
    return splitEin.join('');
  }
}
