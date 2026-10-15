import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IComment, IGetAttachment, IGetComment } from 'src/app/models/common';
import {
  IMetaData,
  IReceiveCheckActivityLog,
  IReceiveCheckDetails,
  IRecurringMetaData,
  IReceivedCheckAccountDetails,
  IReceivePaymentsStatus
} from 'src/app/modules/receive-payments/model/ReceivePayment';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { FormsModule } from '@angular/forms';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import {
  faDownload,
  faEnvelope,
  faExternalLink,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  CommonModule,
  DatePipe,
  KeyValuePipe,
  NgClass,
  NgOptimizedImage
} from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IPodDetails } from 'src/app/modules/payments/model/payments';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { AcceptRequestComponent } from '../../modals/accept-request/accept-request.component';

/**
 * @description Component for displaying received checks and providing options to accept or reject
 */
@Component({
  selector: 'app-recieved-checks-show',
  styleUrls: ['./recieved-checks-show.component.scss'],
  templateUrl: './recieved-checks-show.component.html',
  standalone: true,
  imports: [
    FaIconComponent,
    NgClass,
    MatTabGroup,
    MatTab,
    FormsModule,
    KeyValuePipe,
    MatTooltip,
    DatePipe,
    CommonButtonV35Component,
    NgOptimizedImage,
    OcwBackButtonComponent,
    CommonModule
  ]
})
export class RecievedChecksShowComponent implements OnInit, OnDestroy {
  private requestPaymentsService = inject(RequestPaymentsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sharedService = inject(SharedService);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private dialog = inject(MatDialog);

  subscriptions: Subscription[] = [];
  data: IReceiveCheckDetails;
  statusArr: {
    [key: string]: {
      [key: string]: IReceivePaymentsStatus;
    };
  };

  id: string | null;
  isloading = false;
  isClick = false;
  activeLogs: IReceiveCheckActivityLog[] = [];
  commentList: IGetComment[] = [];
  comment = '';
  listData: IGetAttachment[] = [];
  link: string;
  metaData: IMetaData[];
  checkStatus: number;
  podDetails: IPodDetails[] = [];
  isDownload = signal(false);
  faDownload = faDownload;
  faSpinner = faSpinner;
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  selectedCommentId: string;
  selectedAttachmentId: string;
  recurringDetailssss: IRecurringMetaData;
  recurringDetails: { key: string; value: string | number }[];
  statusColor: string = '';
  statusText: string = '';
  isDataNotEmpty = false;
  accountDetails: IReceivedCheckAccountDetails;
  isLoadingActivityLogs = signal(false);
  isLoadingAttachment = signal(false);
  isLoadingComment = signal(false);
  isDeleteComment = signal(false);
  isDeleteAttachment = signal(false);
  isLoadingPod = signal(false);
  isAccept = signal(false);
  isReject = signal(false);
  isPrinting = signal(false);
  isDdInitiated = signal(false);
  showAcceptBtn = signal(false);
  showRejectBtn = signal(false);
  faTrash = faTrash;
  faEnvelope = faEnvelope;
  faExternalLink = faExternalLink;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.getCheckData(this.id as string);
    this.getActiveLogs(this.id as string);
  }

