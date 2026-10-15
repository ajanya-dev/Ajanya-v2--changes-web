import { ActivatedRoute, Router } from '@angular/router';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  IPaymentDetails,
  IPaymentsProofPayload,
  IPodDetails
} from 'src/app/modules/payments/model/payments';
import { finalize, Subscription } from 'rxjs';
import {
  DatePipe,
  NgClass,
  NgSwitch,
  NgSwitchCase,
  CurrencyPipe,
  NgOptimizedImage,
  CommonModule,
  TitleCasePipe,
  DecimalPipe
} from '@angular/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IRemittanceDetails } from 'src/app/models/bank';
import { IGetAttachment, IGetComment } from 'src/app/models/common';
import { IComment } from 'src/app/models/wallet';
import { HttpHeaders } from '@angular/common/http';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import {
  faCircleCheck,
  faCircleXmark,
  faClock,
  faCopy,
  faHourglassEnd,
  faReceipt,
  faSpinner,
  faDownload,
  faPaperclip,
  faComment,
  faFileInvoice,
  faMoneyBillTransfer,
  faTruckBolt,
  IconDefinition,
  faPrint,
  faEye,
  faEyeSlash,
  faTriangleExclamation,
  faShareNodes
} from '@fortawesome/pro-solid-svg-icons';
import { shareSectionTooltip, type ShareSectionType } from 'src/app/shared/modal/v4-send-payment-proof-modal/v4-send-payment-proof-modal.component';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { MatDialog } from '@angular/material/dialog';
import { SendPaymentProofModalComponent } from 'src/app/shared/modal/send-payment-proof-modal/send-payment-proof-modal.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { CheckMailDetailsComponent } from 'src/app/modules/check/components/check-mail-details/check-mail-details.component';
import { CheckAttachmentComponent } from 'src/app/modules/check/components/check-attachment/check-attachment.component';
import { CheckCommentsComponent } from 'src/app/modules/check/components/check-comments/check-comments.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  ICheckCustomAddress,
  ICheckMailRecord,
  ICustomShippingToCarrierDetails
} from 'src/app/modules/check/model/check';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { SendReceiptModalComponent } from '../../../modal/send-receipt-modal/send-receipt-modal.component';
import { GetReceiptModalComponent } from '../../../modal/get-receipt-modal/get-receipt-modal.component';
import { PayeeBankVerificationDetailsModalComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/payee-bank-verification-details-modal/payee-bank-verification-details-modal.component';
import { IPayeeBankVerificationModalData } from 'src/app/models/payee-bank-verification';

interface IActivatedRoute {
  params: {
    value: {
      id: string;
    };
  };
}

export interface IActivityLogModel {
  id: string;
  date: string;
  status: string;
  activityBy: string;
  location: string;
  ipAddress: string;
  notes: string;
}

@Component({
  selector: 'app-v3-payment-view',
  templateUrl: './v3-payment-view.component.html',
  styleUrls: ['./v3-payment-view.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    NgClass,
    NgSwitch,
    NgSwitchCase,
    CurrencyPipe,
    DatePipe,
    MatTooltip,
    FaIconComponent,
    OcwBackButtonComponent,
    NgOptimizedImage,
    CommonModule,
    TruncatePipe,
    MatTooltipModule,
    CheckMailDetailsComponent,
    CheckAttachmentComponent,
    CheckCommentsComponent,
    TitleCasePipe,
    DecimalPipe
  ]
})
export class V3PaymentViewComponent implements OnInit, OnDestroy {
  /* Injectors */
  private activateRoute = inject(ActivatedRoute);
  private paymentsService = inject(PaymentsService);
  private sharedService = inject(SharedService);
  private alertService = inject(AlertService);
  private walletService = inject(WalletService);
  datePipe = inject(DatePipe);
  private router = inject(Router);
  private psbService = inject(PsbService);
  private dialog = inject(MatDialog);
  private dataTableCacheService = inject(DataTableCacheService);

  /**
   * International payments render the shared check-* tab bodies, which hold
   * their own rows — read them off the child instead of refetching here.
   */
  @ViewChild(CheckAttachmentComponent) attachmentTab?: CheckAttachmentComponent;
  @ViewChild(CheckCommentsComponent) commentsTab?: CheckCommentsComponent;
  @ViewChild('tooltip') tooltip: MatTooltip;
  /* Variables */
  subscriptions: Subscription[] = [];
  canSubmitSignedReceiptRequest = true;
  paymentViewId = '';
  payeeName: string;
  checkAttachmentData: IGetAttachment[] = [];
  activityData: IActivityLogModel[];
  listData: IGetComment[] = [];
  paymentData: IPaymentDetails;
  formattedCreatedAt: string | null;
  paymentStatus: string;
  paymentType: string;
  transferId: string;
  canEdit = false;
  isLoading = true;
  previousPage = '/manage/payments-table/index';
  zilPaymentId: string;
  remittanceType: number | undefined = undefined;
  remittanceData: IRemittanceDetails[];
  remittanceTotal: number;
  faCopy = faCopy;
  statements: IPaidStatement[] = [];
  hasStatementChanges = false;
  podDetails: IPodDetails[] = [];
  checkMailDetails: ICheckMailRecord;
  faCircleCheck = faCircleCheck;
  faGlass = faHourglassEnd;
  faXmark = faCircleXmark;
  faReceipt = faReceipt;
  faClock = faClock;
  faPrint = faPrint;
  faComment = faComment;
  faAttachment = faPaperclip;
  faRemittance = faMoneyBillTransfer;
  faProofOfDelivery = faTruckBolt;
  faFileInvoice = faFileInvoice;
  faSpinner = faSpinner;
  faDownload = faDownload;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faTriangleExclamation = faTriangleExclamation;
  faShareNodes = faShareNodes;
  singatureUrlLoading: boolean = false;
  isDownload = signal(false);
  isDataLoading = signal(false);
  isAttachemntLoading = signal(false);
  isCommentLoading = signal(false);
  isRemittanceLoading = signal(false);
  isPodLoading = signal(false);
  detailsTabSwitch = signal<string>('payee-details');
  /** Toggle between beneficiary vs bank details on international payment view */
  internationalDetailsTabSwitch = signal<string>('beneficiary-details');
  showAccountNumber = signal(false);
  shippingMethod: string = '';
  carrierTrackingNumber: string = '';
  signatureUrl: string | undefined = undefined;
  paymentReceiptsId: string | undefined = undefined;
  paymentCompleted = false;
  isRtpPayment = false;
  canAddInternationalAttachments = false;
  canAddInternationalComments = false;
  selectedTab = 0;
  isCustomShippingTo = false;
  customPayeeAddress: ICheckCustomAddress;
  customTrackingDetails: ICustomShippingToCarrierDetails;
  tabItems: { label: string; icon: IconDefinition }[] = [
    {
      label: 'Attachments',
      icon: this.faAttachment
    },
    {
      label: 'Comments',
      icon: this.faComment
    },
    {
      label: 'Remittance',
      icon: this.faRemittance
    },
    {
      label: 'Cleared Check Details',
      icon: this.faReceipt
    },
    {
      label: 'Signed Receipt',
      icon: this.faFileInvoice
    },
    {
      label: 'Proof of Delivery',
      icon: this.faProofOfDelivery
    }
  ];

  selectedTabName: string;

  isInternationalPayment=signal<boolean>(false);
  isWalletCheckMailPayment = signal<boolean>(false);

  /** Page the view was opened from (passed via router state), used by the back button */
  backUrl: string | null = null;

  /** Tab key → the `share_type` the send-audit-log endpoint expects. */
  private readonly SHARE_TYPES: Record<string, ShareSectionType> = {
    comments: 'comments',
    attachments: 'attachments',
    remittance: 'remittance',
    pod: 'proof_of_delivery'
  };


  ngOnInit() {
    const convertedActivatedRoute = this
      .activateRoute as unknown as IActivatedRoute;
    this.paymentViewId = convertedActivatedRoute.params.value.id;
    this.backUrl = (window.history.state as { backUrl?: string })?.backUrl ?? null;
    this.selectedTabName = this.tabItems[0].label;
    this.paymentDetails();
  }

  paymentDetails() {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.isDataLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getPaymentDetails(this.paymentViewId, headerOptions)
        .pipe(finalize(() => this.isDataLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.paymentData = res.data;
              this.isInternationalPayment.set(this.paymentData?.transferMode === 'INTERNATIONAL PAYMENT' || this.paymentData?.transferMode === 'RIPPLE INTERNATIONAL PAYMENT');
              this.isWalletCheckMailPayment.set(this.paymentData?.sourceType === 'WALLET' && this.paymentData?.transferType === 'MAIL' && this.paymentData?.transferTypeCode === 'checkMail');
              this.carrierTrackingNumber =
                res.data.transfer?.shipping?.carrier_tracking_number || '';
              this.checkMailDetails =
                res.data.transfer?.check_mail_record ||
                res.data.transfer?.walletCheck;
              this.zilPaymentId = res.data.zilpaymentId;
              this.getStatements();
              this.getComment();
              this.loadAttachments();
              if (!this.isInternationalPayment()) {
                this.getRemitanceDetails();
              }
              this.getPodAttachemmnts();
              this.paymentStatus = this.paymentData.status.toLowerCase();
              this.paymentType = this.paymentData.transferTypeCode;
              this.signatureUrl = this.paymentData.signatureUrl;
              this.paymentReceiptsId = this.paymentData.payment_receipt_id;

              if (this.signatureUrl) {
                this.singatureUrlLoading = true;
                this.getSignedReceipt();
              }

              if (this.paymentData.metadata?.sentToCustomAddress) {
                this.isCustomShippingTo = true;
                this.customTrackingDetails = {
                  carrier:
                    this.paymentData.transfer?.check_mail_record?.carrier ?? '',
                  carrier_tracking_number:
                    this.paymentData.transfer?.check_mail_record
                      ?.carrier_tracking_number ?? '',
                  carrier_type:
                    this.paymentData.transfer?.check_mail_record
                      ?.carrier_type ?? ''
                };

                this.customPayeeAddress = {
                  name: this.paymentData.payee.name,
                  address_line_1: this.paymentData.payee.addressLine1 ?? '',
                  address_line_2: this.paymentData.payee.addressLine2 ?? '',
                  city: this.paymentData.payee.city ?? '',
                  state: this.paymentData.payee.state ?? '',
                  zip: this.paymentData.payee.zip ?? '',
                  country: this.paymentData.payee.country ?? '',
                  company_name: ''
                };
              }

              this.isRtpPayment =
                this.paymentData?.transferMode === 'RTP' ||
                this.paymentData?.transferMode ===
                  'RIPPLE INTERNATIONAL PAYMENT';
              const canAddInternational =
                this.isInternationalPayment() &&
                !this.isRtpPayment;
              this.canAddInternationalAttachments = canAddInternational;
              this.canAddInternationalComments = canAddInternational;

              if (
                this.paymentData.status === 'COMPLETED' ||
                (this.paymentData.status === 'PROCESSING' &&
                  (this.paymentData.transferTypeCode === 'wire' ||
                    this.paymentData.transferTypeCode === 'ach'))
              ) {
                this.paymentCompleted = true;
              }

              this.shippingMethod = this.formatShippingMethod(
                res.data.metadata?.shippingType
              );
              if (this.isInternationalPayment()) {
                this.tabItems = [
                  { label: 'Attachments', icon: this.faAttachment },
                  { label: 'Comments', icon: this.faComment },
                  { label: 'Signed Receipt', icon: this.faFileInvoice },
                  { label: 'Proof of Delivery', icon: this.faProofOfDelivery }
                ];
                this.selectedTabName = this.tabItems[0].label;
              } else {
                if (this.paymentType === 'giftCard') {
                  this.tabItems = [this.tabItems[5]];
                  this.selectedTabName = this.tabItems[0].label;
                }

                if (this.paymentStatus === 'pending') {
                  this.canEdit = false;
                }
                if (this.paymentStatus !== 'completed') {
                  this.tabItems = this.tabItems.filter(
                    (item) => item.label !== 'Proof of Delivery'
                  );
                }
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

  formatShippingMethod(method: string): string {
    if(method === 'USPS_FIRST_CLASS_MAIL'){
      return 'USPS First Class Mail without tracking';
    }
    if (method) {
      return method
        .split('_')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
    }
    return '';
  }

  switchTab(tab: string) {
    this.detailsTabSwitch.set(tab);
  }

  switchInternationalTab(tab: string) {
    this.internationalDetailsTabSwitch.set(tab);
  }

  getStatements() {
    this.isLoading = true;
    this.subscriptions.push(
      this.psbService
        .getPaidStatements(this.paymentViewId)
        .pipe(finalize(() => {
          this.isLoading = false;
        }))
        .subscribe((res) => {
          if (res?.success) {
            this.statements = res.data;
            this.hasStatementChanges = this.statements.some(
              (item) => !!item.changes
            );
          }
        })
    );
  }

  downloadFile(data: string) {
    window.open(data);
  }

  goBack() {
    if (
      this.isRtpPayment ||
      this.paymentData?.transferMode === 'RIPPLE INTERNATIONAL PAYMENT' ||
      this.paymentData?.transferMode === 'INTERNATIONAL PAYMENT'
    ) {
      // Opened from the payments section — return there instead of international payment
      if (this.backUrl?.startsWith('/manage/payments-table')) {
        this.router.navigateByUrl(this.backUrl);
        return;
      }
      this.router.navigate(['/manage/international-payment/index'], {
        queryParams: {
          tab: 'recent-transactions'
        }
      });
    } else {
      this.router.navigate(['/manage/payments-table/index']);
    }
  }

  loadAttachments() {
    this.isAttachemntLoading.set(true);
    if (this.isInternationalPayment()) {
      this.subscriptions.push(
        this.walletService
          .getAttachmentsInternationalPayment(this.zilPaymentId)
          .pipe(finalize(() => this.isAttachemntLoading.set(false)))
          .subscribe((res) => {
            if (res?.success) {
              this.checkAttachmentData = res.data.map((item) => ({
                ...item,
                fileName: item.file_name,
                billAttach: false
              }));
            }
          })
      );
      return;
    }
    this.subscriptions.push(
      this.sharedService
        .getAttachment('zil-payments', this.zilPaymentId)
        .pipe(finalize(() => this.isAttachemntLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.checkAttachmentData = res.data;
          }
        })
    );
  }

  getComment() {
    this.isCommentLoading.set(true);
    if (this.isInternationalPayment()) {
      this.subscriptions.push(
        this.walletService
          .getCommentsInternationalPayment(this.zilPaymentId)
          .pipe(finalize(() => this.isCommentLoading.set(false)))
          .subscribe((res) => {
            if (res?.success) {
              this.listData = res.data as IComment[];
            }
          })
      );
      return;
    }
    this.subscriptions.push(
      this.sharedService
        .getZilPaymentsComments(this.zilPaymentId)
        .pipe(finalize(() => this.isCommentLoading.set(false)))
        .subscribe((res) => {
          this.listData = res.data;
        })
    );
  }

  /**
   * @description -Retrieves remittance details from the shared service and processes the data.
   */
  getRemitanceDetails() {
    this.isRemittanceLoading.set(true);
    this.subscriptions.push(
      this.sharedService
        .getZilPaymentsRemitance(this.zilPaymentId)
        .pipe(finalize(() => this.isRemittanceLoading.set(false)))
        .subscribe((res) => {
          this.remittanceType = res.data?.type;
          this.remittanceData = res.data?.items_by_array?.filter((obj) =>
            Object.values(obj).some(
              (value) => value !== null && value !== '' && value !== undefined
            )
          );
          if (this.remittanceType !== null && (this.remittanceType !== 0 || (this.remittanceType === 0 && this.isWalletCheckMailPayment()))) {
            this.remittanceTotal = this.remittanceData?.reduce(
              (sum, item) => sum + ((Number(item.thisPayment)) || 0),
              0
            );
          } else {
            this.remittanceTotal = this.remittanceData?.reduce(
              (sum, item) => sum + ((Number(item.totalSingleRow)) || 0),
              0
            );
          }
        })
    );
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

  /**
   * @description -Opens an attachment using the specified encrypted ID.
   * @param encrypId - The encrypted ID of the attachment.
   */
  openAttachment(encrypId: string) {
    if (this.isInternationalPayment()) {
      this.subscriptions.push(
        this.walletService
          .getAttachmentByIdInternationalPayment(this.zilPaymentId, encrypId)
          .subscribe((res) => {
            if (res?.success) {
              window.open(res.data.public_url);
            }
          })
      );
      return;
    }
    this.subscriptions.push(
      this.sharedService
        .openAttachment('zil-payments', this.zilPaymentId, encrypId)
        .subscribe((res) => {
          if (res?.success) {
            window.open(res.data);
          }
        })
    );
  }

  /**
   * @description -Deletes an attachment at the specified index and encrypted ID if provided.
   * @param index  - The index of the attachment to be deleted.
   * @param encId - The encrypted ID of the attachment (optional).
   */
  deleteAttachment(index: number, encId?: string) {
    const data = {
      content: 'This attachment will be deleted permanently'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        if (this.isInternationalPayment()) {
          if (!encId) return;
          this.subscriptions.push(
            this.walletService
              .deleteAttachmentInternationalPayment(this.zilPaymentId, encId)
              .subscribe((res) => {
                if (res?.success) {
                  this.checkAttachmentData.splice(index, 1);
                  this.loadAttachments();
                }
              })
          );
          return;
        }
        this.subscriptions.push(
          this.sharedService
            .deleteAttachment('zil-payments', this.zilPaymentId, encId)
            .subscribe((res) => {
              if (res?.success) {
                this.checkAttachmentData.splice(index, 1);
                this.loadAttachments();
              }
            })
        );
      }
    });
  }

  tabSelection(val: number, tabName: string) {
    this.selectedTabName = tabName;
    this.selectedTab = val;
  }

  splitDate(dateTime: string) {
    if (!dateTime) return '';
    const splitDate = dateTime.split('_');
    return splitDate[0];
  }

  maskRecipientAccountNumber(accountNumber: string | null | undefined): string {
    if (!accountNumber) return '';
    const raw = String(accountNumber);
    if (raw.length <= 4) return raw;
    return `${'*'.repeat(raw.length - 4)}${raw.slice(-4)}`;
  }

  getActionText() {
    if (this.paymentData?.status === 'COMPLETED') {
      if (
        this.paymentData?.sourceType === 'WALLET' &&
        this.paymentData?.transferType === 'CHECK'
      ) {
        return this.paymentData?.transfer?.chequeStatus === 1002
          ? 'Paid'
          : 'Printed';
      }
      return 'Paid';
    }
    if (this.paymentData?.status === 'FAILED') {
      return 'Failed';
    }
    if (this.paymentData?.status === 'CANCELED') {
      return 'Canceled';
    }
    if (this.paymentData?.status === 'PROCESSING') {
      return 'Processing';
    }
    if (this.paymentData?.status === 'PENDING') {
      return 'Pending';
    }
    return undefined;
  }

  openPaymentConfirmationModal() {
    this.router.navigate([`/manage/payments/main/edit/${this.paymentViewId}`], {
      state: { backUrl: this.router.url }
    });
  }

  /**
   * @description Resolves the source display name based on the payment source type.
   */
  getSourceName(): string {
    const source = this.paymentData?.source as {
      name?: string;
      walletName?: string;
      nickName?: string;
    };
    switch (this.paymentData?.sourceType) {
      case 'WALLET':
        return source?.walletName ?? '';
      case 'CARD':
        return source?.nickName ?? '';
      default:
        return source?.name ?? '';
    }
  }

  /**
   * @description Opens the payee bank verification details modal, passing the
   * payment context. On a successful reminder the modal closes with `true`, so
   * we retrigger the statement/log call to reflect the new activity.
   */
  openPayeeBankVerificationDetailsModal() {
    this.dialog
      .open(PayeeBankVerificationDetailsModalComponent, {
        panelClass: 'paddingless-modal-rounded',
        width: '480px',
        maxWidth: '95vw',
        data: {
          uuId: this.paymentViewId,
          paymentDetails: {
            payeeName:
              this.paymentData.payee?.name || this.paymentData.payee_name,
            amount: this.paymentData.amount,
            source: this.getSourceName(),
            transferMode: this.paymentData.transferType,
            status: this.paymentData.status,
            createdAt: this.splitDate(this.paymentData.createdAt),
            receiverAccountNumber:
              this.paymentData.transfer?.receiver_account_number,
              isResendButtonEnabled:this.paymentData.is_micro_deposit_initiated
          }
        } as IPayeeBankVerificationModalData
      })
      .afterClosed()
      .subscribe((isReminderSent) => {
        if (isReminderSent) {
          this.getStatements();
        }
      });
  }

  clonePayment() {
    if (this.isInternationalPayment()) {
      this.router.navigate(
        [
          `/manage/international-payment/main/clone/${this.paymentViewId}`
        ],
        { state: { backUrl: this.router.url, tab: 'new-payment' } }
      );
    }else{
    this.router.navigate(
      [`/manage/payments/main/clone/${this.paymentViewId}`],
      { state: { backUrl: this.router.url } }
    );
    }
  }

  tableHeaders: { label: string; condition?: () => boolean; class?: string }[] =
    [
      { label: 'Invoice Date', condition: () => this.remittanceType === 1 || (this.remittanceType === 0 && this.isWalletCheckMailPayment()) },
      {
        label: 'Invoice',
        class: this.remittanceType === 1 ? 'w-[14%]' : 'w-[14%]'
      },
      { label: 'Item', condition: () => this.remittanceType === 0 && !this.isWalletCheckMailPayment()},
      { label: 'Description' },
      { label: 'Quantity', condition: () => this.remittanceType === 0 && !this.isWalletCheckMailPayment() },
      {
        label: 'Unit Cost',
        class: 'amount_header',
        condition: () => this.remittanceType === 0 && !this.isWalletCheckMailPayment()
      },
      {
        label: 'Total',
        class: 'amount_header',
        condition: () => this.remittanceType === 0 && !this.isWalletCheckMailPayment()
      },
      {
        label: 'Gross',
        class: 'amount_header',
        condition: () => this.remittanceType === 1 || (this.remittanceType === 0 && this.isWalletCheckMailPayment())
      },
      {
        label: 'Discount',
        class: 'amount_header',
        condition: () => this.remittanceType === 1 || (this.remittanceType === 0 && this.isWalletCheckMailPayment())
      },
      {
        label: 'Net',
        class: 'amount_header',
        condition: () => this.remittanceType === 1 || (this.remittanceType === 0 && this.isWalletCheckMailPayment())
      },
      {
        label: 'This Payment',
        class: 'amount_header',
        condition: () => this.remittanceType === 1 || (this.remittanceType === 0 && this.isWalletCheckMailPayment())
      }
    ];

  /**
   *
   * @param index index of the item
   * @param item The actual data
   * @returns value of the item
   */
  trackByFn(index: number, item: IGetAttachment | IGetComment): string {
    return item.encrypted_id;
  }

  trackByFnByIdx(index: number): number {
    return index;
  }

  track(trackingUrl: string): void {
    window.open(trackingUrl);
  }

  copyTrackingNumber(trackingNumber: string) {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      this.tooltip.message = 'Copied!';
      this.tooltip.show();
      setTimeout(() => {
        this.tooltip.message = 'Copy';
        this.tooltip.hide();
      }, 2000);
    }
  }

  getPodAttachemmnts() {
    this.isPodLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getPodFile('zil-payments', this.zilPaymentId)
        .pipe(finalize(() => this.isPodLoading.set(false)))
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
        .downloadPodFile('zil-payments', this.zilPaymentId, id)
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

  sendPaymentProof() {
    this.dialog.open(SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        checkStatus: undefined,
        uuId: this.paymentViewId
      },
      disableClose: true
    });
  }

  /** Share-button tooltip, naming the section it sends. */
  shareTooltip(section: string): string {
    return shareSectionTooltip(this.SHARE_TYPES[section]);
  }

  /** Share is offered only for a tab that actually holds data to send. */
  canShare(section: string): boolean {
    if (!this.zilPaymentId) return false;
    switch (section) {
      case 'comments':
        return this.isInternationalPayment()
          ? !!this.commentsTab?.listData?.length
          : !!this.listData?.length;
      case 'attachments':
        return this.isInternationalPayment()
          ? !!this.attachmentTab?.checkAttachmentData?.length
          : !!this.checkAttachmentData?.length;
      case 'remittance':
        return !!this.remittanceData?.length;
      case 'pod':
        return !!this.podDetails?.length;
      default:
        return false;
    }
  }

  openShareModal(section: string) {
    if (!this.paymentViewId) return;

    this.dialog.open(SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        uuId: this.paymentViewId,
        mode: 'share',
        shareType: this.SHARE_TYPES[section],
        recipientName: this.paymentData?.payee?.name ?? '',
        payee: {
          email: this.paymentData?.payee?.email,
          phone: this.paymentData?.payee?.phone
        },
        amount: this.paymentData?.amount ?? ''
      }
    });
  }
  
  /**
   * Whether this payment still accepts a proof-of-delivery send or request.
   * A proof is requestable once, so the action goes away as soon as one is on
   * record — on top of the conditions the table's action menu disables its
   * item by: the payment has gone through and the rail supports a proof.
   *
   * Caveat: `GET /zil-payments/{uuid}` carries no `pod_status`, so a request
   * that has been sent but not yet fulfilled cannot be detected here. The
   * button stays visible in that window and the server refuses the repeat.
   */
  get canSendPod(): boolean {
    return (
      this.paymentCompleted &&
      !this.isRtpPayment &&
      !this.isPodLoading() &&
      !this.podDetails?.length
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
            uuId: this.paymentViewId,
            encryptedId: this.zilPaymentId,
            mode: 'pod',
            payee: {
              email: this.paymentData?.payee?.email,
              phone: this.paymentData?.payee?.phone
            },
            amount: this.paymentData?.amount
          },
          disableClose: true
        })
        .afterClosed()
        // The dialog resolves without a result whether a request went out or
        // the user backed out, so re-read the proof list either way.
        .subscribe(() => this.getPodAttachemmnts())
    );
  }

  getReceipt() {
    if (!this.paymentCompleted || this.isRtpPayment) {
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
            transactionId: this.paymentData.id,
            payee: {
              email: this.paymentData.payee.email,
              phone: this.paymentData.payee.phone
            },
            canSubmitSignedReceiptRequest: this.canSubmitSignedReceiptRequest,
            zilId: this.zilPaymentId,
            previewData: {
              senderName: this.paymentData.sourceType ?? '',
              payeeName: this.paymentData.payee.name ?? '',
              amount: this.paymentData.amount ?? '',
              address: this.paymentData.payee.addressLine1 ?? '',
              type: this.paymentData.transferType,
              reference: this.paymentData.referenceNo,
              paymentDate: this.paymentData.createdAt
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
          transactionId: this.paymentData.id,
          payee: {
            email: this.paymentData.payee.email,
            phone: this.paymentData.payee.phone
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

    this.subscriptions.push(
      this.paymentsService
        .sendPaymentReceipt(this.paymentData.id, payload)
        .subscribe((res) => {
          this.signatureUrl = res.data;
          this.singatureUrlLoading = false;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
