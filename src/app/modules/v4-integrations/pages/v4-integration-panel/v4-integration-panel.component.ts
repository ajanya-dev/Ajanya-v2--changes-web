import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, NgComponentOutlet } from '@angular/common';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ISampleFiles } from 'src/app/modules/integration/pages/payrollcheck-integration/payrollcheck-integration.component';
import { ScriptService } from 'src/app/core/services/script.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { IV4IntegrationApp } from '../../data/v4-integration-data';
import {
  V4NetsuiteSettingsComponent,
  netsuiteConnectedOverride
} from '../../netsuite/pages/v4-netsuite-settings/v4-netsuite-settings.component';
import { V4QuickbooksOnlineComponent } from '../../quick-books/pages/v4-quickbooks-online/v4-quickbooks-online.component';
import { V4QuickbooksDesktopComponent } from '../../quick-books/pages/v4-quickbooks-desktop/v4-quickbooks-desktop.component';
import { V4FreshbooksSettingsComponent } from '../../freshbooks/pages/v4-freshbooks-settings/v4-freshbooks-settings.component';
import { V4ZohoBooksSettingsComponent } from '../../zoho/pages/v4-zoho-books-settings/v4-zoho-books-settings.component';
import { V4CheckFromPdfSettingsComponent } from '../../check-from-pdf/pages/v4-check-from-pdf-settings/v4-check-from-pdf-settings.component';
import { V4TrustbooksSettingsComponent } from '../../check-from-pdf/pages/v4-trustbooks-settings/v4-trustbooks-settings.component';
import { V4GustoSettingsComponent } from '../../gusto/pages/v4-gusto-settings/v4-gusto-settings.component';
import { gustoConnectedOverride } from '../../gusto/gusto-connection-state';
import { V4QuickbooksPayrollSettingsComponent } from '../../quickbooks-payroll/pages/v4-quickbooks-payroll-settings/v4-quickbooks-payroll-settings.component';
import { quickbooksPayrollConnectedOverride } from '../../quickbooks-payroll/quickbooks-payroll-connection-state';
import { V4BillcomSettingsComponent } from '../../billcom/pages/v4-billcom-settings/v4-billcom-settings.component';
import {
  billcomConnectModalTrigger,
  billcomConnectedOverride
} from '../../billcom/billcom-connection-state';
import { V4HubspotSettingsComponent } from '../../hubspot/pages/v4-hubspot-settings/v4-hubspot-settings.component';
import { hubspotConnectedOverride } from '../../hubspot/hubspot-connection-state';
import { V4ClioSettingsComponent } from '../../clio/pages/v4-clio-settings/v4-clio-settings.component';
import { clioConnectedOverride } from '../../clio/clio-connection-state';
import { V4SalesforceSettingsComponent } from '../../salesforce/pages/v4-salesforce-settings/v4-salesforce-settings.component';
import { salesforceConnectedOverride } from '../../salesforce/salesforce-connection-state';
import { V4XeroSettingsComponent } from '../../xero/pages/v4-xero-settings/v4-xero-settings.component';
import { xeroConnectedOverride } from '../../xero/xero-connection-state';
import { V4SlackSettingsComponent } from '../../slack/pages/v4-slack-settings/v4-slack-settings.component';
import { slackConnectedOverride } from '../../slack/slack-connection-state';
import { V4OdooSettingsComponent } from '../../odoo/pages/v4-odoo-settings/v4-odoo-settings.component';
import { odooConnectedOverride } from '../../odoo/odoo-connection-state';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { V4JobberSettingsComponent } from '../../jobber/pages/v4-jobber-settings/v4-jobber-settings.component';
import { jobberConnectedOverride } from '../../jobber/jobber-connection-state';
import { V4ZohoPayrollSettingsComponent } from '../../zoho-payroll/pages/v4-zoho-payroll-settings/v4-zoho-payroll-settings.component';
import { zohoPayrollConnectedOverride } from '../../zoho-payroll/zoho-payroll-connection-state';
import { V4WaveSettingsComponent } from '../../wave/pages/v4-wave-settings/v4-wave-settings.component';
import { waveConnectedOverride } from '../../wave/wave-connection-state';
import { V4SquareSettingsComponent } from '../../square/pages/v4-square-settings/v4-square-settings.component';
import { squareConnectedOverride } from '../../square/square-connection-state';
import { V4SageBusinessSettingsComponent } from '../../sage-business/pages/v4-sage-business-settings/v4-sage-business-settings.component';
import { sageBusinessConnectedOverride } from '../../sage-business/sage-business-connection-state';
import { V4ShopifySettingsComponent } from '../../shopify/pages/v4-shopify-settings/v4-shopify-settings.component';
import { shopifyConnectedOverride } from '../../shopify/shopify-connection-state';

