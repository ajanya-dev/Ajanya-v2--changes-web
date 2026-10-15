import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ICardList2, ICloudCardsDetails } from '../../model/cloudbank';
import { CloudListV35Service } from './cloud-list-v35.service';
import { OtpModalComponent } from '../../cloud-bank-v2/modals/otp-modal/otp-modal.component';

@Injectable({
  providedIn: 'root'
})
export class CloudBankDetailsDataV35Service implements OnDestroy {
  private cloudBankService = inject(CloudBankService);
  private cloudListV35Service = inject(CloudListV35Service);
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

  bypassTransactionCheck = false;
  cardUpdatedOrAdded = false;
  public accountId?: string;
  private destroy$ = new Subject<boolean>();
  private airwallexSubscriptionsDestroy$ = new Subject<boolean>();

  // state
  private defaultState = {
    accountCards: {},
    selectedCard: undefined,
    cardLoading: false,
    cardStatusLoading: false,
    cardNumberURL: '',
    cardExpiryURL: '',
    cardSecurityURL: '',
    cardPinURL: '',
    cardNumberLoading: false,
    cardExpiryLoading: false,
    cardSecurityLoading: false,
    cardPinLoading: false,
    setCardPinLoading: false,
    showPinInput: false
  };

  private cloudCardsSignal = signal<ICloudCardsDetails>(this.defaultState);

  // selectors
  accountCardsSignal = computed(() => this.cloudCardsSignal()?.accountCards);
  selectedCardSignal = computed(() => this.cloudCardsSignal()?.selectedCard);
  cardLoadingSignal = computed(() => this.cloudCardsSignal()?.cardLoading);
  cardStatusLoadingSignal = computed(
    () => this.cloudCardsSignal()?.cardStatusLoading
  );

  cardNumberURLSignal = computed(() => this.cloudCardsSignal()?.cardNumberURL);
  cardExpiryURLSignal = computed(() => this.cloudCardsSignal()?.cardExpiryURL);
  cardSecurityURLSignal = computed(
    () => this.cloudCardsSignal()?.cardSecurityURL
  );

  cardPinURLSignal = computed(() => this.cloudCardsSignal()?.cardPinURL);
  cardNumberLoadingSignal = computed(
    () => this.cloudCardsSignal()?.cardNumberLoading
  );

  cardExpiryLoadingSignal = computed(
    () => this.cloudCardsSignal()?.cardExpiryLoading
  );

  cardSecurityLoadingSignal = computed(
    () => this.cloudCardsSignal()?.cardSecurityLoading
  );

  cardPinLoadingSignal = computed(
    () => this.cloudCardsSignal()?.cardPinLoading
  );

  setCardPinLoadingSignal = computed(
    () => this.cloudCardsSignal()?.setCardPinLoading
  );

  showPinInputSignal = computed(() => this.cloudCardsSignal()?.showPinInput);

