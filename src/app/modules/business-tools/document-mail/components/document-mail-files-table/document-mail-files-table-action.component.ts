import { Component, inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { DocumentMailModalComponent } from '../document-mail-modal/document-mail-modal.component';
import { IDocumentMailDataFilesTableRowData } from '../../models/document-mail.model';
import { DocumentMailService } from '../../services/document-mail.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { MatIcon } from '@angular/material/icon';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faEllipsisVertical, faEnvelope, faDownload, faComment, faTrash, faEdit } from '@fortawesome/pro-solid-svg-icons';
import { Router } from '@angular/router';
import { DocumentEditModalComponent } from '../document-edit-modal/document-edit-modal.component';


@Component({
  selector: 'app-document-mail-table-action',
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
  `,
  template: `
    <div class="flex items-center gap-4">

    <button (click)="onView(); $event.stopPropagation()" class="reset-color">
      <fa-icon [icon]="faEye" class="text-sm w-5 h-5 reset-color"></fa-icon>
    </button>
  
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
        <button mat-menu-item (click)="onAction(action.action)" class="reset-color set-font-size" [disabled]="(action.action === 'delete' && params.data.status !== 0) || (action.action === 'edit' && params.data.status !== 0)">
        <fa-icon [icon]="action.icon" class="w-4 h-4 reset-color mr-2"></fa-icon>
        {{ action.name }}
        </button>
      }
    </mat-menu> 
    </div>`,
  standalone: true,
  imports: [MatMenuTrigger, MatMenu, MatMenuItem,MatIcon,FaIconComponent]
})
export class DocumentMailFilesTableActionComponent
  implements ICellRendererAngularComp, OnDestroy
{
  private matDialog = inject(MatDialog);
  private documentMailService = inject(DocumentMailService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  faEye = faEye;
  faEllipsisVertical = faEllipsisVertical;
  faEnvelope = faEnvelope;
  faDownload = faDownload;
  faComment = faComment;
  faTrash = faTrash;
  faEdit = faEdit;

  params: ICellRendererParams<IDocumentMailDataFilesTableRowData>;

  agInit(params: ICellRendererParams<IDocumentMailDataFilesTableRowData>) {
    this.params = params;
  }

  actionButtons = [
    {
      name: 'Edit',
      id: 'edit',
      icon: faEdit,
      action: 'edit'
    },
    {
      name: 'Mail',
      id: 'mail',
      icon: faEnvelope,
      action: 'mail'
    },  
    {
      name: 'Download',
      id: 'download',
      icon: faDownload,
      action: 'download'
    },
    {
      name: 'Add Comment',
      id: 'add-comment',
      icon: faComment,
      action: 'add-comment'
    },
    {
      name: 'Delete',
      id: 'delete',
      icon: faTrash,
      action: 'delete'
    }
  ];

  onAction(action: string) {
    switch (action) {
      case 'mail':
        this.onMail();
        break;
      case 'download':
        this.download();
        break;
      case 'add-comment':
        this.onAddComment();
        break;
      case 'delete':
        this.delete();
        break;
      case 'edit':
        this.edit();
        break;
      default:
        break;
    }
  }

  /**
   * opening the document mail modal with the row data.
   */
  onMail() {
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
   * deletes the file.
   */
  async delete() {
    const result = await firstValueFrom(
      this.alertService.confirmAlert({ content: 'Are you sure?' }).afterClosed()
    );
    if (result) {
      this.documentMailService
        .deleteDocument(this.params.data?.id ?? '')
        .pipe(takeUntil(this.destroy$))
        .subscribe((val) => {
          if (val.success) {
            this.alertService.successAlert({ content: 'Successfully Deleted' });
            this.v3DataTableService.refreshV3DataTable();
          }
        });
    }
  }

  edit(){
      this.matDialog.open(DocumentEditModalComponent, {
        disableClose: true,
        width: '650px',
        data:{
          id:this.params.data?.id,
          title:this.params.data?.document_title,
          fileName:this.params.data?.document_name,
          url:this.params.data?.document_url
        }
    });
  }

  /**
   * downloads the file
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

  onAddComment() {
    this.matDialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      data: {
        type: 'document-mailing',
        id: this.params.data?.id,
        count: 0,
        existingData: [],
        enableDelete: true
      }
    });
  }

  onView() {
    this.router.navigate([`/manage/business-tools/document-mail/view/${this.params.data?.id}`]);
  }

  refresh(_: ICellRendererParams<IDocumentMailDataFilesTableRowData>): boolean {
    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
