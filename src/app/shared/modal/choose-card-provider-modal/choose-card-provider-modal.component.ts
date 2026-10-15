import { Component, OnDestroy, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from '../../v3/common-input-field/common-input-field.component';
import { AddCreditCardComponent } from '../add-credit-card/add-credit-card.component';
import { IAddCardResponse } from '../add-credit-card/add-credit-card.model';
import { CybersourceService } from '../../service/cybersource/cybersource.service';
import { CyberSourceAutherizationModalComponent } from '../cyber-source-modals/cyber-source-autherization-modal/cyber-source-autherization-modal.component';
import { AlertService } from '../../service/alert/alert.service';
import { LocalStorageService } from '../../service/storage/local-storage.service';

@Component({
  selector: 'app-choose-card-provider-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    CommonButtonV35Component,
    FontAwesomeModule,
    CommonInputFieldComponent,
    ReactiveFormsModule,
    FormsModule,
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './choose-card-provider-modal.component.html',
  styleUrl: './choose-card-provider-modal.component.scss'
})
export class ChooseCardProviderModalComponent implements OnDestroy {
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef);
  private cyberSourceService = inject(CybersourceService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private dialogData = inject<{
    success: boolean;
    token: string;
    amex_allowed: 0 | 1;
    amex_divert_to_cybersource: 0 | 1;
    gateway_type: 2 |4 | 5; 
    gateway_url: string;
    user_application_iv: string;
    user_application_id: string;
    amex_token:string;
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
      icon: 'assets/images/card-providers/amex-logo.svg',
      width: '60',
      height: '42'
    },
    {
      id: 'discover',
      icon: 'assets/images/card-providers/discover-logo.jpeg',
      width: '60',
      height: '39'
    }
  ] as const;

  colors = [
    { color: 'green', code: '#E5F8F2' },
    { color: 'blue', code: '#E9F3FF' },
    { color: 'violet', code: '#EDEBFF' },
    { color: 'red', code: '#FAEFF5' }
  ] as const;

  selectedProvider: (typeof this.cardProviders)[number] = this.cardProviders[0];
  selectedColor: (typeof this.colors)[number] = this.colors[0];

  selectProvider(provider: (typeof this.cardProviders)[number]) {
    const currentUserId = this.localStorageService.getItem('userId');
    if (provider.id === 'amex' && currentUserId !== 28567 && this.dialogData.amex_allowed === 0) {
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
        AddCreditCardComponent,
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
            amex_token:string;
          };
        },
        {
          success: boolean;
          data: IAddCardResponse;
          errorCode: number;
          cardCreated?: boolean;
        }
      >(AddCreditCardComponent, {
        width: '547px',
        disableClose: true,
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
            amex_token: this.dialogData.amex_token,
            selectedProvider: this.selectedProvider.id
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

  /**
   * @description Calling CybersourceGetData api. these data used to open cybersource modal (3rd party).
   * @param nickName - For card. Used in create card body
   * @param bgColor - For card. Used in create card body
   */
  cybersourceGetData(nickName: string, bgColor?: string) {
    const sendingData = {
      nickName,
      bgColor
    };
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

  /**
   * @description Opens CybersourceAuthorization modal. in the modal a card being created or gets rejected. if created, we are calling get cards again. else showing error message
   * @param data - Data from CybersourceGetData api
   */
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
