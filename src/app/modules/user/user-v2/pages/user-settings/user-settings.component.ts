import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import { UserService } from 'src/app/shared/service/user/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import {
  faBell,
  faCrown,
  faDesktop,
  faEnvelope,
  faGears,
  faLoader,
  faShieldCheck,
  faUserGear
} from '@fortawesome/pro-solid-svg-icons';
import { NgClass, TitleCasePipe } from '@angular/common';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  IGeneralSettings,
  ISmtpSettings,
  ITimeZone,
  IUserAdvancedSettings,
  IUserEmailURL,
  IUserNotificationSetting,
  IUserTab
} from '../../../model/user';
import { AdvancedSettingsComponent } from '../../components/advanced-settings/advanced-settings.component';
import { EmailSettingsComponent } from '../../components/email-settings/email-settings.component';
import { NotificationSettingsComponent } from '../../components/notification-settings/notification-settings.component';
import { ChecklistSettingsComponent } from '../../components/checklist-settings/checklist-settings.component';
import { GeneralSettingsComponent } from '../../components/general-settings/general-settings.component';
import { MailSettingsComponent } from '../../components/mail-settings/mail-settings.component';
import { OurCompliancesComponent } from '../../components/our-compliances/our-compliances.component';

/**
 * @description Component for application settings.
 */
@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    GeneralSettingsComponent,
    ChecklistSettingsComponent,
    NotificationSettingsComponent,
    EmailSettingsComponent,
    MailSettingsComponent,
    AdvancedSettingsComponent,
    NgClass,
    OurCompliancesComponent,
    TitleCasePipe,
    CommonBackButtonV35Component
  ]
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  public formBuilder = inject(UntypedFormBuilder);
  public userService = inject(UserService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);

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

  faCrown = faCrown;
  faLoader = faLoader;

  showAllNotifications = false;
  planLoading = false;

  tabs = [
    { title: 'General', id: 'general', icon: faUserGear, subtab: '' },
    {
      title: 'Default Screen',
      id: 'default-screen',
      icon: faDesktop,
      subtab: ''
    },
    { title: 'Notification', id: 'notification', icon: faBell, subtab: '' },
    {
      title: 'Email Settings',
      id: 'email-settings',
      icon: faEnvelope,
      subtab: ''
    },
    {
      title: 'Mail Settings',
      id: 'mail-settings',
      icon: faEnvelope,
      subtab: ''
    },
    {
      title: 'Advanced Settings',
      id: 'advanced-settings',
      icon: faGears,
      subtab: ''
    },
    {
      title: 'Our Compliance',
      id: 'our-compliance',
      icon: faShieldCheck,
      subtab: 'certification'
    }
  ] as const;

  currentTab: (typeof this.tabs)[number]['id'] = 'general';
  currentSubTab: string = '';
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      const { tab } = params;
      if (tab === 'our-compliance') {
        this.changeTab('our-compliance');
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

  changeTab(id: typeof this.currentTab) {
    this.currentTab = id;
    const selectedTab = this.tabs.find((tab) => tab.id === id);
    if (selectedTab?.subtab) {
      this.currentSubTab = selectedTab.subtab;
    } else {
      this.currentSubTab = '';
    }
  }

  /**
   * @description Gets status of advanced settings
   */
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

  /**
   * @description Gets and sets the email template
   */
  getEmailTemplate() {
    this.subscriptions.push(
      this.userService.getEmailTemplate().subscribe((res) => {
        if (res.success) {
          this.emailTemplate = res.data.URL;
        }
      })
    );
  }

  /**
   * @property Gets the tab list for settings and sets options like selected tabs, deselected tabs, page orientation etc.
   */
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

  /**
   * @description Gets advanced settings
   */
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

  /**
   * @description Gets status of notification settings
   */
  getNotifStatus() {
    this.subscriptions.push(
      this.userService.getNotifStatus().subscribe((res) => {
        if (res.success) {
          this.notifList = res.data.settings;
        }
      })
    );
  }

  /**
   * @description Gets status of showing and notification settings
   */
  getNotifStatusViewAll() {
    this.subscriptions.push(
      this.userService.getNotifStatusShowAll().subscribe((res) => {
        if (res.success) {
          this.notifList = res.data.settings;
        }
      })
    );
  }

  /**
   * @description Gets email settings
   */
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

  /**
   * @description When event refresh occurs from child component checklist-settings, this method is invoked. Invokes other methods based on event.
   * @param env - event emitted from checklist-settings
   */
  getRefresh(env: string) {
    if (env === 'changed') {
      this.getTabvalue();
    } else {
      this.getAdvanedSettings();
    }
  }

  /**
   * @description Routes to the subscriptions page.
   */
  goToPlans(): void {
    this.planLoading = true;

    this.router.navigate(['manage/subscription'], {
      state: {
        returnUrl: this.router.url
      }
    });
  }

  /**
   * @description Checks the user verification status and updates the `isNotVerified` property accordingly.
   *
   */
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
