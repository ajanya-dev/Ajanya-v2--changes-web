import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IConnectedThirdPartyData } from 'src/app/modules/integration/model/integration';
import { V4FreshbooksSettingsModalComponent } from '../../modals/v4-freshbooks-settings-modal/v4-freshbooks-settings-modal.component';

@Component({
  selector: 'app-v4-freshbooks-settings',
  templateUrl: './v4-freshbooks-settings.component.html',
  styleUrls: ['./v4-freshbooks-settings.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, CommonButtonV4Component]
})
export class V4FreshbooksSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  readonly providerCode = 'freshbooks' as const;

  loading = signal({
    dataLoading: false,
    importCompany: false,
    disconnectingIndex: -1
  });

  isConnected = signal(false);
  companies = signal<IConnectedThirdPartyData['companies']>([]);
  freshbooksData = signal<IConnectedThirdPartyData | null>(null);

  ngOnInit(): void {
    this.loadFreshbooksData();
  }

  loadFreshbooksData(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, dataLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.freshbooksData.set(res.data);
          this.isConnected.set(res.data.connected !== 0);
          this.companies.set(res.data.companies || []);
        } else {
          this.freshbooksData.set(null);
          this.isConnected.set(false);
          this.companies.set([]);
        }
      });
  }

  openSettings(): void {
    const data = this.freshbooksData();
    if (!data) return;
    this.dialog.open(V4FreshbooksSettingsModalComponent, {
      maxWidth: '480px',
      width: '90%',
      data,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onImportCompanies(): void {
    if (this.loading().importCompany) {
      return;
    }

    this.loading.update((l) => ({ ...l, importCompany: true }));

    this.integrationService
      .importZohoCompany(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, importCompany: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: res.message || 'Companies added successfully',
            close: true
          });
          this.loadFreshbooksData();
        }
      });
  }

  onDisconnectAll(): void {
    const confirmRef = this.alertService.confirmAlert({
      content:
        'All your connected companies will be disconnected. Are you sure you want to continue?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, dataLoading: true }));

      const payload: { [key: string]: string | number } = { revoke: 1 };

      this.integrationService
        .disConnectFreshbooks(payload)
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, dataLoading: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully disconnected.',
              close: true
            });
            this.loadFreshbooksData();
          }
        });
    });
  }

  onDeleteCompany(companyId: string, index: number): void {
    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect this company?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnectingIndex: index }));

      const payload: { [key: string]: string | number } = {
        companyId
      };

      this.integrationService
        .disConnectFreshbooks(payload)
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnectingIndex: -1 }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully disconnected.',
              close: true
            });
            this.loadFreshbooksData();
          }
        });
    });
  }
}
