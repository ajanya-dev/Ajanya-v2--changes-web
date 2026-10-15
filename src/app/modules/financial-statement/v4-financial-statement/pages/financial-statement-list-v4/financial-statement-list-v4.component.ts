import { Component, computed, DestroyRef, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatNumber, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IFinancialStatementRowData } from 'src/app/modules/financial-statement/model/financialstatement';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { DetailSidePanelComponent } from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { LucideAngularModule } from 'lucide-angular';
import { FinancialActionButtonsV4Component } from '../../components/financial-action-buttons-v4/financial-action-buttons-v4.component';
import { FinancialStatementDrawerV4Component } from '../../components/financial-statement-drawer-v4/financial-statement-drawer-v4.component';
import { OperationTypeBadgeV4Component } from '../../components/operation-type-badge-v4/operation-type-badge-v4.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';

@Component({
  selector: 'app-financial-statement-list-v4',
  standalone: true,
  imports: [
    FormsModule,
    V4DataTableComponent,
    V4PageHeaderComponent,
    DetailSidePanelComponent,
    FinancialStatementDrawerV4Component,
    LucideAngularModule,
    NgClass
  ],
  templateUrl: './financial-statement-list-v4.component.html',
  styleUrl: './financial-statement-list-v4.component.scss'
})
export class FinancialStatementListV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private destroyRef = inject(DestroyRef);
  private commonOnInitService = inject(CommonOnInitService);
  private localStorageService = inject(LocalStorageService);

  drawerOpen = signal(false);
  isPanelExpanded = signal(false);
  selectedRow = signal<IFinancialStatementRowData | null>(null);
  isChildComponent = input(false);

  panelTitle = computed(() => {
    const r = this.selectedRow();
    if (!r) return 'Transaction Details';
    const map: Record<number, string> = {
      1: 'Refill Details', 2: 'Check Mail Statement', 3: 'Shopping Details',
      5: 'Refund Details', 15: 'SMS Details', 7: 'Transaction Fee',
      11: 'Shipping Label', 13: 'Check Design Fee',
      25: 'Document Mail', 27: 'Invoice Mail'
    };
    return map[r.operation_type] ?? 'Transaction Details';
  });

  panelSubtitle = computed(() => {
    const raw = this.selectedRow()?.created_at;
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  });
  isSubscribed: number;
  @Output() rechargeClick = new EventEmitter<void>();

  readonly tableId = DTTableId.financialStatement;
  readonly isRowSelectable = () => false;

  disabledColumns = [
    'new_amount',
    'financial_statements.amount',
    'old_amount',
    'description'
  ];

  exportConfig = {
    heading: 'Financial Statement',
    ignoreColumns: ['id', 'action']
  };

  frameworkComponents = {
    btnCellRenderer: FinancialActionButtonsV4Component,
    operationTypeBadgeComponent: OperationTypeBadgeV4Component,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4CommonFilterComponent: V4DTCommonFilterComponent
  };

  readonly floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'operation_type',
        values: [
          { value: 1, name: 'Refill' },
          { value: 2, name: 'Mail' },
          { value: 3, name: 'Shopping' },
          { value: 5, name: 'Refund' },
          { value: 15, name: 'SMS' },
          { value: 7, name: 'Transaction Fee' },
          { value: 11, name: 'Shipping Label' },
          { value: 13, name: 'Check Design Fee' },
          { value: 25, name: 'Document Mail' },
          { value: 27, name: 'Invoice Mail' }
        ]
      }
    ]
  };

  columnDefs = [
    {
      minWidth: 90,
      maxWidth: 110,
      headerName: 'Action',
      field: 'action',
      sortable: false,
      suppressFloatingFilterButton: true,
      cellRenderer: 'btnCellRenderer',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      pinned: 'left' as const,
      lockPosition: true,
      lockPinned: true,
      suppressMovable: true,
      resizable: false,
      cellClass: 'flex items-center'
    },
    {
      minWidth: 150,
      maxWidth: 150,
      headerName: 'Date',
      field: 'created_at',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'v4DateFloatingFilterComponent',
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'v4CommonFilterComponent',
      cellRendererParams: {
        type: 'date',
        splitDateTime: true,
        prefixOptionalField: 'created_date'
      }
    },
    {
      minWidth: 160,
      maxWidth: 200,
      headerName: 'Previous Balance',
      field: 'old_amount',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'searchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex justify-end pr-3 text-end',
      cellRenderer: (params: { value: number }) => {
        const amount = formatNumber(params.value, 'en-US', '1.2-2');
        return `$${amount}`;
      }
    },
    {
      minWidth: 150,
      maxWidth: 200,
      headerName: 'Credit',
      field: 'amount',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'searchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex justify-end pr-3 text-end',
      cellRenderer: (params: {
        data: { operation: number; amount: number };
      }) => {
        if (params.data.operation === 1) {
          const amount = formatNumber(params.data.amount, 'en-US', '1.2-2');
          return `<span class="font-semibold text-v4-badge-success-text-color">+$${amount}</span>`;
        }
        return '<span class="text-v4-tertiary-text-color">$0.00</span>';
      }
    },
    {
      minWidth: 150,
      maxWidth: 200,
      headerName: 'Debit',
      field: 'financial_statements.amount',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'searchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex justify-end pr-3 text-end',
      cellRenderer: (params: {
        data: { operation: number; amount: number };
      }) => {
        if (params.data.operation === 2) {
          const amount = formatNumber(params.data.amount, 'en-US', '1.2-2');
          return `<span class="font-semibold text-v4-badge-error-text-color">-$${amount}</span>`;
        }
        return '<span class="text-v4-tertiary-text-color">$0.00</span>';
      }
    },
    {
      minWidth: 150,
      maxWidth: 200,
      headerName: 'Balance',
      field: 'new_amount',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'searchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex justify-end pr-3 text-end',
      cellRenderer: (params: { value: number }) => {
        const amount = formatNumber(params.value, 'en-US', '1.2-2');
        return `<span class="font-semibold">$${amount}</span>`;
      }
    },
    {
      minWidth: 165,
      maxWidth: 200,
      headerName: 'Operation Type',
      field: 'operation_type',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'selectBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'operationTypeBadgeComponent'
    },
    {
      minWidth: 150,
      headerName: 'Description',
      field: 'description',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'searchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true
    },
  ];

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations,
      undefined,
      { actionButton: false, eyeButton: true }
    );
    this.v3DataTableService.refreshV3DataTable();
    this.getHeaderData();
  }

  getHeaderData(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const response = res as IHeaderData;
        this.isSubscribed = response.isSubscribed;
      });
  }

  refresh(): void {
    this.v3DataTableService.refreshV3DataTable();
  }

  onViewEvent(event: unknown): void {
    const row = (event as { selectedRow: IFinancialStatementRowData })
      ?.selectedRow;
    if (row?.id) {
      this.selectedRow.set(row);
      this.drawerOpen.set(true);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onRechargeCredit(): void {
    if (this.isChildComponent()) {
      this.rechargeClick.emit();
      return;
    }
    if (!this.isSubscribed) {
      const alert = this.alertService.warningAlert({
        content: 'Kindly subscribe to a plan.',
        isCancel: true,
        doneMsg: 'Subscribe Now',
        cancelMsg: 'Not Now'
      });
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.goToSubscription();
        }
      });
      return;
    }
    this.router.navigate(['/v4/manage/refill-credit/show-refillform']);
  }

  goToSubscription(): void {
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');
    if (emailVerified === 1 && phoneVerified === 1) {
      this.router.navigate(['/v4/manage/subscription'], {
        state: { returnUrl: this.router.url }
      });
      return;
    }
    const emailMissing = emailVerified !== 1;
    const phoneMissing = phoneVerified !== 1;
    let content = 'Please verify email and phone number.';
    if (emailMissing && !phoneMissing) {
      content = 'Please verify your email address.';
    } else if (phoneMissing && !emailMissing) {
      content = 'Please verify your phone number.';
    }
    const ref = this.alertService.warningAlert({
      content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.commonOnInitService.openEmailPhoneVerificationModal();
      }
    });
  }
}
