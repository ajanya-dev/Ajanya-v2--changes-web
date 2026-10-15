import {
  Component,
  DestroyRef,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { Params } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

@Component({
  selector: 'app-received-status-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonFilterIconComponent],
  template: `
    <div
      class="flex items-center gap-1.5 h-full"
      (mouseenter)="showFilterIcon = true"
      (mouseleave)="showFilterIcon = false"
    >
      <span
        class="text-xs font-medium font-peridot"
        [title]="statusName?.statusFullDescription ?? ''"
        [style.color]="statusName?.color"
      >
        {{ statusName?.statusShortDescription }}
      </span>

      @if (statusIcon()?.attachment === 1) {
        <button
          class="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-v4-tertiary-background-color"
          (click)="addAttachment()"
        >
          <lucide-icon
            name="paperclip"
            [size]="14"
            class="text-v4-common-red-color cursor-pointer"
          />
        </button>
      }

      @if (statusIcon()?.comment === 1) {
        <button
          class="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-v4-tertiary-background-color"
          (click)="addComment()"
        >
          <lucide-icon
            name="message-square"
            [size]="14"
            class="text-v4-primary-brand-color cursor-pointer"
          />
        </button>
      }

      @if (showFilterIcon) {
        <app-common-filter-icon
          class="mt-0.5"
          (filterEvent)="onFilterClicked()"
        />
      }
    </div>
  `
})
export class ReceivedStatusV4Component implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  params!: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  cellRendererRePymntsStatus: Params = {};
  showFilterIcon = false;
  statusName?: {
    statusShortDescription: string;
    color: string;
    statusFullDescription: string;
  };

  statusIcon: Signal<IDtAttachComntArray | undefined> = signal(undefined);

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.getStatus();
    this.getAttachmentStatus();
    this.statusIcon = computed(() =>
      this.attachCommentList()?.find(
        (res) => res.id === params.data.encrypted_id
      )
    );
  }

  private renderStatus(params: ICellRendererParams): void {
    this.statusName =
      this.cellRendererRePymntsStatus?.[params.data?.received_type]?.[
        params.data?.status
      ];
    this.statusIcon = computed(() =>
      this.attachCommentList()?.find(
        (res) => res.id === params.data.encrypted_id
      )
    );
    const hideActions =
      params.data?.received_type === 10 ||
      params.data?.received_type === 11 ||
      params.data?.received_type === 12;
    this.dataTableService.setDataFromParent(undefined, undefined, undefined, {
      actionButton: !hideActions,
      eyeButton: !hideActions
    });
  }

  addAttachment(): void {
    this.dialog
      .open(V4AddAttachmentModalComponent, {
        width: '750px',
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: this.params.data.encrypted_id,
          type: 'request-payments'
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.isRefresh) {
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  addComment(): void {
    this.dialog
      .open(V4CheckAddCommentModalComponent, {
        maxWidth: '700px',
        panelClass: 'paddingless-modal-rounded',
        width: '93%',
        disableClose: true,
        data: {
          id: this.params.data.encrypted_id,
          type: 'request-payments',
          enableDelete: true
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.isRefresh) {
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  private getStatus(): void {
    this.requestPaymentsService
      .getStatusArray()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.cellRendererRePymntsStatus = res;
        if (Object.keys(res)?.length) {
          this.renderStatus(this.params);
        }
      });
  }

  private getAttachmentStatus(): void {
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.attachCommentList.set(res);
      });
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: JSON.stringify(this.statusName),
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }
}
