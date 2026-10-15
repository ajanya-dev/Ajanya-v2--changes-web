import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-external-micro-deposit',
  standalone: true,
  imports: [
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    FaIconComponent
  ],
  templateUrl: './external-micro-deposit.component.html',
  styleUrl: './external-micro-deposit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalMicroDepositComponent implements OnInit, OnDestroy {
  private outsideService = inject(OutsideService);
  private route = inject(ActivatedRoute);
  public authV3Service = inject(AuthV3Service);
  private alertService = inject(AlertService);
  private destroy$ = new Subject();

  env = environment;
  logoPath = 'assets/main/app_logo.svg';
  isLoading = signal(false);
  isSubmit = signal(false);
  linkNotExpired = signal(false);
  depositConfirmed = signal(false);
  bankAccountNumber = signal('');
  bankAccountName = signal('');
  bankName = signal('');

  bankAccountId: string;
  requestId: string;
  successMessage:string;

  faCircleCheck = faCircleCheck;

  microDepositForm = new FormGroup({
    amount1: new FormControl('', [Validators.required]),
    amount2: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.bankAccountId = this.route.snapshot.queryParamMap?.get('bankAccountId') || '';
    this.requestId = this.route.snapshot.queryParamMap?.get('mdRequestId') || '';
    this.getBankDetails(this.bankAccountId,this.requestId);
    if (this.env.isItWhiteLabel) {
      this.logoPath = `assets/white_label/${this.env.env_id}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
    }
  }

  getBankDetails(bankAccountId: string,requestId: string) {
    this.isLoading.set(true);
    this.outsideService
      .getBankDetails(bankAccountId,requestId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next:(res) => {
          this.linkNotExpired.set(res.success);
          if (res.success && res.data) {            
            this.bankAccountNumber.set(res.data.bank_account_number || '');
            this.bankAccountName.set(res.data.bank_account_name || '');
            this.bankName.set(res.data.bank_name || '');
          }
        },
        error: () => {
          this.linkNotExpired.set(false);
        }
      });
        
  }

  submit() {
    this.microDepositForm.markAllAsTouched();
    if (this.microDepositForm.invalid) return;

    // Show confirmation dialog before submitting
    const confirmData = {
      content: 'Are you sure you want to submit the amounts ?',
      doneMsg: 'Confirm',
      cancelMsg: 'Cancel'
    };

    const confirmDialog = this.alertService.confirmAlert(confirmData);
    
    confirmDialog.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.isSubmit.set(true);
        
        const payload = {
          request_id: this.requestId,
          bank_account_id: this.bankAccountId,
          amount1: Number(this.microDepositForm.value.amount1),
          amount2: Number(this.microDepositForm.value.amount2)
        };

        this.outsideService
          .confirmExternalMicroDeposit(payload)
          .pipe(
            finalize(() => this.isSubmit.set(false)),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.depositConfirmed.set(true);
                this.successMessage = res.message || 'Your bank account has been verified successfully.';
              }
            },
            error: () => {
              this.depositConfirmed.set(false);
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}