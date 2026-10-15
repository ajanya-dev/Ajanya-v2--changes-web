import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ISalesforceAccount } from 'src/app/modules/integration/model/integration';
import { V4SalesforceContactsModalComponent } from '../../modals/v4-salesforce-contacts-modal/v4-salesforce-contacts-modal.component';
import { salesforceConnectedOverride } from '../../salesforce-connection-state';

@Component({
  selector: 'app-v4-salesforce-settings',
  standalone: true,
  templateUrl: './v4-salesforce-settings.component.html',
  styleUrls: ['./v4-salesforce-settings.component.scss'],
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component, MatTooltipModule]
})
export class V4SalesforceSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly providerCode = 'salesforce' as const;

  loading = signal({
    dataLoading: false,
    disconnecting: undefined as undefined | string,
    connecting: false
  });

  isConnected = signal(false);
  salesforceAccounts = signal<ISalesforceAccount[]>([]);

  ngOnInit(): void {
    this.handleOAuthCallback();
    this.loadAccounts();
  }

  // ---------- OAuth callback ----------

  private handleOAuthCallback(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.code) {
          this.onCallBack(params);
        }
      });
  }

  private onCallBack(params: Params): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));
    this.integrationService
      .salesforceCallback(params.code)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, dataLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.router.navigate([], {
            queryParams: {},
            queryParamsHandling: ''
          });
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Successfully connected to Salesforce.',
              close: true
            });
            this.loadAccounts();
          }
        },
        error: () => {
          this.router.navigate([], {
            queryParams: {},
            queryParamsHandling: ''
          });
        }
      });
  }

  // ---------- Loaders ----------

  loadAccounts(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));
    this.integrationService
      .getSalesforceAccounts()
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, dataLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const accounts = res.data || [];
          this.salesforceAccounts.set(accounts);
          const connected = accounts.length > 0;
          this.isConnected.set(connected);
          salesforceConnectedOverride.set(connected);
        } else {
          this.salesforceAccounts.set([]);
          this.isConnected.set(false);
          salesforceConnectedOverride.set(false);
        }
      });
  }

  // ---------- Connect / Disconnect ----------

  onConnect(): void {
    if (this.loading().connecting) return;
    this.loading.update((l) => ({ ...l, connecting: true }));
    this.integrationService
      .getSalesforceAuthUrl()
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, connecting: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.data?.authorizationUrl) {
          window.open(res.data.authorizationUrl, '_self');
        }
      });
  }

  onDisconnect(account: ISalesforceAccount): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect this Salesforce account?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.update((l) => ({ ...l, disconnecting: account.id }));
      this.integrationService
        .disconnectSalesforce(account.id)
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnecting: undefined }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Disconnected successfully.',
              close: true
            });
            this.loadAccounts();
          }
        });
    });
  }

  // ---------- Modal openers ----------

  openContactsModal(account: ISalesforceAccount): void {
    this.dialog.open(V4SalesforceContactsModalComponent, {
      maxWidth: '1100px',
      width: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { account }
    });
  }
}
