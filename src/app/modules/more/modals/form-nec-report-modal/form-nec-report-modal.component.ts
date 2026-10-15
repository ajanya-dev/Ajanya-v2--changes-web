import { OnDestroy, Component, OnInit, inject } from '@angular/core';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import {
  IPayeeData,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

import { Subscription } from 'rxjs';
import { IUserBusiness } from 'src/app/modules/common-verification/model/common-verification';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  INecForm,
  IPayeeTotalPayementResponse
} from 'src/app/modules/more/model/all-reports';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SelectedDateService } from 'src/app/shared/components/date-range/selected.service';
import { NgxMaskDirective } from 'ngx-mask';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NecPayeeDetailsModalComponent } from '../nec-payee-details-modal/nec-payee-details-modal.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DropDownPayeeMultiSelectComponent } from '../../../../shared/components/drop-downs/drop-down-payee-multi-select/drop-down-payee-multi-select.component';
import { DateRangeSelectorV35Component } from '../../../../shared/components/date-range-selector-v35/date-range-selector-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBusinessComponent } from '../../../../shared/components/drop-downs/drop-down-business/drop-down-business.component';

@Component({
  selector: 'app-form-nec-report-modal',
  templateUrl: './form-nec-report-modal.component.html',
  styleUrls: ['./form-nec-report-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    DropDownBusinessComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    DateRangeSelectorV35Component,
    DropDownPayeeMultiSelectComponent,
    MatDialogActions,
    CommonButtonV35Component
  ]
})
export class FormNecReportModalComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private reportService = inject(ReportsService);
  private alertService = inject(AlertService);
  private selectedService = inject(SelectedDateService);
  public dialogRef = inject(MatDialogRef<FormNecReportModalComponent>);
  public payeeData = inject<IPayeeData[]>(MAT_DIALOG_DATA);

  /** * Indicates whether the manual business details option is enabled or disabled. */
  manualBusinessDetailsIsEnabled = false;

  /** * The NEC form group. */
  necForm: FormGroup;

  /** * An array of subscription objects to manage subscriptions. */
  subscriptions: Subscription[] = [];

  /** * An array of payee IDs selected in the form. */
  payeeIds: string[] = [];

  /** * The business ID selected in the form. */
  businessId: string;

  /** * An object representing the business address fetched from Google Address API. */
  businessAddressArray: IGoogleAddress;

  /** * The response object containing payee total payment information. */
  payeeTotalPayementResponse: IPayeeTotalPayementResponse;

  /** * Indicates whether the component is in a loading state. */
  loading = false;

  /** * The selected business name. */
  selectedBusiness: string;

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Performs initialization tasks such as setting up form validation and resetting Google Autocomplete API.
   */
  ngOnInit(): void {
    this.setValidation();
    this.iniForm();
    this.selectedService.setValue('This Year');
    this.calculateThisYear();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    if (this.payeeData) {
      this.payeeData.forEach((payee) => {
        this.payeeIds.push(payee.encrypted_id);
      });
      this.necForm.controls.payees.setValue(this.payeeIds);
    }
  }

  /**
   * Initializes the NEC form with form controls and validators.
   */
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

  /**
   * Creates a data object representing the NEC form input values.
   *
   * @returns {INecForm} - The NEC form data object.
   */
  formBody(): INecForm {
    const formValues = this.necForm?.value;
    return {
      payeeIds: this.payeeIds,
      businessId: this.businessId,
      fromDate: this.getFormatedDate(formValues?.fromDate),
      toDate: this.getFormatedDate(formValues?.toDate),
      businessAddress: this.businessAddressArray,
      businessLegalName: formValues?.businessLegalName,
      ein: this.formatEin(formValues?.ein)
    };
  }

  /**
   * @description Enable or disable the manual business details option
   */
  enableManualBusinessDetails(): void {
    this.setValidation();
    if (this.manualBusinessDetailsIsEnabled) {
      this.manualBusinessDetailsIsEnabled = false;
    } else {
      this.googleAddressService.resetGoogleAutocompleteAPI();
      this.manualBusinessDetailsIsEnabled = true;
    }
  }

  /**
   * Sets form validation rules based on the manualBusinessDetailsIsEnabled property.
   */
  setValidation() {
    if (this.manualBusinessDetailsIsEnabled === true) {
      // Clear validators for business field and update validity
      this.necForm?.controls?.business?.clearValidators();
      this.necForm?.controls?.business?.updateValueAndValidity();

      // Add required validator for businessLegalName field and update validity
      this.necForm?.controls?.businessLegalName?.clearValidators();
      this.necForm?.controls?.businessLegalName?.addValidators(
        Validators.required
      );
      this.necForm?.controls?.businessLegalName?.updateValueAndValidity();

      // Add required validator for businessAddress field and update validity
      this.necForm?.controls?.businessAddress?.clearValidators();
      this.necForm?.controls?.businessAddress?.addValidators(
        Validators.required
      );
      this.necForm?.controls?.businessAddress?.updateValueAndValidity();

      // Add required and minLength(9) validators for ein field and update validity
      this.necForm?.controls?.ein?.clearValidators();
      this.necForm?.controls?.ein?.addValidators([
        Validators.required,
        Validators.minLength(9)
      ]);
      this.necForm?.controls?.ein?.updateValueAndValidity();
    } else {
      // Clear validators for businessLegalName, businessAddress, and ein fields
      this.necForm?.controls?.businessLegalName?.clearValidators();
      this.necForm?.controls?.businessLegalName?.updateValueAndValidity();
      this.necForm?.controls?.businessAddress?.clearValidators();
      this.necForm?.controls?.businessAddress?.updateValueAndValidity();
      this.necForm?.controls?.ein?.clearValidators();
      this.necForm?.controls?.ein?.updateValueAndValidity();

      // Add required validator for business field and update validity
      this.necForm?.controls?.business?.clearValidators();
      this.necForm?.controls?.business?.addValidators(Validators.required);
      this.necForm?.controls?.business?.updateValueAndValidity();
    }
  }

  /**
   * @description Opening the payee details form modal with passing the business details and payee details
   *
   */
  onNext(): void {
    this.setValidation();
    if (this.manualBusinessDetailsIsEnabled === true) {
      this.necForm?.controls?.businessLegalName?.value;
    }
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
    this.subscriptions.push(
      this.reportService
        .payeeTotalPayments(payeeData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          const errorContent = res.data as unknown as string;
          if (res.success === false) {
            const errorData = {
              title: 'Error',
              content: errorContent,
              doneMsg: 'Ok'
            };
            this.alertService.warningAlert(errorData);
          } else {
            this.payeeTotalPayementResponse = res?.data;
            const dialogRef = this.dialog.open(NecPayeeDetailsModalComponent, {
              minWidth: '50%',
              maxHeight: '60%',
              disableClose: true,
              data: {
                payeeDetails: this.payeeTotalPayementResponse,
                formDetails: this.formBody(),
                manualBusinessDetailsIsEnabled:
                  this.manualBusinessDetailsIsEnabled,
                fromDate: this.formBody().fromDate,
                toDate: this.formBody().toDate
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              this.alertService.successAlert({
                content: '1099 Form generated succesfully!',
                close: true,
                timeout: 4000
              });
            })
          }
        })
    );
  }

  /**
   * @description Handling business changes events.
   *
   */
  getBusinessChange(event: IUserBusiness | 'add-new'): void {
    if (event === 'add-new') {
      this.dialogRef.close();
      return;
    }
    this.selectedBusiness = event?.businessName;
    this.businessId = event?.id;
    this.necForm?.controls?.business?.setValue(event?.id);
  }

  /**
   * @description Handling payee selection changes events.
   *
   */
  payeeSelectionEvent(payeeEvent: IPayeeDropdown[]): void {
    this.payeeIds = [];
    payeeEvent.forEach((element) => {
      if (this.payeeIds?.indexOf(element?.id) === -1) {
        this.payeeIds?.push(element?.id);
      }
    });
    this.necForm?.controls?.payees?.setValue(this.payeeIds);
  }

  /**
   * @description Handling select date range events.
   *
   */
  selectedRange(dateEvent: { end: string | null; start: string | null }): void {
    if (dateEvent?.start != null && dateEvent?.end != null) {
      this.necForm?.controls?.fromDate?.setValue(dateEvent?.start);
      this.necForm?.controls?.toDate?.setValue(dateEvent?.end);
    }
  }

  /**
   * @description format the date
   */
  getFormatedDate(unformatedDate: Date): string {
    const fullDate = new Date(unformatedDate);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const date = fullDate?.getDate();
    const formatedDate = `${year}-${month}-${date}`;
    return formatedDate;
  }

  calculateThisYear(): void {
    const today = new Date(); // get current date
    const year = today.getFullYear(); // get current year
    const startDate = new Date(year, 0, 1); // January 1st of current year
    const endDate = new Date(year, 11, 31); // December 31st of current year
    this.necForm?.patchValue({
      fromDate: this.getFormatedDate(startDate),
      toDate: this.getFormatedDate(endDate)
    });
  }

  /** @description Load Google Address API */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us'],
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        const googlAddress = new String(res.address);
        this.necForm.patchValue({
          businessAddress: googlAddress.concat(
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
        googleAddressSubscription.unsubscribe();
      });
  }

  /** @description formating the ein number to 00-0000000 */
  formatEin(val: string) {
    const splitEin = val.split('');
    splitEin.splice(2, 0, '-');
    return splitEin.join('');
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
