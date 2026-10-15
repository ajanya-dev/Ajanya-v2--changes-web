import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  ICloudAirwallexAccountInfo,
  ICloudBankAccountDetailsAirwallex
} from '../../../model/cloudbank';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { CommonInputFieldComponent } from '../../../../../shared/v3/common-input-field/common-input-field.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, SlicePipe, TitleCasePipe } from '@angular/common';
import { WhiteLabelDirective } from '../../../../../directive/white-label.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * Represents the cloud account information modal component.
 * @class
 * @implements {OnInit} - Angular interface for initialization
 * @implements {OnDestroy} - Angular interface for destruction
 */
@Component({
  selector: 'app-cloud-account-info-modal',
  templateUrl: './cloud-account-info-modal.component.html',
  styleUrls: ['./cloud-account-info-modal.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    WhiteLabelDirective,
    MatDialogClose,
    NgClass,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    SlicePipe,
    TitleCasePipe,
    TruncatePipe
  ]
})
export class CloudAccountInfoModalComponent implements OnInit, OnDestroy {
  /** Array to hold subscriptions */
  subscription: Subscription[] = [];

  /** Injected instance of CloudBankService */
  public cloudBankService = inject(CloudBankService);

  /** Injected instance of MatDialogRef for the component */
  public dialogRef = inject(MatDialogRef<CloudAccountInfoModalComponent>);

  /** injected form builder */
  private fb = inject(FormBuilder);

  /** Injected account details passed from MAT_DIALOG_DATA */
  public setAccountDetails: ICloudBankAccountDetailsAirwallex =
    inject(MAT_DIALOG_DATA);

  /** Email form */
  emailForm: FormGroup;

  /** Flag to control the visibility of the account number */
  showAccountNumber = false;

  /** Flag to indicate loading state */
  loading = false;

  /** Selected option for action: "email" or "download" */
  selectedOption: 'email' | 'download' | 'email me' | '';

  /** Holds the account details */
  accountDetails: ICloudAirwallexAccountInfo;

  /** Array of switch options */
  switchArray: { name: string; id: string }[] = [
    { name: 'ACH', id: 'ach' },
    { name: 'Wire', id: 'wire' },
    { name: 'International', id: 'international' }
  ];

  /** Default selected item */
  selectedItem = 'ach';

  emailSendText = 'Send';
  isDownload = false;

  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.getAccountDetails();
    this.initFormGroup();
  }

  initFormGroup() {
    this.emailForm = this.fb.group({
      email: ['', [ValidationService.emailValidator, Validators.required]]
    });
  }

  /** Fetches account details */
  getAccountDetails(): void {
    this.accountInfo('json', this.setAccountDetails.id, '');
  }

  /**
   * Handles click event for switch options.
   * @param {string} id - Identifier of the selected option
   */
  onClick(id: string): void {
    this.selectedItem = id;
  }

  /**
   * resetting modal on back button clicked
   */
  onBackClick() {
    this.selectedOption = '';
    this.emailSendText = 'Send';
  }

  /**
   * Fetches account information.
   * @param {string} type - Type of action: 'email' or 'download'
   * @param {string} accountId - ID of the account
   * @param {string} [selectedOption] - Selected option for the action
   */
  accountInfo(type: string, accountId: string, selectedOption?: string): void {
    this.loading = true;
    this.subscription.push(
      this.cloudBankService
        .cloudAccountInfo(accountId, type, selectedOption)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.data) {
            this.accountDetails = res.data;
          }

          if (type === 'email' && res?.success) {
            this.alertService.successAlert({ content: 'Successfully Emailed' });
            this.dialogRef.close();
          }

          if (type === 'download' && res?.success && res?.data?.url) {
            window.open(res?.data?.url);
            this.dialogRef.close();
          }
        })
    );
  }

  /** Initiates email action */
  emailNow(isSendMail: boolean): void {
    if (!isSendMail) {
      if (this.loading) {
        return;
      }
      this.selectedOption = 'email';
      this.emailSendText = 'Send Now';
      return;
    }
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) {
      return;
    }
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.subscription.push(
      this.cloudBankService
        .cloudAccountInfo(
          this.setAccountDetails.id,
          'email',
          this.selectedOption,
          this.emailForm.value.email
        )
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.alertService.successAlert({
                content: 'Successfully Emailed'
              });
              this.dialogRef.close(true);
            }
          }
        })
    );
  }

  emailMe() {
    if (this.loading) {
      return;
    }
    this.selectedOption = 'email me';
    this.accountInfo('email', this.setAccountDetails.id, this.selectedItem);
  }

  /** Initiates download action */
  downloadNow(): void {
    if (this.loading) {
      return;
    }
    this.selectedOption = 'download';
    this.accountInfo('download', this.setAccountDetails.id, this.selectedItem);
  }

  /**
   * @description Download verification letter.
   */
  downloadLetter() {
    if (this.isDownload) return;
    this.isDownload = true;
    this.subscription.push(
      this.cloudBankService
        .verificationLetter(this.setAccountDetails.id, 'download')
        .pipe(
          finalize(() => {
            this.isDownload = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            window.open(res.data?.url);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el.unsubscribe());
  }
}
