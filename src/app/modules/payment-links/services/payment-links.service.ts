import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  SelectedPaymentLink,
  TPaymentLinksCRUpdateData
} from '../../data-table/components/data-table/data-table.model';
import {
  AddNewGetPaidLinkComponent,
  AddOrEditCRLinkDialogData
} from '../../payment-link/modals/add-new-get-paid-link/add-new-get-paid-link.component';
import { EmailLinkModalComponent } from '../../payment-link/modals/email-link-modal/email-link-modal.component';
import {
  PaymentLinksAuditTrailModalComponent,
  PaymentLinksAuditTrailModalData
} from '../modals/payment-links-audit-trail-modal/payment-links-audit-trail-modal.component';

export interface INotificationService {
  error(message: string, title?: string, autoHideAfter?: number): void;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentLinksService {
  private dialog = inject(MatDialog);

  listScrollToEnd = new Subject<boolean>();
  archivedListScrollToEnd = new Subject<boolean>();
  selectedLink = signal<SelectedPaymentLink | undefined>(undefined);
  selectedListTab = signal<string>('active');
  listSearch = new Subject<string>();
  linkDeleted = new Subject<string>();
  linkUpdated = new Subject<0|1>();
  linkRestored = new Subject<string>();

  creditCardEnabled = signal(false);

  openAddOrEditCRLink<T extends 'E' | 'C'>(
    id: string,
    shortUrl: string,
    mode: T,
    data: T extends 'E' ? TPaymentLinksCRUpdateData : undefined
  ) {
    return this.dialog.open<
      AddNewGetPaidLinkComponent,
      AddOrEditCRLinkDialogData<T>,
      boolean
    >(AddNewGetPaidLinkComponent, {
      maxWidth: '420px',
      width: '90%',
      autoFocus: false,
      disableClose:true,
      data: {
        id,
        shortUrl,
        mode,
        data
      }
    });
  }

  openEmailSmsCRLinkModal(
    id: string,
    link: string,
    amount: number,
    bankName: string,
    slugUrl: string,
    type: 'email' | 'sms'
  ) {
    return this.dialog.open<EmailLinkModalComponent, unknown, boolean>(
      EmailLinkModalComponent,
      {
        maxWidth: '420px',
        width: '90%',
        autoFocus: false,
        disableClose:true,
        data: { link, amount, bankName, slugUrl, id, type }
      }
    );
  }

  openAuditTrailModal(id: string) {
    return this.dialog.open<
      PaymentLinksAuditTrailModalComponent,
      PaymentLinksAuditTrailModalData,
      void
    >(PaymentLinksAuditTrailModalComponent, {
      maxWidth: '1000px',
      width: '93%',
      autoFocus: false,
      data: { id }
    });
  }
}
