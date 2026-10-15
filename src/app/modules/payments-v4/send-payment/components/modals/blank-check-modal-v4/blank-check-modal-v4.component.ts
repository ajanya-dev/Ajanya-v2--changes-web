import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';
import { Utils } from 'src/app/data/utils';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { INumberOnlyEvent } from 'src/app/modules/invoices/model/invoice';

@Component({
  selector: 'app-blank-check-modal-v4',
  templateUrl: './blank-check-modal-v4.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    BankAcDropdownV4Component,
    CategoryDropdownV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class BlankCheckModalV4Component implements OnInit, OnDestroy {
  private userProfileService = inject(UserProfileService);
  private v3DataTableService = inject(V3DataTableService);
  private fb = inject(UntypedFormBuilder);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<BlankCheckModalV4Component>);
  private router = inject(Router);
  private dialogData: { hideDemoVideo: boolean } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  readonly includeSignatureConfig: Iv4ngSelectConfig = {
    placeholder: 'Select',
    displayField: 'label',
    outputField: 'value'
  };

  readonly includeSignatureOptions = [
    { label: 'No', value: '0' },
    { label: 'Yes', value: '1' }
  ];

  subscriptions: Subscription[] = [];
  submitting = false;
  hideDemoVideo = false;
  utils = Utils;
  selectedBank = new FormControl();
  selectedBankId: string;
  selectedCategory = new FormControl();
  selectedCategoryId: string;

  blankCheckForm: UntypedFormGroup;
  userEmailAndPhoneVerified = false;

  ngOnInit(): void {
    this.initConfig();
    this.initFormGroup();
    this.setUserVerificationStatus();
    this.getSelectedBank();
    this.getSelectedCategory();
  }

  initConfig() {
    this.hideDemoVideo = !!this.dialogData?.hideDemoVideo;
  }

  initFormGroup() {
    this.blankCheckForm = this.fb.group({
      accountId: ['', Validators.required],
      total: ['1', [Validators.required, Validators.min(1)]],
      categoryId: [''],
      includeSignature: ['1']
    });
  }

  onSubmit() {
    this.blankCheckForm.markAllAsTouched();

    if (!this.blankCheckForm.valid) {
      return;
    }
    this.submitting = true;

    const formData = new FormData();
    const formValue = this.blankCheckForm.value;
    Object.keys(formValue).forEach((key) => {
      if (formValue[key] !== null && formValue[key] !== '') {
        formData.append(key, formValue[key]);
      }
    });

    this.subscriptions.push(
      this.checkService
        .createBlankChecks(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.router.navigate(['/v4/manage/payments-out/detailed/check']);
            this.dialogRef.close(data);
            this.alertService.successAlert({
              title: 'Success',
              content: 'Blank checks created',
              close: true
            });
            this.v3DataTableService.refreshV3DataTable();
          }
        })
    );
  }

  numberOnly(event: INumberOnlyEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  getSelectedBank() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) {
            return;
          }
          this.blankCheckForm.controls.accountId.setValue(res?.id);
          this.blankCheckForm.controls.accountId.markAllAsTouched();
          this.selectedBankId = res.id;
        }
      })
    );
  }

  onRemoveBank() {
    this.selectedBankId = '';
    this.blankCheckForm.controls.accountId.setValue(null);
    this.blankCheckForm.controls.accountId.markAllAsTouched();
  }

  getSelectedCategory() {
    this.subscriptions.push(
      this.selectedCategory.valueChanges.subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedCategoryId) {
            return;
          }
          this.blankCheckForm.controls.categoryId.setValue(res?.id);
          this.blankCheckForm.controls.categoryId.markAllAsTouched();
          this.selectedCategoryId = res.id;
        }
      })
    );
  }

  onRemoveCategory() {
    this.selectedCategoryId = '';
    this.blankCheckForm.controls.categoryId.setValue(null);
    this.blankCheckForm.controls.categoryId.markAllAsTouched();
  }

  setUserVerificationStatus() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified !== 0 && res.phone_verified !== 0) {
          this.userEmailAndPhoneVerified = true;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
