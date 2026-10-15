import { FormsModule } from '@angular/forms';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { closeOnOutsideScroll } from 'src/app/shared/utils/close-on-outside-scroll.util';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IStatus } from 'src/app/models/wallet';
import { Subscription } from 'rxjs';
import { IEvent } from 'src/app/modules/invoices/model/invoice';
import { WalletDataService } from 'src/app/modules/wallet/wallet-v3/services/wallet-data.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { IFloatingFilterParams } from '@ag-grid-community/core';

@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule],
  selector: 'app-dt-wallet-transactions-type',
  templateUrl: './dt-wallet-transactions-type.component.html',
  styleUrls: ['./dt-wallet-transactions-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DtWalletTransactionsTypeComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  public walletDataService = inject(WalletDataService);
  private dataTableService = inject(DataTableService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private removeScrollListener?: () => void;

  @ViewChild('ngSelect') select: NgSelectComponent;

  subscriptions: Subscription[] = [];
  walletTransactionTypes: IStatus[];
  currentValue: number;
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);
  param: IFloatingFilterParams;
  text: string;

  agInit(param: IFloatingFilterParams): void {
    this.param = param;
    this.walletTransactionTypes = [];
    this.walletDataService.getWalletTransactionTypes();
  }

  ngOnInit(): void {
    this.setCellFilter();
  }

  /**
   * @description Method for filtering wallet based on subject type
   * @param event -Wallet status
   */
  onChange(event: IEvent | number) {
    this.v3DataTableService.defaultPayload.filterModel.subject_type = {
      filter: event,
      filterType: 'text',
      type: 'equals'
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Method for clear wallet filter based on subject type
   */
  clear() {
    delete this.v3DataTableService.defaultPayload.filterModel.subject_type;
    this.v3DataTableService?.gridApi?.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Set filter when click cell filter icon.
   */
  setCellFilter(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (res?.field === 'subject_type_short_name' && res?.filter) {
          this.text = this.walletDataService.walletTransactionTypes.find(
            (data) => res.filter === data.name
          )?.name as string;
          this.currentValue =
            this.walletDataService.walletTransactionTypes.find(
              (data) => res.filter === data.name
            )?.subject_type as number;
          this.onChange(this.currentValue);
          this.cdr.detectChanges();
        }
      })
    );
  }

  onOpen(): void {
    this.removeScrollListener?.();
    this.removeScrollListener = closeOnOutsideScroll(this.ngZone, () =>
      this.select?.close()
    );
  }

  onClose(): void {
    this.removeScrollListener?.();
    this.removeScrollListener = undefined;
  }

  ngOnDestroy(): void {
    this.removeScrollListener?.();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
