import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IConnectedCompanyList,
  IJobberProvider
} from 'src/app/modules/integration/model/integration';
import { jobberConnectedOverride } from '../../jobber-connection-state';

@Component({
  selector: 'app-v4-jobber-settings',
  standalone: true,
  templateUrl: './v4-jobber-settings.component.html',
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4JobberSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal({
    dataLoading: false,
    disconnecting: false
  });

  isConnected = signal(false);
  connectedAccounts = signal<IConnectedCompanyList[]>([]);
  jobberProvider = signal<IJobberProvider | null>(null);

  ngOnInit(): void {
    this.loadJobberData();
    this.listenToQueryParams();
  }

  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['code'] && params['state']) {
          this.onCallBackFromJobber(params);
        }
      });
  }

  loadJobberData(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getDetails('jobber')
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, dataLoading: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          const connected = !!res.data.connected;
          this.isConnected.set(connected);
          jobberConnectedOverride.set(connected);
          this.jobberProvider.set(res.data.provider ?? null);
          this.connectedAccounts.set(res.data.companies ?? []);
        } else {
          this.isConnected.set(false);
          jobberConnectedOverride.set(false);
        }
      });
  }

  private onCallBackFromJobber(params: Params): void {
    if (!params['code'] || !params['state']) return;

    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .jobberCallback(params['code'], params['state'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.loadJobberData();
            this.alertService.successAlert({
              content: 'Successfully connected to Jobber.',
              close: true
            });
          } else {
            this.loading.update((l) => ({ ...l, dataLoading: false }));
            this.alertService.failedAlert({
              content: res.message || 'Failed to connect to Jobber. Please try again.'
            });
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.update((l) => ({ ...l, dataLoading: false }));
          this.alertService.failedAlert({
            content: 'Failed to connect to Jobber. Please try again!'
          });
        }
      });
  }

  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect your Jobber account?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnecting: true }));

      this.integrationService
        .disconnectJobber()
        .pipe(
          finalize(() => this.loading.update((l) => ({ ...l, disconnecting: false }))),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.message || 'Successfully disconnected Jobber.',
              close: true
            });
            this.isConnected.set(false);
            jobberConnectedOverride.set(false);
            this.connectedAccounts.set([]);
            this.jobberProvider.set(null);
          }
        });
    });
  }
}
