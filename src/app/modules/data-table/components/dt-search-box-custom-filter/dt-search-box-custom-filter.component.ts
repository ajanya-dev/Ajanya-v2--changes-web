import { Component } from '@angular/core';
import {
  FilterChangedEvent,
  IFloatingFilterParams
} from '@ag-grid-community/core';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dt-search-box-custom-filter',
  templateUrl: './dt-search-box-custom-filter.component.html',
  styleUrls: ['./dt-search-box-custom-filter.component.scss'],
  standalone: true,
  imports: [FormsModule]
})
export class DtSearchBoxCustomFilterComponent {
  onParentModelChanged(
    _parentModel: string,
    _filterChangedEvent?: FilterChangedEvent
  ): void {
    _parentModel;
    _filterChangedEvent;
  }

  params!: IFloatingFilterParams;
  currentValue!: string;
  cardClickedWalletName: string;

  clickEventSubscription: Subscription;

  constructor(private walletService: WalletService) {
    this.clickEventSubscription = this.walletService
      .getWalletAsPerID()
      .subscribe((res) => {
        this.filterChange(res);
      });
  }

  filterChange(walletName: string) {
    this.currentValue = walletName;

    if (this.currentValue == null) {
      // Remove the filter
      this.params.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }

    const filterMode = this.params.filterParams.colDef.filter;
    let mode: string;
    if (filterMode === 'agNumberColumnFilter') {
      mode = 'equals';
    } else {
      mode = 'contains';
    }

    this.params.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged(mode, this.currentValue);
    });
  }

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
  }

  getSearch(event: { keyCode: number }) {
    if (this.currentValue == null) {
      // Remove the filter
      this.params.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }
    if (event.keyCode === 13) {
      const filterMode = this.params.filterParams.colDef.filter;
      let mode: string;
      if (filterMode === 'agNumberColumnFilter') {
        mode = 'equals';
      } else {
        mode = 'contains';
      }

      this.params.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(mode, this.currentValue);
      });
    }
  }
}
