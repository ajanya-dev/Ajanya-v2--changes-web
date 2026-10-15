import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { IDocumentMailDataFilesTableRowData } from '../../../models/document-mail.model';
import { DocumentMailService } from '../../../services/document-mail.service';
import { V4DocumentMailModalComponent } from '../../../components/v4-document-mail-modal/v4-document-mail-modal.component';
import { DocumentEditModalV4Component } from '../../modals/document-edit-modal-v4/document-edit-modal-v4.component';

@Component({
  selector: 'app-document-mail-files-table-action-v4',
  standalone: true,
  imports: [MatMenuTrigger, MatMenu, MatMenuItem, MatTooltip, LucideAngularModule],
  templateUrl: './document-mail-files-table-action-v4.component.html',
  styleUrl: './document-mail-files-table-action-v4.component.scss'
})
export class DocumentMailFilesTableActionV4Component implements ICellRendererAngularComp {
  private matDialog = inject(MatDialog);
  private documentMailService = inject(DocumentMailService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  params!: ICellRendererParams<IDocumentMailDataFilesTableRowData>;

  agInit(params: ICellRendererParams<IDocumentMailDataFilesTableRowData>): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams<IDocumentMailDataFilesTableRowData>): boolean {
    return true;
  }

  onView(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = this.params as any;
    if (p.onViewClick && this.params.data) {
      p.onViewClick(this.params.data);
    }
  }

  onEdit(): void {
    this.matDialog
      .open(DocumentEditModalV4Component, {
        width: '510px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: false,
        autoFocus: false,
        data: {
          id: this.params.data?.id,
          title: this.params.data?.document_title,
          fileName: this.params.data?.document_name,
          url: this.params.data?.document_url
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.v3DataTableService.refreshV3DataTable();
      });
  }

  onMail(): void {
    this.matDialog
      .open(V4DocumentMailModalComponent, {
        disableClose: true,
        width: '1200px',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          type: 'normal',
          documents: [this.params.data]
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.status) this.v3DataTableService.refreshV3DataTable();
      });
  }

  onDownload(): void {
    this.documentMailService
      .downloadDocument(this.params.data?.id ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val.success) {
          window.open(val.data.file_url, '_blank');
        }
      });
  }

  onAddComment(): void {
    this.matDialog
      .open(V4AddCommentCommonModalComponent, {
        width: '750px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        autoFocus: false,
        data: {
          type: 'document-mailing',
          id: this.params.data?.id,
          enableDelete: true
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.refresh) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.params as any).onCommentAdded?.();
        }
      });
  }

  async onDelete(): Promise<void> {
    const confirmed = await firstValueFrom(
      this.alertService.confirmAlert({ content: 'Are you sure you want to delete?' }).afterClosed()
    );
    if (confirmed) {
      this.documentMailService
        .deleteDocument(this.params.data?.id ?? '')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((val) => {
          if (val.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Document deleted successfully',
              timeout: 2000,
              close: true
            });
            this.v3DataTableService.refreshV3DataTable();
          }
        });
    }
  }
}
