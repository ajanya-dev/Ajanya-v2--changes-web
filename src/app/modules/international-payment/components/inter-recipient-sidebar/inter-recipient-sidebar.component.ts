import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleUp, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { faEnvelope as faEnvelopeThin, faMessageMinus as faMessageMinusThin, faPhone as faPhoneThin} from '@fortawesome/pro-regular-svg-icons';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { Utils } from 'src/app/data/utils';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IInternationalPayeeAccount } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { finalize, take } from 'rxjs';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ICountriesCache, IInternationalCountry } from 'src/app/models/wallet';

@Component({
  selector: 'app-inter-recipient-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatTooltip,
    FaIconComponent,
    TruncatePipe
  ],
  templateUrl: './inter-recipient-sidebar.component.html',
  styleUrl: './inter-recipient-sidebar.component.scss'
})
export class InterRecipientSidebarComponent implements OnInit {
  public walletDataService = inject(WalletDataV35Service);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private staticWhiteLabelConditions = StaticWhiteLabelConditions;
  private paymentsService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);

  // Input signals
  selectedRecipient = input<IPayeeDropdown | null>(null);
  selectedBank = input<IInternationalPayeeAccount | null>(null);

  // Output signals
  onEditPayee = output<void>();
  onEditBank = output<void>();

  utils = Utils;
  enabledCountries = signal<ICountriesCache>({});
  Object = Object;

  // Country code of the selected bank (from beneficiary bank details).
  private bankCountryCode = computed(() => this.selectedBank()?.beneficiaryBankDetails?.country ?? '');

  // India doesn't use bank identifier type/code (IFSC is used instead).
  isIndiaBank = computed(() => this.bankCountryCode() === 'IN');

  // European/IBAN countries: no account number or bank identifier; IBAN is shown instead.
  isIbanBank = computed(() => {
    const code = this.bankCountryCode();
    if (!code) return false;
    const country = Object.values(this.enabledCountries()).find(c => c.countryCode === code);
    return country?.iban === 1;
  });
  isLoading = signal(false);
  isCountriesExpanded = signal(false);
  faAngleUp = faAngleUp;

  featuresList = [
    {
      title: 'No Platform Fees',
      description: 'No hidden fees',
      icon: faCheck
    },
    {
      title: 'Faster Transfer',
      description: 'Funds delivered in minutes',
      icon: faCheck
    },
    {
      title: 'Secure & Safe',
      description: 'Bank-level security',
      icon: faCheck
    }
  ];

  helpList = [
    {
      id: 'call',
      title: 'Call Support',
      icon: faPhoneThin,
      link: `tel:${this.staticWhiteLabelConditions.customerSupportNo}`,
      color: 'blue'
    },
    {
      id: 'email',
      title: 'Email Support',
      icon: faEnvelopeThin,
      link: `mailto:${this.staticWhiteLabelConditions.customerSupportEmail}`,
      color: 'violet'
    },
    {
      id: 'chat',
      title: 'Message',
      icon: faMessageMinusThin,
      color: 'green'
    }
  ];

  ngOnInit(): void {
    this.getEnabledCountries();
  }

  getEnabledCountries(): void {
    const cachedData = this.localStorageService.getItem('international_countries_business_data');
    if(cachedData){
      const parsedData = JSON.parse(cachedData);
      this.enabledCountries.set(parsedData);
      return;
    }
    this.isLoading.set(true);
    this.paymentsService.enabledInternationalPaymentCountries()
    .pipe(take(1), finalize(() => this.isLoading.set(false)))
    .subscribe((res) => {
      if(res.success){
        this.enabledCountries.set(res.data);
      }
    });
  }

  onEditPayeeClick(): void {
    this.onEditPayee.emit();
  }

  onEditBankClick(): void {
    this.onEditBank.emit();
  }

  onHelpClick(helpId: string, link?: string): void {
    if (helpId === 'chat') {
      this.dynamicWhiteLabelService.goToLiveChat();
    } else if (link) {
      window.open(link, '_self');
    }
  }

  toggleCountriesExpansion(): void {
    this.isCountriesExpanded.update(value => !value);
  }

  getCountriesToDisplay(): Array<{key: string, value: IInternationalCountry}> {
    const countries = Object.entries(this.enabledCountries()).map(([key, value]) => ({ key, value }));
    const totalCount = countries.length;
    
    if (totalCount <= 8) {
      return countries;
    }
    
    // Always show first 8, expanded section will show the rest
    return countries.slice(0, 8);
  }

  getExpandedCountries(): Array<{key: string, value: IInternationalCountry}> {
    const countries = Object.entries(this.enabledCountries()).map(([key, value]) => ({ key, value }));
    return countries.slice(8);
  }

  getRemainingCountriesCount(): number {
    const totalCount = Object.keys(this.enabledCountries()).length;
    return totalCount > 8 ? totalCount - 8 : 0;
  }
}
