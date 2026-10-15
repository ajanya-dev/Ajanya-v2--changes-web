import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBriefcase,
  faCrown,
  faFileLines,
  faShieldCheck,
  faUser
} from '@fortawesome/pro-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { SecurityComponent } from '../../components/security/security.component';
import { UploadDocsComponent } from '../../components/upload-docs/upload-docs.component';
import { MyBusinessesListV35Component } from '../../components/my-businesses-list-v35/my-businesses-list-v35.component';
import { BusinessInfoComponent } from '../../components/business-info/business-info.component';
import { PersonalInfoComponent } from '../../components/personal-info/personal-info.component';
import { OurCompliancesComponent } from '../../components/our-compliances/our-compliances.component';

/**
 * @description Component for user profile.
 */
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    PersonalInfoComponent,
    BusinessInfoComponent,
    MyBusinessesListV35Component,
    UploadDocsComponent,
    SecurityComponent,
    OurCompliancesComponent,
    TitleCasePipe
  ]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private userService = inject(UserProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  subscriptions: Subscription[] = [];
  userName: string;
  currentSubTab: string = '';
  isManualEntry = signal(false);
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  tabs: {
    title: string;
    id: string;
    icon: IconProp;
    subtab?: string;
    disableTitle?: boolean;
  }[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      icon: faUser
    },
    {
      id: 'myBusinesses',
      title: 'My Businesses',
      icon: faBriefcase,
      disableTitle: true
    },
    {
      id: 'uploadDoc',
      title: 'Upload Documents',
      icon: faFileLines
    },
    {
      id: 'security',
      title: 'Security',
      icon: faShieldCheck
    },
    ...(environment.env_id !== 'csnhc' ? [{
      id: 'myPlan',
      title: 'Billing/Plan',
      icon: faCrown
    }] : []),
    {
      id: 'our-compliance',
      title: 'Our Compliance',
      icon: faShieldCheck,
      subtab: 'certification'
    }
  ];

  selectedTab: {
    title: string;
    id: string;
    icon: IconProp;
    subtab?: string;
    disableTitle?: boolean;
  } = this.tabs[0];

  ngOnInit(): void {
    this.setUserData();
    if (this.route.snapshot?.routeConfig?.path === 'changepassword') {
      this.tabChange('security');
    }
  }

  /**
   * @description Change tabs based on id
   * @param ids - id of the selected list item
   */
  tabChange(tabId: string) {
    this.selectedTab =
      this.tabs.find((tab) => tab.id === tabId) ?? this.tabs[0];
    if (this.selectedTab?.subtab) {
      this.currentSubTab = this.selectedTab.subtab;
    } else {
      this.currentSubTab = '';
    }
    if (tabId === 'myPlan') {
      this.router.navigate(['manage/subscription']);
    }
  }

  /**
   * @description Method to set initial user data.
   */
  setUserData() {
    this.userService.isLoadingUserDetailsSignal.set(true);
    this.subscriptions.push(
      this.userService
        .getPersonalInfo()
        .pipe(
          finalize(() => this.userService.isLoadingUserDetailsSignal.set(false))
        )
        .subscribe((res) => {
          if (this.localStorageService.getItem('username') === '') {
            this.localStorageService.setItem('username', res.data.name);
          }
          if (res.success) {
            this.userService.userDetailsSignal.set(res.data);
            this.userName = res.data.name;
            this.isManualEntry.set(!!res.data.manualBusinessEntryStatus);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.userService.userDetailsSignal.set(undefined);
    this.userService.isLoadingUserDetailsSignal.set(false);
    this.userService.userBusinessListSignal.set([]);

    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
