import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
  FormBuilder
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { IBankAccounts } from 'src/app/models/developer';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { RouterLink } from '@angular/router';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, NgIf, NgFor, NgOptimizedImage } from '@angular/common';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { faArrowRotateRight, faClone, faEnvelope, faHeadset, faMessage, faSpinner, faFileText, faWebhook, faList, faHistory, faKey, faUniversity, faCircleQuestion, faFloppyDisk, faEyeSlash, faGear } from '@fortawesome/pro-solid-svg-icons';
import { faSkype } from '@fortawesome/free-brands-svg-icons';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { WhiteLabelDirective } from '../../../../directive/white-label.directive';
import {
  IActivityDataDeveloper_apiData,
  IWebhookSettings
} from "../../../../models/developer";
import { IApiRes } from "../../../../models/api";
import { CommonButtonV35Component } from "../../../../shared/v3/buttons/common-button-v35/common-button-v35.component";
import { MatDialog } from '@angular/material/dialog';
import { OtpModalComponent } from '../../../cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { faBookBlank, faExclamationTriangle, faEye } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-developer-panel',
  templateUrl: './developer-panel.component.html',
  styleUrls: ['./developer-panel.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgFor,
    MatTooltip,
    FaIconComponent,
    ControlMessageComponent,
    MatRadioGroup,
    MatRadioButton,
    MatCheckbox,
    WhiteLabelDirective,
    RouterLink,
    CommonButtonV35Component,
    NgOptimizedImage,
    NgSelectModule,
    V3DataTableComponent
]
})
export class DeveloperPanelComponent implements OnInit, OnDestroy {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private developerPanelService = inject(DeveloperPanelService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  tokenApiForm: UntypedFormGroup;
  btnDisable = false;
  btnDisable2 = false;
  subscriptions: Subscription[] = [];
  activityData: IBankAccounts[];
  filteredActivityData: IBankAccounts[];
  webhookSett: IWebhookSettings;
  enabledServices: Array<number>;
  selectAnEvent: Array<string>;
  webhookForm: UntypedFormGroup;
  getpaidWebhookForm: UntypedFormGroup;

  searchName: string = '';
  searchNickName: string = '';
  searchId: string = '';
  searchAccount: string = '';
  searchRouting: string = '';

  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faHeadSet = faHeadset;
  faCopyPaste = faClone;
  faRotateArrow = faArrowRotateRight;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faSpinner = faSpinner;
  faFileText = faFileText;
  faSkype = faSkype;
  faWebhook = faWebhook;
  faList = faList;
  faHistory = faHistory;
  faKey = faKey;
  faUniversity = faUniversity;
  faExclamationTriangle = faExclamationTriangle;
  faCircleQuestion = faCircleQuestion;
  faFloppyDisk = faFloppyDisk;
  faGear = faGear;
  faBookBlank = faBookBlank;
  isTokenRevealed = false;
  tokenPlaceholder = '••••••••••••••••••••••••••••••••';
  revealTokenLoading = false;

  isPartnerTokenRevealed = false;
  revealPartnerTokenLoading = false;
  partnerCopyClass = false;

  mailTrackChecked = false;
  checkStatusChecked = false;
  eventUpdateChecked = false;
  eventUpdateChecked2 = false;
  data: IActivityDataDeveloper_apiData;
  generateBtn = false;
  arr: string[] = [];
  webhookEvents: string[];
  selectedEvents: string[] = [];
  copyCLass = false;
  selectedWebhook: string ='new';
  selectedTab: string = 'api-settings';
  screenWidth = window.innerWidth;
  loadingSignal = signal<boolean>(true);
  sessionKey: string;
  hideSecretKey = signal<boolean>(true);

  ngOnInit(): void {
    this.updateScreenWidth();
    this.initForm();
    this.webhookSettinit();
    this.gpbfWebhook();
    this.apiSettingsTable();
    this.getWebhookEvents();
  }

  @HostListener('window:resize', ['$event'])
  updateScreenWidth() {
    this.screenWidth = window.innerWidth;
  }

  getWebhookEvents() {
    this.developerPanelService.getWebhookEvents().subscribe((res) => {
      this.webhookEvents = res.data;
    });
  }

  initForm(): void {
    this.tokenApiForm = this.fb.group({
      token_api: [this.tokenPlaceholder],
      partner_token: [this.tokenPlaceholder]
    });
  }

  webhookSettinit() {
    this.webhookForm = this.fb.group({
      webhookUrl: ['', [Validators.required,this.urlValidator()]],
      secrectKey: [''],
      mailTrack: [''],
      sendCheckUpdate: [''],
      webhookStatus: ['']
    });
  }

  gpbfWebhook() {
    this.getpaidWebhookForm = this.fb.group({
      getPaidWebhookurl: ['', [Validators.required]],
      getPaidSecret: [''],
      selectUpdate: [],
      getPaidStatus: ['']
    });
  }

  token() {
    const data = {
      session_key: this.sessionKey ? this.sessionKey : ''
    };
    this.subscriptions.push(
      this.developerPanelService
        .tokenApiKey(data)
        .pipe(
          finalize(() => {
            this.generateBtn = false;
          })
        )
        .subscribe(
          (res) => {
            this.generateBtn = false;
            if (res.success) {
              this.tokenApiForm.patchValue({
                token_api: res.data.token
              });
              this.isTokenRevealed = true;
            }
            this.alertService.successAlert({title: 'Success', content: 'New Api Key has genereated successfully.'});
          },
          (err) => {
            this.sessionKey = err.error.session_key;
            if (err.error.errorCode === '112') {
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.newApi();
                }
              });
            }
          }
        )
    );
  }

  copyToClipboard(element: HTMLInputElement, section: 'api' | 'partner' = 'api') {
    element.select();
    document.execCommand('copy');

    if (section === 'partner') {
      this.partnerCopyClass = true;
      setTimeout(() => {
        this.partnerCopyClass = false;
      }, 800);
    } else {
      this.copyCLass = true;
      setTimeout(() => {
        this.copyCLass = false;
      }, 800);
    }
  }

  newApi() {
    this.generateBtn = true;
    this.token();
  }

  revealToken() {
    // Prevent multiple simultaneous clicks
    if (this.revealTokenLoading) {
      return;
    }

    this.revealTokenLoading = true;
    this.subscriptions.push(
      this.developerPanelService
        .getToken(this.sessionKey)
        .pipe(
          finalize(() => {
            this.revealTokenLoading = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.tokenApiForm.patchValue({
                token_api: res.data.token
              });
              this.isTokenRevealed = true;
            }
          },
          (err) => {
            this.sessionKey = err.error.session_key;
            if (err.error.errorCode === '112') {
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.revealToken();
                }
              });
            }
          }
        )
    );
  }

  revealPartnerToken() {
    // Prevent multiple simultaneous clicks
    if (this.revealPartnerTokenLoading) {
      return;
    }

    this.revealPartnerTokenLoading = true;
    this.subscriptions.push(
      this.developerPanelService
        .getPartnerConnectToken()
        .pipe(
          finalize(() => {
            this.revealPartnerTokenLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.tokenApiForm.patchValue({
              partner_token: res.data.connectionKey
            });
            this.isPartnerTokenRevealed = true;
          }
        })
    );
  }

  WebUpdatebtn() {
    this.webhookForm.markAllAsTouched();
    if (this.webhookForm.invalid) {
      return;
    }
    this.btnDisable2 = true;
    this.subscriptions.push(
      this.developerPanelService
        .updateWebhook(this.webhookSettings())
        .pipe(
          finalize(() => {
            this.btnDisable2 = false;
          })
        )
        .subscribe((res) => {
          this.btnDisable2 = false;
          if (res.success) {
            const data = {
              close: true,
              content: 'Updated'
            };
            this.alertService.successAlert(data);
          }
        })
    );
  }

  webhookSettings() {
    const data = this.webhookForm.value;
    return {
      webhookUrl: data.webhookUrl,
      webhookSecret: data.secrectKey,
      enabledServices: [data.mailTrack, data.sendCheckUpdate],
      status: data.webhookStatus
    };
  }

  getPaidUpdatebtn() {
    const data = this.getpaidWebhookForm.value;
    this.arr= [...this.selectedEvents];
    const enabledServices = [...new Set(this.arr)];
    return {
      webhookUrl: data.getPaidWebhookurl,
      webhookSecret: data.getPaidSecret,
      enabledServices,
      status: data.getPaidStatus
    };
  }

  formWebhookUpdateBtn() {
    this.getpaidWebhookForm.markAllAsTouched();
    if (this.getpaidWebhookForm.invalid) {
      return;
    }
    this.btnDisable = true;
    this.subscriptions.push(
      this.developerPanelService
        .gpblWebhook(this.getPaidUpdatebtn())
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          this.btnDisable = false;
          if (res.success) {
            const data = {
              close: true,
              content: 'Updated'
            };
            this.alertService.successAlert(data);
          }
        })
    );
  }

  alert() {
    const data = {
      title: 'Success',
      close: true,
      content: 'Webhook Updated'
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description Checks wheather the webhook is selected or not
   * @param item webhook item
   * @returns
   */
  checkEventSelected(item: string): boolean {
    return this.selectedEvents.includes(item);
  }

  apiSettingsTable() {
    this.loadingSignal.set(true);
    this.subscriptions.push(
      this.developerPanelService.apiActivity()
      .pipe(
        finalize(() => {
          this.loadingSignal.set(false);
        })
      )
      .subscribe((res:IApiRes<IActivityDataDeveloper_apiData>) => {
        if (res.success) {
          this.data = res.data;
          this.arr = res.data.getPaidByFormWebhook.selectAnEvent
            ? res.data.getPaidByFormWebhook.selectAnEvent
            : [];
          this.selectedEvents = [...this.arr];

          if (res.data.webhookSettings.enabledServices[0] == 1) {
            this.mailTrackChecked = true;
            this.webhookForm.controls.mailTrack.setValue(1);
          } else {
            this.mailTrackChecked = false;
            this.webhookForm.controls.mailTrack.setValue('');
          }

          if (res.data.webhookSettings.enabledServices[1] == 1) {
            this.checkStatusChecked = true;
            this.webhookForm.controls.sendCheckUpdate.setValue(2);
          } else {
            this.checkStatusChecked = false;
            this.webhookForm.controls.sendCheckUpdate.setValue('');
          }

          if (res.success == true) {
            this.webhookForm.patchValue({
              webhookUrl: res.data.webhookSettings.webhookUrl,
              secrectKey: res.data.webhookSettings.webhookSecret,
              webhookStatus: res.data.webhookSettings.webhookStatus?.toString()
            });

            this.getpaidWebhookForm.patchValue({
              getPaidWebhookurl: res.data.getPaidByFormWebhook.webhookUrl,
              getPaidSecret: res.data.getPaidByFormWebhook.secretKey,
              getPaidStatus:
                res.data.getPaidByFormWebhook.webhookStatus === 0 ||
                res.data.getPaidByFormWebhook.webhookStatus === 1
                  ? res.data.getPaidByFormWebhook.webhookStatus.toString()
                  : '1'
            });
          }

          if (
            res.data.getPaidByFormWebhook?.selectAnEvent?.includes(
              'gpbf.check.created'
            )
          ) {
            this.eventUpdateChecked = true;
            this.arr.push('gpbf.check.created');
          } else {
            this.eventUpdateChecked = false;
          }

          if (
            res.data.getPaidByFormWebhook?.selectAnEvent?.includes(
              'gpbf.check.updated'
            )
          ) {
            this.eventUpdateChecked2 = true;
            this.arr.push('gpbf.check.updated');
          } else {
            this.eventUpdateChecked2 = false;
          }

          this.activityData = res.data.bankaccounts;
          this.filteredActivityData = [...this.activityData];
        }
      })
    );
  }

  filterTable() {
    this.filteredActivityData = this.activityData.filter(item => (
        item.bankAccountName?.toLowerCase().includes(this.searchName.toLowerCase()) &&
        item.id?.toString().includes(this.searchId) &&
        item.bankAccountNumber?.toString().includes(this.searchAccount) &&
        item.bankRoutingNumber?.toString().includes(this.searchRouting) &&
        item.bankAccountNickName?.toLowerCase().includes(this.searchNickName.toLowerCase())
      ));
  }

  onChecked(ev: MatCheckboxChange, val: number) {
    if (ev.checked && val == 1) {
      this.webhookForm.controls.mailTrack.setValue(1);
    } else if (!ev.checked && val == 1) {
      this.webhookForm.controls.mailTrack.setValue('');
    }

    if (ev.checked && val == 2) {
      this.webhookForm.controls.sendCheckUpdate.setValue(2);
    } else if (!ev.checked && val == 2) {
      this.webhookForm.controls.sendCheckUpdate.setValue('');
    }
  }

  onCheckedGpbf(ev: MatCheckboxChange, item: string) {
    if (ev.checked && !this.arr.includes(item)) {
      this.arr.push(item);
      if (!this.selectedEvents.includes(item)) {
        this.selectedEvents.push(item);
      }
    } else if (!ev.checked && this.arr.includes(item)) {
      this.arr = this.arr.filter((val) => val != item);
      this.selectedEvents = this.selectedEvents.filter((val) => val != item);
    }
  }

  removeEvent(item: string) {
    this.selectedEvents = this.selectedEvents.filter((val) => val !== item);
    this.arr = this.arr.filter((val) => val !== item);
  }

  onSelectedEventsChange(selected: string[]) {
    this.selectedEvents = selected;
    this.arr = [...selected];
  }

  updateSelectedEvents(selected: string[]) {
    this.arr = [...selected];
    this.selectedEvents = [...selected];
  }

  removeEventFromSelection(item: string) {
    this.arr = this.arr.filter((val) => val !== item);
    this.selectedEvents = this.selectedEvents.filter((val) => val !== item);
  }

  urlValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: string} | null => {
      if (!control.value) {
        return null;
      }
  
      const url = control.value;
      
      if (!this.isHttps(url)) {
        return { invalidUrl: 'URL must start with https://' };
      }
  
      if (this.isLocalhost(url)) {
        return { invalidUrl: 'localhost is not allowed' };
      }
  
      if (!this.isValidDomainOrIp(url)) {
        return { invalidUrl: 'Invalid domain or IP address' };
      }
  
      return null;
    };
  }

  isHttps(url: string): boolean {
    return url.startsWith('https://');
  }

  isLocalhost(url: string): boolean {
    return /^https:\/\/localhost/i.test(url);
  }

  isValidDomainOrIp(url: string): boolean {
    // Remove 'https://' from the beginning of the URL
    const hostPart = url.replace(/^https:\/\//i, '');
    
    // Regular expression for domain names
    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}/i;
    
    // Regular expression for IP addresses
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    return domainPattern.test(hostPart) || ipPattern.test(hostPart);
  }

    /**
   * @description Method to open live chat
   */
    goToLiveChat(): void {
      this.dynamicWhiteLabelService.goToLiveChat();
    }

    switchWebhookTab(currentWebhook: string){
      this.selectedWebhook = currentWebhook;
    }

    switchTab(tab: string) {
      this.selectedTab = tab;
    }

  toggleStatus(type: string) {
    if (type === 'new') {
      const currentStatus = this.getpaidWebhookForm.controls.getPaidStatus.value;
      this.getpaidWebhookForm.controls.getPaidStatus.setValue(currentStatus === '1' ? '0' : '1');
    } else if (type === 'old') {
      const currentStatus = this.webhookForm.controls.webhookStatus.value;
      this.webhookForm.controls.webhookStatus.setValue(currentStatus === '1' ? '0' : '1');
    }
    
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
