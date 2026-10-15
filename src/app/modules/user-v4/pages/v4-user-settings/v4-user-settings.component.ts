import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import { UserService } from 'src/app/shared/service/user/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import {
  LucideAngularModule,
  Settings2,
  Monitor,
  Bell,
  Mail,
  Box,
  SlidersVertical,
  Shield,
  CreditCard,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  Award,
  Loader,
  LucideIconData
} from 'lucide-angular';
import { CommonModule } from '@angular/common';
import {
  IGeneralSettings,
  ISmtpSettings,
  ITimeZone,
  IUserAdvancedSettings,
  IUserEmailURL,
  IUserNotificationSetting,
  IUserTab
} from '../../../user/model/user';
import { V4AdvancedSettingsComponent } from '../../components/v4-advanced-settings/v4-advanced-settings.component';
import { V4EmailSettingsComponent } from '../../components/v4-email-settings/v4-email-settings.component';
import { V4NotificationSettingsComponent } from '../../components/v4-notification-settings/v4-notification-settings.component';
import { V4ChecklistSettingsComponent } from '../../components/v4-checklist-settings/v4-checklist-settings.component';
import { V4GeneralSettingsComponent } from '../../components/v4-general-settings/v4-general-settings.component';
import { V4MailSettingsComponent } from '../../components/v4-mail-settings/v4-mail-settings.component';
import { V4OurCompliancesComponent } from '../../components/v4-our-compliances/v4-our-compliances.component';
import { V4SubscriptionDashBoardComponent } from '../../components/v4-subscription-dash-board/v4-subscription-dash-board.component';

interface IV4SettingsTab {
  id: string;
  title: string;
  icon: LucideIconData;
  subtab?: string;
}

@Component({
  selector: 'app-v4-user-settings',
  templateUrl: './v4-user-settings.component.html',
  styleUrls: ['./v4-user-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    V4GeneralSettingsComponent,
    V4ChecklistSettingsComponent,
    V4NotificationSettingsComponent,
    V4EmailSettingsComponent,
    V4MailSettingsComponent,
    V4AdvancedSettingsComponent,
    V4OurCompliancesComponent,
    V4SubscriptionDashBoardComponent
  ]
})
export class V4UserSettingsComponent implements OnInit, OnDestroy {
  public formBuilder = inject(UntypedFormBuilder);
  public userService = inject(UserService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);

  readonly ChevronRightIcon = ChevronRight;
  readonly ChevronUpIcon = ChevronUp;
  readonly ChevronDownIcon = ChevronDown;
  readonly CheckIcon = Check;
  readonly AwardIcon = Award;
  readonly LoaderIcon = Loader;
  readonly CreditCardIcon = CreditCard;

  isDropdownOpen = false;

