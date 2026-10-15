import { Component, OnDestroy, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Subscription } from 'rxjs';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { faEye, faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IDocumentMailDataTableRowData } from '../../models/document-mail.model';
import { DocumentMailService } from '../../services/document-mail.service';
import { DocumentMailStatementModalComponent } from '../document-mail-statement-modal/document-mail-statement-modal.component';

@Component({
  selector: 'app-document-mail-table-action',
  styles: `
.reset-color {
  color: var(--eye-button-color);
}

.set-icon-size {
  font-size: 19px;
}
  `,
  template: `
  <div class="flex items-center justify-center gap-3 p-4 h-full">
    <a [href]="params.data?.document" target="_blank" class="reset-color cursor-pointer">
      <fa-icon [icon]="faEye" class="text-sm w-5 h-5 reset-color"></fa-icon>
    </a>
    <button
      class="w-full h-full flex items-center justify-center"
      mat-button
      [matMenuTriggerFor]="menu"
    >
      <fa-icon [icon]="faEllipsisVertical" class="set-icon-size reset-color"></fa-icon>
    </button>
    <mat-menu #menu="matMenu">
      <button mat-menu-item (click)="getStatement()">Statement</button>
      <button
        [disabled]="params.data?.status !== 3 && params.data?.status !== 4"
        mat-menu-item
        (click)="getTrackDetails()"
      >
        Tracking Details
      </button>
    </mat-menu> 
  </div> `,
  standalone: true,
  imports: [MatMenuTrigger, MatMenu, MatMenuItem, FaIconComponent]
})
export class DocumentMailTableActionComponent
  implements ICellRendererAngularComp, OnDestroy
{
  private matDialog = inject(MatDialog);
  private documentMailService = inject(DocumentMailService);
  private checkService = inject(CheckService);

  params: ICellRendererParams<IDocumentMailDataTableRowData>;
  subscription: Subscription[] = [];

  faEye = faEye;
  faEllipsisVertical = faEllipsisVertical;
  /**
   * Mandatory - Params for rendering this component.
   */
  agInit(params: ICellRendererParams<IDocumentMailDataTableRowData>) {
    this.params = params;
  }

  /**
   * Getting the staement of the current row document.
   */
  getStatement() {
    this.subscription.push(
      this.documentMailService
        .getStatement(this.params.data?.id as string)
        .subscribe((res) => {
          this.matDialog.open(DocumentMailStatementModalComponent, {
            width: '650px',
            disableClose: true,
            data: {
              statements: res
            }
          });
        })
    );
  }

  /**
   * @description Getting the mail track details of current row document.
   */
  getTrackDetails() {
    this.subscription.push(
      this.documentMailService
        .getMailTrack(this.params.data?.id as string)
        .subscribe((res) => {
          if (res.success) {
            if (res.data.trackingData.success) {
              this.checkService.openTrackingModal(
                res.data,
                'mail-doc',
                this.params.data?.id as string
              );
            } else if (res.data.trackingUrl) {
              window.open(res.data.trackingUrl, '_blank');
            }
          }
        })
    );
  }

  /**
   * Get the cell to refresh. Return true if successful. Return false if not (or you don't have refresh logic),
   * then the grid will refresh the cell for you.
   */
  refresh(_: ICellRendererParams<IDocumentMailDataTableRowData>): boolean {
    return true;
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
