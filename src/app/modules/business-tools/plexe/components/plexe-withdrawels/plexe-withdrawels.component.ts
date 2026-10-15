import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Component, Input, OnDestroy } from '@angular/core';
import {
  ICellRendererParams,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  RowModelType
} from '@ag-grid-community/core';
import { CustomToolTipCellRendererComponent } from '../plexe-data-table';
import { IWithdrawList } from 'src/app/modules/business-tools/plexe/model/plexe';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-plexe-withdrawels',
  templateUrl: './plexe-withdrawels.component.html',
  styleUrls: ['./plexe-withdrawels.component.scss'],
  standalone: true,
  imports: [NgClass, NgIf]
})
export class PlexeWithdrawelsComponent implements OnDestroy {
  @Input() applicationId: string;
  subscriptions: Subscription[] = [];
  rowData: IWithdrawList[] = [];
  public rowModelType: RowModelType = 'serverSide';
  isLoading = false;
  defaultColDef = {
    resizable: true
  };

  columnDefs = [
    { field: 'lastRepaymentDate', width: 185 },
    { field: 'amount', width: 185 },
    {
      field: 'name',
      headerName: 'Details',
      width: 400,
      cellRendererFramework: CustomToolTipCellRendererComponent
    }
  ];

  constructor(private _plexeService: PlexeService) {}

  /**
   * @description Get Rows.
   *
   */
  onGridReady(params: ICellRendererParams) {
    const datasource: IServerSideDatasource = {
      getRows: (params) => {
        this.getPlexeWithdrawels(
          params?.request?.startRow ? params.request.startRow : 0,
          100,
          params
        );
      }
    };
    params.api.setServerSideDatasource(datasource);
  }

  /**
   * @description Get plexe withdrawels details.
   *
   */
  getPlexeWithdrawels(
    skip: number,
    take: number,
    params: IServerSideGetRowsParams
  ): void {
    this.isLoading = true;
    this.subscriptions.push(
      this._plexeService
        .getPlexeWithdrawels(this.applicationId, skip, take)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          params.api.hideOverlay();
          if (res?.success) {
            if (res?.data?.count === 0) {
              params.api.showNoRowsOverlay();
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
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
