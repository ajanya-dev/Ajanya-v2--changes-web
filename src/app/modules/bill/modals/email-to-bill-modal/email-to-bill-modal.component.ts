import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, Subject, Subscription, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark, faLink, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { Router } from '@angular/router';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-email-to-bill-modal',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    ReactiveFormsModule
  ],
  templateUrl: './email-to-bill-modal.component.html',
  styleUrl: './email-to-bill-modal.component.scss'
})
export class EmailToBillModalComponent implements OnInit, OnDestroy {
  private billService = inject(BillService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EmailToBillModalComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private router = inject(Router);
  loading = false;
  formGroup: FormGroup;
  subscriptions: Subscription[] = [];
  isSetupComplete = false;
  username = '';
  showValidationErrors = false;
  mappedEmailToBill = '';
  isEmailToBillMapped = false;

  faXmark = faXmark;
  faLink = faLink;
  faCheck = faCheck;
  destroy$ = new Subject<boolean>();

  ngOnInit(): void {
    this.isSetupComplete = this.data.isEmailToBillMapped;
    this.mappedEmailToBill = this.data.mappedEmailToBill;
    this.formGroup = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          ValidationService.noWhitespaceValidator
        ]
      ]
    });
  }

  /**
   * @description - Function to connect and automate call.to map ocw email to bill mail.
   * @returns void
   */
  connectAndAutomateCall() {
    // Mark all fields as touched to show validation errors
    this.formGroup.markAllAsTouched();
    this.showValidationErrors = true;

    if (this.formGroup.invalid) {
      return;
    }

    this.username = this.formGroup.get('username')?.value?.trim();
    const emailData = {
      email_address: `${this.username}@bill.zilmoney.com`
    };

    this.loading = true;
    this.billService
      .connectAndAutomateCall(emailData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.isSetupComplete = true;
        } else {
          this.alertService.failedAlert({
            content: res.message,
            close: true,
            timeout: 1500
          });
        }
      });
  }

  /**
   * @description - Function to navigate to email inbox after setup completion
   * @returns void
   */
  goToEmailInbox() {
    this.dialogRef.close();
    this.router.navigate(['manage/bill/inbox']);
  }

  /**
   * @description - Function to close the modal
   * @returns void
   */
  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