  getSelectedAccountInfo(): void {
    this.cloudListV35Service.selectedAccount
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.accountId = res?.id;
        this.getCardDetails('', res?.id);
      });
  }

  /**
   * @description get card details for the selected account id.
   * @param accId - account id.
   * @param reset -set to true by default.
   */
  getCardDetails(type?: string, accId?: string): void {
    const accountId = accId || this.accountId;
    if (!accountId) return;
    const existingAccountIds = Object.keys(
      this.cloudCardsSignal().accountCards
    );
    if (existingAccountIds.includes(accountId) && !this.cardUpdatedOrAdded) {
      const accountCard = this.cloudCardsSignal().accountCards[accountId];
      this.selectCard(accountCard[0]);
      return;
    }
    this.cardUpdatedOrAdded = false;
    this.cloudCardsSignal.update((value) => ({ ...value, cardLoading: true }));
    this.cloudBankService
      .getCardDetails(accountId)
      .pipe(
        finalize(() => {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardLoading: false
          }));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const { data } = res;
        let accountCard;
        if (accountId) {
          accountCard = { [accountId]: data };
        }
        const accountCards = {
          ...this.cloudCardsSignal().accountCards,
          ...accountCard
        };
        this.cloudCardsSignal.update((value) => ({
          ...value,
          ...{ accountCards }
        }));
        if (data.length) {
          if (type === 'edit') {
            const selectedCardId = this.cloudCardsSignal().selectedCard?.id;
            const selectedCard = data.find(
              (item) => item.id === selectedCardId
            );
            this.selectCard(selectedCard ?? data[0]);
            return;
          }
          if (type === 'create') {
            this.selectCard(data[data.length - 1]);
            return;
          }
          this.selectCard(data[0]);
          return;
        }
        this.selectCard(undefined);
      });
  }

  selectCard(data: ICardList2 | undefined) {
    this.cloudCardsSignal.update((value) => ({ ...value, selectedCard: data }));
    this.clearCardInfo();
  }

  revealCard(card: ICardList2) {
    this.revealCardNumber(card);
  }

  revealOtherDetails(card: ICardList2) {
    this.revealCardExpiry(card);
    this.revealCardSecurity(card);
  }

  revealCardNumber(card: ICardList2) {
    /**
     * Use 'Styling iframe' section in this page
     * https://www.airwallex.com/docs/issuing__pan-delegation
     */
    const data = {
      rules: {
        '.details__row--card-number': {
          color: 'white',
          fontFamily: 'Arial',
          display: 'flex',
          fontSize: '16px'
        },
        '.details__row--expiry-date': {
          display: 'none'
        },
        '.details__row--security-code': {
          display: 'none'
        },
        '.details__label': {
          display: 'none'
        },
        '.details__value': {
          paddingRight: '20px'
        },
        '.details__button svg': {
          color: 'white',
          cursor: 'pointer'
        },
        '.details__tooltip': {
          marginTop: '-16px',
          backgroundColor: 'transparent',
          fontFamily: 'Arial',
          fontSize: '10px'
        }
      }
    };
    this.cloudCardsSignal.update((value) => ({
      ...value,
      cardNumberLoading: true
    }));
    this.cloudBankService
      .showCard(card.id, data)
      .pipe(
        finalize(() => {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardNumberLoading: false
          }));
        }),
        takeUntil(this.airwallexSubscriptionsDestroy$)
      )
      .subscribe({
        next: (res) => {
          this.revealOtherDetails(card);
          const selectedCardId = this.cloudCardsSignal().selectedCard?.id;
          if (card.id === selectedCardId) {
            this.cloudCardsSignal.update((value) => ({
              ...value,
              cardNumberURL: this.sanitizer.bypassSecurityTrustResourceUrl(
                res.data.card_info
              )
            }));
          }
        },
        error: (err) => {
          if (err.error.errorCode === '112') {
            this.openOtpModal(err.error, card);
          }
        }
      });
  }

  openOtpModal(
    error: Record<string, unknown>,
    card: ICardList2,
    isCardPin = false
  ) {
    const dialog = this.dialog.open(OtpModalComponent, {
      maxWidth: '410px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: error
    });
    dialog.afterClosed().subscribe((response) => {
      if (response) {
        if (isCardPin) {
          this.revealCardPin(card);
        } else {
          this.revealCardNumber(card);
        }
      }
    });
  }

  revealCardExpiry(card: ICardList2) {
    /**
     * Use 'Styling iframe' section in this page
     * https://www.airwallex.com/docs/issuing__pan-delegation
     */
    const data = {
      rules: {
        '.details__row--card-number': {
          display: 'none'
        },
        '.details__row--expiry-date': {
          color: 'white',
          fontFamily: 'Arial',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        },
        '.details__row--security-code': {
          display: 'none'
        },
        '.details__label': {
          display: 'none'
        },
        '.details__button svg': {
          display: 'none'
        }
      }
    };
    this.cloudCardsSignal.update((value) => ({
      ...value,
      cardNumberLoading: true
    }));
    this.cloudBankService
      .showCard(card.id, data)
      .pipe(
        finalize(() => {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardNumberLoading: false
          }));
        }),
        takeUntil(this.airwallexSubscriptionsDestroy$)
      )
      .subscribe((res) => {
        const selectedCardId = this.cloudCardsSignal().selectedCard?.id;
        if (card.id === selectedCardId) {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardExpiryURL: this.sanitizer.bypassSecurityTrustResourceUrl(
              res.data.card_info
            )
          }));
        }
      });
  }

  revealCardSecurity(card: ICardList2) {
    /**
     * Use 'Styling iframe' section in this page
     * https://www.airwallex.com/docs/issuing__pan-delegation
     */
    const data = {
      rules: {
        '.details__row--card-number': {
          display: 'none'
        },
        '.details__row--expiry-date': {
          display: 'none'
        },
        '.details__row--security-code': {
          color: 'white',
          fontFamily: 'Arial',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        },
        '.details__label': {
          display: 'none'
        },
        '.details__button svg': {
          display: 'none'
        }
      }
    };
    this.cloudCardsSignal.update((value) => ({
      ...value,
      cardNumberLoading: true
    }));
    this.cloudBankService
      .showCard(card.id, data)
      .pipe(
        finalize(() => {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardNumberLoading: false
          }));
        }),
        takeUntil(this.airwallexSubscriptionsDestroy$)
      )
      .subscribe((res) => {
        const selectedCardId = this.cloudCardsSignal().selectedCard?.id;
        if (card.id === selectedCardId) {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardSecurityURL: this.sanitizer.bypassSecurityTrustResourceUrl(
              res.data.card_info
            )
          }));
        }
      });
  }

  revealCardPin(card: ICardList2) {
    const data = {
      rules: {
        '.pin__value': {
          fontSize: '14px'
        }
      }
    };
    this.setPinInputVisibility(false);
    this.cloudCardsSignal.update((value) => ({
      ...value,
      cardPinLoading: true
    }));
    this.cloudBankService
      .showCard(card.id, data)
      .pipe(
        finalize(() => {
          this.cloudCardsSignal.update((value) => ({
            ...value,
            cardPinLoading: false
          }));
        }),
        takeUntil(this.airwallexSubscriptionsDestroy$)
      )
      .subscribe({
        next: (res) => {
          const selectedCardId = this.cloudCardsSignal().selectedCard?.id;
          if (card.id === selectedCardId) {
            this.cloudCardsSignal.update((value) => ({
              ...value,
              cardPinURL: this.sanitizer.bypassSecurityTrustResourceUrl(
                res.data.pin
              )
            }));
          }
        },
        error: (err) => {
          if (err.error.errorCode === '112') {
            this.openOtpModal(err.error, card, true);
          }
        }
      });
  }

  clearCardInfo() {
    this.airwallexSubscriptionsDestroy$.next(true);
    this.cloudCardsSignal.update((value) => ({ ...value, cardNumberURL: '' }));
    this.cloudCardsSignal.update((value) => ({ ...value, cardExpiryURL: '' }));
    this.cloudCardsSignal.update((value) => ({
      ...value,
      cardSecurityURL: ''
    }));
    this.cloudCardsSignal.update((value) => ({ ...value, cardPinURL: '' }));
  }

  changeStatus(card: ICardList2) {
    const data = {
      status: card.cardStatus === 'active' ? 'inactive' : 'active'
    };
    this.cloudCardsSignal.update((value) => ({
      ...value,
      cardStatusLoading: true
    }));
    this.cloudBankService
      .toggleCardStatus(card.id, data)
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.cloudCardsSignal.update((value) => ({
              ...value,
              cardStatusLoading: false
            }));
          }, 1000);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Status changed successfully'
            });

            if (this.cloudCardsSignal().selectedCard && this.accountId) {
              const updatedAccountCardList =
                this.cloudCardsSignal().accountCards[this.accountId].map(
                  (val) => {
                    if (val.id === this.cloudCardsSignal().selectedCard?.id) {
                      const updatedCard = { ...val, cardStatus: data.status };
                      return updatedCard;
                    }
                    return val;
                  }
                );
              this.cloudCardsSignal.update((value) => ({
                ...value,
                accountCards: {
                  ...this.cloudCardsSignal().accountCards,
                  [this.accountId ?? '']: updatedAccountCardList
                },
                selectedCard: {
                  ...(this.cloudCardsSignal().selectedCard as ICardList2),
                  cardStatus: data.status
                }
              }));
            }
          }
        },
        error: (err) => {
          if (err.error.errorCode === '112') {
            const dialog = this.dialog.open(OtpModalComponent, {
              maxWidth: '410px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((response) => {
              if (response) {
                this.changeStatus(card);
              }
            });
          }
        }
      });
  }

  setPin(pin: string) {
    const data = {
      cardPin: pin
    };
    if (this.cloudCardsSignal().selectedCard) {
      const card = this.cloudCardsSignal().selectedCard;
      const cardId = card?.id ?? '';
      this.cloudCardsSignal.update((value) => ({
        ...value,
        setCardPinLoading: true
      }));
      this.cloudBankService
        .setCardPin(cardId, data)
        .pipe(
          finalize(() => {
            this.setPinInputVisibility(false);
            setTimeout(() => {
              this.cloudCardsSignal.update((value) => ({
                ...value,
                setCardPinLoading: false
              }));
            }, 1000);
          })
        )
        .subscribe(() => {
          this.setPinInputVisibility(false);
          this.revealCardPin(card as ICardList2);
          this.getCardDetails('edit');
        });
    }
  }

  setPinInputVisibility(visible: boolean) {
    this.cloudCardsSignal.update((value) => ({
      ...value,
      showPinInput: visible
    }));
  }

  resetSubscriptions() {
    this.destroy$.next(true);
    this.airwallexSubscriptionsDestroy$.next(true);
  }

  ngOnDestroy(): void {
    this.cloudCardsSignal.set(this.defaultState);
    this.cloudBankService.selectedCloudTab = { tab: 'account' };
  }
}
