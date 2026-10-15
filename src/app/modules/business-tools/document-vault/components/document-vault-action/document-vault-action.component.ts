import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faArrowDownToLine,
  faShare,
  faPen,
  faTrash,
  faCommentCheck,
  faEllipsisVertical,
  faUserCog
} from '@fortawesome/pro-solid-svg-icons';
import { finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { DocumentVaultService } from '../../services/document-vault.service';
import { EditFolderModalComponent } from '../../modals/edit-folder-modal/edit-folder-modal.component';
import { UserPermissionModalComponent } from '../../modals/user-permission-modal/user-permission-modal.component';
import { ShareFileModalComponent } from '../../modals/share-file-modal/share-file-modal.component';

interface IExtendedCellRenderer extends ICellRendererParams {
  folderId?: string;
  onItemDeleted?: () => void;
}
@Component({
  selector: 'app-document-vault-action',
  standalone: true,
  imports: [FaIconComponent, MatMenuTrigger, MatMenu, MatMenuItem],
  styles: [`
    .reset-color {
      color: var(--eye-button-color);
    }
    .set-icon-size {
      font-size: 19px;
    }
    .set-font-size {
      font-size: 13px;
    }
    ::ng-deep .mat-mdc-menu-panel {
      box-shadow: none !important;
    }
  `],
  template: `
    <div class="flex items-center gap-4">
      <button
        class="w-[20px]"
        mat-button
        [matMenuTriggerFor]="menu"
        [disabled]="loading()"
        (click)="$event.stopPropagation()"
      >
        @if (loading()) {
          <span class="loadingSpinner after:border-y-common-blue-color"></span>
        } @else {
          <fa-icon [icon]="faEllipsisVertical" class="set-icon-size reset-color"></fa-icon>
        }
      </button>
      <mat-menu #menu="matMenu">
        @for (action of visibleActions(); track action.id) {
          <button 
            mat-menu-item 
            [disabled]="loading()"
            (click)="onAction(action.action)" 
            class="reset-color set-font-size"
          >
            <fa-icon [icon]="action.icon" class="set-icon-size reset-color mr-2"></fa-icon>
            {{ action.name }}
          </button>
        }
      </mat-menu>
    </div>
  `
})
export class DocumentVaultActionComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private documentVaultService = inject(DocumentVaultService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);

  params!: IExtendedCellRenderer;
  
  // Font Awesome Icons
  faDownload = faArrowDownToLine;
  faShare = faShare;
  faPen = faPen;
  faTrash = faTrash;
  faCommentCheck = faCommentCheck;
  faEllipsisVertical = faEllipsisVertical;
  faUserCog = faUserCog;

  folderId = computed(() => this.params?.folderId);

  agInit(params: IExtendedCellRenderer): void {
    this.params = params;
  }

  actionButtons = [
    {
      name: 'Edit',
      id: 'edit',
      icon: faPen,
      action: 'edit',
      showForFile: true,
      showForFolder: true
    },
    {
      name: 'Share',
      id: 'share',
      icon: faShare,
      action: 'share',
      showForFile: true,
      showForFolder: true
    },
    {
      name: 'Download',
      id: 'download',
      icon: faArrowDownToLine,
      action: 'download',
      showForFile: true,
      showForFolder: false
    },
    {
      name: 'Add Comment',
      id: 'add-comment',
      icon: faCommentCheck,
      action: 'add-comment',
      showForFile: false,
      showForFolder: true
    },
    {
      name: 'Delete',
      id: 'delete',
      icon: faTrash,
      action: 'delete',
      showForFile: true,
      showForFolder: true
    },
    {
      name: 'User Permission',
      id: 'user-permission',
      icon: faUserCog,
      action: 'user-permission',
      showForFile: false,
      showForFolder: true
    }
  ];

  visibleActions() {
    const isFile = this.params.data?.type === 'file';
    const isFolderId = !!(this.folderId());
    
    return this.actionButtons.filter(action => {
      // Filter based on file/folder type
      if (isFile && !action.showForFile) return false;
      if (!isFile && !action.showForFolder) return false;
      
      // Hide "Add Comment" when inside a folder (only show for root folder)
      if (action.id === 'add-comment' && action.showForFolder && isFolderId) return false;
      
      return true;
    });
  }


  refresh(_: IExtendedCellRenderer): boolean {
    return true;
  }

  onAction(action: string): void {
    switch (action) {
      case 'download':
        this.download();
        break;
      case 'share':
        this.share();
        break;
      case 'edit':
        this.edit();
        break;
      case 'delete':
        this.delete();
        break;
      case 'add-comment':
        this.addComment();
        break;
      case 'user-permission':
        this.userPermission();
        break;
      default:
        break;
    }
  }

  /**
   * Downloads the file
   */
  download(): void {
    const item = this.params.data;
    if (!item || item.type !== 'file') return;

    this.loading.set(true);
    this.documentVaultService
      .downloadDocument(item.encrypted_id.toString())
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.url) {
            window.open(response.url, '_blank');
            this.alertService.successAlert({
              content: 'File downloaded successfully',
              doneMsg: 'OK'
            });
        }
      },
      error: (error) => {
        if (error.status === 403) {
          this.alertService.failedAlert({
            content: error.error.errorMsg || 'Access denied'
          });
        }
      }
    });
  }

  /**
   * Opens share modal for the file or folder
   */
  share(): void {
    const item = this.params.data;
    if (!item) return;

    const isFile = item.type === 'file';
    const dialogData = isFile
      ? { fileId: item.encrypted_id, type: 'file' as const }
      : { folderId: item.encrypted_id, type: 'folder' as const };

    const dialogRef = this.dialog.open(ShareFileModalComponent, {
      width: '490px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
      data: dialogData
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          this.alertService.successAlert({
            content: result.message || `${isFile ? 'File' : 'Folder'} shared successfully`,
            doneMsg: 'OK',
            isOk: true,
            isCancel: false
          });
        }
      });
  }

  /**
   * Opens edit modal for folder/file
   */
  edit(): void {
    const item = this.params.data;
    if (!item) return;

    const dialogRef = this.dialog.open(EditFolderModalComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
      data: { 
        id: item.encrypted_id, 
        currentName: item.name, 
        type: item.type,
        serial_number: item.serial_number 
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          this.alertService.successAlert({
            content: result.message || 'File renamed successfully',
            doneMsg: 'OK',
            isOk: true,
            isCancel: false
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  /**
   * Deletes the folder/file
   */
  delete():void {
    const item = this.params.data;
    if (!item) return;

    const confirmed =  this.alertService.confirmAlert({
        content: `Are you sure you want to delete "${item.name}"?`,
        doneMsg: 'Delete',
        cancelMsg: 'Cancel',
        isOk: true,
        isCancel: true
    });

    confirmed.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (!result) return;

      this.loading.set(true);
      this.documentVaultService
        .deleteItem(item.encrypted_id.toString())
        .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
              if (response.success) {
              this.alertService.successAlert({
                content: response.errorMsg || 'Item deleted successfully',
                doneMsg: 'OK',
                isOk: true,
                isCancel: false
              });
              this.v3DataTableService.refreshV3DataTable();
              // Notify parent component to refresh breadcrumbs
              if (this.params.onItemDeleted) {
                this.params.onItemDeleted();
              }
            }
          }
        });
    });
  }

  /**
   * Opens add comment modal
   */
  addComment(): void {
    const item = this.params.data;
    if (!item) return;

    this.dialog.open(AddCommentsModalComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
      data: { 
        id: item.encrypted_id, 
        type: 'document-vault',
        count: 0,
        existingData: [],
        enableDelete: true
      }
    });
  }

  /**
   * Opens user permission modal
   */
  userPermission(): void {
    const item = this.params.data;
    this.dialog.open(UserPermissionModalComponent, {
      width: '1070px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
      data: { folderId: item.encrypted_id }
    });
  }
}