@Component({
  selector: 'app-v4-integration-panel',
  templateUrl: './v4-integration-panel.component.html',
  styleUrls: ['./v4-integration-panel.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgComponentOutlet,
    LucideAngularModule,
    CommonButtonV4Component,
    DetailSidePanelComponent
  ]
})
export class V4IntegrationPanelComponent {
  private integrationService = inject(IntegrationService);
  private odooService = inject(OdooService);
  private scriptService = inject(ScriptService);
  private destroyRef = inject(DestroyRef);

  app = input<IV4IntegrationApp | null>(null);
  isOpen = input<boolean>(false);
  closed = output<void>();
  connect = output<IV4IntegrationApp>();
  disconnect = output<IV4IntegrationApp>();

  activeTab = signal<'overview' | 'settings'>('overview');
  connecting = signal(false);
  sampleFilesLoading = signal(false);

  sampleFilesList = signal([
    {
      value: 'quickbooksDesktop',
      label: 'QuickBooks Desktop Payroll',
      file: '',
      color: 'green'
    },
    {
      value: 'quickbooksOnline',
      label: 'QuickBooks Online Payroll',
      file: '',
      color: 'blue'
    },
    { value: 'zoho', label: 'Zoho Payroll', file: '', color: 'yellow' },
    {
      value: 'trustbooks',
      label: 'Trustbooks Payroll',
      file: '',
      color: 'violet'
    },
    { value: 'bill', label: 'Bills & Invoices', file: '', color: 'red' }
  ]);

  isCheckFromPdf = computed(() => {
    const id = this.app()?.id;
    return (
      id === 'check-from-pdf' || id === 'trust-books' || id === 'qb-payroll'
    );
  });

  isTrustBooks = computed(() => this.app()?.id === 'trust-books');

  /** Map of app IDs to their settings components */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private settingsComponentMap: Record<string, any> = {
    netsuite: V4NetsuiteSettingsComponent,
    'qb-online': V4QuickbooksOnlineComponent,
    'qb-desktop': V4QuickbooksDesktopComponent,
    freshbook: V4FreshbooksSettingsComponent,
    zoho: V4ZohoBooksSettingsComponent,
    gusto: V4GustoSettingsComponent,
    'quickbooks-payroll': V4QuickbooksPayrollSettingsComponent,
    'check-from-pdf': V4CheckFromPdfSettingsComponent,
    'trust-books': V4TrustbooksSettingsComponent,
    'qb-payroll': V4CheckFromPdfSettingsComponent,
    bill: V4BillcomSettingsComponent,
    hubspot: V4HubspotSettingsComponent,
    clio: V4ClioSettingsComponent,
    salesforce: V4SalesforceSettingsComponent,
    xero: V4XeroSettingsComponent,
    slack: V4SlackSettingsComponent,
    odoo: V4OdooSettingsComponent,
    jobber: V4JobberSettingsComponent,
    'Zoho-payroll': V4ZohoPayrollSettingsComponent,
    wave: V4WaveSettingsComponent,
    square: V4SquareSettingsComponent,
    'sage-business': V4SageBusinessSettingsComponent,
    shopify: V4ShopifySettingsComponent
  };

  settingsComponent = computed(() => {
    const currentApp = this.app();
    if (!currentApp) return null;
    return this.settingsComponentMap[currentApp.id] ?? null;
  });