  /**
   * @description Retrieve check data for a specific check ID
   * @param id - The ID of the check to retrieve the data for .
   */
  getCheckData(id: string) {
    this.isLoadingComment.set(true);
    this.isLoadingAttachment.set(true);
    this.subscriptions.push(
      this.requestPaymentsService.getCheckView(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.data = res.data;
            this.checkStatus = res?.data.status;
            // Parse and convert metadata to array of IMetaData
            if (res.data.metaData) {
              try {
                let parsedMetaData;
                
                // If it's a string, try to parse it as JSON
                if (typeof res.data.metaData === 'string') {
                  parsedMetaData = JSON.parse(res.data.metaData);
                } else if (typeof res.data.metaData === 'object' && !Array.isArray(res.data.metaData)) {
                  // If it's already an object, use it directly
                  parsedMetaData = res.data.metaData;
                } else {
                  // If it's already an array, use as is
                  this.metaData = res.data.metaData;
                  return;
                }
                
                // Convert object to array of IMetaData: [{ metaData: { [key: string]: string } }]
                this.metaData = [{ metaData: parsedMetaData }];
              } catch (error) {
                this.metaData = [];
              }
            } else {
              this.metaData = [];
            }
            this.accountDetails = res.data.account_details;
            this.getStatus();
            this.getComments();
            this.getAttachment();
            this.getPodAttachemmnts(res.data.chequeId);
            this.setReccuringData(res.data.recurringMetaData);
          }
        }
      })
    );
  }

  setReccuringData(recurringData: IRecurringMetaData) {
    const formattedData: Partial<IRecurringMetaData> = { ...recurringData };

    // Map status number to text and color
    const statusMapping: { [key: number]: { text: string; color: string } } = {
      1: { text: 'Started', color: 'common-blue-color' },
      2: { text: 'Completed', color: 'common-green-color' },
      3: { text: 'Paused', color: 'common-yellow-color' },
      4: { text: 'Canceled', color: 'common-red-color' }
    };

    // Check if status exists in the mapping
    const status = statusMapping[formattedData.status as number];
    if (status) {
      this.statusText = status.text;
      this.statusColor = status.color;
    }

    const transformedData: Record<string, string | number> = {
      'Start Date': formattedData.startDate as string,
      'End Date': formattedData.endDate as string,
      Frequency: formattedData.rruleFreq as string,
      '# of Pay':
        formattedData.isUnlimited === 1
          ? 'Unlimited'
          : (formattedData.total as number),
      '# of Paid': formattedData.completed as number,
      '# of Left':
        formattedData.isUnlimited === 1
          ? 'Unlimited'
          : (formattedData.total as number) -
            (formattedData.completed as number)
    };

    this.recurringDetails = Object.entries(transformedData).map(
      ([key, value]) => ({ key, value })
    );
    this.isDataNotEmpty = this.recurringDetails.some(
      (item) =>
        item.value !== null &&
        item.value !== undefined &&
        !Number.isNaN(item.value)
    );
  }

  areAllValuesNull(accountDetails: IReceivedCheckAccountDetails): boolean {
    return !Object.values(accountDetails).some(
      (value) => value !== null && value !== undefined
    );
  }

  getPodAttachemmnts(paymentId: string) {
    this.isLoadingPod.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getPodFile('request-payments', paymentId)
        .pipe(finalize(() => this.isLoadingPod.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.podDetails = res.data;
          }
        })
    );
  }

  downloadPod(id: string) {
    this.isDownload.set(true);
    this.subscriptions.push(
      this.paymentsService
        .downloadPodFile('request-payments', this.data.chequeId, id)
        .pipe(
          finalize(() => {
            this.isDownload.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            window.open(res.data);
          }
        })
    );
  }

  /**
   * @description Get the status data for the request payment
   */
  getStatus() {
    this.subscriptions.push(
      this.requestPaymentsService.getStatus().subscribe((res) => {
        if (res.success) {
          this.statusArr = res.data;
          this.checkAction();
        }
      })
    );
  }

  /**
   * @description Check the action availability based on the  receivedType and status
   */
  checkAction() {
    if (
      this.statusArr[this.data?.receivedType][this.data?.status]
        .isItApproveAble === 1
    ) {
      if ([1, 2].includes(this.data?.status)) {
        this.showAcceptBtn.set(true);
        this.showRejectBtn.set(true);
      }
      if (
        [4].includes(this.data?.status) &&
        [4].includes(this.data?.receivedType)
      ) {
        this.showRejectBtn.set(true);
      }
      if ([52].includes(this.data?.status) && this.data?.receivedType === 4) {
        this.showAcceptBtn.set(true);
      }
    }
  }

  /**
   * @description Perform the accept action for the specified ID
   * @param id - The ID of the request to accept
   */
  acceptAction(id: string) {
    const alert = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to accept?',
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    });
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.isAccept.set(true);
          this.requestPaymentsService
            .acceptRequest(id)
            .pipe(
              finalize(() => {
                this.isAccept.set(false);
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.showAcceptBtn.set(false);
                this.getActiveLogs(this.id as string);
                const response = this.acceptSuccess();
                const data = {
                  uuids: [id],
                  printType: 1
                };
                response.afterClosed().subscribe((ModalRes) => {
                  switch (ModalRes) {
                    case 'id_print':
                      this.printSelectedData(data);
                      break;
                    case 'id_dd':
                      this.ddfromAccept([id]);
                      break;

                    default:
                      break;
                  }
                });
              }
            });
        }
      })
    );
  }

  printSelectedData(data: { uuids: string[]; printType?: number }) {
    this.isPrinting.set(true);
    this.subscriptions.push(
      this.requestPaymentsService
        .printSelected(data)
        .pipe(
          finalize(() => {
            this.isPrinting.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.getActiveLogs(this.id as string);
              window.open(res.data);
            }
          },
          error: (err) => {
            if (err.error.errorCode === 106) {
              const dref = this.openWarningAlert(err.error.errorMsg);
              dref.afterClosed().subscribe((res) => {
                if (res) {
                  this.router.navigate(['manage/users/verify-email-phone'], {
                    queryParams: { returnUrl: 'manage/receivedchecks/index' }
                  });
                }
              });
            }
          }
        })
    );
  }

  ddfromAccept(uuid: string[]) {
    const data = {
      ids: uuid
    };
    this.isDdInitiated.set(true);
    this.subscriptions.push(
      this.requestPaymentsService
        .directDeposit(data)
        .pipe(
          finalize(() => {
            this.isDdInitiated.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const alertContent = {
              title: 'Success',
              content: 'Direct Deposit has been initiated.',
              close: true,
              timeout: 3000
            };
            this.alertService.successAlert(alertContent);
            this.getActiveLogs(this.id as string);
          }
        })
    );
  }

  openWarningAlert(content: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    };
    return this.alertService.warningAlert(data);
  }

  acceptSuccess() {
    const dialogRef = this.dialog.open(AcceptRequestComponent, {
      minWidth: '370px',
      disableClose: true
    });
    return dialogRef;
  }

  /**
   * @description Perform the reject action for the specified ID
   * @param id -The ID of the  request  to reject
   */
  rejectAction(id: string) {
    const alert = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to reject?',
      cancelMsg: 'Cancel',
      doneMsg: 'Ok'
    });
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.isReject.set(true);
          this.requestPaymentsService
            .rejectRequest(id)
            .pipe(
              finalize(() => {
                this.isReject.set(false);
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.showAcceptBtn.set(false);
                this.showRejectBtn.set(false);
                this.getActiveLogs(this.id as string);
                const data = {
                  title: 'Success',
                  content: 'Request rejected',
                  close: true,
                  timeout: 3000
                };
                this.alertService.successAlert(data);
              }
            });
        }
      })
    );
  }

  /**
   * @description Retrieve active logs for a specific check ID
   * @param id - The ID of the check to retrieve the active logs for .
   */
  getActiveLogs(id: string) {
    this.isLoadingActivityLogs.set(true);
    this.subscriptions.push(
      this.requestPaymentsService
        .recieveCheckActiveLog(id)
        .pipe(
          finalize(() => {
            this.isLoadingActivityLogs.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success && typeof res.data !== 'string') {
            this.activeLogs = res.data;
          }
        })
    );
  }

  /**
   * @description Retrieve all comments
   *
   */
  getComments() {
    this.subscriptions.push(
      this.sharedService
        .getAllComments('request-payments', this.data.chequeId)
        .pipe(
          finalize(() => {
            this.isLoadingComment.set(false);
          })
        )
        .subscribe((res) => {
          const response = res as IComment;
          if (response.success) {
            const commentData = response.data as IGetComment[];
            this.commentList = commentData;
          }
        })
    );
  }

  /**
   * @description Add a comment for the request payment
   */
  addComment() {
    this.isClick = true;
    if (this.comment !== '') {
      this.isClick = false;
    }
    const data = {
      comment: this.comment
    };
    if (this.comment !== '' && this.comment) {
      this.isloading = true;
      this.subscriptions.push(
        this.sharedService
          .addComment('request-payments', this.data.chequeId, data)
          .pipe(
            finalize(() => {
              this.isloading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.getComments();
              this.comment = '';
            }
          })
      );
    }
  }

  /**
   * @description Method to delete comment.
   */
  deleteComment(id: string): void {
    this.subscriptions.push(
      this.deleteConfirmAlert()
        .afterClosed()
        .subscribe((data) => {
          if (!data) return;
          if (id) {
            this.selectedCommentId = id;
            this.isDeleteComment.set(true);
            this.subscriptions.push(
              this.sharedService
                .deleteComment('request-payments', 0, id as string)
                .pipe(
                  finalize(() => {
                    this.isDeleteComment.set(false);
                  })
                )
                .subscribe((res) => {
                  if (res.success) {
                    this.alertService.successAlert({});
                    this.commentList = this.commentList.filter(
                      (item) => item.encrypted_id !== id
                    );
                  }
                })
            );
          }
        })
    );
  }

  deleteConfirmAlert() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this comment?',
      doneMsg: 'Yes, Delete it!',
      cancelMsg: 'No Cancel!'
    };
    return this.alertService.confirmAlert(data);
  }

  getAttachment() {
    this.subscriptions.push(
      this.sharedService
        .getAttachment('request-payments', this.data.chequeId)
        .pipe(
          finalize(() => {
            this.isLoadingAttachment.set(false);
          })
        )
        .subscribe((res) => {
          this.listData = res.data;
        })
    );
  }

  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.data.chequeId,
        type: 'request-payments'
      }
    });
    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res.refresh) {
          this.getAttachment();
        }
      })
    );
  }

  /**
   * @description Open the attachment  with  specified ID.
   * @param id -The ID of the attachment to open
   */
  openAttachment(id: string) {
    this.subscriptions.push(
      this.sharedService
        .openAttachment('request-payments', this.data.chequeId, id)
        .subscribe((res) => {
          this.link = res.data;
          if (res.success) {
            window.open(this.link);
          }
        })
    );
  }

  /**
   * @description Delete the attachment with the specified ID
   * @param id - The ID of the attachment to delete.
   */
  deleteAttachment(id: string) {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to deleted this Attachment permanently?',
      doneMsg: 'Yes, delete it!',
      cancelMsg: 'No cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedAttachmentId = id;
        this.isDeleteAttachment.set(true);
        this.subscriptions.push(
          this.sharedService
            .deleteAttachment('request-payments', this.data.chequeId, id)
            .pipe(
              finalize(() => {
                this.isDeleteAttachment.set(false);
              })
            )
            .subscribe(() => {
              this.getAttachment();
            })
        );
      }
    });
  }

  onGoBack(): void {
    this.router.navigate(['manage/receivedchecks/index']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
