import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  ISalesforceAccount,
  ISalesforceContact
} from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-salesforce-contacts-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-salesforce-contacts-modal.component.html',
  styleUrls: ['./v4-salesforce-contacts-modal.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4SalesforceContactsModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<V4SalesforceContactsModalComponent>);
  private paymentsV4Service = inject(PaymentsV4Service);

  readonly data: { account: ISalesforceAccount } = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  syncing = signal(false);
  issuingCheck = signal<string | null>(null);
  contacts = signal<ISalesforceContact[]>([]);

  pagination = signal({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalContacts: 0
  });

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(page: number = 1): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.integrationService
      .getSalesforceContacts(
        this.data.account.id,
        page,
        this.pagination().perPage
      )
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.contacts.set(res.data || []);
          this.pagination.update((p) => ({
            ...p,
            currentPage: res.meta.currentPage,
            totalPages: res.meta.lastPage,
            totalContacts: res.meta.total
          }));
        }
        this.cdr.markForCheck();
      });
  }

  syncContacts(): void {
    this.syncing.set(true);
    this.cdr.markForCheck();
    this.integrationService
      .syncSalesforceContacts(this.data.account.id)
      .pipe(
        finalize(() => {
          this.syncing.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: `Successfully synced ${res.data?.totalSynced || 0} contacts.`,
            close: true
          });
          this.loadContacts();
        }
      });
  }

  issueCheck(contact: ISalesforceContact): void {
    this.issuingCheck.set(contact.id);
    this.cdr.markForCheck();
    this.integrationService
      .salesforceIssueCheck(contact.id)
      .pipe(
        finalize(() => {
          this.issuingCheck.set(null);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data?.payeeId) {
          this.dialogRef.close();
          this.paymentsV4Service.openSendModal({
            payeeId: res.data.payeeId
          });
        }
      });
  }

  nextPage(): void {
    const p = this.pagination();
    if (p.currentPage < p.totalPages) {
      this.loadContacts(p.currentPage + 1);
    }
  }

  prevPage(): void {
    const p = this.pagination();
    if (p.currentPage > 1) {
      this.loadContacts(p.currentPage - 1);
    }
  }
}
