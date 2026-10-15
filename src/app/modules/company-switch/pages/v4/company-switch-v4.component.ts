import { VersionCheckerService } from 'src/app/shared/service/version-service/version.service';
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { IInvitedCompany, IOwnCompany } from 'src/app/layout/model/header';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app-state.model';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { environment } from 'src/environments/environment';
import {
  LucideAngularModule,
  Building2,
  UserCheck,
  LogOut,
  ChevronRight,
  Shield
} from 'lucide-angular';
import { DynamicPolicyComponent } from '../../components/dynamic-policy/dynamic-policy.component';
import { PoliciesService } from '../../services/policies.service';
import { FirstLoaderComponent } from '../../../common-components/components/first-loader/first-loader.component';
import { LandingPagePreflightService } from '../../services/landingpage-preflight.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service'; 
import { IAppConfig } from 'src/app/models/app_settings';

type CompanySwitchV4Tab = 'all' | 'my' | 'invited';

@Component({
  selector: 'app-company-switch-v4',
  templateUrl: './company-switch-v4.component.html',
  styleUrls: ['./company-switch-v4.component.scss'],
  standalone: true,
  imports: [
    FirstLoaderComponent,
    DynamicPolicyComponent,
    NgClass,
    RouterLink,
    WhiteLabelDirective,
    LucideAngularModule
  ]
})
export class CompanySwitchV4Component implements OnInit, OnDestroy {
  // Lucide icons
  readonly Building2Icon = Building2;
  readonly UserCheckIcon = UserCheck;
  readonly LogOutIcon = LogOut;
  readonly ChevronRightIcon = ChevronRight;
  readonly ShieldIcon = Shield;

  subscriptions: Subscription[] = [];
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  isZilMoneyLogoVisible = this.staticWhiteLabelConditions.zilMoneyLogoVisible;

  ownCompanies: IOwnCompany[] = [];
  invitedCompanies: IInvitedCompany[] = [];
  env = environment;

  appConfig: IAppConfig ;
  ocwInitialLoader = false;

  returnUrl: string;
  returnUrlIfCompanyZero: string;

  loading = {
    default: false,
    buttonDisabling: false,
    sending: undefined as undefined | number,
    removingAccess: undefined as undefined | number,
    accepting: undefined as undefined | number,
    rejecting: undefined as undefined | number
  };

  hasAcceptedPolicy = false;
  activeTab = signal<CompanySwitchV4Tab>('all');
  currentYear = new Date().getFullYear();

  isDarkMode = signal(false);

  brandLogoUrl(): string {
    if (this.isDarkMode()) {
      return (
        this.appConfig?.whiteLogo ||
        this.appConfig?.websiteLogo ||
        this.appConfig?.zilMoneyLogo ||
        'assets/white_label/zilmoney/assets/app_logo_white.svg'
      );
    }
    return (
      this.appConfig?.zilMoneyLogo ||
      this.appConfig?.websiteLogo ||
      'assets/main/zil_Money_logo.svg'
    );
  }

  public companyManagementService = inject(CompanyManagementService);
  public versionCheckerService = inject(VersionCheckerService);
  private authService = inject(AuthService);
  public dialog = inject(MatDialog);
  public appSettingService = inject(AppSettingsService);
  private themeService = inject(ThemeService);
  private localStorageService = inject(LocalStorageService);
  private policiesService = inject(PoliciesService);
  private store = inject(Store<IAppState>);
  private alertService = inject(V4AlertService);
  public landingPagePreflightService = inject(LandingPagePreflightService);
  private scriptService = inject(ScriptService);

  constructor() {
    this.companyManagementService.preventBack();
  }

