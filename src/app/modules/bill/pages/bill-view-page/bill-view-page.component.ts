import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ViewAttachmentsComponent } from 'src/app/shared/components/actions/view-attachments/view-attachments.component';
import { ViewCommentsComponent } from 'src/app/shared/components/actions/view-comments/view-comments.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import {
  IInvoiceRowData,
  IViewBill
} from 'src/app/modules/invoices/model/invoice';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { ViewCommentsComponent as ViewCommentsComponent_1 } from '../../../../shared/components/actions/view-comments/view-comments.component';
import { ViewAuditTrailComponent } from '../../../../shared/components/actions/view-audit-trail/view-audit-trail.component';
import { ViewAttachmentsComponent as ViewAttachmentsComponent_1 } from '../../../../shared/components/actions/view-attachments/view-attachments.component';
import { AddBillModalComponent } from '../../modals/add-bill-modal/add-bill-modal.component';

@Component({
  selector: 'app-bill-view-page',
  templateUrl: './bill-view-page.component.html',
  styleUrls: ['./bill-view-page.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    CommonButtonV35Component,
    MatTabGroup,
    MatTab,
    ViewCommentsComponent_1,
    ViewAttachmentsComponent_1,
    ViewAuditTrailComponent,
    CurrencyPipe,
    TruncatePipe,
    OcwBackButtonComponent,
    MatTooltip,
    TitleCasePipe
  ]
})
export class BillViewPageComponent implements OnInit, OnDestroy {

