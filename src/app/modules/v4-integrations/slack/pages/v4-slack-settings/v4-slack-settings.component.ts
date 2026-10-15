import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { ISlackEmployee } from 'src/app/modules/integration/model/integration';
import { slackConnectedOverride } from '../../slack-connection-state';

@Component({
  selector: 'app-v4-slack-settings',
  standalone: true,
  templateUrl: './v4-slack-settings.component.html',
  styleUrls: ['./v4-slack-settings.component.scss'],
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4SlackSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal({
    dataLoading: false,
    connecting: false,
    disconnecting: false,
    syncingEmployees: false,
    issuingCheck: undefined as string | undefined
  });

  isConnected = signal(false);
  slackEmployees = signal<ISlackEmployee[]>([]);
  workspaceName = signal('');

  pagination = signal({
    currentPage: 1,
    perPage: 10,
    totalEmployees: 0,
    totalPages: 1
  });

  get paginatedEmployees(): ISlackEmployee[] {
    const { currentPage, perPage } = this.pagination();
    const start = (currentPage - 1) * perPage;
    return this.slackEmployees().slice(start, start + perPage);
  }

  ngOnInit(): void {
    this.loadSlackData();
    this.listenToQueryParams();
  }

  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['code'] && params['state']) {
          this.onCallBackFromSlack(params);
        }
      });
  }

  loadSlackData(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getDetails('slack')
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, dataLoading: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          const connected = res.data.connected === 1;
          this.isConnected.set(connected);
          slackConnectedOverride.set(connected);
          if (connected) {
            this.getSlackEmployees();
          }
        } else {
          this.isConnected.set(false);
          slackConnectedOverride.set(false);
        }
      });
  }

  private onCallBackFromSlack(params: Params): void {
    let queryString = '';
    for (const [key, value] of Object.entries(params)) {
      queryString += `${key}=${value}&`;
    }

    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .slackCallback(queryString)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.loadSlackData();
            this.onSyncEmployees();
            this.alertService.successAlert({
              content: 'Successfully connected to Slack.',
              close: true
            });
          } else {
            this.loading.update((l) => ({ ...l, dataLoading: false }));
            this.alertService.failedAlert({
              content: 'Failed to connect to Slack. Please try again.'
            });
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.update((l) => ({ ...l, dataLoading: false }));
          this.alertService.failedAlert({
            content: 'Failed to connect to Slack. Please try again!'
          });
        }
      });
  }

  onConnect(): void {
    this.loading.update((l) => ({ ...l, connecting: true }));

    this.integrationService
      .connectToSlack()
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, connecting: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        } else {
          this.alertService.failedAlert({
            content: 'Failed to get Slack connection URL. Please try again.'
          });
        }
      });
  }

  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect your Slack workspace?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnecting: true }));

      this.integrationService
        .disconnectSlack()
        .pipe(
          finalize(() => this.loading.update((l) => ({ ...l, disconnecting: false }))),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.message || 'Successfully disconnected Slack.',
              close: true
            });
            this.isConnected.set(false);
            slackConnectedOverride.set(false);
            this.slackEmployees.set([]);
            this.workspaceName.set('');
            this.pagination.set({ currentPage: 1, perPage: 10, totalEmployees: 0, totalPages: 1 });
          }
        });
    });
  }

  onSyncEmployees(): void {
    this.loading.update((l) => ({ ...l, syncingEmployees: true }));

    this.integrationService
      .importSlackEmployees()
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, syncingEmployees: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully synced employees from Slack.',
            close: true
          });
          this.getSlackEmployees();
        }
      });
  }

  getSlackEmployees(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getSlackAccounts()
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, dataLoading: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const employees = res.data.employees ?? [];
          this.slackEmployees.set(employees);
          if (employees.length > 0) {
            this.workspaceName.set(employees[0].workspace_name ?? '');
          }
          const total = res.data.total_employees ?? employees.length;
          const perPage = this.pagination().perPage;
          this.pagination.update((p) => ({
            ...p,
            totalEmployees: total,
            totalPages: Math.ceil(total / perPage)
          }));
        }
      });
  }

  onIssueCheck(employee: ISlackEmployee): void {
    this.loading.update((l) => ({ ...l, issuingCheck: employee.id }));

    this.integrationService
      .issueCheckSlack(employee.id)
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, issuingCheck: undefined }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.paymentsV4Service.openSendModal({ payeeId: res.data.payeeId });
        }
      });
  }

  onNextPage(): void {
    const { currentPage, totalPages } = this.pagination();
    if (currentPage < totalPages) {
      this.pagination.update((p) => ({ ...p, currentPage: p.currentPage + 1 }));
    }
  }

  onPrevPage(): void {
    const { currentPage } = this.pagination();
    if (currentPage > 1) {
      this.pagination.update((p) => ({ ...p, currentPage: p.currentPage - 1 }));
    }
  }

  getDisplayName(employee: ISlackEmployee): string {
    return employee.display_name || employee.full_name || `${employee.first_name} ${employee.last_name}`.trim();
  }

  getUserRole(employee: ISlackEmployee): string {
    if (employee.is_owner) return 'Owner';
    if (employee.is_admin) return 'Admin';
    return 'Member';
  }
}
