import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { Subject, takeUntil } from 'rxjs';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { faComment, faPaperclip } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

@Component({
  selector: 'app-dt-attachment',
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <div>
        <span class="flex gap-1">
          <a [class]="class" title="{{ title }}">{{ label }}</a>
          @if (statusIcon?.comment === 1) {
            <fa-icon
              class="text-common-blue-color cursor-pointer"
              (click)="addComment()"
              [icon]="faComment"
            />
          }
          @if (statusIcon?.attachment === 1) {
            <fa-icon
              class="text-common-blue-color cursor-pointer"
              (click)="addAttachment()"
              [icon]="faPaperclip"
            />
          }
        </span>
      </div>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [FaIconComponent, CommonFilterIconComponent]
})
export class CreditMemoAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);

  params?: ICellRendererParams;
  attachCommentList?: IDtAttachComntArray[];
  statusIcon: IDtAttachComntArray | undefined;
  showFilterIcon: boolean = false;
  faComment = faComment;
  faPaperclip = faPaperclip;
  destroy$ = new Subject();

  label: string;
  title: string;
  class: string;

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getAttachmentStatus();

    if (
      this.params.data.status === 1 &&
      this.params.data.balance === this.params.data.amount
    ) {
      this.label = 'New';
      this.title = 'new';
    } else if (this.params.data.status === 2) {
      this.label = 'Marked as Reconciled';
      this.title = 'Marked as Reconciled';
    } else if (this.params.data.status === 3) {
      this.label = 'Voided';
      this.title = 'voided';
    } else if (
      this.params.data.balance !== this.params.data.amount &&
      this.params.data.status !== 5
    ) {
      this.label = 'Partially Paid';
      this.title = 'Partially Paid';
    } else if (this.params.data.status === 5) {
      this.label = 'Completed';
      this.title = 'Completed';
    }
  }

  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.params?.data?.action,
        type: 'credit-memos'
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.refresh) {
          this.dataTableService.setRefreshStatus(true);
        }
      });
  }

  addComment() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.params?.data?.action,
        type: 'credit-memos',
        enableDelete: true
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.refresh) {
          this.dataTableService.setRefreshStatus(true);
        }
      });
  }

  getAttachmentStatus() {
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.attachCommentList = res;

        this.statusIcon = this.attachCommentList?.filter(
          (el) => el.id === this.params?.data?.action
        )[0];
      });
  }

  onFilterClicked(): void {
    let filterValue = this.label;
    if (this.label === 'Voided') {
      filterValue = 'Void';
    } else if (this.label === 'Marked as Reconciled') {
      filterValue = 'Mark as Completed';
    }
    if (this.params) {
      const cellValue = {
        filter: filterValue,
        field: this.params.colDef?.headerName as string,
        payee: undefined
      };
      this.dataTableService.selectedCellValueSignal.set(cellValue);
    }
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
