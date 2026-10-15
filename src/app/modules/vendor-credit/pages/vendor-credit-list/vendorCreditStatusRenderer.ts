import {
  Component,
  OnDestroy,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { IDtAttachComntArray } from '../../../data-table/model/datatable';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-vendor-credit-status',
  template: `
    <div class="wrapper">
      <span
        title="{{ statusName.name }}"
        class="ellipsis"
        [ngStyle]="statusName.style"
      >
        {{ statusName.name }}
      </span>

      @if (statusIcon()?.comment === 1) {
        <fa-icon
          class="comment"
          title="Comments"
          (click)="addComment()"
          [icon]="['far', 'message-dots']"
        >
        </fa-icon>
      }

      @if (statusIcon()?.attachment === 1) {
        <fa-icon
          class="attachment"
          title="Attachments"
          (click)="addAttachment()"
          [icon]="['far', 'paperclip']"
        >
        </fa-icon>
      }
    </div>
  `,
  styles: [
    `
      .wrapper {
        display: flex;
        align-items: center;
      }

      .ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .comment {
        height: 14px;
        flex-shrink: 0;
        display: inline;
        fill: #1754ff;
        font-size: 15px;
        margin-left: 5px;
        text-decoration: none;
        cursor: pointer;
      }

      .attachment {
        height: 14px;
        flex-shrink: 0;
        display: inline;
        fill: #fb084b;
        font-size: 15px;
        margin-left: 5px;
        text-decoration: none;
        cursor: pointer;
      }
    `
  ],
  standalone: true,
  imports: [NgStyle, FaIconComponent]
})
export class VendorCreditStatusRendererComponent
  implements ICellRendererAngularComp, OnDestroy
{
  params: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);

  subscriptions: Subscription[] = [];
  statusName: {
    name: string;
    style: { [key: string]: string | number };
  };

  statusIcon: Signal<IDtAttachComntArray | undefined>;
  attachmentStyle = {
    color: '#fb084b',
    'font-size': '17px',
    'margin-left': '2px',
    'text-decoration': 'none',
    cursor: 'pointer'
  };

  commentStyle = {
    color: '#1754ff',
    'font-size': '15px',
    'margin-left': '4px',
    'text-decoration': 'none',
    cursor: 'pointer'
  };

  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);

  refresh(): boolean {
    // this.params = params;
    // this.statusName = this.getValue(this.params.value);
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getAttachmentStatus();
    this.statusName = this.getValue(this.params.data.status);
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.action
      )[0];
      return statusIcon;
    });
  }

  getValue(value: string | number): any {
    let status = {};
    if (value === 1) {
      status = { name: 'New', style: { color: 'var(--small-modal-header)' } };
    } else if (value === 2) {
      status = {
        name: 'Completed',
        style: { color: 'var(--brand-color-lite)' }
      };
    } else if (value === 3) {
      status = { name: 'Void', style: { color: 'var(--text_danger_lite)' } };
    } else if (value === 4) {
      status = {
        name: 'Partially Paid',
        style: { color: 'var(--alert_warning_text)' }
      };
    } else if (value === 5) {
      status = {
        name: 'Mark as reconciled',
        style: { color: 'var(--brand-color-lite)' }
      };
    }
    return status;
  }

  addAttachment() {
    const dRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '93%',
      data: {
        id: this.params.data.action,
        type: 'vendor-credits'
      }
    });

    dRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  addComment() {
    const dRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '93%',
      data: {
        id: this.params.data.action,
        type: 'vendor-credits'
      }
    });

    dRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList.set(res);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
