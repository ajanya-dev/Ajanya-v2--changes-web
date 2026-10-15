import {
  CurrencyPipe,
  DatePipe,
  NgClass,
  NgOptimizedImage,
  TitleCasePipe,
  NgTemplateOutlet
} from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import {
  faAngleLeft,
  faAngleRight,
  faSpinner
} from '@fortawesome/pro-solid-svg-icons';
import {
  IGiftCardTransactions,
  IWalletCardData,
  IWalletCardInfo
} from '../../model/outside';
import { BillingAddressModalComponent } from '../../modal/billing-address-modal/billing-address-modal.component';

@Component({
  selector: 'app-gift-card-details',
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    NgOptimizedImage,
    TitleCasePipe,
    CurrencyPipe,
    FaIconComponent,
    DatePipe,
    NgTemplateOutlet,
    TruncatePipe,
    MatTooltip
  ],
  templateUrl: './gift-card-details.component.html',
  styleUrl: './gift-card-details.component.scss'
})
export class GiftCardDetailsComponent implements OnInit, OnDestroy {
  public authV3Service = inject(AuthV3Service);
  private activatedRoute = inject(ActivatedRoute);
  private outsideService = inject(OutsideService);
  private matdialog = inject(MatDialog);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);

  cardStatus = 'active';
  logoPath = 'assets/main/app_logo.svg';
  destroy$ = new Subject<void>();
  token: string = '';
  cardDeatils = signal<IWalletCardData | undefined>(undefined);
  cardTransactions = signal<IGiftCardTransactions[]>([]);
  totalTransaction = signal<number>(0);
  isCardinfoLoading = signal<boolean>(false);
  isTrandactionLoading = signal<boolean>(false);
  showRevealBtn = signal(false);
  isActiveCard = signal<boolean>(false);
  isLogout = signal(false);
  isSectionTimeout = signal(false);
  decyptedInfo = signal<
    { cardNumber: string; cardCvv: string; expiryDate: string } | undefined
  >(undefined);

  initialCount = 1;
  totalPage = 0;
  pageArr: (number | string)[] = [];
  initialPage = 1;
  mode = 1;
  selectedValue!: number;
  paginationPage: number = 1;
  pseudoI!: number;
  faSpinner = faSpinner;
  faAngleRight = faAngleRight;
  faAngleLeft = faAngleLeft;

  ngOnInit(): void {
    const { uuId } = this.activatedRoute.snapshot.params;
    if (uuId) {
      this.token = uuId;
      this.getCardDetails(this.token);
      this.getCardTransactions(this.token);
    }
  }

  getCardDetails(token: string, isRevealInfo = false) {
    this.isCardinfoLoading.set(true);
    this.outsideService
      .giftCardInfo(token)
      .pipe(
        finalize(() => this.isCardinfoLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.cardDeatils.set(res.data);
            this.showRevealBtn.set(
              res.data.card?.card_status === 'active' && !isRevealInfo
            );
            if (res.data.card_info && isRevealInfo) {
              this.revealCardInfo(res.data.card_info);
            }
          }
        },
        error: () => {
          this.isSectionTimeout.set(true);
        }
      });
  }

  getCardTransactions(token: string, page = 1, limit = 5) {
    this.cardTransactions.set([]);
    this.paginationPage = page;
    this.isTrandactionLoading.set(true);
    this.outsideService
      .giftCardTransactions(token, page, limit)
      .pipe(
        finalize(() => this.isTrandactionLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res && res.data.total > 0) {
            this.cardTransactions.set(res.data.data);
            this.totalTransaction.set(res.data.total);
            this.totalPage = Math.ceil(res.data.total / 5);
            this.paginationArray();
          }
        },
        error: () => {}
      });
  }

  activateCard() {
    this.isActiveCard.set(true);
    this.outsideService
      .activeGiftCard(this.token)
      .pipe(
        finalize(() => this.isActiveCard.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.cardDeatils.set(undefined);
            this.getCardDetails(this.token, true);
          }
        },
        error: () => {}
      });
  }

  async revealCardInfo(cardInfo: IWalletCardInfo) {
    this.showRevealBtn.set(false);
    try {
      const {
        secretKey,
        token: { encryptedPan, encryptedCvc },
        expiryMonth,
        expiryYear
      } = cardInfo;

      // Initialize with expiry date
      this.decyptedInfo.set({
        cardNumber: '',
        cardCvv: '',
        expiryDate: `${expiryMonth}/${expiryYear}`
      });

      // Decrypt card number
      try {
        const decryptedCardNumber = await this.decryptSecret(
          encryptedPan.data,
          encryptedPan.iv,
          secretKey
        );

        const formattedCardNumber =
          decryptedCardNumber.match(/.{1,4}/g)?.join(' ') ||
          decryptedCardNumber;

        this.decyptedInfo.update((value) => ({
          cardNumber: formattedCardNumber,
          cardCvv: value?.cardCvv || '',
          expiryDate: value?.expiryDate || ''
        }));
      } catch (error) {
        // Handle error silently
      }

      // Decrypt CVV
      try {
        const decryptedCvv = await this.decryptSecret(
          encryptedCvc.data,
          encryptedCvc.iv,
          secretKey
        );

        this.decyptedInfo.update((value) => ({
          cardNumber: value?.cardNumber || '',
          cardCvv: decryptedCvv,
          expiryDate: value?.expiryDate || ''
        }));
      } catch (error) {
        // Handle error silently
      }
    } catch (error) {
      // Handle general errors silently
    }
  }

  async decryptSecret(
    base64Secret: string,
    base64Iv: string,
    secretKey: string
  ): Promise<string> {
    if (!base64Secret) throw new Error('base64Secret is required');
    if (!base64Iv) throw new Error('base64Iv is required');
    if (!secretKey || !/^[0-9A-Fa-f]+$/.test(secretKey)) {
      throw new Error('secretKey must be a hex string');
    }

    try {
      const secret = Uint8Array.from(atob(base64Secret), (c) =>
        c.charCodeAt(0)
      );
      const iv = Uint8Array.from(atob(base64Iv), (c) => c.charCodeAt(0));
      const secretKeyArrayBuffer = Uint8Array.from(
        (secretKey.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16))
      );

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        secretKeyArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        secret
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      // Better error handling
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  /**
   * Moves to the previous page of notifications.
   * @method
   */
  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getCardTransactions(this.token, this.initialPage);
    }
  }

  /**
   * Moves to the next page of notifications.
   * @method
   */
  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getCardTransactions(this.token, this.initialPage);
    }
  }

  /**
   * Navigates to a specific page of notifications.
   * @method
   * @param {number | string} item - The page number to navigate to.
   */
  gotoPage(page: number | string) {
    const item = Number(page);
    if (item > 0) {
      this.initialPage = item;
      if (item < this.initialCount + 4) {
        this.mode = 1;
        this.paginationArray();
      } else if (item > this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }

    this.getCardTransactions(this.token, item);
  }

  updateAddress() {
    this.matdialog
      .open(BillingAddressModalComponent, {
        disableClose: true,
        width: '570px',
        data: this.token
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // Update the holder address with the new address from modal result
          this.cardDeatils.update((value) => {
            if (!value) return value;

            return {
              ...value,
              card: {
                ...value.card,
                holder: {
                  ...value.card.holder,
                  address1: res.address.line1,
                  address2: res.address.line2 || '',
                  city: res.address.city,
                  state: res.address.state,
                  country: res.address.country,
                  zip: res.address.postal_code
                }
              }
            };
          });
        }
      });
  }

  onLogout() {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to log out? '
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.logout();
        }
      });
  }

  logout() {
    const loginToken: string | null =
      this.localStorageService.getItem('gift-card') || '';
    if (loginToken === '') return;
    this.isLogout.set(true);
    this.outsideService
      .logoutVcn()
      .pipe(
        finalize(() => this.isLogout.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.router.navigateByUrl(
            `outside/vcn/auth2/gift-card/${loginToken}`
          );
          this.localStorageService.removeItem('gift-card');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
