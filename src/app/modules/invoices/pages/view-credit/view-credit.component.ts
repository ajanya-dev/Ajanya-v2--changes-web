import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Params, ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, Subject, Subscription, of } from 'rxjs';
import { IApiResMesssage } from 'src/app/models/api';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { MatDialog } from '@angular/material/dialog';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { NgClass, NgOptimizedImage, CommonModule } from '@angular/common';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import {
  faArrowUpRightFromSquare,
  faEnvelope,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  IAttachmentsList,
  ICommentList,
  ICreditMemoData,
  ICreditMemoTransaction,
  ICreditViewData,
  ICreditViewItem
} from '../../model/invoice';
import { AddCreditMemoComponent } from '../../modals/add-credit-memo/add-credit-memo.component';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

type TOpenDialog = [
  {
    id: string;
    type: string;
    enableDelete?: boolean;
  },
  { refresh: boolean }
];

/**
 * Component for viewing credit data.
 *
 * @export
 * @class ViewCreditComponent
 * @implements {OnInit}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'app-view-credit',
  templateUrl: './view-credit.component.html',
  styleUrls: ['./view-credit.component.scss'],
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonBackButtonV35Component,
    OcwPreventMultiClickDirective,
    NgClass,
    FaIconComponent,
    MatTabGroup,
    MatTab,
    CommonButtonV35Component,
    NgOptimizedImage,
    CommonModule
  ]
})
export class ViewCreditComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  ViewList: ICreditViewData;
  viewtable: ICreditViewItem[] = [];
  attachmentsList: IAttachmentsList[] = [];
  commentsList: ICommentList[];
  data: string;
  rowFromGrid: ICreditMemoData | null = null;
  memo: string;
  status: number;
  disable = false;
  isUnVoid = false;
  isVoid = true;
  isDisableAllActions = true;
  err_msg: string;

  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private sharedService = inject(SharedService);
  destroy$ = new Subject<boolean>();

  isLoading = signal(false);
  isAttachmentLoading = signal(false);
  isCommentsLoading = signal(false);
  isVoidLoading = false;
  isDeleteLoading = false;
  isEditing = false;

  faTrash = faTrash;
  faArrowUp = faArrowUpRightFromSquare;
  faSpinner = faSpinner;
  faEnvelope = faEnvelope;

  /**
   * Creates an instance of ViewCreditComponent.
   *
   * @param {Router} router - The Angular router service.
   * @param {InvoiceService} _creditService - The credit service for fetching data.
   * @param {ActivatedRoute} activatedRoute - The activated route service.
   */
  constructor(
    private router: Router,
    private creditService: InvoiceService,
    public activatedRoute: ActivatedRoute
  ) {
    this.data = this.router.getCurrentNavigation()?.extras.state?.data;
    this.rowFromGrid =
      this.router.getCurrentNavigation()?.extras.state?.['row'] ?? null;
  }

  get transactions(): ICreditMemoTransaction[] {
    return this.rowFromGrid?.transactions ?? [];
  }

  /**
   * Lifecycle hook called after the component is initialized.
   */
  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((data: Params) => {
      this.data = data.id;
    });
    this.getData();
    this.getAttachments();
    this.getComments();
  }

  /**
   * Fetches credit data using the credit service.
   */
  getData() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.creditService
        .creditView(this.data)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res: { data: ICreditViewData }) => {
          this.ViewList = res.data;
          this.memo = res.data.memo;
          this.viewtable = res.data.items;
          this.status = res.data.status;
          this.isDisableAllActions = false;
          this.enableButtons();
        })
    );
  }

  /**
   * Fetches credit memos attachments.
   */
  getAttachments() {
    this.isAttachmentLoading.set(true);
    this.subscriptions.push(
      this.creditService
        .getCreditattachments(this.data)
        .pipe(finalize(() => this.isAttachmentLoading.set(false)))
        .subscribe((response: { data: IAttachmentsList[] }) => {
          this.attachmentsList = response.data;
        })
    );
  }

  /**
   * Fetches comments related to the credit memo.
   */
  getComments() {
    this.isCommentsLoading.set(true);
    this.subscriptions.push(
      this.creditService
        .getCreditComments(this.data)
        .pipe(finalize(() => this.isCommentsLoading.set(false)))
        .subscribe((response: { data: ICommentList[] }) => {
          this.commentsList = response.data;
        })
    );
  }

  /**
   * Method to activate Action buttons
   */
  enableButtons() {
    if (this.status === 2 || this.status === 5) {
      this.disable = true;
    } else if (this.status === 3) {
      this.isUnVoid = true;
      this.isVoid = false;
    } else if (this.status === 4) {
      this.isDisableAllActions = true;
    }
  }

  /**
   * Method for delete Credit Memo
   */
  deleteCreditMemo() {
    const confirmMessage = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alertService.confirmAlert(confirmMessage);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isDeleteLoading = true;
        this.subscriptions.push(
          this.creditService
            .deleteSingleCreditmemo(this.data)
            .pipe(
              finalize(() => {
                this.isDeleteLoading = false;
              }),
              catchError((error) => {
                this.err_msg = error.error.errorMsg;
                return of(false);
              })
            )
            .subscribe((res) => {
              const successMsg = {
                title: 'Success',
                content: 'Credit memo deleted ',
                timeout: 2000,
                close: true
              };
              if ((res as IApiResMesssage).success) {
                this.dataTableService.setRefreshStatus(true);
                this.router.navigate(['/manage/invoice/memo']);
                this.alertService.successAlert(successMsg);
              }
            })
        );
      }
    });
  }

  /**
   * Method for unVoid Credit Memo
   */
  unVoidCreditMemo() {
    const confirmMessage = {
      content: 'Are you Sure you want to unvoid?'
    };

    const confirm = this.alertService.confirmAlert(confirmMessage);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isVoidLoading = true;
        this.subscriptions.push(
          this.creditService
            .unvoidSingleCreditMemo(this.data)
            .pipe(
              finalize(() => {
                this.isVoidLoading = false;
              }),
              catchError(() => of(false))
            )
            .subscribe((res) => {
              const successMsg = {
                title: 'Success',
                content: 'Credit Memo Unvoided ',
                timeout: 2000,
                close: true
              };

              if ((res as IApiResMesssage).success) {
                this.isUnVoid = false;
                this.isVoid = true;
                this.dataTableService.setRefreshStatus(true);
                this.alertService.successAlert(successMsg);
              }
            })
        );
      }
    });
  }

  /**
   * Method for delete Credit Memo
   */
  voidCreditMemo() {
    const confirmMessage = {
      content: 'Are you sure you want to void?'
    };

    const confirm = this.alertService.confirmAlert(confirmMessage);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isVoidLoading = true;
        this.subscriptions.push(
          this.creditService
            .voidSingleCreditMemo(this.data)
            .pipe(
              finalize(() => {
                this.isVoidLoading = false;
              }),
              catchError((error) => {
                this.err_msg = error.error.errorMsg;
                return of(false);
              })
            )
            .subscribe((res) => {
              const successMsg = {
                title: 'Success',
                content: 'Credit Memo Voided ',
                timeout: 2000,
                close: true
              };

              if ((res as IApiResMesssage).success) {
                this.getData();
                this.dataTableService.setRefreshStatus(true);
                this.alertService.successAlert(successMsg);
              }
            })
        );
      }
    });
  }

  /**
   * Method for edit Credit Memo
   */
  editCreditMemo() {
    if (this.isEditing) {
      return;
    }
    this.isEditing = true;
    this.subscriptions.push(
      this.creditService
        .getSinglecreditmemo(this.data)
        .pipe(
          finalize(() => {
            this.isEditing = false;
          })
        )
        .subscribe((res) => {
          const editModal = this.dialog.open(AddCreditMemoComponent, {
            maxWidth: '1010px',
            width: '93%',
            data: res.data
          });

          editModal.afterClosed().subscribe(() => {
            this.getData();
          });
        })
    );
  }

  /**
   * Opens a modal for adding an attachment to a credit memo.
   */
  onAddAttachmentRow() {
    const dialogData = this.dialog.open<
      AddAttachmentModalComponent,
      TOpenDialog[0],
      TOpenDialog[1]
    >(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      data: {
        id: this.data,
        type: 'credit-memos'
      }
    });

    dialogData.afterClosed().subscribe(() => {
      this.getAttachments();
    });
  }

  /**
   * Opens a modal for adding a comment to a credit memo.
   */
  onAddCommentRow() {
    const dialogData = this.dialog.open<
      AddCommentsModalComponent,
      TOpenDialog[0],
      TOpenDialog[1]
    >(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      data: {
        id: this.data,
        type: 'credit-memos',
        enableDelete: true
      }
    });

    dialogData.afterClosed().subscribe(() => {
      this.getComments();
    });
  }

  /**
   * Deletes an attachment associated with the invoice.
   *
   * @param {string} attachmentId - The ID of the attachment to delete.
   */
  deleteAttachment(attachmentId: string) {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this attachment?',
      cancelMsg: 'No, cancel',
      doneMsg: 'Yes'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.sharedService
            .deleteAttachment('credit-memos', this.data, attachmentId)
            .subscribe((response) => {
              if (response?.success) {
                this.alertService.successAlert({});
                this.onDeleteSuccess(attachmentId);
              }
            })
        );
      }
    });
  }

  onDeleteSuccess(attachmentId: string) {
    this.attachmentsList = this.attachmentsList.filter(
      (ele) => ele.encrypted_id !== attachmentId
    );
  }

  /**
   * Lifecycle hook called before the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
