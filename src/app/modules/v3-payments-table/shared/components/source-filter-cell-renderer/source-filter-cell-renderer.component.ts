import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBank, faCreditCard, faSearch, faTimes, faWallet } from '@fortawesome/pro-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ISelectBoxFilterArray } from 'src/app/models/v3-datatable';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  switchMap,
  tap
} from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgSelectModule, FaIconComponent],
  selector: 'app-source-filter-cell-renderer',
  templateUrl: './source-filter-cell-renderer.component.html',
  styleUrls: ['./source-filter-cell-renderer.component.scss']
})
export class SourceFilterCellRendererComponent implements OnInit {
  private bankService = inject(BankAccountsService);
  private cybersourceService = inject(CybersourceService);
  private walletService = inject(WalletService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  cdr = inject(ChangeDetectorRef);
  destroyRef = inject(DestroyRef);

  bankSearchSubject = new Subject<string>();
  walletSearchSubject = new Subject<string>();
  cardSearchSubject = new Subject<string>();

  private bankHasActiveSearch = false;
  private walletHasActiveSearch = false;
  private cardHasActiveSearch = false;

  /** Bypass ng-select client-side filtering — search is handled server-side. */
  searchFn = (): boolean => true;

  faSearch = faSearch;
  faTimes = faTimes;
  faBank = faBank;
  faWallet = faWallet;
  faCreditCard = faCreditCard;
  filterText: string = '';

  pageNumber: { [key: string]: number } = {
    BANK: 1,
    WALLET: 1,
    CARD: 1
  };

  sourceTypes=signal([{ value: '', name: 'All' },{ value: 'BANK', name: 'BANK' }, { value: 'WALLET', name: 'WALLET' }, { value: 'CARD', name: 'CARD' }]);

  bankSourceData=signal<IBankDropdown[]>([]);
  walletSourceData=signal<IWalletData[]>([]);
  cardSourceData=signal<IExistingCreditCards[]>([]);

  bankSearchLoading = signal(false);
  walletSearchLoading = signal(false);
  cardSearchLoading = signal(false);

  isCellFilterApplied = signal(false);
  cellFilterSourceId = signal<string | null>(null);
  cellFilterSubFilterName = signal<string | null>(null);

  selectedBankSourceId: string | number | null = null;
  selectedWalletSourceId: string | number | null = null;
  selectedCardSourceId: string | number | null = null;

  selectedCellValueSignal$ = toObservable(computed(() => this.dataTableService.selectedCellValueSignal()));

  ngOnInit(): void {
    this.onBankSearch();
    this.onWalletSearch();
    this.onCardSearch();
    this.onCellFilterChange();
  }

  agInit(): void {}

  onCellFilterChange(){
    this.selectedCellValueSignal$
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((selectedCellValue) => {
      if(selectedCellValue) {
        this.isCellFilterApplied.set(true);
        this.filterText = selectedCellValue.filter as string;
        this.cellFilterSourceId.set(selectedCellValue?.subFilter?.source_id ?? null);
        this.cellFilterSubFilterName.set(selectedCellValue?.subFilter?.name ?? null);
        this.loadSourceData();        
      }
    });
  }

  applyCellFilter(): void {
    if(this.cellFilterSubFilterName() === 'source_type_name') {
      if(this.cellFilterSourceId()) {
        switch(this.filterText) {
          case 'BANK':
            this.selectedBankSourceId = this.cellFilterSourceId() ? this.bankSourceData().find(bank => bank.id === this.cellFilterSourceId())?.id ?? null : null;
            break;
          case 'WALLET':
            this.selectedWalletSourceId = this.cellFilterSourceId() ? this.walletSourceData().find(wallet => wallet.id === this.cellFilterSourceId())?.id ?? null : null;
            break;
          case 'CARD':
            this.selectedCardSourceId = this.cellFilterSourceId() ? this.cardSourceData().find(card => card.id === this.cellFilterSourceId())?.cardId ?? null : null;
            break;
          default:
            break;
        } 
        const filterPayloadForGrid: ISelectBoxFilterArray = {
          source_type: {
            filterType: 'text',
            type: 'equals',
            filter: this.filterText
          },
          source_id: {
            filterType: 'text',
            type: 'equals',
            filter: this.cellFilterSourceId() as string
          }
        };
    
        this.v3DataTableService.updateV3DataTable = filterPayloadForGrid; 
      }
    }
  }

  onFilterTextChange(): void {
    this.loadSourceData();

    this.selectedBankSourceId = null;
    this.selectedWalletSourceId = null;
    this.selectedCardSourceId = null;

    // Reset selected source IDs when source type changes
    this.bankSourceData.set([]);
    this.walletSourceData.set([]);
    this.cardSourceData.set([]);

    if (!this.filterText) {
      // clear existing source_type filter from payload
      this.v3DataTableService.updateV3DataTableByRemovingFilter = ['source_type'];
      return;
    }
    this.applySourceFilter();
  }

  applySourceFilter(): void {
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      source_type: {
        filterType: 'text',
        type: 'equals',
        filter: this.filterText
      }
    };

    this.v3DataTableService.updateV3DataTable = filterPayloadForGrid;
  }

  onSourceSelectionChange(sourceType: string): void {
    switch(sourceType) {
      case 'BANK':
        if(!this.selectedBankSourceId) {
          this.removeSourceSubFilter();
          return;
        }
        this.applySourceSubFilter('BANK', this.selectedBankSourceId ?? null);
        break;
      case 'WALLET':
        if(!this.selectedWalletSourceId) {
          this.removeSourceSubFilter();
          return;
        }
        this.applySourceSubFilter('WALLET', this.selectedWalletSourceId ?? null);
        break;
      case 'CARD':
        if(!this.selectedCardSourceId) {
          this.removeSourceSubFilter();
          return;
        }
        this.applySourceSubFilter('CARD', this.selectedCardSourceId ?? null);
        break;
      default:
        break;
    }
  }