  environment = environment;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];
  timeZone: ITimeZone[] = [];
  generalSettings: IGeneralSettings;
  isAdvancedSettings = false;
  allTabs: IUserTab[] = [];
  selectedTabs: IUserTab[] = [];
  unselectedTabs: IUserTab[] = [];
  pageOriantation!: number;
  checkListTab!: number;
  selectedOrieO = '';
  selectedDefTab = '';
  emailTemplate: IUserEmailURL;
  isEmailTemplateLoading = true;
  selectedTab: IUserTab[] = [];
  isNotVerified = false;

  adVanceSettings: IUserAdvancedSettings[] = [];
  notifList: IUserNotificationSetting[] = [];

  // EMAIL SETTINGS
  smtpSettings: ISmtpSettings[] = [];
  QueueEnable!: number;
  SMTPEnable!: number;
  selectedSMTPid: string;

  isSaveG = false;
  isTabOrder = false;

  checkListObg = {};
  templateData = {};

  showAllNotifications = false;
  planLoading = false;

  tabs: IV4SettingsTab[] = [
    { title: 'General', id: 'general', icon: Settings2 },
    { title: 'Default Screen', id: 'default-screen', icon: Monitor },
    { title: 'Notification', id: 'notification', icon: Bell },
    { title: 'Email Settings', id: 'email-settings', icon: Mail },
    { title: 'Mail Settings', id: 'mail-settings', icon: Box },
    {
      title: 'Advanced Settings',
      id: 'advanced-settings',
      icon: SlidersVertical
    },
    {
      title: 'Our Compliance',
      id: 'our-compliance',
      icon: Shield,
      subtab: 'certification'
    }
  ];

  currentTab = 'general';
  currentSubTab = '';
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      const { tab } = params;
      if (tab) {
        this.changeTab(tab);
      }
    });
    this.checkUserVerification();
    this.getASstatus();
    this.getTabvalue();
    this.getEmailTemplate();
    if (this.activatedRoute.snapshot.queryParams?.show_all === '1') {
      this.getNotifStatusViewAll();
    } else {
      this.getNotifStatus();
    }
    this.getEmailSettings();
  }

  changeTab(id: string) {
    this.currentTab = id;
    this.isDropdownOpen = false;
    const tab = this.tabs.find((t) => t.id === id);
    if (tab?.subtab) {
      this.currentSubTab = tab.subtab;
    } else {
      this.currentSubTab = '';
    }
  }

  get currentTabData(): IV4SettingsTab | undefined {
    if (this.currentTab === 'billing-plan') {
      return { id: 'billing-plan', title: 'Billing/Plan', icon: CreditCard };
    }
    return this.tabs.find((t) => t.id === this.currentTab);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  getASstatus() {
    this.subscriptions.push(
      this.userService
        .getStatusOfASettinngs()
        .pipe(catchError(() => of(false)))
        .subscribe({
          next: (res) => {
            this.getAdvanedSettings();
            if (res.success) {
              this.isAdvancedSettings = true;
            } else {
              this.isAdvancedSettings = false;
            }
          },
          error: () => {
            this.getAdvanedSettings();
          }
        })
    );
  }

  getEmailTemplate() {
    this.isEmailTemplateLoading = true;
    this.subscriptions.push(
      this.userService
        .getEmailTemplate()
        .pipe(
          catchError(() => of(null)),
          finalize(() => {
            this.isEmailTemplateLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.emailTemplate = res.data.URL;
          }
        })
    );
  }

  getTabvalue() {
    this.selectedTabs = [];
    this.unselectedTabs = [];
    this.subscriptions.push(
      this.userService.getTabs().subscribe((res) => {
        this.allTabs = res.data.allTabs;
        this.selectedTab = res.data.selectedTabs;

        const selectedItems = this.selectedTab.map(
          (selectedItem) => selectedItem.number
        );

        this.unselectedTabs = this.allTabs.filter(
          (allTabItems) => !selectedItems.includes(allTabItems.number)
        );

        this.selectedTabs = this.selectedTab;

        this.pageOriantation = res.data.defaultOrientation;
        this.checkListTab = res.data.defaultCheckListTab;

        this.checkListObg = {
          allTabs: this.allTabs,
          selectedTabs: this.selectedTabs,
          unselectedTabs: this.unselectedTabs,
          pageOriantation: this.pageOriantation,
          checkListTab: this.checkListTab
        };
      })
    );
  }

  getAdvanedSettings() {
    this.subscriptions.push(
      this.userService.getAdvancedSettings().subscribe((res) => {
        if (res.success) {
          if (!this.isAdvancedSettings && res.data?.length >= 3) {
            res.data.splice(0, 3);
          }
          this.adVanceSettings = res.data;
        }
      })
    );
  }

  getNotifStatus() {
    this.subscriptions.push(
      this.userService.getNotifStatus().subscribe((res) => {
        if (res.success) {
          this.notifList = res.data.settings;
        }
      })
    );
  }

  getNotifStatusViewAll() {
    this.subscriptions.push(
      this.userService.getNotifStatusShowAll().subscribe((res) => {
        if (res.success) {
          this.notifList = res.data.settings;
        }
      })
    );
  }

  getEmailSettings() {
    this.subscriptions.push(
      this.userService.getEmailSettings().subscribe((res) => {
        if (res.success) {
          this.smtpSettings.forEach((element) => {
            if (element.isDefault === 1) {
              this.selectedSMTPid = element.id;
            }
          });

          this.templateData = {
            isTemplate: res.data.enableEmailTemplate !== '1',
            isSMTP: res.data.enableSmtp === '1',
            smtpSettings: res.data.smtpSettings,
            QueueEnable: res.data.isQueueEnabled,
            SMTPEnable: res.data.isSmtpEnabled,
            selectedSMTPid: this.selectedSMTPid,
            url: res.data.URL,
            customerSupport: res.data?.customerSupportURL
          };
        }
      })
    );
  }

  getRefresh(env: string) {
    if (env === 'changed') {
      this.getTabvalue();
    } else {
      this.getAdvanedSettings();
    }
  }

  goToPlans(): void {
    this.planLoading = true;

    this.router.navigate(['manage/subscription'], {
      state: {
        returnUrl: this.router.url
      }
    });
  }

  checkUserVerification() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isNotVerified =
          res.email_verified === 0 || res.phone_verified === 0;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
