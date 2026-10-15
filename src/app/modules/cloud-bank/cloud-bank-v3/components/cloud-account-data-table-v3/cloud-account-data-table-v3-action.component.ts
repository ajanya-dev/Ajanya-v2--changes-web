import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, inject } from '@angular/core';
import { faDownload, faEye, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ICloudTransactionTableRow } from '../../model/giftcard';
import { CloudTransactionViewModalComponent } from '../cloud-transaction-view-modal/cloud-transaction-view-modal.component';
import { CloudListV35Service } from '../../services/cloud-list-v35.service';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-cloud-account-data-table-v3-action',
  template: `
    <div class="flex justify-center items-center gap-1">
      <fa-icon
        matTooltip="View Statement"
        (click)="view()"
        class="w-5 text-center h-fit cursor-pointer"
        [icon]="faEye"
      />
      <fa-icon
        matTooltip="Download Statement"
        (click)="download()"
        class="w-5 text-center h-fit cursor-pointer"
        [ngClass]="{
          'animate-spin': loading,
          'pointer-events-none':
            cloudListV35Service.selectedAccountSignal()?.accountStatus !==
            'ACTIVE'
        }"
        [icon]="loading ? faSpinner : faDownload"
      />
    </div>
  `,
  standalone: true,
  imports: [FaIconComponent, MatTooltip, NgClass]
})
export class CloudAccountDataTableV3ActionComponent
  implements ICellRendererAngularComp
{
  public cloudBankService = inject(CloudBankService);
  public cloudListV35Service = inject(CloudListV35Service);
  private dialog = inject(MatDialog);

  params?: ICellRendererParams<ICloudTransactionTableRow>;

  loading = false;

  faDownload = faDownload;
  faSpinner = faSpinner;
  faEye = faEye;

  agInit(params: ICellRendererParams<ICloudTransactionTableRow>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return true;
  }

  /**
   * Opening the transaction statement view component.
   */
  view() {
    this.dialog.open(CloudTransactionViewModalComponent, {
      width: '550px',
      disableClose: true,
      data: this.params?.data
    });
  }

  /**
   * Getting the file url and opens it in a new window.
   */
  download() {
    if (!(this.params?.data?.account_id && this.params.data.id)) return;
    this.loading = true;
    this.cloudBankService
      .getTransactionReport(
        this.params?.data?.account_id,
        this.params?.data?.id
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((val) => {
        if (val.success) {
          window.open(val.url, '_blank');
        }
      });
  }
}
