import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { ICheckListTableRowData } from 'src/app/modules/check/model/check';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4CheckActivityModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-activity-modal/v4-check-activity-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-v4-custom-check-report-action',
  standalone: true,
  imports: [LucideAngularModule, MatMenuModule, MatTooltipModule],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
        matTooltip="Options"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="v4-action-icon"
        ></lucide-icon>
      </button>
      <button
        class="action-icon-btn"
        (click)="onEyeClick(); $event.stopPropagation()"
        matTooltip="View Details"
      >
        <lucide-icon
          name="eye"
          [size]="16"
          class="v4-action-icon"
        ></lucide-icon>
      </button>
    </div>

    <mat-menu #menu="matMenu" class="v4-action-menu">
      <div class="v4-menu-group-label">DOCUMENTS</div>
      <button
        mat-menu-item
        (click)="openCommentModal(); $event.stopPropagation()"
      >
        <div class="v4-menu-item">
          <lucide-icon name="message-square" [size]="16"></lucide-icon>
          <span>Add Comment</span>
        </div>
      </button>
      <button
        mat-menu-item
        (click)="openAttachmentModal(); $event.stopPropagation()"
      >
        <div class="v4-menu-item">
          <lucide-icon name="paperclip" [size]="16"></lucide-icon>
          <span>Add Attachment</span>
        </div>
      </button>
      <button
        mat-menu-item
        (click)="openActivityModal(); $event.stopPropagation()"
      >
        <div class="v4-menu-item">
          <lucide-icon name="activity" [size]="16"></lucide-icon>
          <span>Check Activity</span>
        </div>
      </button>
    </mat-menu>
  `
})
export class V4CustomCheckReportActionComponent
  implements ICellRendererAngularComp
{
  private detailPanelService = inject(V4DetailPanelService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);

  private params: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }

  onEyeClick(): void {
    if (!this.params.data) return;
    this.detailPanelService.openCheck(
      this.params.data as ICheckListTableRowData
    );
  }

  openCommentModal(): void {
    const checkId = this.params.data?.id;
    if (!checkId) return;

    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: checkId,
        type: 'checks',
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  openAttachmentModal(): void {
    const checkId = this.params.data?.id;
    if (!checkId) return;

    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { id: checkId }
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  openActivityModal(): void {
    const checkId = this.params.data?.id;
    if (!checkId) return;

    this.dialog.open(V4CheckActivityModalComponent, {
      width: '100%',
      maxWidth: '750px',
      height: '70vh',
      panelClass: 'paddingless-modal-rounded',
      data: checkId
    });
  }
}
