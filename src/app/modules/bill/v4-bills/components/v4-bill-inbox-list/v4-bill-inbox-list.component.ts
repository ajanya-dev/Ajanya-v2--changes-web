import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { InvoiceBillStateService } from 'src/app/modules/bill/services/invoice-bill-state.service';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import {
  IEmailBillItem,
  IEmailBillsResponse
} from 'src/app/modules/bill/model/Bill';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { V4ConfigureBillInboxComponent } from '../../modals/v4-configure-bill-inbox/v4-configure-bill-inbox.component';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';

export interface IViewByFilter {
  id: string;
  name: string;
  value: string;
}

@Component({
  selector: 'app-v4-bill-inbox-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
    ScrollToEndDirective,
    CommonListSkeltonComponent,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    V4DataTableEmptyStateComponent
  ],
  templateUrl: './v4-bill-inbox-list.component.html',
  styleUrls: ['./v4-bill-inbox-list.component.scss']
})
export class V4BillInboxListComponent implements OnInit, OnDestroy {
  private billService = inject(BillService);
  private alertService = inject(V4AlertService);
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private commonLayoutToggleService = inject(CommonLayoutToggleV4Service);
  private dialog = inject(MatDialog);

  emailBills = signal<IEmailBillItem[]>([]);
  isLoading = signal(false);
  isSelectAll = signal(false);
  selectedViewBy = signal('newest');
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  hasMorePages = signal(true);
  isLoadingMore = signal(false);
  mappedEmail = signal('');
  showBulkDelete = signal(false);
  selectedItem = signal<IEmailBillItem | null>(null);

  viewByOptions: IViewByFilter[] = [
    { id: 'newest', name: 'Newest', value: 'newest' },
    { id: 'oldest', name: 'Oldest', value: 'oldest' },
    { id: 'amount-high', name: 'Amount (high)', value: 'amount-high' },
    { id: 'amount-low', name: 'Amount (low)', value: 'amount-low' }
  ];

  viewByDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Sort by',
    displayField: 'name',
    outputField: 'value',
    style: { size: 1 }
  };

  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<boolean>();

  constructor() {
    // Watch for bill-saved trigger to reload list
    effect(() => {
      const trigger = this.invoiceBillStateService.billSavedTrigger();
      if (trigger > 0) {
        this.loadEmailBills();
      }
    });
  }

  ngOnInit(): void {
    this.invoiceBillStateService.clearAll();
    this.commonLayoutToggleService.navigateToList();
    this.loadEmailBills();
  }

  loadEmailBills(resetList = true): void {
    if (resetList) {
      this.isLoading.set(true);
      this.currentPage.set(1);
      this.emailBills.set([]);
    } else {
      this.isLoadingMore.set(true);
    }

    const payload = {
      viewBy: this.selectedViewBy(),
      filter: 'all',
      page: this.currentPage()
    };

    const sub = this.billService.getEmailBills(payload).subscribe({
      next: (response: IEmailBillsResponse) => {
        if (response.success) {
          const newData = response.data.data || [];
          this.invoiceBillStateService.setMappedEmail(response.mappedEmail);
          this.mappedEmail.set(response.mappedEmail);

          if (resetList) {
            this.emailBills.set(newData);
          } else {
            this.emailBills.update((current) => [...current, ...newData]);
          }

          this.currentPage.set(response.data.current_page);
          this.totalPages.set(response.data.last_page);
          this.totalItems.set(response.data.total);
          this.hasMorePages.set(
            response.data.current_page < response.data.last_page
          );
        }

        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });

    this.subscriptions.push(sub);
  }

  onScrollToEnd(): void {
    if (this.hasMorePages() && !this.isLoadingMore() && !this.isLoading()) {
      this.currentPage.update((page) => page + 1);
      this.loadEmailBills(false);
    }
  }

  onItemSelect(item: IEmailBillItem): void {
    this.selectedItem.set(item);

    this.emailBills.update((bills) =>
      bills.map((bill) => ({
        ...bill,
        isSelected: bill.id === item.id ? !bill.isSelected : false
      }))
    );

    this.updateSelectAllState();

    const selectedItems = this.emailBills().filter((bill) => bill.isSelected);
    if (selectedItems.length === 0) {
      this.clearLocalState();
    } else {
      this.invoiceBillStateService.processSelectedItem(item);
      this.commonLayoutToggleService.navigateToDetail();
    }
  }

  onSelectAllToggle(): void {
    const newState = !this.isSelectAll();
    this.isSelectAll.set(newState);
    this.showBulkDelete.set(newState);

    this.emailBills.update((bills) =>
      bills.map((bill) => ({ ...bill, isSelected: newState }))
    );

    if (!newState) {
      this.showBulkDelete.set(false);
      this.clearLocalState();
    }
  }

  onViewByChange(viewBy: string): void {
    this.selectedViewBy.set(viewBy);
    this.loadEmailBills(true);
  }

  getTotalAmount(item: IEmailBillItem): number {
    if (!item.extracted_data || item.extracted_data.length === 0) {
      return 0;
    }
    const firstExtracted = item.extracted_data[0];
    if (!firstExtracted?.invoice_info?.total_amount) {
      return 0;
    }
    const amount = parseFloat(firstExtracted.invoice_info.total_amount);
    return Number.isNaN(amount) ? 0 : amount;
  }

  onDeleteItem(item: IEmailBillItem, event: Event): void {
    event.stopPropagation();

    this.alertService
      .confirmAlert({
        content: `Are you sure you want to delete this email bill from ${item.from_name}?`
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.deleteItem(item);
        }
      });
  }

  bulkDelete(): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete these email bills?'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.billService
            .deleteEmailBillBulk(this.emailBills().map((bill) => bill.id))
            .pipe(takeUntil(this.destroy$))
            .subscribe((response: { success: boolean }) => {
              if (response.success) {
                this.emailBills.set([]);
                this.totalItems.set(0);
                this.invoiceBillStateService.setInvoiceData(null);
                this.currentPage.set(1);
                this.showBulkDelete.set(false);
                this.alertService.successAlert({
                  content: 'Email bills deleted successfully',
                  close: true,
                  timeout: 2500
                });
              }
            });
        }
      });
  }

  onEmptyStateAction(): void {
    if (this.mappedEmail()) {
      this.loadEmailBills();
    } else {
      this.openEmailToBillSetup();
    }
  }

  openEmailToBillSetup(): void {
    this.dialog
      .open(V4ConfigureBillInboxComponent, {
        maxWidth: '680px',
        width: '93%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          mappedEmailToBill: this.mappedEmail(),
          isEmailToBillMapped: false
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.loadEmailBills();
      });
  }

  transformName(name: string): string {
    if (!name) return '';
    return name
      .split('"')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private deleteItem(item: IEmailBillItem): void {
    this.isLoading.set(true);

    this.subscriptions.push(
      this.billService
        .deleteEmailBill(item.id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.emailBills.update((bills) =>
                bills.filter((bill) => bill.id !== item.id)
              );
              this.totalItems.update((count) => count - 1);

              if (this.selectedItem()?.id === item.id) {
                this.selectedItem.set(null);
                this.invoiceBillStateService.setInvoiceData(null);
              }
              this.updateSelectAllState();
            }
          }
        })
    );
  }

  private updateSelectAllState(): void {
    const bills = this.emailBills();
    const selectedCount = bills.filter((bill) => bill.isSelected).length;
    this.isSelectAll.set(selectedCount === bills.length && bills.length > 0);
  }

  private clearLocalState(): void {
    this.isSelectAll.set(false);
    this.selectedItem.set(null);
    this.invoiceBillStateService.setInvoiceData(null);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
