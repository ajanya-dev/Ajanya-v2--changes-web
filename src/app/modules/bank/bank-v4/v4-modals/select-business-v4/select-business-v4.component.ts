import {
  UntypedFormControl,
  Validators,
  AbstractControl
} from '@angular/forms';
import { EnvironmentId } from 'src/app/models/environment';
import { environment } from 'src/environments/environment';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { V4LoaderModalComponent } from 'src/app/shared/modal/v4-loader-modal/v4-loader-modal.component';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { IBankDropdown, IBusinessDetails } from 'src/app/models/bank';
import { UserV3DataService } from 'src/app/modules/user/user-v3/services/user-v3-data.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, X, Briefcase } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from '../../../../../shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import {
  IPersonalCloudAccount,
  PersonalAccountDetailsV4Component
} from '../v4-personal-account-details/v4-personal-account-details.component';

@Component({
  selector: 'app-select-business',
  templateUrl: './select-business-v4.component.html',
  styleUrls: ['./select-business-v4.component.scss'],
  standalone: true,
  imports: [
    BankAcDropdownV4Component,
    MatDialogClose,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class SelectBusinessV4Component implements OnInit, OnDestroy {
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

  readonly XIcon = X;
  readonly BriefcaseIcon = Briefcase;

  private personaHelperService = inject(PersonaHelperService);
  public data: ISelectBizData = inject(MAT_DIALOG_DATA);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<SelectBusinessV4Component>);
  private dialog = inject(MatDialog);
  private cloudBankService = inject(CloudBankService);
  private commonVerificationService = inject(CommonVerificationService);
  private userDataService = inject(UserV3DataService);

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

  loadLabels(): void {
    if (this.data?.applyCloudBank) {
      this.typeLabel = 'business cloud bank account';
    } else if (this.data?.applyCheckDraft) {
      this.typeLabel = 'Check Draft';
    } else {
      this.typeLabel = 'ACH';
    }
  }

  selectBusinessItem(item: IUserBusiness): void {
    if (item?.status === 3) {
      return;
    }
    this.isPersonalAccount = '0';
    this.isOtherBusinessSelected = false;
    this.selectedBusiness = item;
  }

  selectOtherBusiness(): void {
    this.isPersonalAccount = '0';
    this.isOtherBusinessSelected = true;
    this.selectedBusiness = undefined as unknown as IUserBusiness;
  }

  selectPersonalAccount(): void {
    this.isPersonalAccount = this.isPersonalAccount !== '0' ? '0' : '1';
    this.isOtherBusinessSelected = false;
  }

  submit(): void {
    if (
      this.isSolidBusiness &&
      this.data?.sourceType === CVSourceType.cloud_bank
    ) {
      this.subscriptions.push(
        this.cloudBankService
          .applyCloudBank(this.selectedBusiness.id)
          .subscribe((res) => {
            if (res.success) {
              this.cloudBankService.cloudBankStatus();
            }
          })
      );
      return;
    }
    if (this.personalAccountExists && this.isPersonalAccount === '1') {
      const formData = new FormData();
      formData.append(`personal[occupation]`, '');
      formData.append(`personal[document][localNationalDocument]`, '');
      formData.append(`personal[document][supportingDocument]`, '');
      formData.append(`accountType`, 'personalChecking');
      this.dialog
        .open<V4LoaderModalComponent, IActionLoaderData>(
          V4LoaderModalComponent,
          {
            maxWidth: '450px',
            width: '90%',
            panelClass: 'paddingless-modal-rounded',
            disableClose: true,
            data: { type: { cloudBankPersonalAccount: formData } }
          }
        )
        .afterClosed()
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(res);
          }
        });
      return;
    }
    if (this.isPersonalAccount === '1') {
      this.dialog
        .open<PersonalAccountDetailsV4Component, IPersonalCloudAccount>(
          PersonalAccountDetailsV4Component,
          {
            maxWidth: '95%',
            width: '600px',
            panelClass: 'paddingless-modal-rounded',
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
              this.dialogRef.close({
                businessId: this.selectedBusiness.id,
                selectedBusiness: this.selectedBusiness?.businessName
              });
            }
          }
        });
    }
  }

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
        this.router.navigate(['/v4/manage/users/verify-user-id'], {
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
      this.router.navigate(['/v4/manage/users/verify-user-id'], {
        queryParams: {
          type: this.data?.sourceType,
          bankAccountId: this.bankAccountId.value.id
        }
      });
    }
    this.dialogRef.close();
  }

  bankDropDownChange(event: IBankDropdown | null | undefined) {
    if (!event) return;
    this.bankAccountId.setValue(event);
    this.bankAccountId.addValidators([this.isBankVerified]);
    if (this.data?.isShowBankDropDown && !this.data.applyCheckDraft) {
      this.bankAccountId.addValidators([this.isACHApproved]);
    }
    this.bankAccountId.updateValueAndValidity();
    this.bankAccountId.markAsTouched();
  }

  isBankVerified(control: AbstractControl): { isVerified: boolean } | null {
    if (control.value?.verified === 1) {
      return null;
    }
    return { isVerified: false };
  }

  isACHApproved(
    control: AbstractControl
  ): { isAlreadyApproved: boolean } | null {
    if (control.value?.isItZil || control.value?.status >= 3) {
      return { isAlreadyApproved: true };
    }
    return null;
  }

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
