import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  IPaymentLinksCustomTableRes,
  SelectedPaymentLink,
  TPaymentLinksCRUpdateData
} from 'src/app/modules/data-table/components/data-table/data-table.model';

@Injectable({
  providedIn: 'root'
})
export class V4PaymentLinksService {
  private dialog = inject(MatDialog);

  selectedLink = signal<SelectedPaymentLink | undefined>(undefined);
  creditCardEnabled = signal(false);

  selectedListTab = signal<'active' | 'archived'>('active');

  ngOnDestroy() {
    // Called by DestroyerService on logout — drop per-account state so the next
    // user doesn't see the previous user's selected link / tab on first visit.
    this.selectedLink.set(undefined);
    this.creditCardEnabled.set(false);
    this.selectedListTab.set('active');
  }

  listScrollToEnd = new Subject<boolean>();
  listSearch = new Subject<string>();
  linkDeleted = new Subject<string>();
  linkRestored = new Subject<string>();
  linkUpdated = new Subject<0 | 1>();

  openAddOrEditCRLink<T extends 'E' | 'C'>(
    id: string,
    shortUrl: string,
    mode: T,
    data: T extends 'E' ? TPaymentLinksCRUpdateData : undefined
  ) {
    return import('../modals/add-custom-link-modal/add-custom-link-modal.component').then(
      (c) =>
        this.dialog.open(c.AddCustomLinkModalComponent, {
          maxWidth: '420px',
          width: '90%',
          autoFocus: false,
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { id, shortUrl, mode, data }
        })
    );
  }

  openEmailSmsModal(
    id: string,
    link: string,
    amount: number,
    bankName: string,
    slugUrl: string,
    type: 'email' | 'sms'
  ) {
    return import('../modals/email-sms-modal/email-sms-modal.component').then(
      (c) =>
        this.dialog.open(c.EmailSmsModalComponent, {
          maxWidth: '420px',
          width: '90%',
          autoFocus: false,
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { link, amount, bankName, slugUrl, id, type }
        })
    );
  }

  openImportCsvModal(parentLinkId: string) {
    return import('../modals/import-csv-modal/import-csv-modal.component').then(
      (c) =>
        this.dialog.open(c.ImportCsvModalComponent, {
          width: '700px',
          minWidth: '400px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { parentLinkId }
        })
    );
  }

  openShareLinkModal(linkUrl: string, linkName: string) {
    return import('../modals/share-link-modal/share-link-modal.component').then(
      (c) =>
        this.dialog.open(c.ShareLinkModalComponent, {
          maxWidth: '460px',
          width: '90%',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { linkUrl, linkName }
        })
    );
  }

  openNotificationModal() {
    return import('../modals/notification-modal/notification-modal.component').then(
      (c) =>
        this.dialog.open(c.NotificationModalComponent, {
          width: '900px',
          maxWidth: '95vw',
          panelClass: 'paddingless-modal-rounded'
        })
    );
  }

  openAddCredentialModal(typeId: number) {
    return import('../modals/add-payment-credential-modal/add-payment-credential-modal.component').then(
      (c) =>
        this.dialog.open(c.AddPaymentCredentialModalComponent, {
          maxWidth: '440px',
          width: '90%',
          autoFocus: false,
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { typeId }
        })
    );
  }

  openPaymentsModal(row: IPaymentLinksCustomTableRes) {
    return import('../modals/v4-payments-modal/v4-payments-modal.component').then(
      (c) =>
        this.dialog.open(c.V4PaymentsModalComponent, {
          width: '70%',
          minWidth: '400px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { row }
        })
    );
  }

  openAuditTrailModal(id: string) {
    return import('../modals/audit-trail-modal/audit-trail-modal.component').then(
      (c) =>
        this.dialog.open(c.V4PaymentLinksAuditTrailModalComponent, {
          width: '900px',
          maxWidth: '95vw',
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded',
          data: { id }
        })
    );
  }
}
