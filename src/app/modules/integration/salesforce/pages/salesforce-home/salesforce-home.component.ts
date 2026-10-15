import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { Utils } from 'src/app/data/utils';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router, Params } from '@angular/router';
import {
  ISalesforceAccount,
  ISalesforceContact
} from '../../../model/integration';
import { SalesforceContactsTableComponent } from '../../components/salesforce-contacts-table/salesforce-contacts-table.component';

@Component({
  selector: 'app-salesforce-home',
  standalone: true,
  imports: [
    CommonModule,
    CustomerSupportComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    ReactiveFormsModule,
    SalesforceContactsTableComponent
  ],
  templateUrl: './salesforce-home.component.html',
  styleUrl: './salesforce-home.component.scss'
})
export class SalesforceHomeComponent implements OnInit, OnDestroy {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  providerCode = 'salesforce';
  subscriptions: Subscription[] = [];
  salesForceForm: FormGroup;

  // Data
  salesforceAccounts: ISalesforceAccount[] = [];
  selectedAccount: ISalesforceAccount | null = null;
  contacts: ISalesforceContact[] = [];

  // Pagination
  pagination = {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalContacts: 0
  };

  // State
  isConnected = false;
  utils = Utils;

  loading = {
    defaultLoading: false,
    accountsLoading: false,
    contactsLoading: false,
    syncingContacts: false,
    disconnecting: undefined as number | undefined,
    issuingCheck: undefined as string | undefined
  };

  instructions: string[] = [
    'Click on connect',
    'Authenticate with your Salesforce credentials',
    'Select an account to view contacts',
    'Click "Sync Contacts" to import contacts from Salesforce',
    'Click "Issue Check" on a contact to create a payment'
  ];

  ngOnInit(): void {
    this.initFormGroup();
    this.getSalesforceAccounts();
    this.getQueryParams();
  }

  /**
   * Initialize the form group
   */
  initFormGroup(): void {
    this.salesForceForm = this.fb.group({
      selectedAccount: ['']
    });
  }

  /**
   * Get query parameters from the URL for OAuth callback
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res.code) {
        this.onCallBackFromSalesforce(res);
      }
    });
  }

  /**
   * Get connected Salesforce accounts
   */
  getSalesforceAccounts(): void {
    this.loading.accountsLoading = true;

    this.subscriptions.push(
      this.integrationService
        .getSalesforceAccounts()
        .pipe(
          finalize(() => {
            this.loading.accountsLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.salesforceAccounts = res.data || [];
            this.isConnected = this.salesforceAccounts.length > 0;

            // Auto-select first connected account
            const connectedAccount = this.salesforceAccounts.find(
              (a) => a.isConnected
            );
            if (connectedAccount) {
              this.selectAccount(connectedAccount);
            }
          }
        })
    );
  }

  /**
   * Handle OAuth callback from Salesforce
   */
  onCallBackFromSalesforce(params: Params): void {
    if (!params.code) return;

    this.loading.accountsLoading = true;
    this.subscriptions.push(
      this.integrationService.salesforceCallback(params.code).subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.getSalesforceAccounts();
            this.alertService.successAlert({
              content: 'Successfully connected to Salesforce.'
            });
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.accountsLoading = false;
        }
      })
    );
  }

  /**
   * Connect to Salesforce - get OAuth URL and redirect
   */
  onConnectToSalesforce(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.integrationService
        .getSalesforceAuthUrl()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success && res.data?.authorizationUrl) {
            // alert(res.data.authorizationUrl);
            window.open(res.data.authorizationUrl, '_self');
          }
        })
    );
  }

  /**
   * Disconnect a Salesforce account
   */
  ondisconnectToSalesforce(account: ISalesforceAccount, index: number): void {
    const confirm = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect this Salesforce account?'
    });

    confirm.afterClosed().subscribe((r: boolean | undefined) => {
      if (r) {
        this.loading.disconnecting = index;
        this.subscriptions.push(
          this.integrationService
            .disconnectSalesforce(account.id)
            .pipe(
              finalize(() => {
                this.loading.disconnecting = undefined;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  content: 'Successfully disconnected.'
                });
                this.getSalesforceAccounts();
                if (this.selectedAccount?.id === account.id) {
                  this.selectedAccount = null;
                  this.contacts = [];
                }
              }
            })
        );
      }
    });
  }

  /**
   * Select an account to view its contacts
   */
  selectAccount(account: ISalesforceAccount): void {
    this.selectedAccount = account;
    this.pagination.currentPage = 1; // Reset to first page when selecting new account
    this.getContacts(account.id);
  }

  /**
   * Get contacts for a Salesforce account with pagination
   */
  getContacts(accountId: string, page: number = 1): void {
    this.loading.contactsLoading = true;
    this.contacts = [];

    this.subscriptions.push(
      this.integrationService
        .getSalesforceContacts(accountId, page, this.pagination.perPage)
        .pipe(
          finalize(() => {
            this.loading.contactsLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success && res.data) {
            this.contacts = res.data || [];
            this.pagination.currentPage = res.meta.currentPage;
            this.pagination.totalPages = res.meta.lastPage;
            this.pagination.totalContacts = res.meta.total;
          }
        })
    );
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (
      this.selectedAccount &&
      this.pagination.currentPage < this.pagination.totalPages
    ) {
      this.getContacts(
        this.selectedAccount.id,
        this.pagination.currentPage + 1
      );
    }
  }

  /**
   * Go to previous page
   */
  prevPage(): void {
    if (this.selectedAccount && this.pagination.currentPage > 1) {
      this.getContacts(
        this.selectedAccount.id,
        this.pagination.currentPage - 1
      );
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (
      this.selectedAccount &&
      page >= 1 &&
      page <= this.pagination.totalPages
    ) {
      this.getContacts(this.selectedAccount.id, page);
    }
  }

  /**
   * Sync contacts from Salesforce
   */
  syncContacts(): void {
    if (!this.selectedAccount) return;

    this.loading.syncingContacts = true;
    this.subscriptions.push(
      this.integrationService
        .syncSalesforceContacts(this.selectedAccount.id)
        .pipe(
          finalize(() => {
            this.loading.syncingContacts = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: `Successfully synced ${res.data?.totalSynced || 0} contacts.`
            });
            this.pagination.currentPage = 1; // Reset to first page after sync
            if (this.selectedAccount) {
              this.getContacts(this.selectedAccount.id);
            }
          }
        })
    );
  }

  /**
   * Issue check - create payee mapping and navigate to payment page
   */
  issueCheck(contact: ISalesforceContact): void {
    this.loading.issuingCheck = contact.id;

    this.subscriptions.push(
      this.integrationService
        .salesforceIssueCheck(contact.id)
        .pipe(
          finalize(() => {
            this.loading.issuingCheck = undefined;
          })
        )
        .subscribe((res) => {
          if (res.success && res.data?.payeeId) {
            this.router.navigateByUrl(
              `manage/payments/main/pay/bankaccount/check?payee_id=${res.data.payeeId}`
            );
          }
        })
    );
  }

  /**
   * Navigate back to the integrations page
   */
  goBack(): void {
    setTimeout(() => {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
