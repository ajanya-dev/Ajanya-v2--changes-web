import {
  Component,
  OnInit,
  Signal,
  computed,
  inject,
  signal, OnDestroy
} from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { MatDialog } from '@angular/material/dialog';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { Subscription } from 'rxjs';
import { Params } from '@angular/router';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { IDtAttachComntArray } from '../../../data-table/model/datatable';

@Component({
  selector: 'app-dt-attachment',
  template: `
    <div
      class="flex"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <div>
        <span
          [title]="
            statusName?.statusFullDescription !== null
              ? statusName?.statusFullDescription
              : ''
          "
          style="color:{{ statusName?.color }}"
          >{{ statusName?.statusShortDescription
          }}<span>
            @if (statusIcon()?.attachment === 1) {
              <fa-icon
                role="presentation"
                [icon]="['fas', 'paperclip']"
                class="text-common-red-color cursor-pointer text-base ml-2"
                (click)="addAttachment($event)"
              ></fa-icon>
            }
            @if (statusIcon()?.comment === 1) {
              <fa-icon
                role="presentation"
                [icon]="['far', 'message-dots']"
                class="text-common-blue-color cursor-pointer text-base ml-2"
                (click)="addComment($event)"
              ></fa-icon>
            }
          </span>
        </span>
      </div>
      @if (showFilterIcon) {
        <app-common-filter-icon
          class="mt-1 ml-1"
          (filterEvent)="onFilterClicked()"
        />
      }
    </div>
  `,
  standalone: true,
  imports: [FontAwesomeModule, CommonFilterIconComponent]
})
export class RecievedChecksAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private v3DataTableService = inject(V3DataTableService);
  public dialog = inject(MatDialog);

  params: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  cellRendererRePymntsStatus: Params = {};
  subscriptions: Subscription[] = [];
  faFilterList = faFilterList;
  showFilterIcon = false;
  statusName: {
    statusShortDescription: string;
    color: string;
    statusFullDescription: string;
  };

  statusIcon: Signal<IDtAttachComntArray | undefined>; // IDtAttachComntArray | undefined;

  ngOnInit(): void {
    this.getStatus();
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
    // throw new Error('Method not implemented.');
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getStatus();
    this.getAttachmentStatus();
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.encrypted_id
      )[0];
      return statusIcon;
    });
  }

  /**
   * @description Render the status of an attachment and comment in the component.
   * @param params - The parameter containing the data for rendering the status
   */
  renderStatus(params: ICellRendererParams) {
    this.statusName =
      this.cellRendererRePymntsStatus?.[params.data?.received_type]?.[
        params.data?.status
      ];
    this.statusIcon = computed(() => {
      const statusIcon = this.attachCommentList()?.filter(
        (res) => res.id === params.data.encrypted_id
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

  /**
   * @description Open the modal dialog to add an attachment
   */
  addAttachment(event?: Event) {
    event?.stopPropagation();
    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      panelClass: 'v4_alert_wrapper',
      data: {
        id: this.params.data.encrypted_id,
        type: 'request-payments'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  /**
   * @description Open the modal dialog to add a comment
   */
  addComment(event?: Event) {
    event?.stopPropagation();
    const dialogRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      panelClass: 'v4_alert_wrapper',
      data: {
        id: this.params.data.encrypted_id,
        type: 'request-payments',
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  getStatus() {
    this.subscriptions.push(
      this.requestPaymentsService.getStatusArray().subscribe((res) => {
        this.cellRendererRePymntsStatus = res;
        if (Object.keys(res)?.length) {
          this.renderStatus(this.params);
        }
      })
    );
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList.set(res);
      })
    );
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: JSON.stringify(this.statusName),
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