  ngOnInit(): void {
    this.versionCheckerService.checkForUpdate();
    this.companyManagementService.ocwInitialLoader = false;
    this.loading = this.companyManagementService.loading;
    this.themeService.initTheme();
    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.subscriptions.push(
      this.themeService
        .getThemeSwitch()
        .subscribe((dark) => this.isDarkMode.set(dark))
    );
    this.companyManagementService.loadAllCompanies();
    this.companyManagementService.getQueryParams();
    this.setPluginsToLocalStorage();

    if (this.localStorageService.getItem('returnFromManage')) {
      this.companyManagementService.returnUrl =
        this.localStorageService.getItem('returnFromManage')!;
    }

    this.subscriptions.push(
      this.policiesService.getPolicyPending().subscribe((res) => {
        this.hasAcceptedPolicy = res.pendingPolicy === 0;
        this.store.dispatch(UserManagementActions.loadUserVerification());
      })
    );

    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      })
    );

    this.subscriptions.push(
      this.companyManagementService.isComapanyLoaded$.subscribe((isLoaded) => {
        if (isLoaded) {
          this.setMoEngageCompaniesAttribute();
        }
      })
    );
  }

  setTab(tab: CompanySwitchV4Tab): void {
    this.activeTab.set(tab);
  }

  get ownCompaniesCount(): number {
    return this.companyManagementService.ownCompanies?.length ?? 0;
  }

  get invitedCompaniesCount(): number {
    return this.companyManagementService.invitedCompanies?.length ?? 0;
  }

  get showOwnList(): boolean {
    const tab = this.activeTab();
    return tab === 'all' || tab === 'my';
  }

  get showInvitedList(): boolean {
    const tab = this.activeTab();
    return tab === 'all' || tab === 'invited';
  }

  get showOwnOnAllTab(): boolean {
    return (
      (this.env.env_id !== 'compass' && this.env.env_id !== 'csnhc') ||
      !this.companyManagementService.invitedCompanies?.length
    );
  }

  onDoAction(status: number, i: number, data: any): void {
    let msg;
    if (status === 1) {
      msg = 'Are you sure you want to remove access?';
    } else if (status === 2) {
      msg = 'Are you sure you want to accept?';
    } else if (status === 3) {
      msg = 'Are you sure you want to reject or delete it?';
    } else {
      msg = 'Are you sure you want to resend?';
    }
    const response = this.alertService.confirmAlert({ content: msg });
    response.afterClosed().subscribe((r) => {
      if (r) {
        if (status === 1) {
          this.companyManagementService.removeAccess(i, data);
        } else if (status === 2) {
          this.companyManagementService.acceptCompany(i, data);
        } else if (status === 3) {
          this.companyManagementService.rejectCompany(i, data);
        } else if (status === 4) {
          this.companyManagementService.resendCompany(i, data);
        }
      }
    });
  }

  onSelectedCompany(data: IInvitedCompany, isItInvitedCompany = false): void {
    if (data.isClosed === 1) {
      this.alertService.warningAlert({
        title: 'Error',
        content:
          'The selected company is scheduled for deletion. Please choose a different company and try again.'
      });
    } else {
      this.subscriptions.push(
        this.companyManagementService
          .checkCompanyAccessPermission(data.companyId, (res) =>
            this.onCompanyAccess(res, data, isItInvitedCompany)
          )
          .subscribe()
      );
    }
  }

  onCompanyAccess(
    data: { success: boolean; access: number; errorMsg: string; errorCode: number },
    company: IInvitedCompany,
    isItInvitedCompany: boolean
  ) {
    if (data.success && data.access === 1) {
      this.companyManagementService.onSelectedCompany(company, isItInvitedCompany);
    }
  }

  setPluginsToLocalStorage() {
    this.landingPagePreflightService.getPluginsCollectionApi().subscribe((res) => {
      this.localStorageService.setItem('userPlugins', res.data);
    });
  }

  private setMoEngageCompaniesAttribute(): void {
    const ownCompanies = this.companyManagementService.ownCompanies || [];
    const invitedCompanies = this.companyManagementService.invitedCompanies || [];
    const ownCompaniesNames = ownCompanies.map((company) => company.companyName);
    const invitedCompaniesNames = invitedCompanies.map(
      (company) => company.companyName
    );
    const ownCompanyIds = ownCompanies.map((company) => company.companyId);
    const invitedCompanyIds = invitedCompanies.map((company) => company.companyId);

    this.scriptService.moEngageSetUserAttributes({
      own_org_ids: ownCompanyIds,
      invited_org_ids: invitedCompanyIds,
      own_org_names: ownCompaniesNames,
      invited_org_names: invitedCompaniesNames
    });
  }

  logout() {
    this.authService.Logout();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.companyManagementService.clearSubsciptions();
  }
}
