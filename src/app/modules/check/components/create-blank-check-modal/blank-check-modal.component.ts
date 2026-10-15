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
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { UserProfileService } from '../../../../shared/service/user/user-profile.service';
import { NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CategoryDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { INumberOnlyEvent } from 'src/app/modules/invoices/model/invoice';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-blank-check-modal',
  templateUrl: './blank-check-modal.component.html',
  styleUrls: ['./blank-check-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    ControlMessageComponent,
    BankAcDropdownV3Component,
    CategoryDropdownV3Component,
    MatDialogActions,
    NgSelectModule,
    CommonButtonV35Component,
    NgClass
  ]
})
export class BlankCheckModalComponent implements OnInit, OnDestroy {
  private userProfileService = inject(UserProfileService);
  private v3DataTableService = inject(V3DataTableService);

  private fb = inject(UntypedFormBuilder);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<BlankCheckModalComponent>);
  private router = inject(Router);
  private dialogData:{hideDemoVideo: boolean } = inject(MAT_DIALOG_DATA);

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
    if (!this.userEmailAndPhoneVerified) {
      this.router.navigateByUrl('/manage/users/verify-email-phone');
      this.dialogRef.close();
      return;
    }
    this.subscriptions.push(
      this.checkService
        .createBlankChecks(this.blankCheckForm.value)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.router.navigate(['/manage/cheque']);
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
          this.blankCheckForm.controls.accountId.setValue(res?.id);
          this.blankCheckForm.controls.accountId.markAllAsTouched();
          this.selectedBankId = res.id;
        }
      })
    );
  }

  /**
   * clear bank selection
   */
  onRemoveBank() {
    this.selectedBankId = '';
    this.blankCheckForm.controls.accountId.setValue(null);
    this.blankCheckForm.controls.accountId.markAllAsTouched();
  }

  /**
   * Method to get selected category from dropdown
   */
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

  /**
   * clear category selection
   */
  onRemoveCategory() {
    this.selectedCategoryId = '';
    this.blankCheckForm.controls.categoryId.setValue(null);
    this.blankCheckForm.controls.categoryId.markAllAsTouched();
  }

  /**
   * @description Method to set the user verification status value from the `UserVerification$` behaviorSubject from user profile service to `this.userEmailAndPhoneVerified.`
   */
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
