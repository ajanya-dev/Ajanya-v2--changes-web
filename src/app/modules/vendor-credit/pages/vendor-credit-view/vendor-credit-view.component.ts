import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { ViewAttachmentsComponent } from 'src/app/shared/components/actions/view-attachments/view-attachments.component';
import { ViewCommentsComponent } from 'src/app/shared/components/actions/view-comments/view-comments.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import {
  CommonModule,
  CurrencyPipe,
  NgClass,
  NgOptimizedImage
} from '@angular/common';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { ViewAttachmentsComponent as ViewAttachmentsComponent_1 } from '../../../../shared/components/actions/view-attachments/view-attachments.component';
import { ViewCommentsComponent as ViewCommentsComponent_1 } from '../../../../shared/components/actions/view-comments/view-comments.component';
import { ViewAuditTrailComponent } from '../../../../shared/components/actions/view-audit-trail/view-audit-trail.component';
import { IVendorPayment, IVendorViewData } from '../../model/vendor';

interface IViewItem {
  label: string;
  value: string | number;
  type?: 'text' | 'currency';
}

@Component({
  selector: 'app-vendor-credit-view',
  templateUrl: './vendor-credit-view.component.html',
  styleUrls: ['./vendor-credit-view.component.scss'],
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    ViewAuditTrailComponent,
    ViewCommentsComponent_1,
    ViewAttachmentsComponent_1,
    CurrencyPipe,
    NgClass,
    OcwBackButtonComponent,
    CommonButtonV35Component,
    TruncatePipe,
    MatTooltip,
    NgOptimizedImage,
    CommonModule
  ]
})
export class VendorCreditViewComponent implements OnInit, OnDestroy {
  private vendorService = inject(VendorService);
  private dialog = inject(MatDialog);
  private activateRoute = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild(ViewCommentsComponent)
  private commentComponent: ViewCommentsComponent;

  @ViewChild(ViewAttachmentsComponent)
  private attachComponent: ViewAttachmentsComponent;

  @ViewChild(ViewAuditTrailComponent)
  private auditTrailComponent: ViewAuditTrailComponent;

  viewItems: IViewItem[] = [];
  vendorId: string;
  isLoading = signal(false);
  paymentsData: IVendorPayment[] = [];
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.vendorId = this.activateRoute.snapshot.params?.id;
    this.getViewData(this.vendorId);
  }

  getViewData(vendorId: string) {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.vendorService
        .getVendorView(vendorId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.prepareViewItems(data?.data);
            if (data?.data?.payments?.length > 0) {
              this.paymentsData = data?.data?.payments;
            }
          }
        })
    );
  }

  prepareViewItems(vendorData: IVendorViewData) {
    if (!vendorData) return;

    this.viewItems = [
      ...(vendorData.is_bill
        ? [{
        label: 'Bill Invoice Number',
        value: vendorData.billInvNo || ''
      }] : [{
        label: 'Vendor/Payee',
        value: vendorData.payeeName
      }]),
      {
        label: 'Credit Date',
        value: vendorData.creditDate
      },
      {
        label: 'Credit #',
        value: vendorData.creditNumber
      },
      {
        label: 'Used',
        value: Number(vendorData.total) - Number(vendorData.balance),
        type: 'currency'
      },
      {
        label: 'Balance',
        value: vendorData.balance,
        type: 'currency'
      },
      {
        label: 'Total',
        value: vendorData.total,
        type: 'currency'
      }
    ];
  }

  goToCheck(checkId: string, paymentType:number) {
    if(paymentType === 1){
      this.router.navigate([`manage/bill/view/${checkId}`]);
    }else{
      this.router.navigate([`manage/cheque/view/${checkId}`]);
    }
  }

  onAddcomment() {
    const alert = this.dialog.open(AddCommentsModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: {
        id: this.vendorId,
        type: 'vendor-credits'
      }
    });

    alert.afterClosed().subscribe(() => {
      this.commentComponent.getData();
      this.auditTrailComponent.getData();
    });
  }

  onAddattachment() {
    const alert = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: {
        id: this.vendorId,
        type: 'vendor-credits'
      }
    });

    alert.afterClosed().subscribe(() => {
      this.attachComponent.getData();
      this.auditTrailComponent.getData();
    });
  }

  goBack() {
    this.router.navigate([`manage/vendor-credit/index`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
