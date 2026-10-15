import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  LucideAngularModule,
  User,
  Building2,
  FileText,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Award,
  CircleCheck,
  Check
} from 'lucide-angular';
import { environment } from 'src/environments/environment';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { OutsideClickDirective } from 'src/app/directive/outside-click.directive';
import { IV4ProfileTab } from '../../model/v4-user';
import { V4PersonalInfoComponent } from '../../components/v4-personal-info/v4-personal-info.component';
import { V4MyBusinessesListComponent } from '../../components/v4-my-businesses-list/v4-my-businesses-list.component';
import { V4UploadDocsComponent } from '../../components/v4-upload-docs/v4-upload-docs.component';
import { V4SecurityComponent } from '../../components/v4-security/v4-security.component';
import { V4OurCompliancesComponent } from '../../components/v4-our-compliances/v4-our-compliances.component';
import { V4SubscriptionDashBoardComponent } from '../../components/v4-subscription-dash-board/v4-subscription-dash-board.component';

@Component({
  selector: 'app-v4-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    V4PersonalInfoComponent,
    V4MyBusinessesListComponent,
    V4UploadDocsComponent,
    V4SecurityComponent,
    V4OurCompliancesComponent,
    V4SubscriptionDashBoardComponent,
    OutsideClickDirective
  ],
  templateUrl: './v4-user-profile.component.html',
  styleUrls: ['./v4-user-profile.component.scss']
})
export class V4UserProfileComponent implements OnInit, OnDestroy {
  private userService = inject(UserProfileService);
  private route = inject(ActivatedRoute);
  private localStorageService = inject(LocalStorageService);

  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly ChevronRightIcon = ChevronRight;
  readonly AwardIcon = Award;
  readonly CheckIcon = Check;

  private subscriptions: Subscription[] = [];

  userName = signal('');
  isManualEntry = signal(false);
  currentSubTab = '';

  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  tabs: IV4ProfileTab[] = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'myBusinesses', title: 'My Businesses', icon: Building2 },
    { id: 'uploadDoc', title: 'Upload Documents', icon: FileText },
    { id: 'security', title: 'Security', icon: Shield },
    ...(environment.env_id !== 'csnhc'
      ? [{ id: 'myPlan', title: 'Billing/Plan', icon: CreditCard }]
      : []),
    {
      id: 'our-compliance',
      title: 'Our Compliance',
      icon: CircleCheck,
      subtab: 'certification'
    }
  ];

  selectedTab = signal<IV4ProfileTab>(this.tabs[0]);
  complianceOpen = signal(false);
  mobileDropdownOpen = signal(false);

  toggleMobileDropdown(): void {
    this.mobileDropdownOpen.update((v) => !v);
  }

  closeMobileDropdown(): void {
    this.mobileDropdownOpen.set(false);
  }

  ngOnInit(): void {
    this.loadUserData();
    if (this.route.snapshot?.routeConfig?.path === 'changepassword') {
      this.tabChange('security');
    }
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam) {
      this.tabChange(tabParam);
    }
  }

  tabChange(tabId: string): void {
    const tab = this.tabs.find((t) => t.id === tabId) ?? this.tabs[0];
    if (tab.subtab) {
      this.complianceOpen.update((v) => !v);
      return;
    }
    this.complianceOpen.set(false);
    this.selectedTab.set(tab);
    this.currentSubTab = '';
    this.closeMobileDropdown();
  }

  selectSubTab(tabId: string): void {
    const tab = this.tabs.find((t) => t.id === tabId) ?? this.tabs[0];
    this.selectedTab.set(tab);
    this.currentSubTab = tab.subtab ?? '';
    this.closeMobileDropdown();
  }

  private loadUserData(): void {
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
            this.userName.set(res.data.name);
            this.isManualEntry.set(!!res.data.manualBusinessEntryStatus);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.userService.userDetailsSignal.set(undefined);
    this.userService.isLoadingUserDetailsSignal.set(false);
    this.userService.userBusinessListSignal.set([]);
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
