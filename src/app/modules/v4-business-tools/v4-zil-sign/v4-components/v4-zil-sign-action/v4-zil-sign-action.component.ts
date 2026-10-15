import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { take } from 'rxjs';
import { ZilSignService } from 'src/app/modules/business-tools/zil-sign/service/zil-sign.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4SignDocDetailPanelService } from '../../v4-services/v4-sign-doc-detail-panel.service';

interface IZilSignRow {
  uuid: string;
  status?: string;
  name?: string;
}

interface IZilSignAction {
  id: 'send' | 'delete';
  label: string;
  tooltip: string;
  icon: string;
  danger?: boolean;
}

@Component({
  selector: 'app-v4-zil-sign-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Icon order is kebab -> eye, the v4 View-column convention. -->
    <div class="flex items-center gap-1 h-full">
      <button
        type="button"
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        matTooltip="Actions"
        (click)="$event.stopPropagation()"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="v4-action-icon"
        ></lucide-icon>
      </button>

      <button
        type="button"
        class="action-icon-btn"
        matTooltip="View document"
        (click)="onViewClick(); $event.stopPropagation()"
      >
        <lucide-icon name="eye" [size]="16" class="v4-action-icon"></lucide-icon>
      </button>

      <mat-menu #menu="matMenu" class="v4-action-menu">
        <div class="v4-menu-group-label">ACTIONS</div>
        @for (item of visibleActions(); track item.id) {
          <button
            mat-menu-item
            [class.v4-menu-item-danger]="item.danger"
            [matTooltip]="item.tooltip"
            (click)="onActionClick(item.id)"
          >
            <div class="v4-menu-item">
              <lucide-icon [name]="item.icon" [size]="16"></lucide-icon>
              <span>{{ item.label }}</span>
            </div>
          </button>
        }
      </mat-menu>
    </div>
  `
})
export class V4ZilSignActionComponent implements AgRendererComponent {
  private router = inject(Router);
  private zilSignService = inject(ZilSignService);
  private alert = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private detailPanel = inject(V4SignDocDetailPanelService);

  row: IZilSignRow | null = null;

  visibleActions = (): IZilSignAction[] => {
    const actions: IZilSignAction[] = [];
    if (this.row?.status === 'pending') {
      actions.push({
        id: 'send',
        label: 'Send Now',
        tooltip: 'Send document for signing',
        icon: 'send'
      });
    }
    actions.push({
      id: 'delete',
      label: 'Delete',
      tooltip: 'Delete document',
      icon: 'trash-2',
      danger: true
    });
    return actions;
  };

  agInit(params: ICellRendererParams): void {
    this.row = (params.data as IZilSignRow) || null;
  }

  refresh(params: ICellRendererParams): boolean {
    this.row = (params.data as IZilSignRow) || null;
    return true;
  }

  onViewClick(): void {
    if (!this.row?.uuid) return;
    this.detailPanel.open(this.row.uuid);
  }

  onActionClick(id: IZilSignAction['id']): void {
    if (!this.row?.uuid) return;
    switch (id) {
      case 'send':
        this.sendNow();
        break;
      case 'delete':
        this.delete();
        break;
    }
  }

  private sendNow(): void {
    if (!this.row?.uuid) return;
    this.router.navigate([
      '/v4/manage/v4-business-tools/zil-sign/sign-pdf-viewer',
      this.row.uuid
    ]);
  }

  private delete(): void {
    if (!this.row?.uuid) return;
    this.alert
      .confirmAlert({
        title: 'Delete Document',
        content: 'Are you sure you want to delete this document?',
        doneMsg: 'Delete',
        cancelMsg: 'Cancel',
        icon: 'warn',
        isOk: true,
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || !this.row?.uuid) return;
        this.zilSignService
          .deleteDocument(this.row.uuid)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alert.successAlert({
                  content: 'Document deleted successfully'
                });
                this.v3DataTableService.refreshV3DataTable();
              }
            },
            error: (err) => {
              this.alert.failedAlert({
                content: err?.error?.message || 'Failed to delete document'
              });
            }
          });
      });
  }
}
