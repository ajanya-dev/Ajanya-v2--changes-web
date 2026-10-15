import {
  Component,
  OnDestroy,
  OnInit,
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
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

@Component({
  selector: 'app-dt-attachment',
  template: `
    <div
      class="flex gap-1 items-center w-full"
       (mouseenter)="showFilterIconForRow(true)"
(mouseleave)="showFilterIconForRow()"
    >
      <span
        [style]="statusName?.style"
        [title]="statusName?.title ? statusName?.title : ''"
        >{{ statusName.name }}</span
      >
      @if (statusIcon()?.attachment === 1) {
        <fa-icon
          role="presentation"
          [icon]="['fas', 'paperclip']"
          class="text-common-red-color cursor-pointer text-base ml-2"
          (click)="addAttachment()"
        ></fa-icon>
      }
      @if (statusIcon()?.comment === 1) {
        <fa-icon
          role="presentation"
          [icon]="['far', 'message-dots']"
          class="text-common-blue-color cursor-pointer text-base ml-2"
          (click)="addComment()"
        ></fa-icon>
      }
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  standalone: true,
  imports: [FaIconComponent, FontAwesomeModule,CommonFilterIconComponent]
})
export class CheckDraftAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  params: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  subscriptions: Subscription[] = [];
  statusName: { name: string; style: string; title: string };
  statusIcon: Signal<IDtAttachComntArray | undefined>; // IDtAttachComntArray | undefined;
  showFilterIcon = false;
  faFilterList = faFilterList;

  ngOnInit(): void {
    this.getAttachmentStatus();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh(): any {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getAttachmentStatus();
    this.statusName = this.getNames(params.data?.cheque_status);
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.action
      )[0];
      return statusIcon;
    });

    if (
      params.data?.received_type === 10 ||
      params.data?.received_type === 11 ||
      params.data?.received_type === 12
    ) {
      const actionView = {
        actionButton: false,
        eyeButton: false
      };
      this.dataTableService.setDataFromParent(
        undefined,
        undefined,
        undefined,
        actionView
      );
    } else {
      const actionView = {
        actionButton: true,
        eyeButton: true
      };
      this.dataTableService.setDataFromParent(
        undefined,
        undefined,
        undefined,
        actionView
      );
    }
  }

  getNames(id: number) {
    const obj = {} as { name: string; style: string; title: string };
    switch (id) {
      case 0:
        obj.name = 'New';
        obj.style = 'font-weight:bold';
        break;

      case 1:
        obj.name = 'Printed';
        obj.style = 'color:green';
        break;

      case 5:
        obj.name = 'PA';
        obj.style = 'color: #36a3f7';
        obj.title = 'Pending Email Authorization';

        break;

      case 6:
        obj.name = 'AV';
        obj.style = '';
        obj.title = 'Authorization Formed was viewed';

        break;

      case 7:
        obj.name = 'Approved';
        obj.style = 'color: #34bfa3';
        obj.title = 'Authorization Completed';

        break;

      case 8:
        obj.name = 'Rejected';
        obj.style = 'color:red';
        obj.title = 'Authorization Rejected';

        break;

      case 10:
        obj.name = 'DD Initiated';
        obj.style = '';
        obj.title = 'Direct Deposit Initiated';

        break;

      case 11:
        obj.name = 'DD Completed';
        obj.style = 'color:green';
        obj.title = 'Direct Deposit Completed';
        break;

      case 12:
        obj.name = 'DD Rejected';
        obj.style = 'color:red';
        obj.title =
          'Direct Deposit Failed.Click here eye button to see details. you may print and deposit.';

        break;
      case 13:
        obj.name = 'DD Returned';
        obj.style = 'color:red';
        obj.title =
          'Direct Deposit Returned .';
        break;

      case 15:
        obj.name = 'VOIDED';
        obj.style = 'color:red';
        obj.title = 'Voided when Payee bank account deleted';

        break;

      case 20:
        obj.name = 'Permission Needed';
        obj.style = 'color:red';
        obj.title = 'Recurred checkDraft permission needed';

        break;

      default:
        break;
    }

    return obj;
  }

  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.params.data.action,
        type: 'cheque-drafts'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
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
        id: this.params.data.action,
        type: 'cheque-drafts',
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
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

  onFilterClicked(): void {
    const status = Number(this.params?.data?.status);
    let filter = '';
    if (status === 0) {
      filter = 'New';
    } else if (status === 1) {
      filter = 'Printed';
    } else if (status === 5) {
      filter = 'PA';
    } else if (status === 7) {
      filter = 'Approved';
    } else if (status === 8) {
      filter = 'Rejected';
    } else if (status === 10) {
      filter = 'DD Initiated';
    } else if (status === 11) {
      filter = 'DD Completed';
    } else if (status === 12) {
      filter = 'DD Rejected';
    } else if (status === 15) {
      filter = 'Void';
    }
    const cellValue = {
      filter: filter as string,
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  showFilterIconForRow(show?:boolean){
    if(show){
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
