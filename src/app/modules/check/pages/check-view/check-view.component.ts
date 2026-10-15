import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { fabric } from 'fabric';
import { finalize, takeUntil } from 'rxjs/operators';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import {
  ICheckDetailsData,
  ICheckStatus,
  IMailedAttachment,
  IOtherDetails
} from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HttpHeaders } from '@angular/common/http';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import {
  faDownload,
  faSpinner,
  faWavePulse,
  faReceipt,
  faComment,
  faPaperclip,
  faMoneyBillTransfer,
  faTruckBolt,
  faListDropdown,
  faFileInvoice,
  faShareNodes
} from '@fortawesome/pro-solid-svg-icons';
import {
  IPaymentsProofPayload,
  IPodDetails
} from 'src/app/modules/payments/model/payments';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import { SendPaymentProofModalComponent } from 'src/app/shared/modal/send-payment-proof-modal/send-payment-proof-modal.component';
import { shareSectionTooltip, type ShareSectionType } from 'src/app/shared/modal/v4-send-payment-proof-modal/v4-send-payment-proof-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTabGroup, MatTab, MatTabsModule } from '@angular/material/tabs';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { IConfirmAlert, ISuccessAlert } from '../../../../models/alert';
import { CheckMailDetailsComponent } from '../../components/check-mail-details/check-mail-details.component';
import { CheckLastTransactionComponent } from '../../components/check-last-transaction/check-last-transaction.component';
import { CheckRemittanceComponent } from '../../components/check-remittance/check-remittance.component';
import { CheckAttachmentComponent } from '../../components/check-attachment/check-attachment.component';
import { CheckCommentsComponent } from '../../components/check-comments/check-comments.component';
import { CheckActivityLogComponent } from '../../components/check-activity-log/check-activity-log.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { MatIcon } from '@angular/material/icon';
import { GetReceiptModalComponent } from 'src/app/modules/v3-payments-table/modal/get-receipt-modal/get-receipt-modal.component';
import { SendReceiptModalComponent } from 'src/app/modules/v3-payments-table/modal/send-receipt-modal/send-receipt-modal.component';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { environment } from 'src/environments/environment';

