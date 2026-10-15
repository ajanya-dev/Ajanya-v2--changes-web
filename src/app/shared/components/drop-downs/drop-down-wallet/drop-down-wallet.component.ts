import { Subscription, catchError } from 'rxjs';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  ViewChild,
  inject
} from '@angular/core';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { IWalletData } from 'src/app/models/wallet';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

/**
 * @description Drop down component for wallet.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  selector: 'app-drop-down-wallet',
  templateUrl: './drop-down-wallet.component.html',
  styleUrls: ['./drop-down-wallet.component.scss']
})
export class DropDownWalletComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() id = 'id'; //Its better to pass a unique id always for avoiding conflict.
  @Input() isRequired = false;
  @Input() placeholder = 'Select Wallet';
  @Output() selectionEvent = new EventEmitter();
  @Output() clearEvent = new EventEmitter();
  @Input() selectDropdownItem: IWalletData;

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  walletList: IWalletData[] = [];
  subscriptions: Subscription[] = [];
  selectedItem: IWalletData;
  private _paymentService = inject(PaymentsService);

  constructor(private _walletService: WalletService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isRequired) {
      this.loadRequiredLabel();
    }
    if (changes.selectDropdownItem && this.selectDropdownItem) {
      this.handleSelectedItem();
    }
  }

  ngAfterViewInit(): void {
    this.loadRequiredLabel();
  }

  ngOnInit(): void {
    this.getWalletInformation();
  }

  /**
   * @description Loads wallet information and sets it into `this.walletList`.
   */
  getWalletInformation() {
    this.subscriptions.push(
      this._walletService
        .getWalletInformation()
        .pipe(
          catchError((error) => {
            if (
              error.error.permissionRequired === 'wallet-view-transactions' &&
              error.error.permissionType === 'page'
            ) {
              const noPermission = {
                noPermission: true,
                payMethode: 'wallets'
              };
              this._paymentService.isPermissionDenied.next(noPermission);
            }
            throw error;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.walletList = res.data.map((value) => {
              value.displayName = `${value.walletName} (${value.availableBalance})`;
              return value;
            });
          }
        })
    );
  }

  /**
   * @description THe selected drop down item is added to `this.selectDropdownItem` if not already present.
   * Also sets the same to `this.selectedItem`
   */
  handleSelectedItem() {
    setTimeout(() => {
      if (!this.walletList.includes(this.selectDropdownItem)) {
        this.walletList.push(this.selectDropdownItem);
      }
      this.selectedItem = this.selectDropdownItem;
    }, 100);
  }

  /**
   * @description Clears the selection in ng select.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description Emits `selectionEvent` when selection is made.
   * @param event - selection event in template.
   */
  onChange(event: IWalletData) {
    this.selectionEvent.emit(event);
  }

  /**
   * @description Adds or removes required label class.
   */
  loadRequiredLabel(): void {
    const dd = document.querySelectorAll(
      `#drop_down_${this.id} .ng-select-container .ng-value-container .ng-placeholder`
    );
    if (this.isRequired) dd[0]?.classList.add('drop_down_required_star');
    else dd[0]?.classList.remove('drop_down_required_star');
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.clearEvent.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