  removeSourceSubFilter(): void {
    this.v3DataTableService.updateV3DataTableByRemovingFilter = ['source_id'];
    this.isCellFilterApplied.set(false);
    this.dataTableService.selectedCellValueSignal.set(undefined);
    this.cellFilterSourceId.set(null);
    this.cellFilterSubFilterName.set(null);
  }

  private applySourceSubFilter(Type:string, sourceId: string | number | null): void {
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      source_id: {
        filterType: 'text',
        type: 'equals',
        filter: sourceId?.toString() ?? ''
      }
    };
    this.v3DataTableService.updateV3DataTable = filterPayloadForGrid;
  }

  loadSourceData(): void {
    if(!this.filterText) {
      return;
    }

    switch(this.filterText) {
      case 'BANK':
        this.getBankData();
        break;
      case 'WALLET':
        this.getWalletData();
        break;
      case 'CARD':
        this.getCardData();
        break;
      default:
        break;
    }
  }

  getBankData(): void {
    this.bankSearchLoading.set(true);
    this.bankService.getBankAccountList(this.pageNumber.BANK)
    .pipe(
      finalize(() => this.bankSearchLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (res) => {
        this.bankSourceData.update(prev => [...prev, ...res.data]);
        if(this.isCellFilterApplied()) {
          this.applyCellFilter();
        }
      }
    });
  }

  getWalletData(): void {
    this.walletSearchLoading.set(true);
    this.walletService.getWalletInformation(this.pageNumber.WALLET)
    .pipe(
      finalize(() => this.walletSearchLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (res) => {
        this.walletSourceData.update(prev => [...prev, ...res.data]);
        if(this.isCellFilterApplied()) {
            this.applyCellFilter();
        }
      }
    });
  }

  getCardData(): void {
    this.cardSearchLoading.set(true);
    this.cybersourceService.getExistingCards(true)
    .pipe(
      finalize(() => this.cardSearchLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (res) => {
        this.cardSourceData.update(prev => [...prev, ...res.data]);
        if(this.isCellFilterApplied()) {
          this.applyCellFilter();
        }
      }
    });
  }

  clearSubFilter(): void {
    this.filterText = '';
    this.v3DataTableService.updateV3DataTableByRemovingFilter = ['source_id'];
    this.isCellFilterApplied.set(false);
    this.onFilterTextChange();
  }

  onClearSearch(sourceType: string): void {
    switch(sourceType) {
      case 'BANK':
        this.bankHasActiveSearch = false;
        break;
      case 'WALLET':
        this.walletHasActiveSearch = false;
        break;
      case 'CARD':
        this.cardHasActiveSearch = false;
        break;
      default:
        break;
    }
    this.onSearch({ term: '' }, sourceType);
  }

  onDropdownClose(sourceType: string): void {
    const hasActiveSearch =
      sourceType === 'BANK' ? this.bankHasActiveSearch :
      sourceType === 'WALLET' ? this.walletHasActiveSearch :
      this.cardHasActiveSearch;
    if (hasActiveSearch) {
      this.onClearSearch(sourceType);
    }
  }

  onSearch(event: {term: string}, sourceType: string): void {
    if(!event.term) {
      switch(sourceType) {
        case 'BANK':
          this.getBankData();
          break;
        case 'WALLET':
          this.getWalletData();
          break;
        case 'CARD':
          this.getCardData();
          break;
        default:
          break;
      }
      return;
    }
    switch(sourceType) {
      case 'BANK':
        this.bankHasActiveSearch = true;
        this.bankSearchSubject.next(event.term);
        break;
      case 'WALLET':
        this.walletHasActiveSearch = true;
        this.walletSearchSubject.next(event.term);
        break;
      case 'CARD':
        this.cardHasActiveSearch = true;
        this.cardSearchSubject.next(event.term);
        break;
      default:
        break;
    }
  }

  onBankSearch(): void {
    this.bankSearchSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      tap(() => this.bankSearchLoading.set(true)),
      switchMap((term) => this.bankService.getBankAccountList(this.pageNumber.BANK, term).pipe(
        catchError(() => {
          this.bankSearchLoading.set(false);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((res) => {
      if (!res) {
        return;
      }
      this.bankSourceData.set(res.data);
      this.bankSearchLoading.set(false);
      this.cdr.detectChanges();
    });
  }

  onWalletSearch(): void {
    this.walletSearchSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      tap(() => this.walletSearchLoading.set(true)),
      switchMap((term) => this.walletService.getWalletInformation(this.pageNumber.WALLET, term).pipe(
        catchError(() => {
          this.walletSearchLoading.set(false);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((res) => {
      if (!res) {
        return;
      }
      this.walletSourceData.set(res.data);
      this.walletSearchLoading.set(false);
      this.cdr.detectChanges();
    });
  }

  onCardSearch(): void {
    this.cardSearchSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      tap(() => this.cardSearchLoading.set(true)),
      switchMap(() => this.cybersourceService.getExistingCards(true).pipe(
        catchError(() => {
          this.cardSearchLoading.set(false);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((res) => {
      if (!res) {
        return;
      }
      this.cardSourceData.set(res.data);
      this.cardSearchLoading.set(false);
      this.cdr.detectChanges();
    });
  }

  onScrollToEnd(): void {
    this.pageNumber[this.filterText]+=1;
    this.loadSourceData();
  }

}