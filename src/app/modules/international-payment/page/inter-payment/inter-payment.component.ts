import { Component,inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGlobe } from '@fortawesome/pro-regular-svg-icons';
import { faPartyHorn } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, take, takeUntil } from 'rxjs';
import { ICountriesCache, IInternationalCountry } from 'src/app/models/wallet';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { ScheduledMaintenanceBreakComponent } from 'src/app/shared/modal/scheduled-maintenance-break/scheduled-maintenance-break.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ComplianceFreezeComponent } from 'src/app/modules/compliance-freeze/compliance-freeze.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { InterCountryListComponent } from '../../components/inter-country-list/inter-country-list.component';
import { InterReceipientComponent } from '../../components/inter-receipient/inter-receipient.component';
import { InterRecipientSidebarComponent } from '../../components/inter-recipient-sidebar/inter-recipient-sidebar.component';
import { InterTransactionsComponent } from '../../components/inter-transactions/inter-transactions.component';
import { InterWelcomeComponent } from '../../components/inter-welcome/inter-welcome.component';

@Component({
  selector: 'app-inter-payment',
  standalone: true,
  imports: [
    InterCountryListComponent,
    InterReceipientComponent,
    CommonModule,
    FaIconComponent,
    InterWelcomeComponent,
    InterTransactionsComponent,
    InterRecipientSidebarComponent,
    NgClass,
    ComplianceFreezeComponent,
    CommonBackButtonV35Component
  ],
  templateUrl: './inter-payment.component.html',
  styleUrl: './inter-payment.component.scss'
})
export class InterPaymentComponent implements OnInit, OnDestroy {
  @ViewChild(InterCountryListComponent) interCountryListComponent!: InterCountryListComponent;
  
  public walletDataService = inject(WalletDataV35Service);
  private paymentService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private readonly COUNTRIES_BUSINESS_CACHE_KEY = 'international_countries_business_data';

  currentStep = 'country-amount';
  isInternationalPaymentEnabled = signal(false);
  isLoading = signal(false);
  faGlobe = faGlobe;
  faPartyHorn = faPartyHorn;
  complianceFreeze = signal(false);

  destroy$:Subject<void>= new Subject();

  internationalPaymentsEnabledCountries = signal<{
    [key: string]: IInternationalCountry;
  }>({});

  selectedCountry: IInternationalCountry | null = null;

  currentTab = signal<'new-payment' | 'recent-transactions' | undefined>(undefined);
  paymentId = signal<string>('');
  existsTransaction = signal(false);
  isFromRecentTransactions = signal(false);

  ngOnInit(): void {
    this.complianceFreeze.set(this.localStorageService.getItem('hasComplianceFreeze'));
    this.checkMaitanceMode();
    this.initializeLandingTab();

    // Check local storage for ripple payment settings
    const businessPaymentEnabled = this.localStorageService.getItem('rippleBusinessInternationalPaymentEnabled');
    const personalPaymentEnabled = this.localStorageService.getItem('ripplePersonalInternationalPaymentEnabled');
    
    // Enable international payment if either business or personal is enabled
    const isBusinessEnabled = businessPaymentEnabled === '1' || businessPaymentEnabled === 1;
    const isPersonalEnabled = personalPaymentEnabled === '1' || personalPaymentEnabled === 1;
    
    if (isBusinessEnabled || isPersonalEnabled) {
      this.isInternationalPaymentEnabled.set(true);
    }

    this.getEnabledPaymentCountries();
  }

