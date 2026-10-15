import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFileInvoice,
  faCalendar,
  faDollarSign,
  faChevronDown,
  faTrash,
  faCircleCheck
} from '@fortawesome/pro-solid-svg-icons';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { finalize, Subject, Subscription, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { InvoiceBillStateService } from '../../services/invoice-bill-state.service';
import { IEmailBillItem, IEmailBillsResponse } from '../../model/Bill';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { EmailToBillModalComponent } from '../../modals/email-to-bill-modal/email-to-bill-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';



export interface IViewByFilter {
  id: string;
  name: string;
  value: string;
}

@Component({
  selector: 'app-email-bill-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    CurrencyPipe,
    ScrollToEndDirective,
    NgClass,
    CommonButtonV35Component,
    MatTooltipModule
  ],
  templateUrl: './email-bill-list.component.html',
  styleUrl: './email-bill-list.component.scss'
})
export class EmailBillListComponent implements OnInit, OnDestroy {
  private billService = inject(BillService);
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private dialog = inject(MatDialog);

  @Input() selectedItem: IEmailBillItem | null = null;
  @Output() itemSelected = new EventEmitter<IEmailBillItem>();
  @Output() selectAllToggled = new EventEmitter<boolean>();

  // Signals
  emailBills = signal<IEmailBillItem[]>([]);
  isLoading = signal<boolean>(false);
  isSelectAll = signal<boolean>(false);
  selectedViewBy = signal<string>('newest');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  hasMorePages = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);
  mappedEmail = signal<string>('');

  // Icons
  faFileInvoice = faFileInvoice;
  faCalendar = faCalendar;
  faDollarSign = faDollarSign;
  faChevronDown = faChevronDown;
  faTrash = faTrash;
  faCheck = faCircleCheck;

  showBulkDelete = signal<boolean>(false);
  destroy$ = new Subject<boolean>();

  // View by options
  viewByOptions: IViewByFilter[] = [
    { id: 'newest', name: 'View by newest', value: 'newest' },
    { id: 'oldest', name: 'View by oldest', value: 'oldest' },
    {
      id: 'amount-high',
      name: 'View by amount (high to low)',
      value: 'amount-high'
    },
    {
      id: 'amount-low',
      name: 'View by amount (low to high)',
      value: 'amount-low'
    }
  ];

  private subscriptions: Subscription[] = [];
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.loadEmailBills();
  }

 

  /**
   * Load email bills from API
   */
  loadEmailBills(resetList: boolean = true): void {
    if (resetList) {
      this.isLoading.set(true);
      this.currentPage.set(1);
      this.emailBills.set([]);
    } else {
      this.isLoadingMore.set(true);
    }

    const payload = {
      viewBy: this.selectedViewBy(),
      filter: 'all', // You can add more filter options
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
            this.emailBills.update((currentBills) => [
              ...currentBills,
              ...newData
            ]);
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
      error: (error) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Handle scroll to end event - load more items
   */
  onScrollToEnd(): void {
    if (this.hasMorePages() && !this.isLoadingMore() && !this.isLoading()) {
      this.currentPage.update((page) => page + 1);
      this.loadEmailBills(false);
    }
  }

  /**
   * Handle item selection
   */
  onItemSelect(item: IEmailBillItem): void {
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
      this.itemSelected.emit(item);
    }
  }

  /**
   * Handle select all toggle
   */
  onSelectAllToggle(): void {
    const newSelectAllState = !this.isSelectAll();
    this.isSelectAll.set(newSelectAllState);
    this.showBulkDelete.set(newSelectAllState);

    // Update all items selection state
    this.emailBills.update((bills) =>
      bills.map((bill) => ({
        ...bill,
        isSelected: newSelectAllState
      }))
    );

    if (!newSelectAllState) {
      this.showBulkDelete.set(false);
      this.clearLocalState();
    }

    this.selectAllToggled.emit(newSelectAllState);
  }

  /**
   * Update select all state based on current selections
   */
  private updateSelectAllState(): void {
    const bills = this.emailBills();
    const selectedCount = bills.filter((bill) => bill.isSelected).length;
    const totalCount = bills.length;

    this.isSelectAll.set(selectedCount === totalCount && totalCount > 0);
  }

  /**
   * Clear local state when no items are selected
   */
  private clearLocalState(): void {
    this.isSelectAll.set(false);
    this.itemSelected.emit(undefined);
  }

  /**
   * Handle view by filter change
   */
  onViewByChange(viewBy: string): void {
    this.selectedViewBy.set(viewBy);
    this.loadEmailBills(true);
  }

  /**
   * Get total amount from extracted data with null safety
   */
  getTotalAmount(item: IEmailBillItem): number {
    if (!item.extracted_data || item.extracted_data.length === 0) {
      return 0;
    }

    const firstExtractedData = item.extracted_data[0];
    if (!firstExtractedData?.invoice_info?.total_amount) {
      return 0;
    }

    const amount = parseFloat(firstExtractedData.invoice_info.total_amount);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Delete an email bill item
   */
  onDeleteItem(item: IEmailBillItem, event: Event): void {
    event.stopPropagation();

    this.alertService
      .confirmAlert({
        content: `Are you sure you want to delete this email bill from ${item.from_name}?`
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.deleteItem(item, event);
        }
      });
  }

  deleteItem(item: IEmailBillItem, event: Event): void {
    this.isLoading.set(true);

    this.subscriptions.push(
      this.billService.deleteEmailBill(item.id).pipe(finalize(() => this.isLoading.set(false))).subscribe({
        next: (response) => {
          if (response.success) {
            this.emailBills.update((bills) =>
              bills.filter((bill) => bill.id !== item.id)
            );

            this.totalItems.update((count) => count - 1);

            if (this.selectedItem?.id === item.id) {
              this.selectedItem = null;
              this.itemSelected.emit(undefined);
            }
            this.updateSelectAllState();
            }
        }
      })
    );
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
                  content: 'Email bills deleted successfully'
                });
              }
            });
        }
      });
  }

  openEmailToBillSetup(): void {
    this.dialog.open(EmailToBillModalComponent, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true,
      data: {
        mappedEmailToBill: this.mappedEmail(),
        isEmailToBillMapped: false,
      }
    }).afterClosed().subscribe(() => {
      this.loadEmailBills();
    });
  }


  transformName(name: string): string {
    if (!name) return '';
    return name.split('"').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
