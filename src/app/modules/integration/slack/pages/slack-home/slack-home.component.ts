import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SlackEmployeesTableComponent, ISlackPagination } from '../../components/slack-employees-table/slack-employees-table.component';
import { IConnectedThirdPartyData, ISlackEmployee } from '../../../model/integration';

interface ILoadingState {
  defaultLoading: boolean;
  employeesLoading: boolean;
  disconnecting: boolean;
  syncingEmployees: boolean;
  issuingCheck: string | undefined;
}
@Component({
  selector: 'app-slack-home',
  standalone: true,
  imports: [ 
    FormsModule, 
    ReactiveFormsModule, 
    OcwBackButtonComponent,
    CustomerSupportComponent, 
    SlackEmployeesTableComponent,
    CommonButtonV35Component,
    NgClass
  ],
  templateUrl: './slack-home.component.html',
  styleUrl: './slack-home.component.scss'
})
export class SlackHomeComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isConnected = false;
  slackData: IConnectedThirdPartyData ;
  slackEmployees: ISlackEmployee[] = [];
  pagination: ISlackPagination = {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalEmployees: 0
  };

  loading: ILoadingState = {
    defaultLoading: false,
    employeesLoading: false,
    disconnecting: false,
    syncingEmployees: false,
    issuingCheck: undefined as string | undefined
  };

  instructions: string[] = [
    'Click "Connect" to authorize OnlineCheckWriter to access your Slack workspace.',
    'Once connected, sync employees from your Slack workspace.',
    'Select employees to create payees for issuing checks.',
    'Use "Issue Check" to create payee records in OnlineCheckWriter.',
    'Manage your Slack integration and employee sync settings.'
  ];

  ngOnInit() {
    this.getSlackData();
    this.getQueryParams();
  }

  syncEmployees(): void {
    this.loading.syncingEmployees = true;
    this.integrationService
      .importSlackEmployees()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.syncingEmployees = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.getSlackEmployees();
          this.alertService.successAlert({
            content: 'Successfully synced employees from Slack.'
          });
        }
      });
  }

  getSlackEmployees(): void {
    this.loading.employeesLoading = true;
    this.integrationService.getSlackAccounts().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.loading.employeesLoading = false;
      })
    ).subscribe((res) => {
      if (res.success) {
        this.slackEmployees = res.data.employees;
        this.pagination.totalEmployees = res.data.total_employees;
        this.pagination.totalPages = Math.ceil(this.pagination.totalEmployees / this.pagination.perPage);
      }
    });
  }

  issueCheck(employee: ISlackEmployee): void {
    this.loading.issuingCheck = employee.id;
    this.integrationService
      .issueCheckSlack(employee.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.issuingCheck = undefined;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.router.navigateByUrl(
            `manage/payments/main/pay/bankaccount/check?payee_id=${res.data.payeeId}`
          );

        }
      });
  }

  nextPage(): void {
    if (this.pagination.currentPage < this.pagination.totalPages) {
      this.pagination.currentPage++;
    }
  }

  prevPage(): void {
    if (this.pagination.currentPage > 1) {
      this.pagination.currentPage--;
    }
  }

  private getSlackData() {
    this.loading.defaultLoading = true;
    this.integrationService
      .getDetails('slack')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.defaultLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.slackData = res.data;
          this.isConnected = this.slackData.connected === 1;
          if (this.isConnected) {
            this.getSlackEmployees();
          }
        }
      });
  }

  /**
   * Retrieves query parameters from the URL to handle callback from Slack.
   */
  getQueryParams() {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state ) {
        this.onCallBackFromSlack(res);
      }
    });
  }

    /**
   * Handles callback from Slack after successful connection.
   */
  onCallBackFromSlack(params: Params): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

      this.integrationService
        .slackCallback(getParams)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.loading.employeesLoading = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              this.getSlackData();
              this.importSlackEmployees();
            }
          },
          (error) => {
            if (error) {
              this.router.navigate([]);
            }
          }
        );
  }

  /**
   * Imports Slack employees.
   */
  importSlackEmployees() {
    this.syncEmployees();
  }

  onConnectToSlack() {
    this.loading.defaultLoading = true;
    this.integrationService
      .connectToSlack()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.defaultLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          // Handle redirect URL if provided
          if (res.redirectUrl && typeof res.redirectUrl === 'string') {
            window.location.href = res.redirectUrl;
          } else {
            this.alertService.successAlert({
              content: res.message || 'Successfully connected to Slack.'
            });
            this.getSlackData();
          }
        }
      });
  }

  onDisconnectSlack() {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect Slack?'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.loading.disconnecting = true;
        this.integrationService
          .disconnectSlack()
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => {
              this.loading.disconnecting = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.isConnected = false;
              this.slackEmployees = [];
              this.alertService.successAlert({
                content: res.message ||'Successfully disconnected Slack.'
              });
            }
          });
      }
    });
  }
}