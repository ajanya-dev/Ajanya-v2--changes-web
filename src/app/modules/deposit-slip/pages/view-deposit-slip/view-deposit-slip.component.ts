import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import {
  IViewCheckdraftItems,
  IViewReceivedPayments
} from 'src/app/modules/deposit-slip/model/depositslips';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, CurrencyPipe } from '@angular/common';
import { IReceiveCheckActivityLog } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { DepositSlipAttachmentsComponent } from '../../components/depositSlip-attachments/depositSlip-attachments.component';
import { DepositSlipCommentsComponent } from '../../components/depositSlip-comments/depositSlip-comments.component';
import { DepositSlipActivitylogComponent } from '../../components/deposit-slip-activitylog/deposit-slip-activitylog.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { DepositSlipLastTransactionsComponent } from '../../components/deposit-slip-last-transactions/deposit-slip-last-transactions.component';
import { faCalculator } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-view-deposit-slip',
  templateUrl: './view-deposit-slip.component.html',
  styleUrls: ['./view-deposit-slip.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    NgClass,
    CommonButtonV35Component,
    FaIconComponent,
    DepositSlipActivitylogComponent,
    DepositSlipCommentsComponent,
    DepositSlipAttachmentsComponent,
    CurrencyPipe,
    DepositSlipLastTransactionsComponent
  ]
})
export class ViewDepositSlipComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private depositService = inject(DepositSlipsService);
  private alertService = inject(AlertService);
  private datatableService = inject(DataTableService);
  private router = inject(Router);
  private checkDraftService = inject(CheckDraftService);
  private requestPaymentService = inject(RequestPaymentsService);
  private activatedRoute = inject(ActivatedRoute);

  subscriptions: Subscription[] = [];
  slipId: string;
  depositData: Params = {};
  checkDraftItems: IViewCheckdraftItems[];
  ReceivedPayments: IViewReceivedPayments[];
  total = { items: 0, grandTotal: 0 };
  selectedTab = 'Deposit slip Activity Log';
  loading = true;
  showMobileMenu = false;
  isPrinted: boolean;
  isVerifying: boolean;
  isPaymentPrinted: boolean = false;
  showPaymentPrintBtn: boolean = true;
  isPaymentPrintDisabled: boolean = true;
  enableBreakdown: boolean = false;
  openBreakdownIndex: number | null = null;
  isVoiding= signal(false);
  denominations = [
    { value: 100, count: 0 },
    { value: 50, count: 0 },
    { value: 20, count: 0 },
    { value: 10, count: 0 },
    { value: 5, count: 0 },
    { value: 1, count: 0 },
    { value: 0.25, count: 0 },
    { value: 0.10, count: 0 },
    { value: 0.05, count: 0 },
    { value: 0.01, count: 0 }
  ];

  faCalculator = faCalculator;

  activityTabLabel: string[] = [
    'Deposit slip Activity Log',
    'Last Deposits',
    'Comments',
    'Attachment'
  ];

  ngOnInit(): void {
    this.isPrinted = false;
    this.slipId = this.route.snapshot.params.slipId;
    this.getData();
    this.getCheckDetails();
  }

  getData() {
    this.subscriptions.push(
      this.depositService
        .getEditBody(this.slipId)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.depositData = data.data;
            if(this.depositData.cash.length > 0 && this.depositData.cash[0].denominations?.length > 0) {
              this.enableBreakdown = true;
            }
            if (this.depositData) {
              this.setCheckType();
            }
            this.countTotal();
          }
        })
    );
  }

  toggleBreakdown(index: number) {
    this.openBreakdownIndex = this.openBreakdownIndex === index ? null : index;
  }

  getTotalDenomination(row: {denominations: {value: number, count: number}[]}): number {
    if (!row?.denominations || !Array.isArray(row.denominations)) return 0;
    return row.denominations.reduce((sum: number, d: { value: number; count: number }) => sum + d.value * d.count, 0);
  }

  setCheckType() {
    this.depositData.check.forEach(
      (checkData: { [key: string]: string }, index: number) => {
        if (checkData.checkType === 'chk') {
          this.depositData.check[index].checkType = 'Business Check';
        } else if (checkData.checkType === 'p-chk') {
          this.depositData.check[index].checkType = 'Personal Check';
        } else if (checkData.checkType === 'mo') {
          this.depositData.check[index].checkType = 'Money Order';
        } else if (checkData.checkType === 'cash chk') {
          this.depositData.check[index].checkType = 'Cashier Check';
        }
      }
    );

    this.depositData.cash.forEach(
      (checkData: { [key: string]: string }, index: number) => {
        if (checkData.checkType === 'coin') {
          this.depositData.cash[index].checkType = 'Coin';
        } else if (checkData.checkType === 'cash') {
          this.depositData.cash[index].checkType = 'Cash';
        }
      }
    );
  }

  clone() {
    this.router.navigate([`/manage/depositslips/clone/${this.slipId}`], {
      relativeTo: this.activatedRoute
    });
  }

  getCheckDetails() {
    this.subscriptions.push(
      this.depositService
        .getCheckDetails(this.slipId)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            if (data?.data.checkDraftItems.length !== 0) {
              this.checkDraftItems = data?.data.checkDraftItems;
            }

            if (data?.data.ReceivedPayments.length !== 0) {
              this.ReceivedPayments = data?.data.ReceivedPayments;
              this.setPaymentsPrintBtn();
            }
          }
        })
    );
  }

  print() {
    if (!this.isPrinted) {
      this.isPrinted = true;
      this.subscriptions.push(
        this.depositService
          .printBulk([this.slipId])
          .subscribe((data: IApiRes<{ printData: string }>) => {
            if (data?.success) {
              const iframes = document.querySelectorAll('iframe');
              for (let i = 0; i < iframes.length; i += 1) {
                iframes[i]?.parentNode?.removeChild(iframes[i]);
              }
              const iframe = document.createElement('iframe');
              iframe.srcdoc = data.data.printData;
              iframe.style.visibility = 'hidden';
              document.body.appendChild(iframe);
              iframe.addEventListener('load', () => {
                this.isPrinted = false;
                iframe.removeEventListener('load', () => {});
              });
            }
          })
      );
    }
  }

  verifySlip() {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to verify this?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.isVerifying = true;
        this.subscriptions.push(
          this.depositService
            .verifySlip(this.slipId)
            .pipe(
              finalize(() => {
                this.isVerifying = false;
              })
            )
            .subscribe((data) => {
              if (data?.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Deposit slip verified',
                  close: true
                });
                this.datatableService.setRefreshStatus(true);
                this.depositData.verified = 1;
              }
            })
        );
      }
    });
  }

  changeActivityTab(tab: string) {
    this.selectedTab = tab;
  }

  countTotal() {
    if (this.depositData?.cash && this.depositData.check) {
      [...this.depositData.cash, ...this.depositData.check].forEach((e) => {
        this.total.items += 1;
        this.total.grandTotal += e.amount * 1;
      });
    }
  }

  numSequence(n: number): Array<number> {
    return Array(n);
  }

  clickToNav(id: string) {
    if (this.checkDraftItems) {
      this.router.navigate([`/manage/checkdraft/view/${id}`]);
    } else {
      this.router.navigate([`/manage/receivedchecks/show/${id}`]);
    }
  }

  printCheck(checkDraftItems: IViewCheckdraftItems[]) {
    const Ids: string[] = [];

    checkDraftItems.forEach((element: IViewCheckdraftItems) => {
      Ids.push(element.id);
    });
    const data = {
      ids: Ids,
      check_design_templete: '1'
    };
    this.subscriptions.push(
      this.checkDraftService.CheckDraftMultiPrint(data).subscribe((res) => {
        if (res.success) {
          window.open(res.data.url);
        }
      })
    );
  }

  setPaymentsPrintBtn() {
    this.ReceivedPayments.forEach((element: IViewReceivedPayments) => {
      this.subscriptions.push(
        this.requestPaymentService
          .recieveCheckActiveLog(element.uuid)
          .subscribe((res) => {
            if (res?.success) {
              res.data.forEach((e: IReceiveCheckActivityLog) => {
                if (e.status === 'printed') {
                  this.showPaymentPrintBtn = false;
                }
              });
            }
            this.isPaymentPrintDisabled = false;
          })
      );
    });
  }

  printPayment(ReceivedPayments: IViewReceivedPayments[]) {
    const uuids: string[] = [];

    ReceivedPayments.forEach((element: IViewReceivedPayments) => {
      uuids.push(element.uuid);
    });
    const data = {
      uuids
    };
    this.isPaymentPrinted = true;
    this.isPaymentPrintDisabled = true;
    this.subscriptions.push(
      this.requestPaymentService
        .printSelected(data)
        .pipe(
          finalize(() => {
            this.isPaymentPrinted = false;
            this.isPaymentPrintDisabled = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            window.open(res.data);
            const resp = this.markAsPrint();
            resp.afterClosed().subscribe((response) => {
              if (response) {
                const datas = {
                  uuids: data.uuids
                };
                this.markAsPrintBulk(datas);
              }
            });
          }
        })
    );
  }

  markAsPrintBulk(data: object) {
    this.subscriptions.push(
      this.requestPaymentService
        .markAsPrintBulkRequest(data)
        .subscribe((res) => {
          if (res.success) {
            /* empty */
            this.setPaymentsPrintBtn();
          }
        })
    );
  }

  editDepositSlip(): void {
    this.router.navigate([`/manage/depositslips/edit/${this.slipId}`], {
      relativeTo: this.activatedRoute
    });
  }

  markAsPrint() {
    const data = {
      title: 'Did you print it correctly?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };
    return this.alertService.confirmAlert(data);
  }

  voidSlip() {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to void this?'
    });

  dRef.afterClosed().subscribe((res) => {
    if (res) {
      this.isVoiding.set(true);
      this.subscriptions.push(
        this.depositService.multiVoid([this.slipId])
        .pipe(
          finalize(() => {
            this.isVoiding.set(false);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Deposit slip voided',
              close: true
            });
            this.datatableService.setRefreshStatus(true);
            this.depositData.verified = 2;
          }
        })
      );
    }
  });
}

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
