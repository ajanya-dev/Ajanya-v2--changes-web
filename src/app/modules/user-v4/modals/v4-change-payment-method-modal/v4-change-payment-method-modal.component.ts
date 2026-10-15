import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideAngularModule,
  Check,
  CreditCard,
  ShieldCheck,
  TriangleAlert,
  Wallet,
  X
} from 'lucide-angular';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IAppConfig } from 'src/app/models/app_settings';
import { IWalletData } from 'src/app/models/wallet';
import { IApiRes } from 'src/app/models/api';

export type ChangePaymentMode = 'change-payment' | 'update-card';

export interface IChangePaymentModalData {
  mode: ChangePaymentMode;
}

@Component({
  selector: 'app-v4-change-payment-method-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ],
  templateUrl: './v4-change-payment-method-modal.component.html',
  styleUrl: './v4-change-payment-method-modal.component.scss'
})
export class V4ChangePaymentMethodModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4ChangePaymentMethodModalComponent>);
  private dialogData = inject<IChangePaymentModalData | null>(MAT_DIALOG_DATA, { optional: true });

  private fb = inject(FormBuilder);
  private subscriptionService = inject(SubscriptionService);
  private sanitizer = inject(DomSanitizer);
  private alertService = inject(V4AlertService);
  private walletService = inject(WalletService);
  private appSettingsService = inject(AppSettingsService);
  private destroyRef = inject(DestroyRef);

  // White-label
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  appConfig: IAppConfig | undefined;

  // Icons
  readonly CheckIcon = Check;
  readonly CreditCardIcon = CreditCard;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly WalletIcon = Wallet;
  readonly XIcon = X;

  // Mode
  mode: ChangePaymentMode = 'change-payment';
  isUpdateCardOnly = false;

  // Payment state
  paymentMethod = signal<'Card' | 'Wallet'>('Card');
  cardLink: SafeResourceUrl = '';
  cardLoading = signal(false);
  securedLoading = signal(false);
  isItDownGrade = false;
  isPaymentLoading = signal(false);

  // Wallet
  walletList: IWalletData[] = [];
  walletLoading = false;
  walletForm = this.fb.group({
    wallet: ['', [Validators.required]]
  });

  walletDropdownConfig = {
    displayField: 'walletName',
    displaySubField: 'availableBalance',
    outputField: 'uuId',
    placeholder: 'Select Wallet'
  };

  get title(): string {
    return this.isUpdateCardOnly ? 'Update Card' : 'Change Payment Method';
  }

  get description(): string {
    return this.isUpdateCardOnly
      ? 'Update your card details for your subscription.'
      : 'Choose your preferred payment method for your subscription.';
  }

  ngOnInit(): void {
    this.mode = this.dialogData?.mode || 'change-payment';
    this.isUpdateCardOnly = this.mode === 'update-card';

    this.loadAppSettings();
    this.initiatePayment();
  }

  private loadAppSettings(): void {
    this.appSettingsService.appConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      });
  }

  private initiatePayment(): void {
    this.securedLoading.set(true);
    setTimeout(() => this.securedLoading.set(false), 3000);

    if (this.isUpdateCardOnly) {
      this.loadUpdateCard();
    } else {
      this.loadChangePaymentCard();
      this.loadWallets();
    }
  }

  /**
   * Update Card — POST /subscription/associate-card
   * Used for "Update Card/PayPal" button
   */
  private loadUpdateCard(): void {
    this.cardLoading.set(true);
    this.isItDownGrade = false;

    const successPageUrl = `https://${window.location.host}/v4/manage/subscription/completed?type=1`;

    this.subscriptionService
      .updateCard({ successPageUrl })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cardLoading.set(false)),
        catchError((e) => {
          if (e.error?.errorCode === 200) {
            this.isItDownGrade = true;
          }
          return of(false);
        })
      )
      .subscribe((res: IApiRes<{ url: string }> | false) => {
        if (res && res.success) {
          this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(
            res.data.url
          );
        }
      });
  }

  /**
   * Change Payment Method (Card) — POST /subscription/payment-method/online
   * Used for "Change" payment method button
   */
  private loadChangePaymentCard(): void {
    this.cardLoading.set(true);
    this.isItDownGrade = false;

    this.subscriptionService
      .updatePaymentCard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cardLoading.set(false)),
        catchError((e) => {
          if (e.error?.errorCode === 200) {
            this.isItDownGrade = true;
          }
          return of(false);
        })
      )
      .subscribe((res: IApiRes<{ url: string }> | false) => {
        if (res && res.success) {
          this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(
            res.data.url
          );
        }
      });
  }

  /**
   * Load wallet list
   */
  private loadWallets(): void {
    this.walletLoading = true;
    this.walletService
      .getWalletInformation()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.walletLoading = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.walletList = res.data;
        }
      });
  }

  /**
   * Submit wallet as payment method — POST /subscription/payment-method/offline
   */
  submitWalletPayment(): void {
    this.walletForm.markAllAsTouched();
    if (this.walletForm.invalid) return;

    this.isPaymentLoading.set(true);

    const payload = {
      type: 'wallet',
      wallet: this.walletForm.value.wallet ?? ''
    };

    this.subscriptionService
      .updatePaymentCheckAndWallet(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isPaymentLoading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ title: 'Payment method updated' });
          this.dialogRef.close(true);
        }
      });
  }

  switchPaymentMethod(method: 'Card' | 'Wallet'): void {
    this.paymentMethod.set(method);
    if (method === 'Card' && !this.cardLink) {
      this.loadChangePaymentCard();
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
