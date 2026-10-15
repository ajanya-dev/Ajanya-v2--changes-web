import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { finalize, take } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ICardTransactionDocsPayload, IPaymentBody } from '../../../model/payments';

@Component({
  selector: 'app-card-transaction-docs-preview-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    MatDialogClose,
    FormsModule,
    NgClass
  ],
  templateUrl: './card-transaction-docs-preview-modal.component.html',
  styleUrl: './card-transaction-docs-preview-modal.component.scss'
})
export class CardTransactionDocsPreviewModalComponent implements OnInit {
  private paymentService = inject(PaymentsService);
  private headerService = inject(HeaderService);
  private sanitizer = inject(DomSanitizer);
  public data = inject<IPaymentBody & { authSign: string,paymentType:string ,companyType?:string,companyId?:string,invoiceNumber?:string,payrollId?:string,zil_payment_uuid?:string}>(MAT_DIALOG_DATA);

  documentSafeUrl: SafeResourceUrl;
  isLoading: boolean = false;
  hasError: boolean = false;
  faXmark = faXmark;
  isAgreed = false; // Property to track checkbox state

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
    // Format the payload according to API requirements
    const payload:ICardTransactionDocsPayload = {
      user_id: userId as string,
      amount: this.data.amount as string,
      invoiceNumber: invoiceNumber || '',
      memo: this.data.payees && this.data.payees[0]?.memo || '',
      paymentType: this.data.paymentType ?? 'rail', // Default value as required by API
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

    if(this.data.paymentType === 'payroll'){
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
