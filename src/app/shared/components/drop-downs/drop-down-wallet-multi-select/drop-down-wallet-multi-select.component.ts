import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  ViewChild,
  SimpleChanges,
  signal,
  computed,
  forwardRef
} from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faWallet } from '@fortawesome/pro-solid-svg-icons';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';

/**
 * @description Drop down component for wallet with multi select.
 */
@Component({
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    FaIconComponent,
    MatTooltip
  ],
  selector: 'app-drop-down-wallet-multi-select',
  templateUrl: './drop-down-wallet-multi-select.component.html',
  styleUrls: ['./drop-down-wallet-multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropDownWalletMultiSelectComponent),
      multi: true
    }
  ]
})
export class DropDownWalletMultiSelectComponent
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() id = 'id';
  @Input() isRequired = false;
  @Input() placeholder = 'Select Wallets';
  @Input() appendTo: string = 'body';
  @Input() maxDisplayItems: number = 3;
  @Input() clearable: boolean = true;
  @Input() loading: boolean = false;
  @Input() items: IWalletData[] = [];
  @Input() selectedWallets: IWalletData[] = [];
  @Input() selectAll: boolean = false;
  @Input() disableSelectionId: string | null = null;

  @Output() selectionEvent = new EventEmitter<IWalletData[]>();
  @Output() clearEvent = new EventEmitter<void>();
  @Output() scrollToEnd = new EventEmitter<void>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() ngModelChange = new EventEmitter<IWalletData[]>();

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];


  walletList = signal<IWalletData[]>([]);
  isSelectedWallets: IWalletData[] = [];
  
  sortedWalletList = computed(() => {
    const allWallets = this.walletList();
    const selectedWallets = this.isSelectedWallets;
    const selectedIds = selectedWallets.map(wallet => wallet.id);
    const unselectedWallets = allWallets.filter(wallet => !selectedIds.includes(wallet.id));
    return [...selectedWallets, ...unselectedWallets];
  });
  
  // Icons
  faWallet = faWallet;

  ngOnInit(): void {
    this.initializeSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && changes['items'].currentValue) {
      this.walletList.set(changes['items'].currentValue);
    }
    
    if (changes['selectedWallets'] && changes['selectedWallets'].currentValue) {
      this.isSelectedWallets = changes['selectedWallets'].currentValue;
    }
  }


  private initializeSearch(): void {
    const searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.searchEvent.emit(searchTerm);
      });

    this.subscriptions.push(searchSubscription);
  }


  search(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    if (target && target.value !== undefined) {
      const searchValue = target.value;
      this.searchSubject.next(searchValue);
    }
  }

  onScrollToEnd(): void {
    this.scrollToEnd.emit();
  }

  getChange(selectedItems: IWalletData[]): void {
    this.isSelectedWallets = selectedItems || [];
    this.selectionEvent.emit(selectedItems || []);
    this.ngModelChange.emit(selectedItems || []);
    this.onChange(selectedItems || []);
    this.onTouched();
  }

  clear(): void {
    this.isSelectedWallets = [];
    this.clearEvent.emit();
    this.onChange([]);
    this.onTouched();
  }

  selectAllWallets(): void {
    const availableWallets = this.sortedWalletList().filter(
      wallet => wallet.id !== this.disableSelectionId
    );
    this.isSelectedWallets = availableWallets;
    this.selectionEvent.emit(availableWallets);
    this.onChange(availableWallets);
    this.onTouched();
  }

  clearSelection(): void {
    this.isSelectedWallets = [];
    this.onChange([]);
    this.onTouched();
  }

  clearItem(walletId: string): void {
    this.isSelectedWallets = this.isSelectedWallets.filter(
      (wallet) => wallet.id !== walletId
    );
    this.selectionEvent.emit(this.isSelectedWallets);
    this.onChange(this.isSelectedWallets);
    this.onTouched();
  }


  private onChange = (value: IWalletData[]) => {};
  private onTouched = () => {};

  writeValue(value: IWalletData[]): void {
    this.isSelectedWallets = value || [];
  }

  registerOnChange(fn: (value: IWalletData[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  // Getter for ngModel binding
  get selectedWalletsValue(): IWalletData[] {
    return this.isSelectedWallets;
  }

  set selectedWalletsValue(value: IWalletData[]) {
    this.isSelectedWallets = value || [];
    this.onChange(value || []);
    this.onTouched();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
