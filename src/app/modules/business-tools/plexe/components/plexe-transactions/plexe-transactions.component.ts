import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import {
  Component,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  ICellRendererParams,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  RowModelType
} from '@ag-grid-community/core';
import { ITransactionList } from 'src/app/modules/business-tools/plexe/model/plexe';
import { CustomToolTipCellRendererComponent } from '../plexe-data-table';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-plexe-transactions',
  templateUrl: './plexe-transactions.component.html',
  styleUrls: ['./plexe-transactions.component.scss'],
  standalone: true,
  imports: [NgClass, NgIf]
})
export class PlexeTransactionsComponent implements OnDestroy, OnChanges {
  @Input() applicationId: string;
  @Input() refresh: boolean;

  subscription: Subscription[] = [];
  rowData: ITransactionList[] = [];
  public rowModelType: RowModelType = 'serverSide';
  isLoading = false;
  takeValue: number;
  skipValue: number;
  paramsData: IServerSideGetRowsParams;
  defaultColDef = {
    resizable: true
  };

  columnDefs = [
    { field: 'date', headerName: 'Date', width: 150 },
    {
      field: 'description',
      headerName: 'Details',
      cellRendererFramework: CustomToolTipCellRendererComponent,
      width: 170
    },
    {
      field: 'debit',
      valueGetter: (params: ICellRendererParams) => {
        return params.data.isCredit ? '' : params.data.amount;
      },
      cellStyle: { color: 'red' },
      width: 150
    },
    {
      field: 'credit',
      valueGetter: (params: ICellRendererParams) => {
        return params.data.isCredit ? params.data.amount : '';
      },
      width: 150
    },
    { field: 'balance', cellStyle: { color: 'green' }, width: 150 }
  ];

  constructor(private _plexeService: PlexeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.refresh && this.takeValue === 100) {
      this.getPlexeTransactions(
        this.skipValue,
        this.takeValue,
        this.paramsData
      );
    }
  }

  /**
   * @description Get Rows.
   *
   */
  onGridReady(params: ICellRendererParams): void {
    const datasource: IServerSideDatasource = {
      getRows: (params) => {
        this.getPlexeTransactions(
          params?.request?.startRow ? params.request.startRow : 0,
          100,
          params
        );
      }
    };
    params.api.setServerSideDatasource(datasource);
  }

  /**
   * @description Get plexe transactions details.
   *
   */
  getPlexeTransactions(
    skip: number,
    take: number,
    params: IServerSideGetRowsParams
  ): void {
    this.takeValue = take;
    this.skipValue = skip;
    this.paramsData = params;
    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .getPlexeTransactions(this.applicationId, skip, take)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          params.api.hideOverlay();
          if (res?.success) {
            if (res?.data?.count == 0) {
              (this.rowData = res?.data?.rows), params.api.showNoRowsOverlay();
            } else {
              params.api.hideOverlay();
            }
            params.success({
              rowData: res?.data?.rows,
              rowCount: res?.data?.count
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