  private billService = inject(BillService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public dialog = inject(MatDialog);
  public alertService = inject(AlertService);
  public headerService = inject(HeaderService);



  @ViewChild(ViewCommentsComponent)
  private commentComponent: ViewCommentsComponent;

  @ViewChild(ViewAttachmentsComponent)
  private attachComponent: ViewAttachmentsComponent;

  billData: Partial<IViewBill> & Partial<IInvoiceRowData>;
  billId: string;

  voided = false; // bill status 3 for void
  disableActionBtns = false;
  statusText: string;

  subscriptions: Subscription[] = [];
  loading = true;
  backUrl: string = history.state.backUrl;
  paidFromAmount: number;
  importedAppName: string | undefined;
  addAttachmentDisabled: boolean;
  addCommentDisabled: boolean;
  isVoidLoading = false;
  isDeleteLoading = false;
  isPrintLoading = false;
  isLoggedAsUser = signal(false);

  ngOnInit(): void {
    this.billId = this.route.snapshot.params?.id;
    this.billId && this.getViewData();
    this.trackUserLoginStatus();
  }

  trackUserLoginStatus(){
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        this.isLoggedAsUser.set(isUser);
      })
    );
  }

  /**
   * @description  Get the bill data.
   *
   */
  getViewData() {
    this.loading = true;
    this.subscriptions.push(
      this.billService
        .viewBill(this.billId)
        .pipe(finalize(() => {this.loading = false;}))
        .subscribe((data) => {
          if (data?.success) {
            this.billData = data.data as Partial<IViewBill> &
              Partial<IInvoiceRowData>;
            this.isBillingStatusDisabled(String(this.billData.status));
            if (
              data.data.paidFromThirdParty &&
              data.data.paidFromThirdParty !== 0
            ) {
              this.paidFromAmount = data.data.paidFromThirdParty;
              this.importedAppName = data.data.thirdPartyAppName;
            }
            if (
              ((this.billData?.status as number | undefined)?.toString() ??
                '') === '3'
            ) {
              this.voided = true;
              this.statusText = 'VOIDED';
            } else if (
              ((this.billData?.status as number | undefined)?.toString() ??
                '') === '2'
            ) {
              this.statusText = 'PAID';
            }
          }
        })
    );
  }

  /**
   * @description  void the bill.
   *
   */
  voidBill() {
    const alertData = {
      content: 'Are you sure you want to void this bill?'
    };
    const alertRef = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alertRef.afterClosed().subscribe((result) => {
        if (result) {
          this.isVoidLoading = true;
          this.disableActionBtns = true;
          this.subscriptions.push(
            this.billService
              .voidBill(this.billId)
              .pipe(finalize(() => {
                this.disableActionBtns = false;
                this.isVoidLoading = false;
              }))
              .subscribe((res) => {
                if (res?.success) {
                  this.voided = true;
                  this.statusText = 'VOIDED';
                  this.addAttachmentDisabled = true;
                  this.addCommentDisabled = true;
                  const alert = {
                    title: 'Success',
                    content: 'Bill voided.',
                    close: true
                  };
                  this.alertService.successAlert(alert);
                }
              })
          );
        }
      })
    );
  }

  /**
   * @description  Unvoid the bill.
   *
   */
  unVoid() {
    const alertData = {
      content: 'Are you sure you want to unvoid this bill?'
    };
    const alertRef = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alertRef.afterClosed().subscribe((result) => {
        if (result) {
          this.isVoidLoading = true;   
          this.disableActionBtns = true;
          this.subscriptions.push(
            this.billService
              .UnvoidBill([this.billId])
              .pipe(finalize(() => {
                this.disableActionBtns = false;
                this.isVoidLoading = false;
              }))
              .subscribe((res) => {
                if (res.success) {
                  this.voided = false;
                  this.statusText = '';
                  this.addAttachmentDisabled = false;
                  this.addCommentDisabled = false;
                  const alert = {
                    title: 'Success',
                    content: 'Bill unvoided',
                    close: true
                  };
                  this.alertService.successAlert(alert);
                }
              })
          );
        }
      })
    );
  }

  /**
   * @description  void or unvoid bill.
   *
   */
  voidBtnClick() {
    if (this.voided) {
      this.unVoid();
    } else {
      this.voidBill();
    }
  }

  /**
   * @description  edit the bill.
   *
   */
  onEdit() {
    const alert = this.dialog.open(AddBillModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: { billId: this.billId, mode: 'edit' }
    });
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.alertService.successAlert({
            content: 'Bill successfully modified',
            close: true,
            timeout: 2000
          });
          this.getViewData();
        }
      })
    );
  }

  /**
   * @description  Deleting the bill.
   *
   */
  onDelete() {
    const alertData = {
      content: 'Are you sure you want to delete this bill permanently?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) this.deleteRow();
      })
    );
  }

  /**
   * @description  Delete the row of bill.
   *
   */
  deleteRow() {
    this.disableActionBtns = true;
    this.isDeleteLoading = true;
    this.subscriptions.push(
      this.billService
        .deleteBills(this.billId)
        .pipe(finalize(() => {
          this.disableActionBtns = false;
          this.isDeleteLoading = false;
        }))
        .subscribe((res) => {
          if (res.success === true) {
            const alertData = {
              title: 'Success',
              content: 'Bill deleted',
              close: true
            };
            this.alertService.successAlert(alertData);
            this.router.navigate(['manage/bill/index']);
          }
        })
    );
  }

  /**
   * @description  printing the bill.
   *
   */
  singlePrint() {
    this.isPrintLoading = true;
    this.subscriptions.push(
      this.billService.printBill(this.billId)
      .pipe(finalize(() => {
        this.isPrintLoading = false;
      })).subscribe((data) => {
        if (data?.success) {
          const iframe = document.createElement('iframe');
          iframe.srcdoc = data.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      })
    );
  }

  /**
   * @description  Open page for pay bill.
   *
   */
  payBill() {
    this.router.navigate([`manage/cheque/create`], {
      queryParams: { billid: this.billId }
    });
  }

  /**
   * @description  click to back page.
   *
   */
  onGoBack(): void {
    this.router.navigate([this.backUrl]);
  }

  /**
   * @description  Add comment modal.
   *
   */
  onAddcomment() {
    const alert = this.dialog.open(AddCommentsModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { id: this.billId, type: 'bills', enableDelete: true }
    });
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result.refresh) {
          this.commentComponent.getData();
        }
      })
    );
  }

  /**
   * @description  Add attachment modal.
   *
   */
  onAddattachment() {
    const alert = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { id: this.billId, type: 'bills' }
    });
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result.refresh) {
          this.attachComponent.getData();
        }
      })
    );
  }

  /**
   * Checking for disable add attachment
   */
  isBillingStatusDisabled(statusId: string) {    
    if (['2', '3'].includes(statusId)) {
      this.addAttachmentDisabled = true;
    } else {
      this.addAttachmentDisabled = false;
    }

    if (statusId === '3') {
      this.addCommentDisabled = true;
    } else {
      this.addCommentDisabled = false;
    }
  }

  goBack() {
    this.router.navigate(['/manage/bill/index']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
