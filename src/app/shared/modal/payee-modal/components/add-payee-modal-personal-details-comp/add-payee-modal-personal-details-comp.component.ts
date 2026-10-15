import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import {
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as countryList from 'src/app/data/data/country-list-json/country-list-code.json';
import { ICountry } from 'src/app/shared/components/phone-input/phone-input.component';
import { NgIf } from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { NewPhoneInputComponent } from '../../../../components/new-phone-input/new-phone-input.component';
import { ControlMessageComponent } from '../../../../components/control-message/control-message/control-message.component';

export interface IChildData {
  payeeType?: string;
  editMode?: boolean;
  dataLoaded?: boolean;
}

/**
 * @description Modal component for adding payee personal details (in add payee modal).
 */
@Component({
  selector: 'app-add-payee-modal-personal-details-comp',
  templateUrl: './add-payee-modal-personal-details-comp.component.html',
  styleUrls: ['./add-payee-modal-personal-details-comp.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NewPhoneInputComponent,
    NgIf,
    WhiteLabelDirective,
    WhiteLabelPipe,
    // IndustryTypesDropdownComponent,
    V35ControlMessageComponent,
    CommonInputFieldComponent
  ]
})
export class AddPayeeModalPersonalDetailsCompComponent
  implements OnInit, OnDestroy
{
  private googleAddressService = inject(GoogleAddressService);
  private localStorageService = inject(LocalStorageService);

  @Input() payeeForm: UntypedFormGroup;
  @Input() payeePhone: string;
  @Input() payeeEmail: string;
  @Input() editMode = false;
  @Input() childData$: Observable<IChildData>;
  @Input() entityLabel: string = 'Payee';
  @Input() payeeTypeId: string | number = 1;
  @Input() isCompass = false;
  @Output() inputDataChange = new EventEmitter();
  @Output() phoneNumberWithoutDialCodeEvent = new EventEmitter<number>();
  @Output() countryChange = new EventEmitter<{
    length: { min: number; max: number };
    code: string;
  }>();

  payeeType = 'customer';
  subscriptions: Subscription[] = [];
  phoneNumber = '';
  countryCode = '';
  dialCode = '';
  countryList: ICountry[] = (countryList as any).default;
  isPhoneValueLoading = false;
  env = environment;
  isBusinessIsRequired = false;
  isBryancohen = signal(false);

  /**
   * @description Entity word used in the legal name label, derived from the selected payee type.
   */
  get nameEntityWord(): string {
    if (this.entityLabel && this.entityLabel !== 'Payee') return this.entityLabel;
    if (String(this.payeeTypeId) === '2') return 'Vendor';
    if (String(this.payeeTypeId) === '3') return 'Employee';
    return 'Customer';
  }

  ngOnInit(): void {
    this.getObservableData();
    this.loadFormValue();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    if (this.payeePhone || this.payeeEmail) {
      this.setFormValues();
    }
    this.changeEntityType();
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.isBryancohen.set(userPlugins?.includes('enterprise-bryancohen') ?? false);
  }

  changeEntityType() {
    this.subscriptions.push(
      this.payeeForm.controls.entityType.valueChanges.subscribe((res) => {
        if (res === 'business') {
          this.isBusinessIsRequired = true;
        } else {
          this.isBusinessIsRequired = false;
        }
      })
    );
  }

  countryDropdownChange(event: {
    length: { min: number; max: number };
    code: string;
  }) {
    this.countryChange.emit(event);
  }

  /**
   * @description Method to get payee type and set it to `this.payeeType`.
   */
  getObservableData(): void {
    this.subscriptions.push(
      this.childData$.subscribe((res) => {
        this.payeeType = res.payeeType ?? 'customer';
      })
    );
  }

  /**
   * @description Emits `inputDataChange` event.
   */
  loadFormValue() {
    this.inputDataChange.emit(this.payeeForm.value);
  }

  setFormValues() {
    this.payeeForm.controls.payeePhone.markAllAsTouched();
    this.payeeForm.controls.payeeEmail.markAllAsTouched();
    this.payeeForm.controls.payeePhone.setValue(this.payeePhone);
    this.payeeForm.controls.payeeEmail.setValue(this.payeeEmail);
    this.inputDataChange.emit(this.payeeForm.value);
  }

  /**
   * @description Loads google address api and update `payeeForm`.
   * @param address - payee address.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.payeeForm.patchValue({
          payeeAddress1: res.address,
          payeeCity: res.city,
          payeeState: res.state,
          payeeZip: res.zip,
          payeeCountry: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Checks whether payee name is valid or not.
   * @param event keypress event
   * @returns boolean
   */
  validPayeeName(event: { which: number; keyCode: number }) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 96) {
      return false;
    }
    return true;
  }

  // onIndustryChange(event: any) {
  //   this.payeeForm.controls.merchant_category.setValue(event);
  // }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
