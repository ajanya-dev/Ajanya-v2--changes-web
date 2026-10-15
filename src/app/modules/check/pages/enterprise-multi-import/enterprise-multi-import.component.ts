// import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';

@Component({
  selector: 'app-enterprise-multi-import',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    SharedModule,
    CommonUploadButtonV35Component,
    CommonButtonV35Component
  ],
  templateUrl: './enterprise-multi-import.component.html',
  styleUrl: './enterprise-multi-import.component.scss'
})
export class EnterpriseMultiImportComponent implements OnInit, OnDestroy {
  public fb = inject(FormBuilder);
  public userProfileService = inject(UserProfileService);
  private checkService = inject(CheckService);
  private authDataService = inject(AuthDataService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];
  submitting = false;
  fileName = '';
  sampleFileUrl: string;
  selectedBank = new FormControl();
  selectedBankId: string;
  isDeleting = false;
  importForm: FormGroup = this.fb.group({
    bankAccount: ['', [Validators.required]],
    file: [null, [Validators.required]]
  });

  ngOnInit(): void {
    this.getSelectedBank();
  }

  /**
   * Method to get selected bank from dropdown
   */
  getSelectedBank() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) {
            return;
          }
          this.importForm.controls.bankAccount.setValue(res?.id);
          this.importForm.controls.bankAccount.markAllAsTouched();
          this.selectedBankId = res.id;
        }
      })
    );
  }

  /**
   * clear bank selection
   */
  onRemoveBank() {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  /**
   * @description Handles the event when files are selected for upload.
   * @param {File[]} files - An array of selected File objects for upload.
   */
  uploadEvent(files: File): void {
    if (files && files?.name) {
      this.fileName = files?.name;
      this.importForm.controls.file.setValue(files);
    } else {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.markAsTouched();
    }
  }

  /**
   * @description Initiates the submission process for the import form.
   */
  submit() {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.authDataService.verifyEmailAndMobile(
            this.authDataService.getVerificationMessage(res),
            'Not Now'
          );
          return;
        }
        this.processImport();
      })
    );
  }

  /**
   * @description Initiates the import process.
   */
  processImport() {
    // const formData = this.getFormData(this.importForm.value);
    const formData = new FormData();
    formData.append('bankAccount', this.importForm.value.bankAccount);
    formData.append('file', this.importForm.value.file);
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .enterpriseMultiImport(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data.success) {
            this.alertService.successAlert({
              content: 'Imported Successfully'
            });
            this.router.navigateByUrl('/manage/payments-table/index');
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
