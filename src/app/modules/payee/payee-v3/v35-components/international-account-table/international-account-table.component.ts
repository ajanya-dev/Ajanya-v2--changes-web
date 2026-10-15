import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { toObservable } from '@angular/core/rxjs-interop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuildingColumns, faCheck, faQuestionCircle } from '@fortawesome/pro-solid-svg-icons';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { AddRecipientModalComponent } from 'src/app/modules/international-payment/modal/add-recipient-modal/add-recipient-modal.component';
import { TitleCasePipe } from '@angular/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { ICountriesCache } from 'src/app/models/wallet';
import { IPayeeInterBank } from '../../../payee-v2/model/payee';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { DtInternationalBankActionV35Component } from '../international-bank-action-v35/international-bank-action-v35.component';

@Component({
  selector: 'app-international-account-table',
  standalone: true,
  imports: [
    DtInternationalBankActionV35Component,
    FaIconComponent,
    TruncatePipe,
    MatTooltip,
    TitleCasePipe
  ],
  templateUrl: './international-account-table.component.html',
  styleUrl: './international-account-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InternationalAccountTableComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private payeeDataV35Service = inject(PayeeDataV35Service);
  private paymentsService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  private readonly COUNTRIES_BUSINESS_CACHE_KEY = 'international_countries_business_data';
  private readonly COUNTRIES_PERSONAL_CACHE_KEY = 'international_countries_personal_data';

  private countryCodeToNameMap = signal<Record<string, string>>({});

  faCheck = faCheck;
  faQuestionCircle = faQuestionCircle;

  tableHeaders: string[] = [
    'Account Number',
    'Bank Name',
    'Account Type',
    'Identifier Type',
    'Identifier Code',
    'Default Bank',
    'Country',
    'Action'
  ];

  rowData = signal<IPayeeInterBank[]>([]);
  payeeId = input<string>();
  selectedPayeeId: string;
  destroy$ = new Subject();
  isTableLoading = false;
  faBank = faBuildingColumns;

  onClickNewButton$ = toObservable(
    computed(
      () => this.payeeDataV35Service.payeeBankTableActions().onClickNewBank
    )
  );

  onRefresh$ = toObservable(
    computed(
      () => this.payeeDataV35Service.payeeBankTableActions().refreshInterBank
    )
  );

  constructor() {
    effect(() => {
      const selectedPayeeId = this.payeeId();
      if (!selectedPayeeId || this.selectedPayeeId === selectedPayeeId) return;
      this.getTableData(selectedPayeeId);
    });
  }

  ngOnInit(): void {
    this.getNewButtonAction();
    this.refreshTable();
    this.loadCountryNames();
  }

  getTableData(id: string) {
    this.selectedPayeeId = id;
    const payload = {
      startRow: 0,
      endRow: 50,
      payeeId: id,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
    this.isTableLoading = true;
    this.cdr.detectChanges();
    this.v3DataTableService
      .getTableListData(64, payload)
      .pipe(
        finalize(() => {
          this.isTableLoading = false;
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.rowData) {
          this.rowData.set(res.rowData as IPayeeInterBank[]);
          this.payeeDataV35Service.payeeBankTableActions.update((val) => ({
            ...val,
            refreshInterBank: false
          }));
        }
      });
  }

  getNewButtonAction() {
    this.onClickNewButton$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res && res === 'international') {
        // Reset immediately to allow subsequent clicks to work
        this.payeeDataV35Service.payeeBankTableActions.update((val) => ({
          ...val,
          onClickNewBank: undefined
        }));
        this.addInternationalPayeeBankAc();
      }
    });
  }

  refreshTable() {
    this.onRefresh$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res) {
        this.getTableData(this.payeeId() as string);
      }
    });
  }

  addInternationalPayeeBankAc() {
    const dialogRef = this.dialog.open(AddRecipientModalComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        editMode: false,
        id: this.payeeId(),
        bankAcId: undefined,
        recipientType: null,
        mode: 'new-bank-account',
        recipientId: this.payeeId(),
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if(res?.success){
          this.payeeDataV35Service.payeeBankTableActions.update((val) => ({
            ...val,
            refreshInterBank: true
          }));
        }
      });
  }

  getIsDefault(bankAccount: IPayeeInterBank) {
    if(bankAccount.account_type === 'business' && bankAccount?.is_default_for_business === 1){
      return true;
    }
    if(bankAccount.account_type === 'personal' && bankAccount?.is_default_for_personal === 1){
      return true;
    }
    return false;
  }

  getBankCountry(code: string): string {
    if (!code) return '-';
    return this.countryCodeToNameMap()[code] ?? code;
  }

  private loadCountryNames(): void {
    const map: Record<string, string> = {};

    const mergeCacheIntoMap = (cacheKey: string): boolean => {
      try {
        const cached = this.localStorageService.getItem(cacheKey as LocalStorageKeys);
        if (!cached) return false;
        const data = JSON.parse(cached) as ICountriesCache;
        Object.entries(data).forEach(([countryName, countryData]) => {
          map[countryData.countryCode] = countryName;
        });
        return true;
      } catch {
        return false;
      }
    };

    const hasBusiness = mergeCacheIntoMap(this.COUNTRIES_BUSINESS_CACHE_KEY);
    const hasPersonal = mergeCacheIntoMap(this.COUNTRIES_PERSONAL_CACHE_KEY);

    if (hasBusiness || hasPersonal) {
      this.countryCodeToNameMap.set(map);
      return;
    }

    // Neither cache populated yet — fetch business list as the base
    this.paymentsService
      .enabledInternationalPaymentCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          Object.entries(res.data).forEach(([countryName, countryData]) => {
            map[countryData.countryCode] = countryName;
          });
          this.countryCodeToNameMap.set({ ...map });
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
