import {
  Component,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { IBankDropdown } from 'src/app/models/bank';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

interface IBankFilterParams extends IFloatingFilterParams {
  tableName?: string;
  page?: string;
}

@Component({
  selector: 'app-v4-bank-dropdown-floating-filter',
  standalone: true,
  imports: [FormsModule, NgClass, OverlayModule, LucideAngularModule],
  template: `
    <div class="relative w-full font-peridot px-[1px]">
      <button
        type="button"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        (click)="toggleDropdown()"
        class="flex items-center w-full h-7 px-2 py-1 border rounded-md text-[12px] hover:bg-v4-tertiary-background-color focus:outline-none focus:ring-1 focus:ring-v4-brand-focus-color"
        [ngClass]="
          hasSelection
            ? 'bg-v4-brand-tint border-v4-primary-brand-color/30 text-v4-primary-brand-bold-color'
            : isOpen
              ? 'bg-v4-secondary-background-color border-v4-primary-brand-color ring-1 ring-v4-brand-focus-color text-v4-main-text-color'
              : 'bg-v4-secondary-background-color border-v4-input-border-color text-v4-main-text-color'
        "
      >
        <span
          class="flex-1 text-left truncate"
          [ngClass]="
            hasSelection
              ? 'text-v4-main-text-color'
              : 'text-v4-subtle-text-color'
          "
        >
          {{ displayLabel || 'Select Account' }}
        </span>
        @if (hasSelection) {
          <span
            role="button"
            tabindex="0"
            (click)="clearSelection($event)"
            (keydown.enter)="clearSelection($event)"
            (keydown.space)="clearSelection($event); $event.preventDefault()"
            class="p-0.5 hover:bg-v4-tertiary-background-color rounded mr-1 cursor-pointer"
          >
            <lucide-icon
              name="x"
              [size]="10"
              class="text-v4-subtle-text-color"
            ></lucide-icon>
          </span>
        }
        <lucide-icon
          name="chevron-down"
          [size]="14"
          class="text-v4-subtle-text-color transition-transform"
          [ngClass]="isOpen ? 'rotate-180' : ''"
        ></lucide-icon>
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen"
        [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        (backdropClick)="closeDropdown()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayMinWidth]="160"
      >
        <div
          class="bg-v4-popup-background-color border border-v4-border-color rounded shadow-lg overflow-hidden flex flex-col max-h-[200px] font-peridot"
        >
          <!-- Search input -->
          <div class="p-2 border-b border-v4-border-color">
            <div class="relative">
              <lucide-icon
                name="search"
                [size]="12"
                class="absolute left-2 top-1/2 -translate-y-1/2 text-v4-subtle-text-color"
              ></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearch()"
                placeholder="Search..."
                class="w-full pl-7 pr-2 py-1 text-xs border border-v4-input-border-color rounded focus:outline-none focus:ring-1 focus:ring-v4-brand-focus-color bg-v4-secondary-background-color text-v4-main-text-color"
              />
            </div>
          </div>

          <!-- Options list -->
          <div class="overflow-y-auto flex-1" (scroll)="onScroll($event)">
            <!-- All option -->
            @if (!showPermissionDeniedMessage()) {
            <div
              role="button"
              tabindex="0"
              class="px-2 py-1.5 cursor-pointer text-xs flex items-center gap-2 hover:bg-v4-brand-tint"
              [ngClass]="
                !hasSelection
                  ? 'bg-v4-brand-tint text-v4-primary-brand-bold-color'
                  : 'text-v4-main-text-color'
              "
              (click)="selectAll()"
              (keydown.enter)="selectAll()"
              (keydown.space)="selectAll(); $event.preventDefault()"
            >
              <span class="truncate">All</span>
              @if (!hasSelection) {
                <lucide-icon
                  name="check"
                  [size]="12"
                  class="ml-auto text-v4-primary-brand-bold-color"
                ></lucide-icon>
              }
            </div>
            }

            <!-- Bank options -->
            @for (item of bankAccounts; track item.id) {
              <div
                role="button"
                tabindex="0"
                class="px-2 py-1.5 cursor-pointer text-xs flex items-center gap-2 hover:bg-v4-brand-tint"
                [ngClass]="
                  isSelected(item)
                    ? 'bg-v4-brand-tint text-v4-primary-brand-bold-color'
                    : 'text-v4-main-text-color'
                "
                (click)="selectOption(item)"
                (keydown.enter)="selectOption(item)"
                (keydown.space)="selectOption(item); $event.preventDefault()"
              >
                <span class="truncate">{{ item.nickName || item.name }}</span>
                @if (isSelected(item)) {
                  <lucide-icon
                    name="check"
                    [size]="12"
                    class="ml-auto text-v4-primary-brand-color"
                  ></lucide-icon>
                }
              </div>
            }

            @if (bankAccounts.length === 0) {
              <div
                class="px-2 py-3 text-xs text-v4-tertiary-text-color text-center"
              >
                {{ !showPermissionDeniedMessage() ? 'No accounts found' : 'Permission Denied' }}
              </div>
            }
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class V4BankDropdownFloatingFilterComponent
  implements AgFloatingFilterComponent, OnInit, OnDestroy
{
  @HostBinding('class') hostClass = 'w-full';

  private bankService = inject(BankAccountsService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private sharedService = inject(SharedService);

  params: IBankFilterParams;
  fieldName = '';
  isOpen = false;
  hasSelection = false;
  displayLabel = '';
  searchTerm = '';
  page = 1;
  bankAccounts: IBankDropdown[] = [];
  selectedItem: IBankDropdown | null = null;
  isFromDepositSlip = signal(false);
  isFromCashExpense = signal(false);
  showPermissionDeniedMessage = signal(false);

  private subscriptions: Subscription[] = [];
  private searchTimeout: ReturnType<typeof setTimeout>;
  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

  overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 2
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 2
    }
  ];

  agInit(params: IBankFilterParams): void {
    this.params = params;
    this.fieldName = params.column.getColId();

    const colDef = params.column.getColDef();
    const renderedPage = colDef.floatingFilterComponentParams?.page;
    this.isFromDepositSlip.set(renderedPage === 'depositSlip');
    this.isFromCashExpense.set(renderedPage === 'cashExpense');

    this.loadBankAccounts();
    this.autoPopulate();
    this.listenForCellFilter();
  }

  ngOnInit(): void {
    this.listenForNewBank();
  }

  onParentModelChanged(): void {}

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }

  isSelected(item: IBankDropdown): boolean {
    return this.selectedItem?.id === item.id;
  }

  selectOption(item: IBankDropdown): void {
    this.selectedItem = item;
    this.hasSelection = true;
    this.displayLabel = item.nickName || item.name || '';
    this.isOpen = false;
    this.searchTerm = '';

    this.v3DataTableService.defaultPayload.filterModel[this.fieldName] = {
      filter: item.nickName,
      filterType: 'text',
      type: 'contains'
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  selectAll(): void {
    this.clearSelection();
  }

  clearSelection(event?: Event): void {
    event?.stopPropagation();
    this.selectedItem = null;
    this.hasSelection = false;
    this.displayLabel = '';
    this.isOpen = false;
    this.searchTerm = '';

    this.v3DataTableService.updateV3DataTableByRemovingFilter = [
      this.fieldName
    ];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.subscriptions.push(
        this.bankService
          .getBankAccounts(this.page, this.searchTerm)
          .subscribe((res) => {
            this.bankAccounts = res.data;
          })
      );
    }, 600);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      this.onScrollToEnd();
    }
  }

  private loadBankAccounts(): void {
    this.showPermissionDeniedMessage.set(false);
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(
          this.page,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          this.getPermissionContext()
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.bankAccounts = res.data;
            }
          },
          error: (err) => {
            if (err.status === 403) this.showPermissionDeniedMessage.set(true);
          }
        })
    );
  }

  getPermissionContext() {
    if(this.isFromCashExpense()) {
      return {forCashExpense: true};
    }
    if(this.isFromDepositSlip()) {
      return {fromDepositSlip: true};
    }
    return undefined;
  }

  private onScrollToEnd(): void {
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(
          this.page + 1,
          this.searchTerm,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            fromDepositSlip: this.isFromDepositSlip() ? true : undefined
          }
        )
        .subscribe({
          next: (res) => {
            this.page += 1;
            res.data.forEach((item: IBankDropdown) => {
              this.bankAccounts.push(item);
            });
          },
          error: (err) => {
            if (err.status === 403) this.showPermissionDeniedMessage.set(true);
          }
        })
    );
  }

  private autoPopulate(): void {
    const payload = this.dataTableService.dataTablePayload;
    if (
      payload?.filterModel?.bank_account_nick_name &&
      this.fieldName === 'bank_account_nick_name'
    ) {
      this.displayLabel = payload.filterModel.bank_account_nick_name.filter;
      this.hasSelection = true;
    }
  }

  private listenForCellFilter(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if ((res?.field === 'bank' || res?.isBank) && res.filter) {
          const matchedBank = this.bankAccounts.find(
            (b) => b.nickName === res.filter || b.name === res.filter
          );
          if (matchedBank) {
            this.selectOption(matchedBank);
          } else {
            this.displayLabel = res.filter;
            this.hasSelection = true;
            this.v3DataTableService.defaultPayload.filterModel[this.fieldName] =
              {
                filter: res.filter,
                filterType: 'text',
                type: 'contains'
              };
            this.v3DataTableService.refreshV3DataTable();
          }
        }
      })
    );
  }

  private listenForNewBank(): void {
    this.subscriptions.push(
      this.sharedService.getNewBankCreatedData().subscribe((result) => {
        if (!result) {
          return;
        }
        this.loadBankAccounts();
        if (result.bankAccountName) {
          this.displayLabel = result.bankAccountName;
          this.hasSelection = true;
        }
      })
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimeout);
    this.sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
