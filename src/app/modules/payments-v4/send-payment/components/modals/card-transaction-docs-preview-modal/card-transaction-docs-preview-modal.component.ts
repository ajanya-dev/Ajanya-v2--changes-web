import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { finalize, take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ICardTransactionDocsPayload, IPaymentBody } from 'src/app/modules/payments/model/payments';

@Component({
  selector: 'app-v4-card-transaction-docs-preview-modal',
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  templateUrl: './card-transaction-docs-preview-modal.component.html',
  styleUrl: './card-transaction-docs-preview-modal.component.scss'
})
export class V4CardTransactionDocsPreviewModalComponent implements OnInit {
  private paymentService = inject(PaymentsService);
  private headerService = inject(HeaderService);
  private sanitizer = inject(DomSanitizer);
  public data = inject<IPaymentBody & { authSign: string, paymentType: string, companyType?: string, companyId?: string, invoiceNumber?: string, payrollId?: string, zil_payment_uuid?: string, authorizationFlow?: boolean, grandTotal?: number }>(MAT_DIALOG_DATA);

  readonly XIcon = X;

  get confirmText(): string {
    if (!this.data.authorizationFlow) {
      return 'Confirm & Proceed';
    }
    const total = Number(this.data.grandTotal);
    return Number.isFinite(total) && total > 0
      ? `Authorize & Send $${total.toFixed(2)}`
      : 'Authorize & Send';
  }

  documentSafeUrl: SafeResourceUrl;
  isLoading: boolean = false;
  hasError: boolean = false;
  isAgreed = false;

  ngOnInit(): void {
    this.getUserId();
  }

  getUserId() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData.subscribe((res) => {
      const reponse = res as IHeaderData;
      if (reponse.userInfo?.encrypted_id) {
        this.getDocs(reponse.userInfo?.encrypted_id);
      }
    });
  }

  getDocs(userId: string) {
    this.isLoading = true;
    this.hasError = false;
    const invoiceNumber = this.data.payees && this.data.payees[0]?.invoiceNumber || this.data.invoiceNumber;
    const payload: ICardTransactionDocsPayload = {
      user_id: userId as string,
      amount: this.data.amount as string,
      invoiceNumber: invoiceNumber || '',
      memo: this.data.payees && this.data.payees[0]?.memo || '',
      paymentType: this.data.paymentType ?? 'rail',
      authSign: this.data.authSign,
      cardId: this.data.cardId as string,
      payee_phone: this.data.payee_phone as string,
      payees: this.data.payees || [],
      mode: this.data.mode,
      isSameDay: this.data.isSameDay as number,
      email_otp_session_key: this.data.email_otp_session_key || '',
      phone_otp_session_key: this.data.phone_otp_session_key || '',
      zil_payment_uuid: this.data.zil_payment_uuid || '',
      payee_email: this.data.payee_email || ''
    };

    if (this.data.paymentType === 'payroll') {
      payload.companyType = this.data.companyType;
      payload.companyId = this.data.companyId;
      payload.payrollId = this.data.payrollId;
    }

    this.paymentService
      .cardTransactionDocsReview(payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        take(1)
      )
      .subscribe({
        next: (blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.documentSafeUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
        },
        error: () => {
          this.hasError = true;
        }
      });
  }
}
