import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subscription,
  debounceTime,
  take,

} from 'rxjs';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import {
  selectCards,
  selectIsCardsLoading
} from 'src/app/modules/store/cards/cards.selectors';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import { IHeaderData } from 'src/app/layout/model/header';

@Component({
  selector: 'app-cards-dropdown-v3',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltip,
    MatTooltipModule
  ],
  templateUrl: './cards-dropdown-v3.component.html',
  styleUrls: ['./cards-dropdown-v3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardsDropdownV3Component),
      multi: true
    }
  ]
})
export class CardsDropdownV3Component
  implements OnInit, OnDestroy, AfterViewInit
{
  private store = inject(Store);
  public openAddCardService = inject(OpenAddCardService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private v3DataTableService = inject(V3PaymentsTableService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);
  public paymentsService = inject(PaymentsService);
  private cardPaymentService = inject(CardPaymentService);

  subscriptions: Subscription[] = [];
  @Input() id = 'id'; // Its better to pass a unique id always for avoiding conflict.
  @Input() enableAddNew = true;
  @Input() append = 'ng-select';
  @Input() placeholder = 'Select Card';
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' = '2';
  @Input() labelIconNeeded = true;
  @Input() dropdownIconNeeded = true;
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() touch = new EventEmitter();
  showAllCards = input<boolean>(false);
  gatewayType = input<number | undefined>(undefined);
  isPayroll = input<boolean>(false);
  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  cards: IExistingCreditCards[];
  allCards: IExistingCreditCards[] = [];
  selectIsCardsLoading$: Observable<boolean>;

  selectedCard: FormControl<IExistingCreditCards | null | undefined> = new FormControl();
  searchTerm: string;
  searchTimeout: number;
  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};
  isNotVerified: boolean;
  credit_card_gateway_switching_status: 1 | 2 | 3 | 4;
  credit_card_gateway_type: 4 |5;

  faCircleQuestion = faCircleQuestion;

  private isFirstLoad = true;
  private isAmountAlertOpen = false;

  showAllCardsEffect = effect(() => {
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
  });

  gatewayTypeEffect = effect(() => {
    if (this.isGatewaySwitchingBypassed()) {
      this.cards = this.allCards;
      this.changeDetectorRef.detectChanges();
      return;
    }

    const gatewayType = this.gatewayType();
    // Filter cards based on gateway type
    this.filterCardsByGatewayType(gatewayType);
    // Show alert and clear selected card if its gateway type doesn't match
    const selectedCard = this.selectedCard.value;
    if (selectedCard && gatewayType !== undefined && gatewayType !== null) {
      if (Number(selectedCard.gatewayType) !== Number(gatewayType)) {
        this.alertService.infoAlert({
          content: `This payment amount requires you to reselect your card. Please select your card again to continue. If your card is not listed, please add it again to proceed.`,
          isOk: true
        }).afterClosed().subscribe(() => {
          this.selectedCard.setValue(undefined);
          this.changeDetectorRef.detectChanges();
        });
      }
    }
    this.changeDetectorRef.detectChanges();
  });

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
        this.credit_card_gateway_switching_status = headerData.credit_card_gateway_switching_status;
        this.credit_card_gateway_type = headerData.credit_card_gateway_type;
        this.filterCardsByGatewayType(this.gatewayType());
        this.changeDetectorRef.detectChanges();
      })
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load cards.
   */
  initStoreSelectors() {
    this.store.dispatch(CardsActions.loadCards({ showAllCards: this.showAllCards(), isPayroll: this.isPayroll() }));
    this.store.select(selectCards).subscribe((res) => {
      this.allCards = res;
      this.filterCardsByGatewayType(this.gatewayType());
      this.changeDetectorRef.detectChanges();
    });
    this.selectIsCardsLoading$ = this.store.select(selectIsCardsLoading);
  }

  /**
   * Filters cards based on gateway type.
   * @param gatewayType - The gateway type to filter by.
   */
  filterCardsByGatewayType(gatewayType: number | undefined) {
    if (this.isGatewaySwitchingBypassed()) {
      this.cards = this.allCards;
      return;
    }

    if (this.credit_card_gateway_switching_status === 1 && this.isPayroll()) {
      this.cards = this.allCards;
      return;
    }
    if (this.credit_card_gateway_switching_status === 1 && gatewayType == null) {
      this.cards = [];
      return;
    }

    const type = this.credit_card_gateway_switching_status === 1
      ? Number(gatewayType)
      : Number(this.credit_card_gateway_type);

    this.cards = this.allCards.filter(card => {
      const cardGateway = Number(card.gatewayType);
      if (cardGateway === type) return true;
      if (type === 5 && cardGateway === 4 && card.cardType === '003') return true;
      return false;
    });
  }

  onDropdownOpen() {
    this.paymentsService.clearGatewaySkip();
    if (this.isGatewaySwitchingBypassed()) return;

    if (this.credit_card_gateway_switching_status === 1 && this.gatewayType() == null && !this.isPayroll() && this.showAllCards() && this.allCards.length > 0 && !this.paymentsService.isGatewayTypeLoading()) {
      this.ngSelectComponent.close();
      if (!this.isAmountAlertOpen) {
        this.isAmountAlertOpen = true;
        this.alertService.infoAlert({
          content: 'Please enter amount to continue.',
        }).afterClosed().subscribe(() => {
          this.isAmountAlertOpen = false;
        });
      }
    }

    if (this.credit_card_gateway_switching_status === 1 && this.gatewayType() && !this.isPayroll() && this.showAllCards() && this.cards.length === 0 && !this.paymentsService.isGatewayTypeLoading()){
      this.ngSelectComponent.close();
      if (!this.isAmountAlertOpen) {
        this.isAmountAlertOpen = true;
        this.alertService.infoAlert({
          content: 'Unable to find the card. Please re-enter or add the card details',
          doneMsg: 'Add Card',
          isCancel: true,

        }).afterClosed().subscribe((res) => {
          this.isAmountAlertOpen = false;
          if(res){
            this.addNewCard();
          }
        });
      }
    }
  }

  private isGatewaySwitchingBypassed(): boolean {
    return this.credit_card_gateway_switching_status === 3 || this.credit_card_gateway_switching_status === 4;
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
    this.changesSubscription = this.selectedCard.valueChanges.subscribe((card) => {
      if (card && !card.isMapped) {
        this.handleUnmappedCard(card, fn);
        return;
      }

      if(card && card.notAvailableGateway && !this.isPayroll() && !this.paymentsService.isGatewaySkip(card.cardId)){
        this.addCardWithPrefill(card,card.notAvailableGateway);
        return;
      }

      fn(card);
    });
  }

  private handleUnmappedCard(
    card: IExistingCreditCards,
    onChange: (event?: IExistingCreditCards | null | undefined) => void
  ): void {
    this.alertService.warningAlert({
      title: 'Warning',
      content: 'This card is not mapped to a business. Please map the card to a business to continue.',
      doneMsg: 'Map Card to Business',
    }).afterClosed().subscribe(() => {
      this.cardPaymentService.openMapSourceWithBusinessModal(card).afterClosed().subscribe((res) => {
        if (res?.success) {
          const mappedCard = { ...card, isMapped: true };
          this.store.dispatch(CardsActions.updateCard({ card: mappedCard }));
          this.selectedCard.setValue(mappedCard);
          onChange(mappedCard);
          this.alertService.successAlert({ content: 'Card mapped to business successfully.' });
        } else {
          this.selectedCard.setValue(undefined);
          this.changeDetectorRef.detectChanges();
        }
      });
    });
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
      this.router.navigate(['/manage/users/verify-email-phone']);
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
    } else if (this.isPayroll() && this.credit_card_gateway_switching_status === 1) {
      gatewayTypeParam = this.credit_card_gateway_type;
    } else if (this.showAllCards()) {
      gatewayTypeParam = this.gatewayType();
    } else {
      gatewayTypeParam = undefined;
    }

    const sub = this.openAddCardService.openAddCard(gatewayTypeParam).subscribe((cardModal) => {
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
   * chooser. Used by the trans-limit 824 fail flow on the "Add" path so the user
   * only re-enters card number/expiration/CVV when re-tokenising on a new gateway.
   * Falls back to the standard `addNewCard` flow when get-card-details does not
   * return a valid record.
   */
  addCardWithPrefill(card: IExistingCreditCards, gatewayType: number) {
    if (this.isNotVerified) {
      this.router.navigate(['/manage/users/verify-email-phone']);
      return;
    }
    this.clearSelection();
    if (this.openAddCardService.isLoading()) return;

    const sub = this.openAddCardService
      .openAddCardWithPrefill(card.cardId, gatewayType, card.nickName, card.bgColor, card.allowSkipGatewayAddition && !this.isPayroll())
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
            this.writeValue(res.data.metaData);
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

  /**
   * @description Marks the transient skip so the current payment bypasses the
   * gateway check. The card keeps `allowSkipGatewayAddition`, so "Skip & Pay"
   * stays on offer for as long as the backend reports the card as eligible.
   */
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
    this.ngSelectComponent.handleClearClick();
    this.ngSelectComponent.close();
  }

  /**
   * @description Programmatically inserts a card into the dropdown (if not already
   * present in `allCards`) and selects it. Used by the trans-limit 824 fail flow
   * when the backend returns a `duplicate_card` object — the user should not have
   * to re-add it manually.
   * @param card - the duplicate card returned by the backend (shape matches IExistingCreditCards).
   */
  populateDuplicateCard(card: IExistingCreditCards): void {
    if (!card?.cardId) return;
    const exists = this.allCards.some((c) => c.cardId === card.cardId);
    if (!exists) {
      this.store.dispatch(CardsActions.addCard({ card }));
    }
    this.selectedCard.setValue(card);
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
