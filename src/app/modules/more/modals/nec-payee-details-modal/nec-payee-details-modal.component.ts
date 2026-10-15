import { finalize } from 'rxjs/operators';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import {
  INecPayeeDetailsData,
  INecReportPostForm,
  IPayeeTotalPayementResponse
} from 'src/app/modules/more/model/all-reports';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Subscription } from 'rxjs';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { OutsideClickDirective } from '../../../../directive/outside-click.directive';
import { NgxMaskDirective } from 'ngx-mask';
import { NgFor } from '@angular/common';

/**
 * Angular component representing the NEC Payee Details Modal.
 * @class
 */
@Component({
  selector: 'app-nec-payee-details-modal',
  templateUrl: './nec-payee-details-modal.component.html',
  styleUrls: ['./nec-payee-details-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    NgxMaskDirective,
    OutsideClickDirective,
    MatDialogActions,
    OcwPreventMultiClickDirective
  ]
})
export class NecPayeeDetailsModalComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private reportService = inject(ReportsService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  public data: INecPayeeDetailsData = inject(MAT_DIALOG_DATA);

  /**
   * An array of payee data containing IPayeeTotalPayementResponse objects.
   * @type {IPayeeTotalPayementResponse[]}
   */
  payeeData: IPayeeTotalPayementResponse[] = [];

  /**
   * The payee details form group.
   * @type {FormGroup}
   */
  payeeDetailsForm: FormGroup;

  /**
   * An array of subscription objects to manage subscriptions.
   * @type {Subscription[]}
   */
  subscriptions: Subscription[] = [];

  /**
   * A subscription for Google Address Service.
   * @type {Subscription}
   */
  googleAddressSubscription: Subscription;

  /**
   * Indicates whether the component is in a loading state.
   * @type {boolean}
   */
  loading = false;

  /**
   * An array of booleans indicating whether input fields are read-only.
   * @type {boolean[]}
   */
  isInputReadOnly: boolean[] = [];

  /**
   * An array of masks for input fields.
   * @type {string[]}
   */
  mask: string[] = [];

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Performs initialization tasks such as setting up form controls and loading data.
   * @method
   */
  ngOnInit(): void {
    this.payeeData = this.data?.payeeDetails;
    this.iniForm();
    this.loadPayeeDetailsData();
    this.setPayeeDetailsValue();
    this.googleAddressService.resetGoogleAutocompleteAPI(
      this.data?.payeeDetails?.length
    );
  }

  /**
   * Gets the FormArray control for payee details.
   * @method
   * @returns {FormArray} - The FormArray control for payee details.
   */
  getPayeeDetailsFormControl(): FormArray {
    return this.payeeDetailsForm.get('payeeDetails') as FormArray;
  }

  /**
   * Initializes the payee details form with form controls.
   * @method
   */
  iniForm(): void {
    this.payeeDetailsForm = this.formBuilder.group({
      payeeDetails: this.formBuilder.array([this.payeeDetailsFormBody()])
    });
  }

  /**
   * Creates a form group representing payee details.
   * @method
   * @returns {FormGroup} - The form group representing payee details.
   */
  payeeDetailsFormBody() {
    return this.formBuilder.group({
      id: [''],
      payeeName: [''],
      taxIdNumber: [''],
      taxIdType: [''],
      payeeAddress: [''],
      payeeAddressArray: [''],
      payeeTotalAmount: [''],
      payeeTypeId: ['']
    });
  }

  /**
   * @description Creating Empty Forms
   */
  loadPayeeDetailsData(): void {
    const addRow = this.getPayeeDetailsFormControl();
    for (let i = 1; i < this.payeeData.length; i += 1) {
      addRow.push(this.payeeDetailsFormBody());
    }
  }

  /**
   * @description Here the form data values push in payeeDetails Form when the payee details modal is opened first time
   */
  setPayeeDetailsValue() {
    this.payeeData.forEach((value, key) => {
      this.getPayeeDetailsFormControl().controls[key].patchValue({
        id: value.id,
        payeeName: value.payee_name,
        taxIdNumber:
          value.payee_type_id === 3 ? value.payee_ssn : value.payee_ein,
        taxIdType: value.payee_type_id === 2 ? 'EIN' : 'SSN',
        payeeAddress: this.formatPayeeAddress(value),
        payeeAddressArray: this.arrayFormatPayeeAddress(value),
        payeeTotalAmount: '$' + value.total_amount,
        payeeTypeId: value.payee_type_id
      });
    });
  }

  /**
   * @description Load Google Address API
   * */
  loadGoogleAddress(address: HTMLInputElement, id: number) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us'],
      displayShortName: true,
      addressInstance: id
    });

    this.googleAddressSubscription?.unsubscribe();

    this.googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        const address = new String(res.address);
        this.getPayeeDetailsFormControl().controls[id].patchValue({
          payeeAddress: address.concat(
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
        this.getPayeeDetailsFormControl().controls[id].patchValue({
          payeeAddressArray: {
            address: res.address,
            state: res.state,
            city: res.city,
            country: res.country,
            zip: res.zip
          }
        });
        this.isInputReadOnly = [];
      });
  }

  /**
   * @description Disabling other input focus
   * @param id current input index value
   * `isInputReadOnly` It have which inputs have to set readonly behavior
   */
  disableOtherInputs(id: number) {
    const pacItem = document.getElementsByClassName('pac-item');
    for (let i = 0; i < this.data?.payeeDetails?.length; i += 1) {
      if (i !== id && pacItem.length > 0) {
        this.isInputReadOnly[i] = true;
      } else {
        this.isInputReadOnly[i] = false;
      }
    }
  }

  /**
   * @description Formatting the payee address to Single line string
   */
  formatPayeeAddress(data: IPayeeTotalPayementResponse) {
    if (data.payee_address_line_1) {
      const address = data.payee_address_line_1;
      const city = data.payee_city !== null ? `, ${data.payee_city}` : '';
      const state = data.payee_state !== null ? `, ${data.payee_state}` : '';
      const zip = data.payee_zip !== null ? `, ${data.payee_zip}` : '';
      const country =
        data.payee_country !== null ? `, ${data.payee_country}` : '';
      return address + city + state + zip + country;
    }
    return;
  }

  /**
   * @description Formating the payee address like an array object
   */
  arrayFormatPayeeAddress(data: IPayeeTotalPayementResponse) {
    if (data.payee_address_line_1 !== '') {
      return {
        address: data.payee_address_line_1,
        city: data.payee_city,
        state: data.payee_state,
        zip: data.payee_zip,
        country: data.payee_country
      };
    }
    return;
  }

  /**
   * @description Downloading the pdf
   */
  onDownload() {
    this.loading = true;
    const data = this.setPayloadBody();
    this.subscriptions.push(
      this.reportService
        .getNecFormReport(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success === false) {
            const errorData = {
              title: 'Error',
              content: res.data,
              doneMsg: 'Ok'
            };
            this.alertService.warningAlert(errorData);
            return;
          } else {
            this.dialog.closeAll();
            window.open(res?.data, '_blank');
          }
        })
    );
  }

  /**
   * @description  mapped the post payload date here
   */
  setPayloadBody(): INecReportPostForm {
    const allPayeeDetails = [];
    for (
      let i = 0;
      i < this.getPayeeDetailsFormControl().controls.length;
      i += 1
    ) {
      const formData = this.getPayeeDetailsFormControl().controls[i].value;

      allPayeeDetails.push({
        id: formData.id,
        payeeName: formData.payeeName,
        payeeTypeId: formData.payeeTypeId,
        taxIdNumber: this.formatEinOrSSN(
          formData?.taxIdNumber,
          formData?.taxIdType
        ),
        taxIdType: formData?.taxIdType,
        totalPayment: this.removeDollerFromString(formData.payeeTotalAmount),
        address: formData?.payeeAddressArray?.address,
        city: formData?.payeeAddressArray?.city,
        state: formData?.payeeAddressArray?.state,
        zip: formData?.payeeAddressArray?.zip,
        country: formData?.payeeAddressArray?.country
      });
    }

    return {
      businessId: this.data?.formDetails?.businessId,
      ein: this.data?.formDetails?.ein,
      businessLegalName: this.data?.formDetails?.businessLegalName,
      businessAddress: this.data?.formDetails?.businessAddress?.address,
      businessCity: this.data?.formDetails?.businessAddress?.city,
      businessState: this.data?.formDetails?.businessAddress?.state,
      businessZip: this.data?.formDetails?.businessAddress?.zip,
      businessCountry: this.data?.formDetails?.businessAddress?.country,
      manualBusinessDetailsIsEnabled: this.data.manualBusinessDetailsIsEnabled,
      payeeDetails: allPayeeDetails,
      fromDate: this.data.fromDate,
      toDate: this.data.toDate
    };
  }

  removeDollerFromString(amount: string) {
    return String(amount).replace('$', '');
  }

  /**
   * @description Mask value set for the dynamic form
   *
   * @param event Tax id type
   * @param id form index value
   */
  setMaskValue(event: Event, id: number) {
    const eventTarget = event.target as HTMLInputElement;
    if (eventTarget.value === 'EIN') {
      this.mask[id] = '00-0000000';
    } else {
      this.mask[id] = '000-00-0000';
    }
  }

  /**
   * @description Mask value came like a normal number format.
   *  So, we format the value here.
   *
   * @param val payee tax id number
   * @param type tax id type
   * @returns formated value like 00-0000000 or 000-00-0000
   */
  formatEinOrSSN(val: string, type: string) {
    if (val && type === 'EIN') {
      if (val.includes('-')) {
        return val;
      }
      const splitEin = val.split('');
      splitEin.splice(2, 0, '-');
      return splitEin.join('');
    }
    if (val && type === 'SSN') {
      if (val.includes('-')) {
        return val;
      }
      const splitSSN = val.split('');
      splitSSN.splice(3, 0, '-');
      splitSSN.splice(6, 0, '-');
      return splitSSN.join('');
    }
    return;
  }

  handleChange() {
    const pacItem = document.getElementsByClassName('pac-item');
    for (let i = 0; i < this.data?.payeeDetails?.length; i += 1) {
      if (pacItem.length === 0 || !pacItem) {
        this.isInputReadOnly[i] = false;
      }
    }
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
    this.googleAddressSubscription?.unsubscribe();
  }
}
