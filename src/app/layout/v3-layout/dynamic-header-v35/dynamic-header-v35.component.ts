import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { NgClass, NgIf, CurrencyPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDollarSign } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IOverallData } from 'src/app/models/user';
import { IHeaderData } from '../../model/header';
import { WhiteLabelDirective } from '../../../directive/white-label.directive';

@Component({
  selector: 'app-dynamic-header-v35',
  templateUrl: './dynamic-header-v35.component.html',
  styleUrls: ['./dynamic-header-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    NgIf,
    WhiteLabelDirective,
    CurrencyPipe,
    WhiteLabelDirective
  ]
})
export class DynamicHeaderV35Component implements OnInit, OnDestroy {
  private userService = inject(UserService);
  public router = inject(Router);
  private headerService = inject(HeaderService);
  private companyManagementService = inject(CompanyManagementService);
  private localStorageService = inject(LocalStorageService);

  mailCreditBalance = '0';
  subscriptions: Subscription[] = [];

  overallData: IOverallData;

  overallDataLoading: boolean;

  routePaths = {
    credit: '/manage/refill-credit/show-refillform',
    wallet: '/manage/wallet',
    bankAccount: '/manage/bank-accounts',
    addBankAccount: '/manage/users/add-bank-account',
    cloud: '/manage/cloud-bank/index',
    creditCard: '/manage/cards'
  };

  isHidden = false;
  isV2Page = false;

  isCreditPath = false;
  isWalletPath = false;
  isBankAccountPath = false;
  isAddBankAccountPath = false;
  isCloudPath = false;
  isCreditCardPath = false;

  faDollar = faDollarSign;

  ngOnInit() {
    this.getUserOverallData();
    this.getMyCredits();
    this.checkRoute();
    this.checkSubHeaderState();
    this.getCompanyChange();
    this.getRoute();
    this.onRefresh();
  }

  /**
   *  Method to catch all router event
   */
  getRoute() {
    this.headerService.getRouterEvents();
    this.subscriptions.push(
      this.headerService.routerEvents.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.checkCurrentRoute();
        }
      })
    );
  }

  getCompanyChange() {
    this.subscriptions.push(
      this.companyManagementService.getCompanyChanges().subscribe((res) => {
        if (res) {
          this.getUserOverallData();
        }
      })
    );
  }

  checkSubHeaderState() {
    this.subscriptions.push(
      this.headerService.isSubHeaderVisible.subscribe((res) => {
        this.isHidden = res.hidden;
      })
    );
  }

  checkRoute() {
    this.isV2Page = this.router.url.slice(1, 3) !== 'v3';
  }

  getMyCredits() {
    // eslint-disable-next-line no-underscore-dangle
    this.subscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.mailCreditBalance = headerData.totalMailCredit?.credit;
        this.localStorageService.setItem('myCredits', this.mailCreditBalance);
      })
    );
  }

  getUserOverallData() {
    this.overallDataLoading = true;
    this.subscriptions.push(
      this.userService
        .getUserOverallData()
        .pipe(
          finalize(() => {
            this.overallDataLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.localStorageService.setItem('overallData', res.data);
            this.overallData = {
              bankAccountCount: res.data.bankAccountCount,
              walletBalance: res.data.walletBalance,
              cloudbankBalance: res.data.cloudbankBalance,
              creditCardCount: res.data.creditCardCount,
              cloudbankExist: res.data.cloudbankExist,
              payeeCount: res.data.payeeCount,
              checkMailExist: res.data.checkMailExist,
              hasWalletFunding: res.data.hasWalletFunding,
              hasWalletTransfer: res.data.hasWalletTransfer,
              hasWalletWithdrawal: res.data.hasWalletWithdrawal,
              hasTransacted: res.data.hasTransacted
            };
            this.userService.userOverallData.next(res.data);
          }
        })
    );
  }

  navigateToUrl(id: string) {
    
    this.headerService.isSubHeaderVisible.next({
      hidden: false,
      animation: false
    });
    switch (id) {
      case 'credit':
        this.router.navigate(['/manage/refill-credit/show-refillform']);
        break;
      case 'cloud':
        this.router.navigate(['/manage/cloud-bank/index']);
        break;
      case 'credit_card':
        this.router.navigate(['/manage/cards']);
        break;
      case 'wallet':
        this.router.navigate(['/manage/wallet/transactions']);
        break;
      case 'add_account':
        this.router.navigate([`/manage/users/add-bank-account`], {
          queryParams: { returnUrl: '/manage/bank-accounts' }
        });
        break;
      case 'account':
        this.router.navigate(['/manage/bank-accounts']);
        break;
      default:
        break;
    }
  }

  /**
   *  Method to check current route event
   */
  checkCurrentRoute() {
    this.isCreditPath = false;
    this.isWalletPath = false;
    this.isBankAccountPath = false;
    this.isAddBankAccountPath = false;
    this.isCloudPath = false;
    this.isCreditCardPath = false;
    if (this.router.url.includes(this.routePaths.credit)) {
      this.isCreditPath = true;
    } else if (this.router.url.includes(this.routePaths.wallet)) {
      this.isWalletPath = true;
    } else if (this.router.url.includes(this.routePaths.bankAccount)) {
      this.isBankAccountPath = true;
    } else if (this.router.url.includes(this.routePaths.addBankAccount)) {
      this.isAddBankAccountPath = true;
    } else if (this.router.url.includes(this.routePaths.cloud)) {
      this.isCloudPath = true;
    } else if (this.router.url.includes(this.routePaths.creditCard)) {
      this.isCreditCardPath = true;
    }
  }

  /**
   * @description Call the dynamic heade api when need refresh data.
   */
  onRefresh() {
    this.subscriptions.push(
      this.headerService.onRefreshDynamicHeader.subscribe((res) => {
        if (res) {
          this.getUserOverallData();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