export interface IStatus {
  color: string;
  id: string | number;
  isItDeleteAble: number;
  isItEditAble: number;
  isItPrintAble: number;
  isItVoidAble: number;
  statusFullDescription: string;
  statusShortDescription: string;
  statusValue: number;
}
@Component({
  selector: 'app-check-view',
  templateUrl: './check-view.component.html',
  styleUrls: ['./check-view.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    FaIconComponent,
    CommonButtonV35Component,
    MatTabGroup,
    MatTab,
    CheckActivityLogComponent,
    CheckCommentsComponent,
    CheckAttachmentComponent,
    CheckRemittanceComponent,
    CheckLastTransactionComponent,
    CheckMailDetailsComponent,
    DatePipe,
    NgClass,
    TruncatePipe,
    MatTooltip,
    MatIcon,
    MatTabsModule,
    MatTooltipModule,
    CommonModule
  ]
})
export class CheckViewComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private vendorCredit = inject(VendorService);
  private validationService = inject(ValidationService);
  private checkDesignCanvasService = inject(CheckdesignCanvasService);
  private localStorageService = inject(LocalStorageService);
  private paymentsService = inject(PaymentsService);
  private psbService = inject(PsbService);
  private dialog = inject(MatDialog);
  private dataTableCacheService = inject(DataTableCacheService);
  private headerService = inject(HeaderService);

  /**
   * The tab bodies fetch and hold their own rows, so the emptiness check reads
   * them straight off the rendered child rather than refetching here.
   */
  @ViewChild(CheckActivityLogComponent) activityLogTab?: CheckActivityLogComponent;
  @ViewChild(CheckCommentsComponent) commentsTab?: CheckCommentsComponent;
  @ViewChild(CheckAttachmentComponent) attachmentTab?: CheckAttachmentComponent;
  @ViewChild(CheckRemittanceComponent) remittanceTab?: CheckRemittanceComponent;

  public canvas: fabric.Canvas;
  checkId: string;
  checkData: ICheckDetailsData;
  payeeSummaryData: IOtherDetails;
  vendorCreditData: { [key: string]: string }[] = [];
  vendorCreditTotal = 0;
  subscriptions: Subscription[] = [];
  payeeId: string;
  checkStatus: Record<string, ICheckStatus> = {};
  checkTemplate: string;
  dataLoaded = false;
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  canSubmitSignedReceiptRequest = true;

  enableEdit = false;
  enableVoid = false;
  enableDelete = false;
  isClientUser = false;

  backUrl: string = history.state.backUrl;
  signatureUrl: string | null = null;
  paymentReceiptsId: string | null = null;
  mailAttachment: IMailedAttachment[] = [];
  uuid: string;
  isCheckShowData: boolean;
  podDetails: IPodDetails[] = [];
  faDownload = faDownload;
  faSpinner = faSpinner;
  isDownload = signal(false);
  paymentId: string;
  statements: IPaidStatement[] = [];
  hasStatementChanges = false;
  isAch = false;
  isCompletePayment = false;
  activeTab = 'summary';
  faReceipt = faReceipt;
  faWavePulse = faWavePulse;
  faComment = faComment;
  faAttachment = faPaperclip;
  faRemittance = faMoneyBillTransfer;
  faProofOfDelivery = faTruckBolt;
  faListDropDown = faListDropdown;
  faFileInvoice = faFileInvoice;
  faShareNodes = faShareNodes;
  singatureUrlLoading: boolean = false;
  destroy$ = new Subject<boolean>();
  groupMailingDetails: {check_mailing_group_check_ids:string[],check_mailing_group_name:string};

  tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'credit', label: 'Vendor Credit' },
    { id: 'statement', label: 'Statement' }
  ];

  achStatus = [
    301, 302, 303, 304, 305, 306, 311, 312, 313, 400, 410, 411, 412, 420, 430,
    431, 432, 433, 440, 441
  ];

  /** Tab key → the `share_type` the send-audit-log endpoint expects. */
  private readonly SHARE_TYPES: Record<string, ShareSectionType> = {
    audit: 'audit_log',
    comments: 'comments',
    attachments: 'attachments',
    remittance: 'remittance',
    pod: 'proof_of_delivery'
  };

  ngOnInit(): void {
    this.getCheckData();
    this.loadCheckData();
    this.getCheckStatus();
    this.dataTableService.destroyPayload = true;
    if (environment.env_id === 'csnhc') {
      this.subscriptions.push(
        // eslint-disable-next-line no-underscore-dangle
        this.headerService._headerData.subscribe((res) => {
          if (res && (res as unknown as IHeaderData).isLoggedInAsClient) {
            this.isClientUser = true;
            this.enableEdit = false;
            this.enableVoid = false;
            this.enableDelete = false;
          }
        })
      );
    }
  }

  getCheckData() {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        this.checkId = params.get('id') as string;
      }),

      this.activatedRoute.queryParams.subscribe((res) => {
        this.uuid = res.uuid;
        this.checkStatus = res.status;
        if (res?.zilId) {
          this.paymentId = res?.zilId;
          this.getPodAttachemmnts(this.paymentId);
        }
        this.getStatements();
      })
    );
  }

  getStatements() {
    if (!this.uuid) return;
    this.subscriptions.push(
      this.psbService.getPaidStatements(this.uuid).subscribe((res) => {
        if (res?.success) {
          this.statements = res.data;
          this.hasStatementChanges = this.statements.some(
            (item) => !!item.changes
          );
          this.checkCompletePayment();
        }
      })
    );
  }

  checkCompletePayment() {
    this.isCompletePayment = this.statements.some(
      (statement) =>
        statement.status === 'COMPLETED' || statement.status === 'PROCESSING'
    );
  }

  attachments(event: IMailedAttachment[]) {
    this.mailAttachment = event;
  }

  getCheckStatus() {
    if (this.localStorageService.getItem('check_status')) {
      const status = this.localStorageService.getItem('check_status');
      this.checkStatus = status;
      return;
    }

    this.subscriptions.push(
      this.checkService.getCheckStatus().subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.checkStatus = res.data;
        }
      })
    );
  }

  disableActions(changedStatus?: number) {
    if (this.isClientUser) {
      this.enableEdit = false;
      this.enableVoid = false;
      this.enableDelete = false;
      return;
    }

    let actionList: IStatus;

    if (changedStatus) {
      actionList = this.checkStatus[changedStatus];
    } else {
      actionList = this.checkStatus[this.checkData?.status];
    }

    if (actionList?.isItEditAble === 1) this.enableEdit = true;
    else if (actionList?.statusValue === 50) this.enableEdit = true;
    else this.enableEdit = false;

    if (actionList?.isItVoidAble === 1) this.enableVoid = true;
    else this.enableVoid = false;

    if (actionList?.isItDeleteAble === 1) this.enableDelete = true;
    else this.enableDelete = false;
  }

  // Load Check Data By ID
  loadCheckData() {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.dataLoaded = true;
    this.subscriptions.push(
      this.checkService
        .getChecksById(this.checkId, headerOptions)
        .pipe(
          finalize(() => {
            this.dataLoaded = false;
            this.removeLoadedSkelton();
          })
        )
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.checkData = res.data;
              this.checkService.checkData = this.checkData;
              this.payeeId = this.checkData.payee.payeeId;
              this.checkTemplate = this.checkData.template;
              this.isCheckShow(this.checkData.status);
              this.loadPayeeSummary();
              if (res.data.status === 50) {
                this.disableActions(50);
              } else {
                this.disableActions();
              }
              this.loadCheckTemplate();
              this.loadAppliedVendorCredit();
              this.isAch = this.achStatus.includes(res.data.status);
              this.paymentReceiptsId = res.data.payment_receipts_id;
              this.signatureUrl = res.data.signatureUrl;
              if (this.signatureUrl) {
                this.singatureUrlLoading = true;
                this.getSignedReceipt();
              }
              
              if(res.data.check_mailing_group){
                this.groupMailingDetails = res.data.check_mailing_group;
              }

              const checkStatus =
                this.localStorageService.getItem('check_status');
              if (checkStatus) {
                this.cellRendererCheckStatus = checkStatus;
              }
            }
          },
          error: (err) => {
            if (err.error.errorCode === 404) {
              this.router.navigate(['/404']);
            }
          }
        })
    );
  }

  // Load Check Design Template
  loadCheckTemplate() {
    this.canvas = new fabric.Canvas('canvas');
    const json = JSON.parse(this.checkTemplate as string);
    this.checkDesignCanvasService.removeNullText(json);
    this.canvas.loadFromJSON(json, () => {
      setTimeout(() => {
        this.routingBoxFix();
        this.canvasRenderAll();
        this.onPreventCanvasEdit();
        this.setVoidTextToCanvas();
      }, 200);
    });
  }

  routingBoxFix(): void {
    this.getCanvasObjects().forEach((ele: Params) => {
      // Load Routing No
      if (ele.id === "dynamic['bank_account_routing_no']") {
        ele.set({ width: 500 });
        this.canvasRenderAll();
      }
    });
  }

  setVoidTextToCanvas(status?: string | number): void {
    if (
      this.checkData?.status === 2 ||
      status === 2 ||
      this.checkData?.status === 507 ||
      this.checkData?.status === 807
    ) {
      // Set Voided Text
      const context = this.canvas.getContext();
      context.font = 'bold 49px Roboto';
      context.fillStyle = '#5252524f';
      context.fillText(
        'VOIDED',
        this.canvas.width! * 0.4,
        this.canvas.height! * 0.5
      );
    }
  }

  onPreventCanvasEdit(): void {
    // Prevent Editable
    this.canvas.forEachObject((object) => {
      object.selectable = object.evented = false;
    });
  }

  getCanvasObjects(): any {
    return this.canvas.getObjects();
  }

  canvasRenderAll(): void {
    this.canvas.renderAll();
  }

  // Load Payee Summary
  loadPayeeSummary(): void {
    if (this.checkData.payee.payeeId == '') return;

    this.subscriptions.push(
      this.checkService
        .getPayeeSummary(this.checkData.payee.payeeId)
        .subscribe((res) => {
          if (res?.success) this.payeeSummaryData = res.other;
        })
    );
  }

  // Load Payee Applied Vendor Credit
  loadAppliedVendorCredit(): void {
    const data = {
      referenceId: this.checkId,
      referenceType: 2
    };
    this.subscriptions.push(
      this.vendorCredit.getVendorCreditApplied(data).subscribe((res) => {
        if (res?.success) {
          this.vendorCreditData = res.data;
          let total = 0;
          if (this.vendorCreditData) {
            this.vendorCreditData.forEach((e) => {
              const amountMatch = e.amount.match(/[\d.]+/);
              if (amountMatch) {
                total += parseFloat(amountMatch[0]);
              }
            });
          }
          this.vendorCreditTotal =
            this.validationService.formateCurrency(total);
        }
      })
    );
  }

  // Edit Check
  onEditCheck(): void {
    const checkStatus = this.checkData.status;
    const uuid = this.uuid ? this.uuid : this.checkData.uuid;
    this.router.navigate([`/manage/payments/main/edit/${uuid}`], {
      queryParams: { checkStatus }
    });
  }

  // Void Check
  onVoidCheck(): void {
    const confirmContent = this.checkData?.status === 7 || this.checkData?.status === 505
      ? 'This check is voided only within this platform. It may still be delivered to the payee and could still be presented to the bank. Are you sure you want to void this check?'
      : 'Are you sure you want to void this check?';
    const cancelMsg = 'No, Cancel!';
    const doneMsg = 'Yes, Void it!';
    const alert = this.openConfirmAlert(confirmContent, cancelMsg, doneMsg);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkService.voidCheck(this.checkId).subscribe({
            next: (res) => {
              if (res?.success) {
                this.disableActions(2);
                this.setVoidTextToCanvas(2);
                this.successAlert('Check voided.');
              }
            },
            error: (err) => {
            }
          })
        );
      }
    });
  }

  /** Method for cloning check */
  cloneCheck() {
    this.router.navigate([
      '/manage/payments/main/clone/' + this.checkData.uuid
    ]);
  }

  // Delete Check
  onDeleteCheck(): void {
    const confirmContent = 'Are you sure you want to delete this check?';
    const cancelMsg = 'No, Cancel!';
    const doneMsg = 'Yes, Delete it!';
    const alert = this.openConfirmAlert(confirmContent, cancelMsg, doneMsg);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkService.deleteCheck(this.checkId).subscribe((res) => {
            if (res?.success) {
              this.successAlert('Check deleted.');
              this.router.navigateByUrl('/manage/cheque');
            }
          })
        );
      }
    });
  }

  onClickTransAmount(ev: string) {
    if (ev) {
      this.checkId = ev;
      this.loadCheckData();
    }
  }

  //= =====>For Template Responsive
  mobileHeaderRightBtn(): void {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay: HTMLElement = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    if (ocwOverlay) {
      ocwOverlay.style.display = 'block';
    }
  }

  ocwOverlayRightHeadClick(): void {
    const ocwOverlay: HTMLElement = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    if (ocwOverlay) {
      ocwOverlay.style.display = 'none';
    }

    const actionBtn = this.querySelector('#mobile-header-right-btn');
    actionBtn?.classList.remove('mobile-head-rightshow');
  }

  openConfirmAlert(content: string, cancelMsg?: string, doneMsg?: string) {
    const data: IConfirmAlert = {
      content,
      cancelMsg: cancelMsg || 'cancel!',
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.confirmAlert(data);
  }

  successAlert(content: string): void {
    const data: ISuccessAlert = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  //= ==> Remove skelton loader
  removeLoadedSkelton(): void {
    const main_common_module: NodeListOf<HTMLElement> =
      document.querySelectorAll('.main_common_module .skelton')!;
    main_common_module.forEach((item) => item.classList.remove('skelton'));
  }

  numSequence(n: number): Array<number> {
    return Array(n);
  }

  querySelector(el: string) {
    return document.querySelector(el);
  }

  onGoBack(): void {
    if (
      this.backUrl.includes('manage/payments-table/index') ||
      this.backUrl.includes('manage/payments-table/check')
    ) {
      this.dataTableService.destroyPayload = false;
      this.dataTableService.isEyeButtonClicked = true;
    }
    this.router.navigateByUrl(this.backUrl);
  }

  /**
   * method to enable view
   */
  isCheckShow(id: number) {
    if ([50,4, 5, 6, 7,2,807].includes(id)) {
      this.isCheckShowData = true;
    } else {
      this.isCheckShowData = false;
    }
  }

  getPodAttachemmnts(paymentId: string) {
    this.subscriptions.push(
      this.paymentsService
        .getPodFile('zil-payments', paymentId)
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
        .downloadPodFile('zil-payments', this.paymentId, id)
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

  /** The zil payment id every share request is posted against. */
  private shareId(): string | undefined {
    return this.paymentId ?? this.uuid ?? this.checkData?.uuid;
  }

  /** Share-button tooltip, naming the section it sends. */
  shareTooltip(section: string): string {
    return shareSectionTooltip(this.SHARE_TYPES[section]);
  }

  /** Share is offered only for a tab that actually holds data to send. */
  canShare(section: string): boolean {
    if (!this.shareId()) return false;
    switch (section) {
      case 'audit':
        return !!this.activityLogTab?.activityData?.length;
      case 'comments':
        return !!this.commentsTab?.listData?.length;
      case 'attachments':
        return !!this.attachmentTab?.checkAttachmentData?.length;
      case 'remittance':
        return !!this.remittanceTab?.remittanceData?.length;
      case 'pod':
        return !!this.podDetails?.length;
      default:
        return false;
    }
  }

  openShareModal(section: string) {
    const zilId = this.shareId();
    if (!zilId) return;

    this.dialog.open(SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        uuId: zilId,
        mode: 'share',
        shareType: this.SHARE_TYPES[section],
        recipientName: this.checkData?.payee?.payeeName ?? '',
        payee: {
          email: this.checkData?.payeeEmail,
          phone: this.checkData?.payeePhone
        },
        amount: this.checkData?.amount ?? ''
      }
    });
  }

  sendPaymentProof() {
    const isMailedCheck = [7, 8].includes(this.checkData?.status);
    const status = {
      value: 'Mailed',
      color: '#14AE5B'
    };
    this.dialog.open(SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        checkStatus: isMailedCheck ? status : undefined,
        uuId: this.uuid
      },
      disableClose: true
    });
  }

  changeTab(btnId: string) {
    this.activeTab = btnId;
  }

  /**
   * Whether this cheque still accepts a proof-of-delivery send or request.
   * Same pair of conditions `getReceipt` already judges by: the cheque is
   * mailed or its payment completed, and no proof is on record yet.
   */
  get canSendPod(): boolean {
    if (!this.checkData) {
      return false;
    }
    const checkStatus =
      this.cellRendererCheckStatus?.[this.checkData.status]
        ?.statusShortDescription;
    const delivered =
      checkStatus === 'Mailed' || this.checkData.zilPaymentStatus === 'COMPLETED';
    // Requestable once: `podStatus` covers a request already sent, the
    // attachment list covers a proof already recorded.
    return (
      delivered && this.checkData.podStatus !== 1 && !this.podDetails?.length
    );
  }

  /** `mode: 'pod'` — the Request Proof / Send Proof flow, not payment proof. */
  sendProofOfDelivery() {
    this.subscriptions.push(
      this.dialog
        .open(SendPaymentProofModalComponent, {
          maxWidth: '500px',
          width: '93%',
          data: {
            checkStatus: undefined,
            uuId: this.uuid,
            encryptedId: this.paymentId,
            mode: 'pod',
            payee: {
              email: this.checkData?.payeeEmail,
              phone: this.checkData?.payeePhone
            },
            amount: this.checkData?.amount
          },
          disableClose: true
        })
        .afterClosed()
        // The dialog resolves without a result whether a request went out or
        // the user backed out, so re-read the proof list either way.
        .subscribe(() => {
          if (this.paymentId) {
            this.getPodAttachemmnts(this.paymentId);
          }
        })
    );
  }

  getReceipt() {
    const checkStatus =
      this.cellRendererCheckStatus?.[this.checkData?.status]
        ?.statusShortDescription;
    const zilPaymentStatus = this.checkData?.zilPaymentStatus;
    const podStatus = this.checkData?.podStatus;
    if (
      (checkStatus !== 'Mailed' && zilPaymentStatus !== 'COMPLETED') ||
      podStatus === 1
    ) {
      this.canSubmitSignedReceiptRequest = false;
    }

    if (!this.signatureUrl) {
      this.dialog
        .open(GetReceiptModalComponent, {
          maxWidth: '550px',
          width: '93%',
          disableClose: true,
          panelClass: 'paddingless-modal',
          data: {
            transactionId: this.checkData.uuid,
            payee: {
              email: this.checkData.payeeEmail,
              phone: this.checkData.payeePhone
            },
            canSubmitSignedReceiptRequest: this.canSubmitSignedReceiptRequest,
            previewData: {
              senderName: this.checkData.bankAccount.bankAccountName ?? '',
              payeeName: this.checkData.payee.payeeName ?? '',
              amount: this.checkData.amount ?? '',
              address: this.checkData.payeeAddress1 ?? '',
              reference: this.checkData.invoiceNumber,
              type: 'CHECK',
            }
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            if (res.success) {
              this.paymentReceiptsId = '10';
              this.dataTableCacheService.deleteV3Data(62);
            }
          }
        });
    } else {
      this.dialog.open(SendReceiptModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: {
          transactionId: this.checkData.uuid,
          payee: {
            email: this.checkData.payeeEmail,
            phone: this.checkData.payeePhone
          }
        }
      });
    }
  }

  getSignedReceipt() {
    const payload: IPaymentsProofPayload = {
      type: ['download'],
      is_signature_request: false
    };
    this.paymentsService
      .sendPaymentReceipt(this.checkData.uuid, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.signatureUrl = res.data;
        this.singatureUrlLoading = false;
      });
  }

  /**
   * @description Generates initials from a given payee name.
   * @param {string} payeeName - The full name of the payee.
   * @returns {string | undefined} The initials of the payee, or undefined if no name is provided.
   */
  returnPayeeInitials(payeeName: string): string | undefined {
    if (!payeeName) {
      return undefined;
    }
    const trimmedPayeeName = payeeName.trim().toUpperCase();
    const splitUpPayeeName = trimmedPayeeName.split(' ').filter(Boolean);
    if (splitUpPayeeName.length <= 1) {
      return trimmedPayeeName[0] + (trimmedPayeeName[1] || '');
    }
    return splitUpPayeeName[0][0] + splitUpPayeeName[1][0];
  }

  getPhoneNumberDisplay(phone: string): string {
    if(!phone || phone === 'undefined' || phone === 'null') {
      return '';
    }
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phone === '+' || phone === '+1' || phone === '1' || phoneDigits.length === 0) {
      return '';
    }
    return phone;
  }

  downloadFile(data: string) {
    window.open(data);
  }

  ngOnDestroy(): void {
    if (this.dataTableService.destroyPayload) {
      this.dataTableService.dataTablePayload = undefined;
      this.dataTableService.dateRangeNameChequeCreated = undefined;
      this.dataTableService.selectedDateRangeChequeCreated = undefined;
      this.dataTableService.selectedDateRangeCheque = undefined;
      this.dataTableService.dateRangeNameCheque = undefined;
    }
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
