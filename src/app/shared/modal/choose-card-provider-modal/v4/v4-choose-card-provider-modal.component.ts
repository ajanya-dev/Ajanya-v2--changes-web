import { Component, OnDestroy, ViewEncapsulation, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { ICyberSourceCardAddRequestModel } from 'src/app/modules/integration/model/integration';
import { Router } from '@angular/router';
import { Subject, finalize, firstValueFrom, takeUntil } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CyberSourceAutherizationModalComponent } from '../../cyber-source-modals/cyber-source-autherization-modal/cyber-source-autherization-modal.component';
import { IAddCardResponse } from '../../add-credit-card/add-credit-card.model';
import { V4AddCreditCardComponent } from '../../add-credit-card/v4/v4-add-credit-card.component';

@Component({
  selector: 'app-v4-choose-card-provider-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    NgOptimizedImage
  ],
  templateUrl: './v4-choose-card-provider-modal.component.html',
  styleUrl: './v4-choose-card-provider-modal.component.scss'
})
export class V4ChooseCardProviderModalComponent implements OnDestroy {
  readonly XIcon = X;

  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef);
  private cyberSourceService = inject(CybersourceService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private dialogData = inject<{
    success: boolean;
    token: string;
    amex_allowed: 0 | 1;
    amex_divert_to_cybersource: 0 | 1;
    gateway_type: 2 | 4 | 5;
    gateway_url: string;
    user_application_iv: string;
    user_application_id: string;
    amex_token: string;
  }>(MAT_DIALOG_DATA);

  private localStorageService = inject(LocalStorageService);

  loading = false;
  destroy$ = new Subject<boolean>();

  nickNameControl = new FormControl('', Validators.required);

  cardProviders = [
    {
      id: 'visa',
      icon: 'assets/images/card-providers/visa-logo.png',
      width: '60',
      height: '20'
    },
    {
      id: 'master-card',
      icon: 'assets/images/card-providers/master-card-logo.png',
      width: '60',
      height: '47'
    },
    {
      id: 'amex',
      icon: 'assets/images/card-providers/american-express.png',
      width: '60',
      height: '42'
    },
    {
      id: 'discover',
      icon: 'assets/images/card-providers/discover-logo-transparent.png',
      width: '60',
      height: '39'
    }
  ] as const;

  colors = [
    {
      color: 'green',
      code: '#E5F8F2',
      displayCode: 'var(--v4-common-green-color)'
    },
    {
      color: 'blue',
      code: '#E9F3FF',
      displayCode: 'var(--v4-primary-brand-color)'
    },
    {
      color: 'violet',
      code: '#EDEBFF',
      displayCode: 'var(--v4-common-violet-color)'
    },
    { color: 'red', code: '#FAEFF5', displayCode: 'var(--v4-common-red-color)' }
  ] as const;

  selectedProvider: (typeof this.cardProviders)[number] = this.cardProviders[0];
  selectedColor: (typeof this.colors)[number] = this.colors[0];

  selectProvider(provider: (typeof this.cardProviders)[number]) {
    const currentUserId = this.localStorageService.getItem('userId');
    if (
      provider.id === 'amex' &&
      currentUserId !== 28567 &&
      this.dialogData.amex_allowed === 0
    ) {
      this.alertService.infoAlert({
        content:
          'Our Amex card service is temporarily unavailable as we work on enhancements for a smoother user experience and will be back soon.'
      });
      return;
    }
    this.selectedProvider = provider;
  }

  selectColor(color: typeof this.selectedColor) {
    this.selectedColor = color;
  }

  onContinue() {
    this.nickNameControl.markAsTouched();
    if (this.nickNameControl.invalid) return;

    if (
      this.selectedProvider.id !== 'amex' ||
      this.dialogData.amex_divert_to_cybersource === 0
    ) {
      const ref = this.dialog.open<
        V4AddCreditCardComponent,
        {
          nickName: string;
          color: string;
          data: {
            success: boolean;
            token: string;
            amex_allowed: 0 | 1;
            gateway_type: 2 | 4 | 5;
            gateway_url: string;
            user_application_iv: string;
            user_application_id: string;
            selectedProvider: string;
            amex_token: string;
          };
        },
        {
          success: boolean;
          data: IAddCardResponse;
          errorCode: number;
          cardCreated?: boolean;
        }
      >(V4AddCreditCardComponent, {
        width: '547px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          nickName: this.nickNameControl.value as string,
          color: this.selectedColor.code,
          data: {
            success: this.dialogData.success,
            token: this.dialogData.token,
            amex_allowed: this.dialogData.amex_allowed,
            gateway_type: this.dialogData.gateway_type,
            gateway_url: this.dialogData.gateway_url,
            user_application_iv: this.dialogData.user_application_iv,
            user_application_id: this.dialogData.user_application_id,
            selectedProvider: this.selectedProvider.id,
            amex_token: this.dialogData.amex_token
          }
        }
      });

      ref
        .beforeClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (val) => {
          if (val?.success) {
            this.dialogRef.close({ ...val, type: 'nmi' });
            return;
          }
          if (!val?.success && val?.errorCode === 677) {
            const value = await firstValueFrom(
              this.alertService
                .confirmAlert({
                  content: 'Please confirm your card details again'
                })
                .afterClosed()
            );
            if (value) {
              this.cybersourceGetData(
                this.nickNameControl.value as string,
                this.selectedColor.code
              );
            } else {
              this.dialogRef.close({ success: false });
            }
            return;
          }
          // Cancelled / closed without a card. `cardCreated` is set when the
          // user backed out of the "Confirm Card" step after the first gateway
          // already stored the card, so callers can refresh their lists.
          this.dialogRef.close({
            success: false,
            cardCreated: !!val?.cardCreated
          });
        });
    } else {
      this.cybersourceGetData(
        this.nickNameControl.value as string,
        this.selectedColor.code
      );
    }
  }

  cybersourceGetData(nickName: string, bgColor?: string) {
    const sendingData = { nickName, bgColor };
    this.loading = true;
    this.cyberSourceService
      .addCardData(sendingData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.openCyberSourceAuthorizationModal(res?.data);
          }
        },
        error: (err) => {
          if (err.error.errorCode === 631) {
            this.verifyEmailAndMobile(err.error.errorMsg);
          }
        }
      });
  }

  verifyEmailAndMobile(msg: string) {
    const ref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.router.navigate(['/manage/users/verify-email-phone']);
        }
      });
  }

  openCyberSourceAuthorizationModal(data: ICyberSourceCardAddRequestModel) {
    const ref = this.dialog.open(CyberSourceAutherizationModalComponent, {
      width: '800px',
      height: '700px',
      maxWidth: '95%',
      data,
      disableClose: true
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.dialogRef.close({
          success: Boolean(res.success),
          data: res,
          type: 'cybs'
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
