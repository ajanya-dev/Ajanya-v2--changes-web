import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription, debounceTime, take } from 'rxjs';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import {
  selectCards,
  selectIsCardsLoading
} from 'src/app/modules/store/cards/cards.selectors';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { OpenAddCardV4Service } from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { MatDialog } from '@angular/material/dialog';
import { MapSourceWithBusinessModalV4Component } from 'src/app/modules/payments/shared/modal/v4/map-source-with-business-modal-v4/map-source-with-business-modal-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { IHeaderData } from 'src/app/layout/model/header';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, CreditCard, Plus, Star } from 'lucide-angular';
import { EmailPhoneVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/email-phone-verification-modal-v4/email-phone-verification-modal-v4.component';

@Component({
  selector: 'app-cards-dropdown-v4',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    MatTooltipModule
  ],
  templateUrl: './cards-dropdown-v4.component.html',
  styleUrls: ['./cards-dropdown-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardsDropdownV4Component),
      multi: true
    }
  ]
})
export class CardsDropdownV4Component
  implements OnInit, OnDestroy, AfterViewInit
{
  private store = inject(Store);
  private openAddCardService = inject(OpenAddCardV4Service);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private v3DataTableService = inject(V3PaymentsTableService);
  private userProfileService = inject(UserProfileService);
  public paymentsService = inject(PaymentsService);

  // Lucide icons
  readonly CreditCardIcon = CreditCard;
  readonly PlusIcon = Plus;
  readonly StarIcon = Star;

  subscriptions: Subscription[] = [];

  // Inputs
  id = input('id');
  enableAddNew = input(true);
  appendTo = input('ng-select');
  placeholder = input('Select Card');
  customHeight = input<'0' | '1'>('0');
  labelIconNeeded = input(true);
  dropdownIconNeeded = input(true);
  /** Suppress the inline help "?" icon rendered inside the input (opt-in; on elsewhere) */
  hideInlineHelpIcon = input(false);
  showAllCards = input<boolean>(false);
  gatewayType = input<number | undefined>(undefined);
  isPayroll = input<boolean>(false);
  isInvalid = input(false);
  /** render a per-row default star (opt-in; off elsewhere) */
  showDefaultStar = input(false);
  /** cardId of the card that is the saved default — filled/yellow star */
  defaultItemId = input<string | number | null>(null);

  // Outputs
  ready = output<IV3DropDownOnReady>();
  touch = output<void>();
  cardMapped = output<void>();
  /** a star was clicked — the caller sets this card as the default */
  starClick = output<IExistingCreditCards>();

  // ViewChild
  ngSelectComponent = viewChild(NgSelectComponent);

  cards: IExistingCreditCards[] = [];
  allCards: IExistingCreditCards[] = [];
  selectIsCardsLoading$: Observable<boolean>;

  selectedCard: FormControl<IExistingCreditCards | null | undefined> =
    new FormControl();

  searchTerm: string;
  searchTimeout: number;
  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};
  isNotVerified: boolean;
  /** widened locally — the API also returns 4, which the shared header model predates */
  creditCardGatewaySwitchingStatus: 1 | 2 | 3 | 4;
  creditCardGatewayType: 4 | 5;

  private isFirstLoad = true;
  private isHandlingUnmappedCard = false;

  showAllCardsEffect = effect(
    () => {
      const showAllCards = this.showAllCards();
      // Skip the first load as it's handled by initStoreSelectors
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        return;
      }
      // Clear existing cards from dropdown and store, then reload with new parameter
      this.cards = [];
      this.allCards = [];
      this.selectedCard.setValue(undefined);
      this.changeDetectorRef.detectChanges();
      this.store.dispatch(CardsActions.cardsReset());
      this.store.dispatch(CardsActions.loadCards({ showAllCards, isPayroll: this.isPayroll() }));
    },
    { allowSignalWrites: true }
  );

  gatewayTypeEffect = effect(
    () => {
      // An account with gateway switching bypassed is not held to the gateway
      // the amount asks for, so the card already chosen stays valid however the
      // amount moves. `cards-dropdown-v3` returns here for exactly this reason;
      // without it the alert below cleared a perfectly good selection and made
      // the user pick the same card again.
      if (this.isGatewaySwitchingBypassed()) {
        this.cards = this.allCards;
        this.changeDetectorRef.detectChanges();
        return;
      }

      const gatewayType = this.gatewayType();
      const selectedCard = this.selectedCard.value;
      if (selectedCard && gatewayType !== undefined && gatewayType !== null) {
        if (Number(selectedCard.gatewayType) !== Number(gatewayType)) {
          this.alertService
            .infoAlert({
              content: `This payment amount requires you to reselect your card. Please select your card again to continue. If your card is not listed, please add it again to proceed.`,
              isOk: true
            })
            .afterClosed()
            .subscribe(() => {
              this.selectedCard.setValue(undefined);
              this.changeDetectorRef.detectChanges();
            });
        }
      }
      this.changeDetectorRef.detectChanges();
    },
    { allowSignalWrites: true }
  );

  ngOnInit(): void {
    this.initStoreSelectors();
    this.isUserVerified();
    this.getHeaderData();

    // TODO: remove after card issue, this is to check if the card added with cybs.
    // if so we dont' allow them to select the card.
    // commented for the time being to bypass amex disable
    // this.subscriptions.push(
    //   this.selectedCard.valueChanges
    //     .pipe(
    //       pairwise(),
    //       tap(([prev, next]) => {
    //         if (!next) return;
    //         if (next.cardType === '003') {
    //           this.selectedCard.setValue(prev);
    //           this.alertService.infoAlert({
    //             content: 'Our Amex card service is temporarily unavailable as we work on enhancements for a smoother user experience and will be back soon.'
    //           })
    //         }
    //       })
    //     )
    //     .subscribe()
    // );
  }

  ngAfterViewInit(): void {
    this.onReady();
  }

  getHeaderData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.creditCardGatewaySwitchingStatus =
          headerData.credit_card_gateway_switching_status;
        this.creditCardGatewayType = headerData.credit_card_gateway_type;
        this.changeDetectorRef.detectChanges();
      })
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load cards.
   */
  initStoreSelectors() {
    this.store.dispatch(
      CardsActions.loadCards({ showAllCards: this.showAllCards(), isPayroll: this.isPayroll() })
    );
    this.store.select(selectCards).subscribe((res) => {
      this.allCards = res;
      // Every saved card is listed — no gateway-type filtering is applied here.
      this.cards = this.allCards;
      this.changeDetectorRef.detectChanges();
    });
    this.selectIsCardsLoading$ = this.store.select(selectIsCardsLoading);
  }

  onDropdownOpen() {
    this.paymentsService.clearGatewaySkip();
  }

  private isGatewaySwitchingBypassed(): boolean {
    return (
      this.creditCardGatewaySwitchingStatus === 3 ||
      this.creditCardGatewaySwitchingStatus === 4
    );
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.ready.emit(this.onReadyResponse);
  }

  /**
   * Sets an item with a specific ID in the selected card.
   * @param id - The ID of the card to set.
   */
  setItemWithId = (id: string) => {
    let loadingSubscription: Subscription;
    // eslint-disable-next-line prefer-const
    loadingSubscription = this.selectIsCardsLoading$
      .pipe(debounceTime(100), take(2))
      .subscribe((isLoading) => {
        if (!isLoading) {
          // Search in allCards to find the item even if it's filtered out
          const item = this.allCards.find((ele) => ele.cardId === id);
          if (item) {
            this.selectedCard.setValue(item);
            this.changeDetectorRef.detectChanges();
          }
          loadingSubscription.unsubscribe();
        }
      });
  };

  onTouched: (event?: Event) => void = () => {};

  /**
   * Writes a value to the form control.
   * @param value - The value to write.
   */
  writeValue(value: IExistingCreditCards): void {
    if (value?.cardId) {
      this.setItemWithId(value.cardId);
    } else {
      this.selectedCard.setValue(undefined);
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (event?: IExistingCreditCards | null | undefined) => void
  ): void {
    this.changesSubscription = this.selectedCard.valueChanges.subscribe(
      (card) => {
        if (card && !card.isMapped) {
          this.handleUnmappedCard(card, fn);
          return;
        }

        if (
          card &&
          card.notAvailableGateway &&
          !this.isPayroll() &&
          !this.paymentsService.isGatewaySkip(card.cardId)
        ) {
          this.addCardWithPrefill(card, card.notAvailableGateway);
          return;
        }

        fn(card);
      }
    );
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  /**
   * @description Opens modal dialog for adding card.
   * @param gatewayTypeOverride - when combined with `fromTransLimitApi === true`,
   *        bypasses normal gateway-type resolution and passes this value directly
   *        to openAddCard. Used by the trans-limit fail flow.
   * @param fromTransLimitApi - set to `true` when the call originates from the
   *        decide-gateway-by-trans-limit failure handler. Otherwise the existing
   *        resolution logic is preserved unchanged.
   */

  addNewCard(gatewayTypeOverride?: number, fromTransLimitApi?: boolean) {
    if (this.isNotVerified) {
      this.openVerificationAlert();
      return;
    }
    this.clearSelection();
    if (this.openAddCardService.isLoading()) return;
    // In bypass mode (status 3), never constrain Add Card by gateway type.
    // Payroll uses header gateway; otherwise pass gatewayType when showAllCards is true.
    // The trans-limit fail flow overrides all of the above: it forces the gateway_type
    // returned by the decide-gateway-by-trans-limit API, even in bypass mode.
    let gatewayTypeParam: number | undefined;
    if (fromTransLimitApi === true) {
      gatewayTypeParam = gatewayTypeOverride;
    } else if (this.isGatewaySwitchingBypassed()) {
      gatewayTypeParam = undefined;
    } else if (this.isPayroll() && this.creditCardGatewaySwitchingStatus === 1) {
      gatewayTypeParam = this.creditCardGatewayType;
    } else if (this.showAllCards()) {
      gatewayTypeParam = this.gatewayType();
    } else {
      gatewayTypeParam = undefined;
    }
    const sub = this.openAddCardService
      .openAddCard(gatewayTypeParam)
      .subscribe((cardModal) => {
        if (cardModal) {
          cardModal.afterClosed().subscribe((res) => {
            if (res && res.success) {
              this.store.dispatch(
                CardsActions.addCard({
                  card: res.data.metaData as IExistingCreditCards
                })
              );
              this.alertService.successAlert({ content: res.data.message });
              this.initStoreSelectors();
              this.writeValue(res.data.metaData);
              this.headerService.refreshDynamicHeader.next(true);
              this.v3DataTableService.cardsDataDispatched = false;
            } else if (res?.cardCreated) {
              this.reloadAfterUnconfirmedCard();
            }
          });
        }
      });
    this.subscriptions.push(sub);
  }

  /**
   * @description Opens the Add Credit Card modal with billing fields prefilled
   * from an existing card's saved details, bypassing the nickname/color/provider
   * chooser. Used by the trans-limit 824 fail flow and the notAvailableGateway
   * selection check so the user only re-enters card number/expiration/CVV when
   * re-tokenising on a new gateway. Falls back to the standard `addNewCard` flow
   * when get-card-details does not return a valid record. Skip & Pay is never
   * offered in payroll.
   */
  addCardWithPrefill(card: IExistingCreditCards, gatewayType: number) {
    if (this.isNotVerified) {
      this.openVerificationAlert(() => this.addCardWithPrefill(card, gatewayType));
      return;
    }
    this.clearSelection();
    if (this.openAddCardService.isLoading()) return;

    const sub = this.openAddCardService
      .openAddCardWithPrefill(
        card.cardId,
        gatewayType,
        card.nickName,
        card.bgColor,
        card.allowSkipGatewayAddition && !this.isPayroll()
      )
      .subscribe((cardModal) => {
        if (!cardModal) {
          this.addNewCard(gatewayType, true);
          return;
        }
        cardModal.afterClosed().subscribe((res) => {
          if (res && res.success && res.data) {
            this.store.dispatch(
              CardsActions.addCard({
                card: res.data.metaData as IExistingCreditCards
              })
            );
            this.alertService.successAlert({ content: res.data.message });
            this.initStoreSelectors();
            this.writeValue(res.data.metaData as IExistingCreditCards);
            this.headerService.refreshDynamicHeader.next(true);
            this.v3DataTableService.cardsDataDispatched = false;
          } else if (res?.skipGatewayAddition) {
            this.handleGatewaySkip(card);
          } else if (res?.cardCreated) {
            this.reloadAfterUnconfirmedCard();
          }
        });
      });
    this.subscriptions.push(sub);
  }

  private handleGatewaySkip(card: IExistingCreditCards) {
    this.paymentsService.markGatewaySkip(card.cardId);
    this.selectedCard.setValue(card);
    this.changeDetectorRef.detectChanges();
  }

  /**
   * @description The user backed out of the "Confirm Card" step, so a new
   * (unconfirmed) card exists on the first gateway — refetch so it shows up.
   */
  private reloadAfterUnconfirmedCard() {
    this.v3DataTableService.cardsDataDispatched = false;
    this.initStoreSelectors();
  }

  /**
   * @description Programmatically inserts a card into the dropdown (if not
   * already present in `allCards`) and selects it. Used by the trans-limit 824
   * fail flow when the backend returns a `duplicate_card` object — the user
   * should not have to re-add it manually.
   */
  populateDuplicateCard(card: IExistingCreditCards) {
    if (!card?.cardId) return;
    const exists = this.allCards.some((c) => c.cardId === card.cardId);
    if (!exists) {
      this.store.dispatch(CardsActions.addCard({ card }));
    }
    this.selectedCard.setValue(card);
    this.changeDetectorRef.detectChanges();
  }

  /**
   * @description Checks the user verification status and updates the `isNotVerified` property accordingly.
   */
  isUserVerified() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isNotVerified =
          res.email_verified === 0 || res.phone_verified === 0;
      })
    );
  }

  /**
   * Clears the selection in the ng-select component.
   *
   * @memberof V35CommonDropDownSelectorComponent
   */
  clearSelection() {
    this.ngSelectComponent()?.handleClearClick();
    this.ngSelectComponent()?.close();
  }

  private dialog = inject(MatDialog);

  private handleUnmappedCard(
    card: IExistingCreditCards,
    onChange: (event?: IExistingCreditCards | null | undefined) => void
  ): void {
    if (this.isHandlingUnmappedCard) return;
    this.isHandlingUnmappedCard = true;

    this.alertService
      .warningAlert({
        title: 'Warning',
        content:
          'This card is not mapped to a business. Please map the card to a business to continue.',
        doneMsg: 'Map Card to Business'
      })
      .afterClosed()
      .subscribe(() => {
        this.openMapSourceWithBusinessModal(card)
          .afterClosed()
          .subscribe((res) => {
            if (res?.success) {
              // Reload cards from store to get updated isMapped status
              this.store.dispatch(CardsActions.cardsReset());
              this.store.dispatch(
                CardsActions.loadCards({ showAllCards: this.showAllCards(), isPayroll: this.isPayroll() })
              );
              const mappedCard = { ...card, isMapped: true };
              this.isHandlingUnmappedCard = false;
              onChange(mappedCard);
              this.selectedCard.setValue(mappedCard, { emitEvent: false });
              this.cardMapped.emit();
              this.alertService.successAlert({
                content: 'Card mapped to business successfully.'
              });
            } else {
              this.isHandlingUnmappedCard = false;
              this.selectedCard.setValue(undefined);
              this.changeDetectorRef.detectChanges();
            }
          });
      });
  }

  openMapSourceWithBusinessModal(card: IExistingCreditCards) {
    return this.dialog.open(MapSourceWithBusinessModalV4Component, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        type: 'card',
        card
      }
    });
  }

  /**
   * @description Warns the user that email/phone verification is required and,
   * on success, resumes the action that was blocked. Defaults to the plain
   * Add Card flow when no continuation is supplied.
   */
  openVerificationAlert(onVerified?: () => void) {
    this.clearSelection();
    const dialogRef = this.alertService.warningAlert({
      title: 'Verification Required',
      content:
        'Please verify your phone number to complete this payment.',
      doneMsg: 'Verify Now',
      isOk: true,
      isCancel: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if(res){
        const verificationModalRef = this.dialog.open(EmailPhoneVerificationModalV4Component, {
          width: '550px',
          maxWidth: '95vw',
          panelClass: 'paddingless-modal-rounded',
          disableClose: true
        });
        verificationModalRef.afterClosed().subscribe((result: { emailVerified: boolean; phoneVerified: boolean } | undefined) => {
          const verified = !!(result?.emailVerified && result?.phoneVerified);
          if (verified) {
            this.isNotVerified = false;
            if (onVerified) {
              onVerified();
            } else {
              this.addNewCard();
            }
          }
        });
      }

    });
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
