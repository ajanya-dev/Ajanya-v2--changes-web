import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';

import {
  INecPayeeDetailsData,
  INecReportPostForm,
  IPayeeTotalPayementResponse
} from 'src/app/modules/more/model/all-reports';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { OutsideClickDirective } from 'src/app/directive/outside-click.directive';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';

@Component({
  selector: 'app-nec-payee-details-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    OutsideClickDirective,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
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
          <h2 class="text-xs text-v4-subtle-text-color">
            Review payee details before downloading
          </h2>
        </div>
        <div
          role="button"
          tabindex="0"
          (click)="closeAll()"
          (keydown.enter)="closeAll()"
          (keydown.space)="closeAll(); $event.preventDefault()"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon name="x" [size]="20" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- modal body -->
      <div
        class="p-6 bg-v4-tertiary-background-color min-h-[35vh] overflow-auto"
      >
        <form [formGroup]="payeeDetailsForm">
          <div class="overflow-x-auto border border-v4-border-color rounded-xl">
            <div class="max-h-[50vh] overflow-y-auto">
              <table class="v4-ocw-table">
                <thead>
                  <tr>
                    <th>Payee Name</th>
                    <th>Tax ID Number</th>
                    <th>Address</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody formArrayName="payeeDetails">
                  @for (
                    item of getPayeeDetailsFormControl().controls;
                    track $index
                  ) {
                    <tr [formGroupName]="$index">
                      <td>
                        <app-common-input-v4
                          [placeholder]="'Payee Name'"
                          [readOnly]="true"
                          [isFieldRequired]="false"
                          [control]="
                            getPayeeDetailsFormControl().controls[$index].get(
                              'payeeName'
                            )
                          "
                          formControlName="payeeName"
                        />
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <select
                            class="w-auto min-w-[64px] h-[38px] px-2 text-xs font-bold font-funnel text-v4-main-text-color bg-v4-input-background-color border border-v4-input-border-color rounded-lg outline-none cursor-pointer shrink-0 focus:border-v4-primary-brand-color"
                            (change)="setMaskValue($index)"
                            formControlName="taxIdType"
                          >
                            @if (
                              getPayeeDetailsFormControl().controls[$index]
                                .value.payeeTypeId !== 2
                            ) {
                              <option value="SSN">SSN</option>
                            }
                            @if (
                              getPayeeDetailsFormControl().controls[$index]
                                .value.payeeTypeId !== 3
                            ) {
                              <option value="EIN">EIN</option>
                            }
                          </select>
                          <input
                            type="text"
                            class="w-full h-[38px] px-3 text-[13px] font-funnel text-v4-main-text-color bg-v4-input-background-color border border-v4-input-border-color rounded-lg outline-none focus:border-v4-primary-brand-color"
                            placeholder="Tax ID"
                            [mask]="
                              mask[$index] ||
                              (getPayeeDetailsFormControl().controls[$index]
                                .value.taxIdType === 'EIN'
                                ? '00-0000000'
                                : '000-00-0000')
                            "
                            formControlName="taxIdNumber"
                          />
                        </div>
                      </td>
                      <td appOutsideClick (clickOutSide)="handleChange()">
                        <app-address-autocomplete-v4
                          [placeholder]="'Address'"
                          [isFieldRequired]="false"
                          [maxLength]="155"
                          [control]="
                            $any(
                              getPayeeDetailsFormControl().controls[$index].get(
                                'payeeAddress'
                              )
                            )
                          "
                          [allowedCountries]="['us']"
                          [addressInstance]="$index"
                          (addressSelected)="
                            onNecAddressSelected($event, $index)
                          "
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          class="w-full h-[38px] px-3 text-[13px] font-funnel text-v4-main-text-color bg-v4-input-background-color border border-v4-input-border-color rounded-lg outline-none focus:border-v4-primary-brand-color"
                          placeholder="Amount"
                          mask="separator.2"
                          thousandSeparator=","
                          maxlength="13"
                          formControlName="payeeTotalAmount"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>

      <!-- modal footer -->
      <div
        class="flex justify-end gap-3 p-6 bg-v4-secondary-background-color border-t border-v4-border-color"
      >
        <app-common-button-v4
          width="120px"
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          (clickEvent)="closeAll()"
        />
        <app-common-button-v4
          width="120px"
          [type]="{ style: 'primary', name: 'main' }"
          text="Download"
          [disabled]="loading"
          [loading]="loading"
          (clickEvent)="onDownload()"
        />
      </div>
    </div>
  `,
  styles: [``]
})
export class NecPayeeDetailsModalV4Component implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private reportService = inject(ReportsService);
  private dialogRef = inject(MatDialogRef<NecPayeeDetailsModalV4Component>);
  private alertService = inject(V4AlertService);
  public data: INecPayeeDetailsData = inject(MAT_DIALOG_DATA);

  payeeData: IPayeeTotalPayementResponse[] = [];
  payeeDetailsForm: FormGroup;
  loading = false;
  isInputReadOnly: boolean[] = [];
  mask: string[] = [];

  ngOnInit(): void {
    this.payeeData = this.data?.payeeDetails;
    this.iniForm();
    this.loadPayeeDetailsData();
    this.setPayeeDetailsValue();
    this.googleAddressService.resetGoogleAutocompleteAPI(
      this.data?.payeeDetails?.length
    );
  }

  getPayeeDetailsFormControl(): FormArray {
    return this.payeeDetailsForm.get('payeeDetails') as FormArray;
  }

  iniForm(): void {
    this.payeeDetailsForm = this.formBuilder.group({
      payeeDetails: this.formBuilder.array([this.payeeDetailsFormBody()])
    });
  }

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

  loadPayeeDetailsData(): void {
    const addRow = this.getPayeeDetailsFormControl();
    for (let i = 1; i < this.payeeData.length; i += 1) {
      addRow.push(this.payeeDetailsFormBody());
    }
  }

  setPayeeDetailsValue(): void {
    this.payeeData.forEach((value, key) => {
      this.getPayeeDetailsFormControl().controls[key].patchValue({
        id: value.id,
        payeeName: value.payee_name,
        taxIdNumber:
          value.payee_type_id === 3 ? value.payee_ssn : value.payee_ein,
        taxIdType: value.payee_type_id === 2 ? 'EIN' : 'SSN',
        payeeAddress: this.formatPayeeAddress(value),
        payeeAddressArray: this.arrayFormatPayeeAddress(value),
        payeeTotalAmount: `$${value.total_amount}`,
        payeeTypeId: value.payee_type_id
      });
    });
  }

  onNecAddressSelected(res: IGoogleAddress, id: number): void {
    const addr = String(res.address ?? '');
    this.getPayeeDetailsFormControl().controls[id].patchValue({
      payeeAddress: addr.concat(
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
  }

  disableOtherInputs(id: number): void {
    const pacItem = document.getElementsByClassName('pac-item');
    for (let i = 0; i < this.data?.payeeDetails?.length; i += 1) {
      if (i !== id && pacItem.length > 0) {
        this.isInputReadOnly[i] = true;
      } else {
        this.isInputReadOnly[i] = false;
      }
    }
  }

  formatPayeeAddress(data: IPayeeTotalPayementResponse): string | undefined {
    if (data.payee_address_line_1) {
      const address = data.payee_address_line_1;
      const city = data.payee_city !== null ? `, ${data.payee_city}` : '';
      const state = data.payee_state !== null ? `, ${data.payee_state}` : '';
      const zip = data.payee_zip !== null ? `, ${data.payee_zip}` : '';
      const country =
        data.payee_country !== null ? `, ${data.payee_country}` : '';
      return address + city + state + zip + country;
    }
    return undefined;
  }

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
    return undefined;
  }

  onDownload(): void {
    this.loading = true;
    const data = this.setPayloadBody();
    this.reportService
      .getNecFormReport(data)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success === false) {
          this.alertService.warningAlert({
            title: 'Error',
            content: res.data,
            doneMsg: 'Ok'
          });
        } else {
          this.dialogRef.close(true);
          window.open(res?.data, '_blank');
        }
      });
  }

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

  removeDollerFromString(amount: string): string {
    return String(amount).replace('$', '');
  }

  setMaskValue(id: number): void {
    this.getPayeeDetailsFormControl().controls[id].patchValue({
      taxIdNumber: ''
    });
  }

  formatEinOrSSN(val: string, type: string): string | undefined {
    if (val && type === 'EIN') {
      if (val.includes('-')) return val;
      const splitEin = val.split('');
      splitEin.splice(2, 0, '-');
      return splitEin.join('');
    }
    if (val && type === 'SSN') {
      if (val.includes('-')) return val;
      const splitSSN = val.split('');
      splitSSN.splice(3, 0, '-');
      splitSSN.splice(6, 0, '-');
      return splitSSN.join('');
    }
    return undefined;
  }

  handleChange(): void {
    const pacItem = document.getElementsByClassName('pac-item');
    for (let i = 0; i < this.data?.payeeDetails?.length; i += 1) {
      if (pacItem.length === 0 || !pacItem) {
        this.isInputReadOnly[i] = false;
      }
    }
  }

  closeAll(): void {
    this.dialogRef.close(false);
  }
}
