import { Component, inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subject, takeUntil } from 'rxjs';
import { DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/document-mail-modal/document-mail-modal.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faEllipsisVertical, faEnvelope, faDownload } from '@fortawesome/pro-solid-svg-icons';
import { Router } from '@angular/router';
import { DocumentMailService } from 'src/app/modules/business-tools/document-mail/services/document-mail.service';

interface IDocumentMailHistoryRowData {
  id?: string;
  boxId?: number;
  document_title?: string;
  created_at?: string;
  status?: number;
  action?: string;
}

@Component({
  selector: 'app-document-mail-history-action',
  styles: `
    .reset-color {
      color: var(--eye-button-color);
    }

    .set-icon-size {
      font-size: 19px;
    }

    .set-font-size {
      font-size: 13px;
    }

    .send-btn {
      background-color: var(--primary-color);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .send-btn:hover {
      opacity: 0.9;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  template: `
    <div class="flex items-center gap-4">
      <!-- Send Button -->
      <button
        (click)="onSend(); $event.stopPropagation()"
        class="send-btn"
        [disabled]="params.data?.status === 4"
        [title]="params.data?.status === 4 ? 'Already sent' : 'Send mail'"
      >
        <fa-icon [icon]="faEnvelope" class="mr-1"></fa-icon>
        Send
      </button>

      <!-- View Button -->
      <button (click)="onView(); $event.stopPropagation()" class="reset-color">
        <fa-icon [icon]="faEye" class="text-sm w-5 h-5 reset-color"></fa-icon>
      </button>

      <!-- More Actions Menu -->
      <button
        class="w-[20px]"
        mat-button
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
      >
        <fa-icon [icon]="faEllipsisVertical" class="set-icon-size reset-color"></fa-icon>
      </button>
      <mat-menu #menu="matMenu">
        @for (action of actionButtons; track action.id) {
          <button mat-menu-item (click)="onAction(action.action)" class="reset-color set-font-size">
            <fa-icon [icon]="action.icon" class="w-4 h-4 reset-color mr-2"></fa-icon>
            {{ action.name }}
          </button>
        }
      </mat-menu>
    </div>
  `,
  standalone: true,
  imports: [MatMenuTrigger, MatMenu, MatMenuItem, FaIconComponent]
})
export class DocumentMailHistoryActionComponent
  implements ICellRendererAngularComp, OnDestroy
{
  private matDialog = inject(MatDialog);
  private documentMailService = inject(DocumentMailService);
  private alertService = inject(AlertService);
  public v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  faEye = faEye;
  faEllipsisVertical = faEllipsisVertical;
  faEnvelope = faEnvelope;
  faDownload = faDownload;

  params: ICellRendererParams<IDocumentMailHistoryRowData>;

  agInit(params: ICellRendererParams<IDocumentMailHistoryRowData>) {
    this.params = params;
  }

  actionButtons = [
    {
      name: 'Download',
      id: 'download',
      icon: faDownload,
      action: 'download'
    }
  ];

  onAction(action: string) {
    switch (action) {
      case 'download':
        this.download();
        break;
      default:
        break;
    }
  }

  /**
   * Opens the document mail modal to send the document
   */
  onSend() {
    if (this.params.data?.status === 4) {
      this.alertService.failedAlert({ content: 'This mail has already been sent' });
      return;
    }

    this.matDialog.open(DocumentMailModalComponent, {
      disableClose: true,
      width: '1200px',
      data: {
        type: 'normal',
        documents: [this.params.data]
      }
    });
  }

  /**
   * Downloads the document file
   */
  download() {
    this.documentMailService
      .downloadDocument(this.params.data?.id ?? '')
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val.success) {
          window.open(val.data.file_url, '_blank');
        }
      });
  }

  /**
   * Navigates to the document detail view
   */
  onView() {
    this.router.navigate([`/manage/business-tools/document-mail/view/${this.params.data?.id}`]);
  }

  refresh(_: ICellRendererParams<IDocumentMailHistoryRowData>): boolean {
    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
