import { Component, DestroyRef, HostBinding, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { IStatus } from 'src/app/models/wallet';
import { WalletDataService } from 'src/app/modules/wallet/wallet-v3/services/wallet-data.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v4-wallet-transaction-type-floating-filter',
  templateUrl: './v4-wallet-transaction-type-floating-filter.component.html',
  standalone: true,
  imports: [NgClass, OverlayModule, LucideAngularModule]
})
export class V4WalletTransactionTypeFloatingFilterComponent {
  @HostBinding('class') hostClass = 'w-full';

  public walletDataService = inject(WalletDataService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  params: IFloatingFilterParams;
  isOpen = false;
  hasSelection = false;
  displayText = '';
  selectedItem: IStatus | null = null;

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

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.walletDataService.getWalletTransactionTypes();
    this.listenForCellFilter();
  }

  onParentModelChanged(): void {}

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  isSelected(item: IStatus): boolean {
    return this.selectedItem?.subject_type === item.subject_type;
  }

  selectItem(item: IStatus | null): void {
    if (item === null) {
      this.clear();
      return;
    }
    this.selectedItem = item;
    this.hasSelection = true;
    this.displayText = item.name;
    this.isOpen = false;

    this.v3DataTableService.defaultPayload.filterModel.subject_type = {
      filter: item.subject_type,
      filterType: 'text',
      type: 'equals'
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    this.selectedItem = null;
    this.hasSelection = false;
    this.displayText = '';
    this.isOpen = false;
    delete this.v3DataTableService.defaultPayload.filterModel?.subject_type;
    this.v3DataTableService.gridApi?.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  private listenForCellFilter(): void {
    this.cellValue$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.field === 'subject_type_short_name' && res?.filter) {
          const match = this.walletDataService.walletTransactionTypes.find(
            (t) => t.name === res.filter
          );
          if (match) {
            this.selectItem(match);
          }
        }
      });
  }
}
