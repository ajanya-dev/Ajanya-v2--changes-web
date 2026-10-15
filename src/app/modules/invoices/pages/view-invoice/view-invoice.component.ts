import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, finalize, of } from 'rxjs';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { IApiResMesssage } from 'src/app/models/api';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ICheckMailTrackDetails } from 'src/app/modules/check/model/check';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import {
  NgClass,
  DecimalPipe,
  DatePipe,
  NgOptimizedImage,
  CommonModule
} from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import {
  faArrowUpRightFromSquare,
  faCircleInfo,
  faEnvelope,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddInvoiceComponent } from '../../modals/add-invoice/add-invoice.component';
import {
  IAttachmentsList,
  IAuditTrailList,
  ICommentList,
  IInvoiceData,
  IInvoiceStatements,
  IOpenAttachmentsRes
} from '../../model/invoice';

interface InvoiceRow {
  label: string;
  value: string | number;
  condition?: boolean;
  formatter?: (value: string) => string;
  additionalContent?: boolean;
  extraContent?: string;
}

/**
 * Component for viewing an invoice.
 *
 * @export
 * @class ViewInvoiceComponent
 * @implements {OnInit}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'app-view-invoice',
  templateUrl: './view-invoice.component.html',
  styleUrls: ['./view-invoice.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    NgClass,
    MatTabGroup,
    MatTab,
    DecimalPipe,
    CommonButtonV35Component,
    OcwBackButtonComponent,
    TruncatePipe,
    MatTooltip,
    NgOptimizedImage,
    CommonModule
  ]
})
export class ViewInvoiceComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public invoiceService = inject(InvoiceService);
  private alertService = inject(AlertService);
  public dialog = inject(MatDialog);
  public activatedRoute = inject(ActivatedRoute);
  private sharedService = inject(SharedService);
  private checkService = inject(CheckService);
  private datePipe = inject(DatePipe);

  subscriptions: Subscription[] = [];
  ViewList: IInvoiceStatements;
  void = true;
  unvoid = false;
  data: string;
  memo: string;
  privateNote: string;
  tatalpaid: string;
  BalanceAmount: number | string = 0;
  err_msg: string;
  val: IInvoiceData;
  type: string;
  disable = false;
  isEditing: boolean = false;

  auditTrailList: IAuditTrailList[] = [];
  attachmentsList: IAttachmentsList[] = [];
  commentsList: ICommentList[];
  datas: IInvoiceData;
  discount: number;
  dataType: string;
  paidFromAmount: number;
  importedAppName: string;
  isMailed = false;
  isVoidLoading = false;
  isDeleteLoading = false;
  activeTab = 'Summary';
  summaryDetails: InvoiceRow[] = [];
  faCircleInfo = faCircleInfo;
  faSpinner = faSpinner;
  faEnvelope = faEnvelope;
  faTrash = faTrash;
  faArrowUp = faArrowUpRightFromSquare;

  isLoading = signal(false);
  isAuditTrailLoading = signal(false);
  isAttachmentLoading = signal(false);
  isCommentsLoading = signal(false);

  /**
   * Lifecycle hook called after the component is initialized.
   */
  ngOnInit(): void {
    this.getRouterData();
    this.getData();
    this.getAuditTrail();
    this.getAttachments();
    this.getComments();
  }

  getRouterData() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((data) => {
        this.type = data.type;
        this.data = data.id;
        this.dataType = 'invoices';
        if (data.type === 'unvoid') {
          this.unvoid = true;
          this.void = false;
        }

        if (data.is_mailed === '1' || data.is_emailed === '1') {
          this.disable = true;
        }

        if (data.is_mailed === '1' && data.status === '1') {
          this.isMailed = true;
          this.getInvoiceMailTrack(this.data);
        } else {
          this.isMailed = false;
        }
      })
    );
  }

  /**
   * Fetches invoice data using the invoice service.
   */
  getData() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.invoiceService
        .invoiceView(this.data)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res) {
            this.ViewList = res.data.statements;
            this.memo = res.data.statements.invoice?.memo;
            this.privateNote = res.data?.note;
            this.tatalpaid = res.data.paid;
            this.BalanceAmount = res.data.balance;
            this.datas = res.data;
            if (
              res.data.paidFromThirdParty &&
              res.data.paidFromThirdParty !== 0
            ) {
              this.paidFromAmount = res.data.paidFromThirdParty;
              this.importedAppName = res.data.thirdPartyAppName;
            }
            this.getInvoiceRows();
            const amount = parseFloat(this.tatalpaid);
            if (amount > 0 && this.type === 'unvoid') {
              this.disable = true;
            } else if (amount > 0 && this.type === 'void') {
              this.disable = true;
            }
          }
        })
    );
  }

  getInvoiceRows() {
    this.summaryDetails = [
      {
        label: 'Invoice #',
        value: this.ViewList.invoice?.invoiceNo
      },
      {
        label: 'PO #',
        value: this.datas?.poNo,
        condition: !!this.datas?.poNo
      },
      {
        label: 'Category',
        value: this.datas?.category?.categoryName,
        condition: !!this.datas?.category?.categoryName
      },
      {
        label: 'Inv From',
        value: this.ViewList.invoice?.invFrom
      },
      {
        label: 'Client Name',
        value: this.ViewList.invoice?.payeeName
      },
      {
        label: 'Invoice Date',
        value: this.ViewList.invoice?.invoiceDate,
        formatter: (date) =>
          this.datePipe.transform(date, 'MM/dd/YYYY') as string
      },
      {
        label: 'Due Date',
        value: this.datas?.dueDate
      },
      {
        label: 'Delivery Charge',
        value: this.datas?.shippingCharge,
        condition: this.datas?.providerType === 5,
        formatter: (value) => `$ ${value}`
      },
      {
        label: 'Total',
        value: this.ViewList.invoice?.total,
        formatter: (value) => `$ ${value}`
      },
      {
        label: `Paid From ${this.importedAppName}`,
        value: this.paidFromAmount,
        condition: !!this.paidFromAmount,
        formatter: (value) => `$ ${value}`
      },
      {
        label: 'Discount',
        value: this.getdiscount(this.datas),
        formatter: (value) => `$ ${value}`,
        additionalContent: this.datas?.discountType === 2,
        extraContent: `( ${this.datas?.discount} % )`
      },
      {
        label: 'Shipping Charge',
        value: this.datas?.shippingCharge,
        condition: this.datas?.isZohoInvoice === 1,
        formatter: (value) => `$ ${value}`
      },
      {
        label: this.datas?.adjustmentText,
        value: this.datas?.adjustment,
        condition: this.datas?.isZohoInvoice === 1,
        formatter: (value) => `$ ${value}`
      },
      {
        label: 'Tax',
        value: this.ViewList.invoice?.totalTax,
        formatter: (value) => `$ ${value}`
      },
      {
        label: 'Credit',
        value: this.datas?.creditMemoApplied,
        condition: !!this.datas?.creditMemoApplied,
        formatter: (value) => `$ ${value}`
      },
      {
        label: 'Credit From Xero',
        value: this.datas?.amountCredited,
        condition: this.datas?.amountCredited > 0,
        formatter: (value) => `$ ${value}`
      },
      {
        label: 'Grand Total',
        value: this.ViewList.invoice?.grandTotal,
        formatter: (value) => `$ ${value}`,
        additionalContent: true
      }
    ];
  }

  /**
   * Calculates the discount based on the invoice data.
   *
   * @param {IInvoiceData} data - The invoice data.
   * @returns {number} - The calculated discount amount.
   */
  getdiscount(data: IInvoiceData) {
    const discount = data?.discount;
    const total = data?.total;

    if (data?.discountType === 1) {
      this.discount = data?.discount;
    } else {
      const totalDiscount = (discount / 100) * total;
      this.discount = totalDiscount;
    }
    return this.discount;
  }

  /**
   * Opens a dialog for editing the invoice.
   */
  Edit() {
    if (this.isEditing) {
      return;
    }
    this.isEditing = true;

    this.subscriptions.push(
      this.invoiceService
        .getInvoiceData(this.data)
        .pipe(
          finalize(() => {
            this.isEditing = false;
          })
        )
        .subscribe((res: { data: IInvoiceData }) => {
          this.val = res.data;

          const editInvoice = this.dialog.open(AddInvoiceComponent, {
            maxWidth: '1010px',
            width: '93%',
            data: {
              data: this.val,
              isClone: false
            }
          });

          editInvoice.afterClosed().subscribe((result) => {
            if (result) {
              this.getData();
              this.getAuditTrail();
              this.getAttachments();
              this.getComments();
            }
          });
        })
    );
  }

  /**
   * Voids the invoice.
   */
  Void() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to Void this Invoice',
      doneMsg: 'Yes, Void it!',
      cancelMsg: 'No cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isVoidLoading = true;
        this.subscriptions.push(
          this.invoiceService
            .voidSingleInvoice(this.data)
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
              const alertData = {
                title: 'Success',
                content: 'Invoice Voided successfully',
                timeout: 2000,
                close: true
              };

              if ((res as IApiResMesssage).success) {
                this.alertService.successAlert(alertData);
                this.void = false;
                this.unvoid = true;
              }
            })
        );
      }
    });
  }

  /**
   * Unvoids the invoice.
   */
  unVoid() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to Unvoid this Invoice',
      doneMsg: 'Yes, Unvoid it!',
      cancelMsg: 'No cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isVoidLoading = true;
        this.subscriptions.push(
          this.invoiceService
            .UnvoidSingleInvoice(this.data)
            .pipe(
              finalize(() => {
                this.isVoidLoading = false;
              }),
              catchError(() => of(false))
            )
            .subscribe((res) => {
              const alertData = {
                title: 'Success',
                content: 'Invoice Unvoided successfully',
                timeout: 2000,
                close: true
              };

              if ((res as IApiResMesssage).success) {
                this.alertService.successAlert(alertData);
                this.void = true;
                this.unvoid = false;
              }
            })
        );
      }
    });
  }

  /**
   * Deletes the invoice.
   */
  Delete() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this invoice?',
      doneMsg: 'Yes, delete it!',
      cancelMsg: 'No cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.isDeleteLoading = true;
        this.subscriptions.push(
          this.invoiceService
            .DeleteSingleInvoice(this.data)
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
              const alertData = {
                title: 'Success',
                content: 'Invoice Deleted successfully',
                timeout: 1500,
                close: true
              };

              if ((res as IApiResMesssage).success) {
                const close = this.alertService.successAlert(alertData);
                close.afterClosed().subscribe(() => {
                  this.router.navigate(['manage/invoice/']);
                });
              }
            })
        );
      }
    });
  }

  /**
   * Fetches the audit trail for the invoice.
   */
  getAuditTrail() {
    this.isAuditTrailLoading.set(true);
    this.subscriptions.push(
      this.invoiceService
        .auditTrailInvoice(this.data)
        .pipe(finalize(() => this.isAuditTrailLoading.set(false)))
        .subscribe((response: { data: IAuditTrailList[] }) => {
          this.auditTrailList = response.data;
        })
    );
  }

  /**
   * Fetches attachments related to the invoice.
   */
  getAttachments() {
    this.isAttachmentLoading.set(true);
    this.subscriptions.push(
      this.invoiceService
        .getAttachments(this.data)
        .pipe(finalize(() => this.isAttachmentLoading.set(false)))
        .subscribe((response: { data: IAttachmentsList[] }) => {
          this.attachmentsList = response.data;
        })
    );
  }

  /**
   * Fetches comments related to the invoice.
   */
  getComments() {
    this.isCommentsLoading.set(true);
    this.subscriptions.push(
      this.invoiceService
        .getComments(this.data)
        .pipe(finalize(() => this.isCommentsLoading.set(false)))
        .subscribe((response: { data: ICommentList[] }) => {
          this.commentsList = response.data;
        })
    );
  }

  /**
   * Opens a dialog for adding comments to the invoice.
   */
  addComments() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '100%',
      maxWidth: '850px',
      data: {
        id: this.data,
        type: 'invoices'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getComments();
    });
  }

  addAttachments() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '100%',
      maxWidth: '700px',
      disableClose:true,
      data: {
        id: this.data,
        type: 'invoices'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getAttachments();
    });
  }

  /**
   * Opens an attachment associated with the invoice.
   *
   * @param {IAttachmentsList} attachment - The attachment to open.
   */
  openAttachment(attachment: IAttachmentsList) {
    this.subscriptions.push(
      this.invoiceService
        .openAttachment(this.data, attachment.encrypted_id)
        .subscribe((response: IOpenAttachmentsRes) => {
          window.open(response.data, 'blank');
        })
    );
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
            .deleteAttachment(this.dataType, this.data, attachmentId)
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
   * Toggles the visibility of the mobile header's right button.
   */
  mobileHeaderRightBtn(): void {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    ocwOverlay.style.display = 'block';
  }

  /**
   * Queries for an HTML element.
   *
   * @param {string} el - The element selector.
   * @returns {Element | null} - The selected HTML element or null if not found.
   */
  querySelector(el: string) {
    return document.querySelector(el);
  }

  getInvoiceMailTrack(id: string) {
    this.invoiceService.invoiceMailTrack(id, 'view');
  }

  track() {
    if (this.invoiceService.mailTrackSignal()?.trackingData.success) {
      this.checkService.openTrackingModal(
        this.invoiceService.mailTrackSignal() as ICheckMailTrackDetails,
        'invoice',
        this.data
      );
    } else {
      window.open(this.invoiceService.mailTrackSignal()?.trackingUrl, '_blank');
    }
  }

  changeTab(btn: string) {
    this.activeTab = btn;
  }

  goBack() {
    this.router.navigate(['manage/invoice']);
  }

  /**
   * Lifecycle hook called before the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.invoiceService.ngOnDestroy();
  }
}
