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
import { finalize, Subject, takeUntil } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuildingColumns,
  faCheck,
  faQuestionCircle,
  faTriangleExclamation
} from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { IPayeeBank } from '../../../payee-v2/model/payee';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { DtBankActionButtonV35Component } from '../bank-action-button-v35/bank-action-button-v35.component';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-bank-account-table',
  standalone: true,
  imports: [
    FaIconComponent,
    MatTooltip,
    DtBankActionButtonV35Component,
    TruncatePipe,
    MatTooltip,
    TitleCasePipe
  ],
  templateUrl: './bank-account-table.component.html',
  styleUrl: './bank-account-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankAccountTableComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(AlertService);
  private payeeDataV35Service = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private cdr = inject(ChangeDetectorRef);

  destroy$ = new Subject();
  isTableLoading = false;
  rowData = signal<IPayeeBank[]>([]);
  payeeId = input<string>();
  faCheck = faCheck;
  faQuestionCircle = faQuestionCircle;
  faBank = faBuildingColumns;
  faUnverified = faTriangleExclamation;
  onClickNewButton$ = toObservable(
    computed(
      () => this.payeeDataV35Service.payeeBankTableActions().onClickNewBank
    )
  );

  onRefresh$ = toObservable(
    computed(() => this.payeeDataV35Service.payeeBankTableActions().refreshBank)
  );

  selectedPayeeId: string;
  tableHeaders: string[] = [
    'Bank Account Holder Name',
    'Routing Number',
    'Account Number',
    'Account Type',
    'Default For DD',
    'Action'
  ];

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
      .getTableListData(43, payload)
      .pipe(
        finalize(() => {
          this.isTableLoading = false;
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.rowData) {
          this.rowData.set(res.rowData as IPayeeBank[]);
          this.payeeDataV35Service.payeeBankTableActions.update((val) => ({
            ...val,
            refreshBank: false
          }));
        }
      });
  }

  getNewButtonAction() {
    this.onClickNewButton$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res && res === 'domestic') {
        this.openAddBankModal();
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

  openAddBankModal() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.bankModalService
      .openAddBankNormalModal({ editMode: false, id: this.payeeId() })
      .pipe(takeUntil(this.destroy$))
      .subscribe((bankModal) => {
        if (bankModal) {
          bankModal
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
              this.payeeDataV35Service.payeeBankTableActions.update((val) => ({
                ...val,
                onClickNewBank: undefined
              }));
              if (result?.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: ' Bank account added successfully',
                  close: true
                });
                this.getTableData(this.payeeId() as string);
              }
            });
        }
      });
  }

  getAccountType(accountType: string) {
    switch (accountType) {
      case 'CHECKING':
        return 'Checking';
      case 'SAVINGS':
        return 'Savings';
      case 'BUSINESS':
        return 'Business';
      case 'personalChecking':
        return 'Personal Checking';
      case 'businessChecking':
        return 'Business Checking';
      case 'personalSavings':
        return 'Personal Savings';
      case 'businessSavings':
        return 'Business Savings';
      default:
        return accountType;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
