import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import {
  LucideAngularModule,
  X,
  Mail,
  Zap,
  Settings,
  Copy,
  Check
} from 'lucide-angular';
import { finalize } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

@Component({
  selector: 'app-v4-configure-bill-inbox',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSlideToggle,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './v4-configure-bill-inbox.component.html',
  styleUrls: ['./v4-configure-bill-inbox.component.scss']
})
export class V4ConfigureBillInboxComponent {
  private billService = inject(BillService);
  private alertService = inject(V4AlertService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4ConfigureBillInboxComponent>);
  private data: { mappedEmailToBill: string; isEmailToBillMapped: boolean } =
    inject(MAT_DIALOG_DATA);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  isSetupComplete = signal(false);
  username = signal('');

  readonly XIcon = X;
  readonly MailIcon = Mail;
  readonly ZapIcon = Zap;
  readonly SettingsIcon = Settings;
  readonly CopyIcon = Copy;
  readonly CheckIcon = Check;
  readonly billInboxDomain =
    environment.env_id === 'staging' || environment.env_id === 'staging_dev'
      ? 'staging.bill.zilmoney.com'
      : 'bill.zilmoney.com';

  formGroup = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        ValidationService.noWhitespaceValidator
      ]
    ],
    autoApproveHighConfidence: [false],
    emailNotifications: [true]
  });

  constructor() {
    this.isSetupComplete.set(this.data.isEmailToBillMapped);
  }

  get mappedEmailToBill(): string {
    return this.data.mappedEmailToBill || '';
  }

  billInboxEmailDisplay(): string {
    const username = this.formGroup.get('username')?.value?.trim() || '';
    return username ? `${username}@${this.billInboxDomain}` : '';
  }

  copyBillInboxEmail(): void {
    const email = this.billInboxEmailDisplay();
    if (!email) return;
    navigator.clipboard.writeText(email).then(() => {
      this.alertService.successAlert({
        content: 'Email address copied to clipboard',
        close: true,
        timeout: 1500
      });
    });
  }

  connectAndAutomate(): void {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    const trimmedUsername = this.formGroup.get('username')?.value?.trim() || '';
    this.username.set(trimmedUsername);

    this.loading.set(true);
    this.billService
      .connectAndAutomateCall({
        email_address: `${trimmedUsername}@${this.billInboxDomain}`
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.isSetupComplete.set(true);
        } else {
          this.alertService.failedAlert({
            content: res.message,
            close: true,
            timeout: 1500
          });
        }
      });
  }

  goToEmailInbox(): void {
    this.dialogRef.close();
    this.router.navigate(['/v4/manage/bill/inbox']);
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
