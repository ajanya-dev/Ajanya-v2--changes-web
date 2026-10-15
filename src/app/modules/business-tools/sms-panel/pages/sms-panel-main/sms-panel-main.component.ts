import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import { ITabItem } from 'src/app/modules/business-tools/model/business-tools-common';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AllSmsLogComponent } from '../../components/all-sms-log/all-sms-log.component';
import { InboxComponent } from '../../components/inbox/inbox.component';
import { MoreSettingsComponent } from '../../components/more-settings/more-settings.component';
import { DefaultMessageSettingsComponent } from '../../components/default-message-settings/default-message-settings.component';
import { SendSmsComponent } from '../../components/send-sms/send-sms.component';
import { ContactsComponent } from '../../components/contacts/contacts.component';
import { GroupTableComponent } from '../../components/group-table/group-table.component';
import { SmsTableComponent } from '../../components/sms-table/sms-table.component';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-sms-panel-main',
  templateUrl: './sms-panel-main.component.html',
  styleUrls: ['./sms-panel-main.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    SmsTableComponent,
    GroupTableComponent,
    ContactsComponent,
    SendSmsComponent,
    DefaultMessageSettingsComponent,
    MoreSettingsComponent,
    InboxComponent,
    AllSmsLogComponent
  ]
})
export class SmsPanelMainComponent implements OnInit, OnDestroy {
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  subscriptions: Subscription[] = [];
  tabs: ITabItem[] = [];
  selectedTab: ITabItem;
  isEnabled: number;
  constructor(
    private businessToolsService: BusinessToolsService,
    private router: Router,
    private _localStorageService: LocalStorageService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initialize();
    this.getSmsEnable();
  }

  /**
   * @description Initialise the selected data.
   */
  initialize() {
    this.tabs = [
      { name: 'Send SMS', id: 0 },
      { name: 'Group SMS History', id: 52 },
      { name: 'SMS Log', id: 6 },
      { name: 'Groups', id: 51 },
      { name: 'Contacts', id: 4 },
      { name: 'Inbox', id: 3 },
      { name: 'Default Reply Settings', id: 1 },
      { name: 'More Settings', id: 2 }
    ];

    this.selectedTab = this._localStorageService.getItem(
      'smsPanelLastOpenedTab'
    );

    if (!this.selectedTab) {
      this.selectedTab = this.tabs[0];
    }
  }

  /**
   * @description Select tab.
   */
  selectTab(tab: ITabItem) {
    this.selectedTab = tab;
    this._localStorageService.setItem('smsPanelLastOpenedTab', tab);
  }

  /**
   * @description Get sms enable.
   */
  getSmsEnable() {
    this.subscriptions.push(
      this.businessToolsService
        .getSmsEnable()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const reponse = res as IApiRes<{ terms: boolean; smsEnable: number }>;
          if (reponse.success) {
            this.isEnabled = reponse?.data?.smsEnable;
            if (this.isEnabled == 0) {
              this.router.navigate(['/manage/business-tools/sms-panel/intro']);
            } else if (this.isEnabled == 1 && !reponse?.data?.terms) {
              this.router.navigate(['/manage/business-tools/sms-panel/terms']);
            } else if (this.isEnabled == 2) {
              this.alertService
                .infoAlert({
                  isCancel: true,
                  doneMsg: 'Contact Us',
                  content:
                    'You are not able to access the SMS panel now. Please contact customer support for more info.'
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    this.openChat();
                  }
                  this.router.navigate(['/manage/business-tools']);
                });
            }
          }
        })
    );
  }

  /**
   * @description change selected tab.
   */
  changeTab(tabDetails: ITabItem) {
    this.selectedTab = tabDetails;
  }

  /**
   * @description open zoho support chat.
   */
  openChat() {
    this._dynamicWhiteLabelService.goToLiveChat();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
