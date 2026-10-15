import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { Subscription, catchError } from 'rxjs';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';

/**
 * @description Drop down component for credit/debit cards.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  selector: 'app-drop-down-card',
  templateUrl: './drop-down-card.component.html',
  styleUrls: ['./drop-down-card.component.scss']
})
export class DropDownCardComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  private cyberSourceService = inject(CybersourceService);
  private openAddCardService = inject(OpenAddCardService);
  private alertService = inject(AlertService);
  private _paymentService = inject(PaymentsService);

  @Input() id = 'card'; //Its better to pass a unique id always for avoiding conflict.
  @Input() isRequired = false;
  @Input() isDropdownDisabled = false;
  @Input() placeholder = 'Select Card';
  @Output() selectionEvent = new EventEmitter();
  @Output() newCardAdded = new EventEmitter();
  @Input() selectDropdownItem: IExistingCreditCards;
  @Input() enableAddNew: false;
  @Input() isPayroll: false;

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  subscriptions: Subscription[] = [];
  cardList: IExistingCreditCards[] = [];
  selectedItem: IExistingCreditCards;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isRequired) {
      this.loadRequiredLabel();
    }
    if (changes.selectDropdownItem && this.selectDropdownItem) {
      this.handleSelectedItem();
    }
    if (this.selectDropdownItem === undefined && this.isPayroll) {
      this.selectedItem = this.selectDropdownItem;
    }
  }

  ngAfterViewInit() {
    this.loadRequiredLabel();
  }

  ngOnInit() {
    this.getCards();
  }

  /**
   * @description Gets the list of existing cards and sets the data into `this.cardList`.
   * Also sets the selected card.
   * @param selectedId - card ID of selected card.
   */
  getCards(selectedId?: string) {
    this.subscriptions.push(
      this.cyberSourceService
        .getExistingCards()
        .pipe(
          catchError((error) => {
            if (
              error.error.permissionRequired === 'creditcard-view' &&
              error.error.permissionType === 'action'
            ) {
              const noPermission = {
                noPermission: true,
                payMethode: 'cards'
              };
              this._paymentService.isPermissionDenied.next(noPermission);
            }
            throw error;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.cardList = res?.data;
            if (selectedId) {
              const selectedCard = this.cardList.find(
                (ele) => ele.cardId == selectedId
              );
              if (selectedCard) {
                this.selectedItem = selectedCard;
                this.newCardAdded.emit(this.selectedItem);
              }
            }
          }
        })
    );
  }

  /**
   * @description THe selected drop down item is added to `this.cardList` if not already present.
   * Also sets the same to `this.selectedItem`
   */
  handleSelectedItem() {
    const alredayPresent = this.cardList.find(
      (card) => card.cardId === this.selectDropdownItem.cardId
    );
    if (!alredayPresent) {
      this.cardList.push(this.selectDropdownItem);
    }
    if (
      !this.selectedItem ||
      this.selectDropdownItem.cardId !== this.selectedItem.cardId
    ) {
      this.selectedItem = this.selectDropdownItem;
    }
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Opens add new card dialog if 'add-new' is selected.
   * @param event - selection event in template.
   */
  onChange(event: Event | 'add-new') {
    if (event === 'add-new') {
      this.addNewCard();
      this.ngSelectComponent.handleClearClick();
      return;
    }
    this.selectionEvent.emit(event);
  }

  /**
   * @description Clears the selection.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description Opens dialog for adding new card.
   */
  addNewCard() {
    if(this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService
      .openAddCard()
      .subscribe((cardModal) => {
        if(cardModal){
          cardModal
          .afterClosed()
          .subscribe((res) => {
            if (res && res.success) {
              this.alertService.successAlert({ content: res.data.message });
              this.getCards(res.data.metaData?.cardId ?? undefined);
            } else if (res?.cardCreated) {
              // Backed out of "Confirm Card": the card exists (unconfirmed).
              this.getCards();
            }
          });
        }
      });
    this.subscriptions.push(sub);
  }

  /**
   * @description Adds or removes required label class.
   */
  loadRequiredLabel() {
    const dd = document.querySelectorAll(
      `#drop_down_${this.id} .ng-select-container .ng-value-container .ng-placeholder`
    );
    if (this.isRequired) dd[0]?.classList.add('drop_down_required_star');
    else dd[0]?.classList.remove('drop_down_required_star');
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
