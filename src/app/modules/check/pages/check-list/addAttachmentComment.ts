import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgStyle, NgClass, TitleCasePipe } from '@angular/common';
import {
  faFilterList,
  faMessageExclamation,
  faPaperclip
} from '@fortawesome/pro-solid-svg-icons';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { CheckAddAttachmentCommonModalComponent } from '../../modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from '../../modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import {
  checkStatus,
  statusCodesWithFilter
} from '../../components/methods/check-methods';

interface IExtendedCellRendererParams extends ICellRendererParams {
  showFilter?: boolean;
}

@Component({
  selector: 'app-dt-attachment',
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      @if (
        isLegalEnabled && statusIcon?.reprint === 1 && status.statusValue === 1
      ) {
        <span>Re-printed</span>
      } @else {
        <div
          role="presentation"
          [style.color]="statusColor"
          [title]="statusDescription"
          [ngClass]="{
            'cursor-pointer text-common-blue-color':
              trackingCode !== null && trackingCode !== ''
          }"
          (click)="getCheckTrackingUrls()"
        >
          {{ statusName }}
        </div>
      }
      @if (statusIcon?.comment === 1) {
        <fa-icon
          (click)="addComment()"
          class="text-common-blue-color cursor-pointer"
          [icon]="faMessageExclamation"
        ></fa-icon>
      }
      @if (statusIcon?.attachment === 1) {
        <fa-icon
          (click)="addAttachment()"
          class="text-common-red-color cursor-pointer"
          [icon]="faPaperclip"
        ></fa-icon>
      }
      @if (
        showFilterIcon &&
        statuscode.includes(params.data.cheque_status) &&
        params.showFilter
      ) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `,
  styles: [
    `
      .comment {
        height: 14px;
        display: inline;
        fill: var(--eye-button-color);
        font-size: 15px;
        margin-left: 5px;
        text-decoration: none;
        cursor: pointer;
      }

      .attachment {
        height: 14px;
        display: inline;
        fill: #fb084b;
        font-size: 15px;
        margin-left: 5px;
        text-decoration: none;
        cursor: pointer;
      }

      .software_type {
        font-size: 10px;
        color: #6b778c;
      }
    `
  ],
  standalone: true,
  imports: [
    NgStyle,
    NgClass,
    FaIconComponent,
    CommonFilterIconComponent,
    TitleCasePipe
  ]
})
export class CheckAddAttachmentCommentComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dataTableService = inject(DataTableService);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  public dialog = inject(MatDialog);

  params: IExtendedCellRendererParams;
  attachCommentList: IDtAttachComntArray[] | undefined;
  cellRendererCheckStatus: Record<string, ICheckStatus> = {};
  subscriptions: Subscription[] = [];
  statusName: string;
  statusDescription: string;
  statusIcon: IDtAttachComntArray | undefined;
  statusColor: string;
  trackingCode: string;
  softwareType: string;
  isLegalEnabled: boolean;
  status: ICheckStatus;
  showFilterIcon = false;
  faFilterList = faFilterList;
  faMessageExclamation = faMessageExclamation;
  faPaperclip = faPaperclip;
  checkstatusList = statusCodesWithFilter;
  statuscode = checkStatus;

  ngOnInit(): void {
    this.getStatus();
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  agInit(params: IExtendedCellRendererParams): void {
    this.params = params;

    this.getStatus();
    this.getAttachmentStatus();
    this.loadedHeaderDataAndProcess();
    this.trackingCode = params.data.trackingCode;
    if (this.cellRendererCheckStatus) {
      this.status = this.cellRendererCheckStatus[params?.data.cheque_status];
      if (params?.data.cheque_status === 7) {
        const status =
          this.cellRendererCheckStatus[params?.data.cheque_status]
            ?.statusShortDescription;
        this.statusDescription = `${this.cellRendererCheckStatus[
          params?.data?.cheque_status
        ]?.statusFullDescription} ( ${params?.data.mailedUsing} )`;
        this.statusName = this.customStatus(status);
      } else {
        const status =
          this.cellRendererCheckStatus[params?.data.cheque_status]
            ?.statusShortDescription;
        this.statusDescription =
          this.cellRendererCheckStatus[params?.data?.cheque_status]
            ?.statusFullDescription;
        this.statusColor =
          this.cellRendererCheckStatus[params?.data.cheque_status]?.color;
          this.statusName = params.data?.cheque_status === 807 ?  status : this.customStatus(status);
      }
      if (
        params.data?.is_voided_scheduled_check === true &&
        params?.data?.cheque_status === 2
      ) {
        this.statusName = 'Mail Scheduled-Void';
      }
    }

    this.statusIcon = this.attachCommentList?.filter(
      (res) => res?.id === params.data?.id
    )[0];

    if (this.params.data.software_type != null) {
      this.softwareType = this.params.data.software_type;
    }

    // HERE THE ACTION COMPONENT HIDE CODE

    //  - - - - - - - - - -

    if (
      ((params.data?.bank_specialization_id == null ||
        params.data?.bank_specialization_id === 0 ||
        params.data?.bank_specialization_id === '') &&
        params.data?.qb_transaction_id > 1) ||
      (params.data?.third_party === 1 &&
        (params.data?.bank_specialization_id === 0 ||
          params.data?.bank_specialization_id == null ||
          params.data?.bank_specialization_id === ''))
    ) {
      const actionView = {
        actionButton: false,
        eyeButton: false,
        dangerButton: true
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

  loadedHeaderDataAndProcess() {
    // eslint-disable-next-line no-underscore-dangle
    const headerSubscription = this.headerService._headerData.subscribe(
      (headerData) => {
        if (headerData) {
          if (headerData.personalInfo?.isLegalEnabled) {
            this.isLegalEnabled = true;
          }
          setTimeout(() => {
            headerSubscription.unsubscribe();
          }, 0);
        }
      }
    );
  }

  addAttachment() {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: { id: this.params.data.id }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) this.dataTableService.setRefreshStatus(true);
    });
  }

  addComment() {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: { id: this.params.data.id }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) this.dataTableService.setRefreshStatus(true);
    });
  }

  getStatus() {
    if (this.localStorageService.getItem('check_status') != null) {
      const status = this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatus = status;
      return;
    }

    this.subscriptions.push(
      this.checkService.getCheckStatus().subscribe((res) => {
        if (res.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
        }
      })
    );
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList = res;
      })
    );
  }

  /**
   * @description Get check tracking details.
   */
  getCheckTrackingUrls() {
    if (
      !this.checkService.isLoading &&
      this.trackingCode !== null &&
      this.trackingCode !== ''
    ) {
      this.checkService.getCheckTrackingUrls(this.params.data.id);
    }
  }

  /**
   * @description Triggered when a cell filter is clicked.
   */
  onFilterClicked(): void {
    const selectedStatusValue = this.getKeyForStatusCode(
      this.params.data.cheque_status
    );
    const cellValue = {
      filter: selectedStatusValue as string,
      field: this.params.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  /**
   * @description Retrieves the key (filter name) corresponding to a given check status code.
   * @param {number} statusCode - The check status code for which the filter name is to be retrieved.
   * @returns {string | null} The filter name corresponding to the provided status code, or null if not found.
   */
  getKeyForStatusCode(statusCode: number): string | null {
    const entry = Object.entries(this.checkstatusList).find(([_, codes]) =>
      codes.includes(statusCode)
    );
    return entry ? entry[0] : null;
  }

  customStatus(value: string) {
    if (!value) return '';

    // Split the string by hyphens, underscores, or spaces
    const words = value.split(/[-_\s]+/);

    return words
      .map((word, index) => {
        // Check if the word is 'dd' (case insensitive)
        if (word.toLowerCase() === 'dd' || word.toLowerCase() === 'ddw') {
          return word.toUpperCase();
        }
        // For words after 'dd', capitalize only the first letter
        if (index > 0 && words[index - 1].toLowerCase() === 'dd') {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        // For all other words, apply title case

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('-');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.checkService.unSubscribe();
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}