  private initializeLandingTab() {
    const { state } = window.history;
    const routeId = this.route.snapshot.params?.id;
    const queryTab = this.route.snapshot.queryParams?.tab;

    if (state?.from === 'recent-transactions') {
      this.isFromRecentTransactions.set(true);
    }

    if (routeId) {
      this.paymentId.set(routeId);
      this.navigateToTab('new-payment');
      return;
    }

    // The /new route always opens the new-payment form.
    if (this.route.snapshot.routeConfig?.path === 'new') {
      this.navigateToTab('new-payment');
      return;
    }

    if (state?.tab === 'recent-transactions') {
      this.navigateToTab('recent-transactions');
      return;
    }

    if (state?.tab === 'new-payment') {
      this.navigateToTab('new-payment');
      return;
    }

    if (queryTab === 'recent-transactions') {
      this.navigateToTab('recent-transactions');
      return;
    }

    this.checkExistsTransaction();
  }

  navigateToTab(tab: 'new-payment' | 'recent-transactions') {
    this.currentTab.set(tab);
    this.currentStep = tab === 'new-payment' ? 'country-amount' : 'recent-transactions';
  }

  getEnabledPaymentCountries() {
    this.paymentService
    .enabledInternationalPaymentCountries()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        if (res.success) {
           // STORE in localStorage
          this.storeCachedCountriesData(res.data);
          
          this.internationalPaymentsEnabledCountries.set(res.data);
          this.selectedCountry =  res.data.India;
          this.walletDataService.internationalPayment.update((value) => ({
            ...value,
            selectedCurrency: this.selectedCountry
          }));        
        }
      }
    });
  }

  // Method to store data with timestamp
  private storeCachedCountriesData(data: ICountriesCache) {
      this.localStorageService.setItem(this.COUNTRIES_BUSINESS_CACHE_KEY, JSON.stringify(data));
  }

  checkIsEnabled(){
    this.isLoading.set(true);
    this.paymentService
      .getDisablePayments()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.isInternationalPaymentEnabled.set(
            !!res.data.isInternationalPaymentEnabled
          );
        }
      });
  }

  onNextClick(step: string) {
    if (step === 'new') {
      this.walletDataService.internationalPayment.set({
        selectedWallet: null,
        selectedCurrency: null,
        selectedAmount: null,
        selectedRecipient: null,
        recipientType: null,
        version: null
      });
      this.currentStep = 'country-amount';
    } else {
      this.currentStep = step;
    }
  }

  onNewPaymentClick() {
    this.navigateToTab('new-payment');

     // Clear query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true 
    });
  }

  onRecentTransactionsClick() {
    this.navigateToTab('recent-transactions');
  }

  onEditPayee() {
    if (this.interCountryListComponent) {
      this.interCountryListComponent.onEditPayee();
    }
  }

  onEditBank() {
    if (this.interCountryListComponent) {
      this.interCountryListComponent.addNewRecipientBank(true);
    }
  }

  checkMaitanceMode() {
    this.paymentService.getMaitanceMode().pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res.success && res.data.maintenances?.length) {
        const internationalPaymentMaintenance = res.data.maintenances.find(
          (m) => m.appName === 'international_payment' && (m.status === 'enabled' || m.status === 'scheduled')
        );

        if (internationalPaymentMaintenance) {
          this.dialog.open(ScheduledMaintenanceBreakComponent, {
            width: '1000px',
            disableClose: false,
            data: {
              description: internationalPaymentMaintenance.description
            }
          });
        }
      }
    });
  }

  navigateToRecentTransactions() {
    this.router.navigate(['/manage/international-payment/index'], {
      state: {
        tab: 'recent-transactions'
      }
    });
  }

  checkExistsTransaction() {
    this.walletDataService.getTransactionDetails()
    .pipe(
      takeUntil(this.destroy$)
    )
    .subscribe((res) => {
      if (res.success) {
        this.existsTransaction.set(res.data.exists);
        if (!res.data.exists) {
          this.navigateToTab('new-payment');
        } else {
          this.navigateToTab('recent-transactions');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.walletDataService.internationalPayment.set({
      selectedWallet: null,
      selectedCurrency: null,
      selectedAmount: null,
      selectedRecipient: null,
      recipientType: null,
      version: null
    });
    this.currentStep = 'country-amount';
    this.destroy$.next();
    this.destroy$.complete();
  }
}