  /**
   * Effective connection status. For Gusto, the settings tab can publish a
   * fresher value via `gustoConnectedOverride` so the Overview tab reflects
   * a connection without waiting for the parent integrations page to refresh.
   */
  effectiveIsConnected = computed(() => {
    const currentApp = this.app();
    if (!currentApp) return false;
    if (currentApp.id === 'netsuite') {
      const overlay = netsuiteConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'gusto') {
      const overlay = gustoConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'quickbooks-payroll') {
      const overlay = quickbooksPayrollConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'bill') {
      const overlay = billcomConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'hubspot') {
      const overlay = hubspotConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'clio') {
      const overlay = clioConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'salesforce') {
      const overlay = salesforceConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'xero') {
      const overlay = xeroConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'slack') {
      const overlay = slackConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'odoo') {
      const overlay = odooConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'jobber') {
      const overlay = jobberConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'Zoho-payroll') {
      const overlay = zohoPayrollConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'wave') {
      const overlay = waveConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'square') {
      const overlay = squareConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'sage-business') {
      const overlay = sageBusinessConnectedOverride();
      if (overlay !== null) return overlay;
    }
    if (currentApp.id === 'shopify') {
      const overlay = shopifyConnectedOverride();
      if (overlay !== null) return overlay;
    }
    return !!currentApp.isConnected;
  });

  statusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    if (this.effectiveIsConnected()) {
      return {
        text: 'Connected',
        color: 'var(--v4-badge-success-text-color)',
        bgColor: 'var(--v4-badge-success-bg-color)'
      };
    }
    return undefined;
  });

  /** Dynamic instructions that account for QB Desktop version switching */
  panelInstructions = computed(() => {
    const currentApp = this.app();
    if (
      currentApp?.id === 'qb-desktop' &&
      IntegrationService.qbDesktopOldVersion()
    ) {
      return [
        'Install CheckPrintingSoftware.exe',
        'If your QuickBooks Desktop is installed on a server, make sure you have full administrative rights before the installation.'
      ];
    }
    return currentApp?.instructions ?? [];
  });

  constructor() {
    effect(
      () => {
        this.app();
        this.activeTab.set('overview');
      },
      { allowSignalWrites: true }
    );

    // Switch to overview tab when QB Desktop version changes
    effect(
      () => {
        IntegrationService.qbDesktopOldVersion();
        if (this.app()?.id === 'qb-desktop') {
          this.activeTab.set('overview');
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Bill.com live connection state when its panel is opened so the
    // Overview tab's Connect button can hide immediately, without waiting on
    // the settings tab component to instantiate and propagate state.
    effect(
      () => {
        if (this.app()?.id === 'bill' && this.isOpen()) {
          this.integrationService
            .getBillOrgs()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                billcomConnectedOverride.set((res.data?.length ?? 0) > 0);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve HubSpot live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'hubspot' && this.isOpen()) {
          this.integrationService
            .getDetails('hubspot')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                hubspotConnectedOverride.set(!!res.data?.connected);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Clio live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'clio' && this.isOpen()) {
          this.integrationService
            .getDetails('clio')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                clioConnectedOverride.set(!!res.data?.connected);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Salesforce live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'salesforce' && this.isOpen()) {
          this.integrationService
            .getSalesforceAccounts()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                salesforceConnectedOverride.set(
                  (res.data?.length ?? 0) > 0
                );
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Xero live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'xero' && this.isOpen()) {
          this.integrationService
            .getDetails('xero')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                xeroConnectedOverride.set(!!res.data?.connected);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Slack live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'slack' && this.isOpen()) {
          this.integrationService
            .getDetails('slack')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                slackConnectedOverride.set(res.data?.connected === 1);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Odoo live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'odoo' && this.isOpen()) {
          this.odooService
            .getOdooConnectionDetails()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                odooConnectedOverride.set(res.data?.connected !== 0);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Jobber live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'jobber' && this.isOpen()) {
          this.integrationService
            .getDetails('jobber')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                jobberConnectedOverride.set(!!res.data?.connected);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Wave live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'wave' && this.isOpen()) {
          this.integrationService
            .getDetails('wave')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                waveConnectedOverride.set(!!res.data?.connected);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Square live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'square' && this.isOpen()) {
          this.integrationService
            .getSquareDetails()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                squareConnectedOverride.set(res.data?.connected === 1);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Resolve Sage Business live connection state when its panel is opened
    effect(
      () => {
        if (this.app()?.id === 'sage-business' && this.isOpen()) {
          this.integrationService
            .getDetails('sage_business')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                sageBusinessConnectedOverride.set(!!res.data?.connected);
              }
            });
        }
      },
      { allowSignalWrites: true }
    );

    // Load sample files when check-from-pdf panel is opened
    effect(
      () => {
        if (this.isCheckFromPdf() && this.isOpen()) {
          this.onLoadCheckSampleFiles();
        }
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * Loads sample files for payroll checks (same as v3).
   */
  onLoadCheckSampleFiles(): void {
    this.sampleFilesLoading.set(true);
    this.integrationService
      .getPayrollCheckSampleFiles()
      .pipe(
        finalize(() => this.sampleFilesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          const sampleFiles = res.data;
          this.sampleFilesList.update((prev) =>
            prev.map((obj) => ({
              ...obj,
              file:
                (sampleFiles[obj.value as keyof ISampleFiles] as string) || ''
            }))
          );
        }
      });
  }

  close(): void {
    this.closed.emit();
  }

  onConnect(): void {
    const currentApp = this.app();
    if (!currentApp) return;

    switch (currentApp.id) {
      case 'qb-online':
        this.connectQuickBooksOnline();
        break;
      case 'qb-desktop':
        this.activeTab.set('settings');
        break;
      case 'bill':
        // Ask the bill settings component to open its connect modal.
        billcomConnectModalTrigger.update((n) => n + 1);
        break;
      case 'freshbook':
        this.connectFreshBooks();
        break;
      case 'zoho':
        this.connectZohoBooks();
        break;
      case 'gusto':
        this.connectGusto();
        break;
      case 'quickbooks-payroll':
        this.connectQuickbooksPayroll();
        break;
      case 'Zoho-payroll':
        this.connectZohoPayroll();
        break;
      case 'hubspot':
        this.connectHubSpot();
        break;
      case 'clio':
        this.connectClio();
        break;
      case 'salesforce':
        this.connectSalesforce();
        break;
      case 'jobber':
        this.connectJobber();
        break;
      case 'square':
        this.connectSquare();
        break;
      case 'xero':
        this.connectXero();
        break;
      case 'slack':
        this.connectSlack();
        break;
      case 'wave':
        this.connectWave();
        break;
      case 'sage-business':
        this.connectSageBusiness();
        break;
      case 'zapier':
        this.connectZapier();
        break;
      default:
        this.connect.emit(currentApp);
        break;
    }
  }

  private connectSlack(): void {
    this.connecting.set(true);
    this.integrationService
      .connectToSlack()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectWave(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('wave')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectZapier(): void {
    this.connecting.set(true);
    this.integrationService
      .getZapierData()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res.data?.connectLink) {
          window.open(res.data.connectLink, '_self');
        }
      });
  }

  private connectXero(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('xero')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectSageBusiness(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('sage_business')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectFreshBooks(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('freshbooks')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectZohoBooks(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('zoho_books')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectGusto(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('gusto')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  /**
   * QuickBooks Payroll uses its own connect endpoint, not the generic
   * third-party one, so the Overview tab must call the same API the Settings
   * tab does.
   */
  private connectQuickbooksPayroll(): void {
    this.connecting.set(true);
    this.integrationService
      .connectQuickbooksPayroll()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.data?.url) {
          window.open(res.data.url, '_self');
        }
      });
  }

  private connectZohoPayroll(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrl('zoho_payroll')
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectHubSpot(): void {
    this.connecting.set(true);
    this.integrationService
      .connectToHubSpot()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectClio(): void {
    this.connecting.set(true);
    this.integrationService
      .connectToClio()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectSalesforce(): void {
    this.connecting.set(true);
    this.integrationService
      .getSalesforceAuthUrl()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.data?.authorizationUrl) {
          window.open(res.data.authorizationUrl, '_self');
        }
      });
  }

  private connectJobber(): void {
    this.connecting.set(true);
    this.integrationService
      .connectToJobber()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  private connectSquare(): void {
    this.connecting.set(true);
    this.integrationService
      .getConnectionUrlForSquare()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.data?.url) {
          window.open(res.data.url, '_self');
        }
      });
  }

  private connectQuickBooksOnline(): void {
    this.connecting.set(true);
    this.integrationService
      .connectToQuickBooksOnline()
      .pipe(
        finalize(() => this.connecting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.scriptService.gtagEventScript('qbonline-init');
          window.open(res?.redirectUrl, '_self');
        }
      });
  }

  onDisconnect(): void {
    const currentApp = this.app();
    if (currentApp) {
      this.disconnect.emit(currentApp);
    }
  }

  onLiveChat(event: Event): void {
    event.preventDefault();
    const chatBox = document.getElementById('zsiq_float');
    if (chatBox) chatBox.click();
  }
}
