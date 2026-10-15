import { Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MapBankAccountModalComponent } from '../../../modals/map-bank-account-modal/map-bank-account-modal.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-dt-attachment',
  template: `
    <span class="map">
      <div *ngIf="label">
        <a [class]="class" style="color : black" title="{{ title }}">{{
          label
        }}</a>
      </div>
      <div *ngIf="!label">
        <button
          class="map_bank"
          matTooltip="Map your bank account."
          (click)="openBankAccountMappingModal(params.data.id, params.data)"
        >
          Map Now
        </button>
      </div>
    </span>
  `,
  styles: [
    `
      .map {
        display: flex;
        align-items: center;
        /* background-color:red; */
        height: 100%;
      }

      .class {
        color: red;
      }
      .map_bank {
        background-color: var(--sky-blue-2);
        color: var(--common-font-color);
        border-radius: 5px;
        width: 90px;
        font-weight: 500;
        height: 24px;
        font-size: 12px;
        align-items: center;
        display: flex;
        justify-content: center;
      }
    `
  ],
  standalone: true,
  imports: [NgIf, MatTooltip]
})
export class mapImportQbComponent implements ICellRendererAngularComp {
  params!: any;
  label: any;
  title: any;

  class: any;

  subscriptions: Subscription[] = [];

  constructor(
    private _dataTableService: DataTableService,
    public dialog: MatDialog
  ) {}

  refresh(): boolean {
    return true;
    // throw new Error('Method not implemented.');
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.label = this.params?.data?.bankAccount;
  }

  openBankAccountMappingModal(id: string, data: any): void {
    const dialogRef = this.dialog.open(MapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: { qbId: id, data: data }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._dataTableService.setRefreshStatus(true);
      }
    });
  }
}
