import {
  UntypedFormControl,
  Validators,
  AbstractControl
} from '@angular/forms';
import { EnvironmentId } from 'src/app/models/environment';
import { environment } from 'src/environments/environment';
import { Component, OnDestroy, OnInit, Inject, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  CVSourceType,
  IActionLoaderData,
  ISelectBizData,
  IUserBusiness
} from 'src/app/modules/common-verification/model/common-verification';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { LoaderModalComponent } from 'src/app/shared/modal/loader-modal/loader-modal.component';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { IBankDropdown, IBusinessDetails } from 'src/app/models/bank';
import { UserV3DataService } from 'src/app/modules/user/user-v3/services/user-v3-data.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import {
  IPersonalCloudAccount,
  PersonalAccountDetailsComponent
} from '../personal-account-details/personal-account-details.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-select-business',
  templateUrl: './select-business.component.html',
  styleUrls: ['./select-business.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    DropDownBankComponent,
    MatDialogClose,
    NgFor,
    NgClass,
    MatTooltip
  ]
})
export class SelectBusinessComponent implements OnInit, OnDestroy {
  env_id: EnvironmentId = environment.env_id;
  subscriptions: Subscription[] = [];
  businessDetails: IBusinessDetails[] = [];
  loaded = false;
  typeLabel = 'ACH';
  selectBankSubTitle: string;
  alertTitle: string;
  isOtherBusinessSelected = false;
  selectedBusiness: IUserBusiness;
  bankAccountId = new UntypedFormControl([], [Validators.required]);
  isPersonalAccount = '0';
  personalAccountPending = '0';
  personalAccountExists = false;
  isSolidBusiness: boolean;

