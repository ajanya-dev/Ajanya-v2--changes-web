import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  inject
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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';

@Component({
  selector: 'app-card-dropdown-multi-select',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  templateUrl: './card-dropdown-multi-select.component.html',
  styleUrl: './card-dropdown-multi-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardDropdownMultiSelectComponent),
      multi: true
    }
  ]
})
export class CardDropdownMultiSelectComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  private store = inject(Store);
  private openAddCardService = inject(OpenAddCardService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private v3DataTableService = inject(V3PaymentsTableService);

  subscriptions: Subscription[] = [];
  @Input() id = 'id'; // Its better to pass a unique id always for avoiding conflict.
  @Input() enableAddNew = true;
  @Input() append = 'ng-select';
  @Input() placeholder = 'Select Card';
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' | '5' = '5';
  @Input() labelIconNeeded = true;
  @Input() dropdownIconNeeded = true;
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() touch = new EventEmitter();
  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  cards: IExistingCreditCards[];
  selectIsCardsLoading$: Observable<boolean>;

  selectedCard: FormControl<IExistingCreditCards | null | undefined> =
    new FormControl();

  searchTerm: string;
  searchTimeout: number;
  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};

  ngOnInit(): void {
    this.initStoreSelectors();
  }

  ngAfterViewInit(): void {
    this.onReady();
  }

  /**
   * Initializes store selectors and dispatches an action to load cards.
   */
  initStoreSelectors() {
    if (!this.v3DataTableService.cardsDataDispatched) {
      this.store.dispatch(CardsActions.loadCards({ showAllCards: false }));
      this.v3DataTableService.cardsDataDispatched = true;
    }
    this.store.select(selectCards).subscribe((res) => {
      this.cards = res;
      this.changeDetectorRef.detectChanges();
    });
    this.selectIsCardsLoading$ = this.store.select(selectIsCardsLoading);
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
          const item = this.cards.find((ele) => ele.cardId === id);
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
    this.changesSubscription = this.selectedCard.valueChanges.subscribe(fn);
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
   */

  addNewCard() {
    this.clearSelection();
    if(this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService
      .openAddCard()
      .subscribe((cardModal) => {
        if(cardModal){
          cardModal      .afterClosed()
          .subscribe((res) => {
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
              // Backed out of "Confirm Card": the card exists (unconfirmed).
              this.v3DataTableService.cardsDataDispatched = false;
              this.initStoreSelectors();
            }
          });
        }
      });
    this.subscriptions.push(sub);
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

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