  private personaHelperService = inject(PersonaHelperService);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ISelectBizData,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private dialogRef: MatDialogRef<SelectBusinessComponent>,
    private dialog: MatDialog,
    private cloudBankService: CloudBankService,
    private commonVerificationService: CommonVerificationService,
    private userDataService: UserV3DataService
  ) {}

  ngOnInit(): void {
    this.userDataService.setBankData(this.data.bankData);
    this.subscriptions.push(
      this.commonVerificationService.getUserBusinesses().subscribe((res) => {
        if (res.success) this.businessDetails = res.data as IBusinessDetails[];
      })
    );
    this.loadLabels();
    this.personalAccountPending =
      this.route?.snapshot?.queryParams?.personalAccountApplicationPending;
  }

  /**
   * @description Loads labels based on the provided data.
   */
  loadLabels(): void {
    if (this.data?.applyCloudBank) {
      this.typeLabel = 'business cloud bank account';
    } else if (this.data?.applyCheckDraft) {
      this.typeLabel = 'Check Draft';
    } else {
      this.typeLabel = 'ACH';
    }
  }

  /**
   * @description Selects a business and updates the corresponding properties and states.
   * @param singleItem - The HTMLDivElement representing the selected business item.
   * @param item - The IUserBusiness object representing the selected business.
   * @param isSolid - A boolean indicating if the business is solid.
   */
  selectBusiness(
    singleItem: HTMLDivElement,
    isSolid: boolean | undefined,
    item?: IUserBusiness
  ) {
    if (item?.status === 3) {
      return;
    }
    this.isPersonalAccount = '0';
    if (isSolid) {
      this.isSolidBusiness = isSolid;
    }
    const tabList: NodeListOf<HTMLDivElement> =
      document.querySelectorAll('#singleItem');
    tabList?.forEach((s) => {
      if (s.classList.contains('active')) s.classList.remove('active');
    });
    singleItem.classList.toggle('active');

    if (item !== undefined) {
      this.isOtherBusinessSelected = false;
      this.selectedBusiness = item;
    } else {
      this.isOtherBusinessSelected = true;
    }
  }

  /**
   * @description Selects the personal account and toggles its active state.
   * @param singleItem - The HTML div element representing the personal account.
   */
  selectPersonalAccount(singleItem: HTMLDivElement) {
    const tabList: NodeListOf<HTMLDivElement> =
      document.querySelectorAll('#singleItem');
    tabList?.forEach((s) => {
      if (s.classList.contains('active')) s.classList.remove('active');
    });
    singleItem.classList.toggle('active');
    this.isPersonalAccount = this.isPersonalAccount !== '0' ? '0' : '1';
    this.isOtherBusinessSelected = false;
  }

  /**
   * @description Submits the form data and performs the necessary actions based on the selected options.
   *
   */
  submit(): void {
    if (
      this.isSolidBusiness &&
      this.data?.sourceType === CVSourceType.cloud_bank
    ) {
      this.cloudBankService
        .applyCloudBank(this.selectedBusiness.id)
        .subscribe((res) => {
          if (res.success) {
            this.cloudBankService.cloudBankStatus();
          }
        });
      return;
    }
    if (this.personalAccountExists && this.isPersonalAccount === '1') {
      const formData = new FormData();
      formData.append(`personal[occupation]`, '');
      formData.append(`personal[document][localNationalDocument]`, '');
      formData.append(`personal[document][supportingDocument]`, '');
      formData.append(`accountType`, 'personalChecking');
      this.dialog
        .open<LoaderModalComponent, IActionLoaderData>(LoaderModalComponent, {
          maxWidth: '400px',
          width: '80%',
          minHeight: '200px',
          height: 'unset',
          disableClose: true,
          data: { type: { cloudBankPersonalAccount: formData } }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res.success) {
            window.location.reload();
            this.dialogRef.close(res);
          }
        });
      return;
    }
    if (this.isPersonalAccount === '1') {
      this.dialog
        .open<PersonalAccountDetailsComponent, IPersonalCloudAccount>(
          PersonalAccountDetailsComponent,
          {
            maxWidth: '95%',
            width: '800px',
            data: { personalAccountExists: this.personalAccountExists }
          }
        )
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.dialogRef.close(res);
          }
        });
      return;
    }

    if (this.data?.isShowBankDropDown) {
      this.bankAccountId.markAsTouched();
      if (this.bankAccountId.invalid) {
        return;
      }
    }

    if (this.isOtherBusinessSelected) {
      this.addNewBusiness();
    } else {
      this.alertService
        .confirmAlert({
          content: this.getAlertTitle(
            this.selectedBusiness.business_name ??
              this.selectedBusiness.businessName
          )
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            if (this.data?.applyCloudBank) {
              this.dialogRef.close({ businessId: this.selectedBusiness.id });
            } else if (this.data?.isShowBankDropDown) {
              this.dialogRef.close({
                businessId: this.selectedBusiness.id,
                bankAccountId: this.bankAccountId.value.id
              });
            } else {
              this.dialogRef.close({ businessId: this.selectedBusiness.id, selectedBusiness: this.selectedBusiness?.businessName });
            }
          }
        });
    }
  }

  /**
   * @description Adds a new business and navigates to the appropriate verification page based on the application status.
   * If the KYC status is not 0, it either navigates to the v3 verification page or opens the verify business modal.
   * If the KYC status is 0, it navigates to the common verification page with the specified query parameters.
   */
  addNewBusiness() {
    if (this.data?.applicationStatus?.kycStatus === 3) {
      this.alertService.warningAlert({
        content:
          'Your KYC application has been declined, and as a result, you are ineligible to apply for KYB at this time.'
      });
      return;
    }
    if (this.data?.applicationStatus?.kycStatus !== null) {
      if (environment.isV4Persona) {
        this.personaHelperService
          .openModal('kyb', this.data.sourceType)
          .subscribe((res) => {
            if (res?.data?.inquiry_type === 'kyb') {
              this.personaHelperService.kycKybVerifivationResult.set(res);
            }
          });
      } else {
        this.router.navigate(['/manage/users/verify-user-id'], {
          queryParams: {
            type: CVSourceType.add_new_business,
            from: this.data.from
          }
        });
      }
    } else if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc', this.data.sourceType)
        .subscribe((res) => {
          if (res?.data?.inquiry_type === 'kyb') {
            this.personaHelperService.kycKybVerifivationResult.set(res);
          }
        });
    } else {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: {
          type: this.data?.sourceType,
          bankAccountId: this.bankAccountId.value.id
        }
      });
    }
    this.dialogRef.close();
  }

  /**
   * @description Handles the change event when a bank is selected from the dropdown.
   * @param event - The selected bank from the dropdown.
   */
  bankDropDownChange(event: IBankDropdown) {
    this.bankAccountId.setValue(event);
    this.bankAccountId.addValidators([this.isBankVerified]);
    if (this.data?.isShowBankDropDown && !this.data.applyCheckDraft) {
      this.bankAccountId.addValidators([this.isACHApproved]);
    }
    this.bankAccountId.updateValueAndValidity();
    this.bankAccountId.markAsTouched();
  }

  /**
   * @description Custom validator that checks if a bank account is verified.
   * @param control - The form control representing the bank account.
   * @returns An object with the `isVerified` property set to `false` if the bank account is not verified, or `null` if it is verified.
   */
  isBankVerified(control: AbstractControl): { isVerified: boolean } | null {
    if (control.value?.verified === 1) {
      return null;
    }
    return { isVerified: false };
  }

  /**
   * @description Custom validator that checks if an ACH transaction is already approved.
   * @param control The form control representing the ACH transaction.
   * @returns An object with the `isAlreadyApproved` property set to `true` if the ACH transaction is already approved, or `null` if it is not approved.
   */
  isACHApproved(
    control: AbstractControl
  ): { isAlreadyApproved: boolean } | null {
    if (control.value?.isItZil || control.value?.status >= 3) {
      return { isAlreadyApproved: true };
    }
    return null;
  }

  /**
   * @description Returns the error message for the bank account validation.
   */
  get errorBankMsg(): string {
    if (this.bankAccountId.errors?.required) {
      return 'Please select bank account.';
    }
    if (this.bankAccountId.errors?.isVerified === false) {
      return 'Selected bank is not verified.';
    }
    if (this.bankAccountId.errors?.isAlreadyApproved === true) {
      return 'Bank account already approved for ACH.';
    }
    return '';
  }

  /**
   * @description  Generates the alert title based on the business name and the selected application type.
   * @param businessName The name of the business.
   * @returns The alert title string.
   */
  getAlertTitle(businessName: string): string {
    let title;
    if (this.data?.applyCloudBank) {
      title = `Apply cloud bank for ${businessName}`;
    } else if (this.data?.applyCheckDraft) {
      title = `Apply check draft for ${businessName}`;
    } else {
      title = `Apply ACH for ${businessName}`;
    }
    return title;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
    this.personaHelperService.kycKybVerifivationResult.set(undefined);
  }
}
