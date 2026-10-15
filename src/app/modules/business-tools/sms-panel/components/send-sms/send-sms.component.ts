import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IGroupDetails,
  IPhonenumberDetailsModel,
  ITabItem
} from 'src/app/modules/business-tools/model/business-tools-common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { GroupDetailsComponent } from '../group-details/group-details.component';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { QuicksmsComponent } from '../quicksms/quicksms.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-send-sms',
  templateUrl: './send-sms.component.html',
  styleUrls: ['./send-sms.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    MatTooltip,
    ControlMessageComponent,
    NgFor,
    QuicksmsComponent
  ]
})
export class SendSmsComponent implements OnInit, OnDestroy {
  smsForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  groups: IGroupDetails[] = [];
  fromNumbers: IPhonenumberDetailsModel[] = [];
  isLoading: boolean;
  isShowGroupDetails: boolean;
  @Output() changeTab = new EventEmitter<ITabItem>();
  customSwitch = 0;
  clickEventSubscription: Subscription;
  isDarkMode: boolean;

  constructor(
    private businessToolsService: BusinessToolsService,
    private matDialogue: MatDialog,
    private _alertService: AlertService,
    private headerService: HeaderService,
    private _themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.smsForm = new UntypedFormGroup({
      campaignName: new UntypedFormControl('', [Validators.required]),
      group: new UntypedFormControl('', [Validators.required]),
      fromNumber: new UntypedFormControl('', [Validators.required]),
      message: new UntypedFormControl('', [Validators.required])
    });
    this.getGroups();
    this.getFromNumbers();
    this.getDarkModeStatus();
  }

  /**
   * @description Get dark mode status.
   */
  getDarkModeStatus() {
    if (this.isDarkMode === undefined) {
      this.isDarkMode = this._themeService.getInitialColourTheme();
    }
    this.clickEventSubscription = this._themeService
      .getThemeSwitch()
      .subscribe((res) => {
        this.isDarkMode = res;
      });
  }

  /**
   * @description Get phone numbers.
   */
  getFromNumbers() {
    this.subscriptions.push(
      this.businessToolsService
        .getFromNumber()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const reposne = res as IApiRes<IPhonenumberDetailsModel[]>;
          this.fromNumbers = reposne.data;
          if (!(this.fromNumbers?.length > 0)) {
            const data = {
              content: 'You dont have any phone number to send sms.',
              isCancel: true,
              doneMsg: 'Buy Phone Number'
            };
            const alertRef = this._alertService.infoAlert(data);
            alertRef.afterClosed().subscribe((buyPhno) => {
              if (buyPhno) {
                const tabDetails: ITabItem = {
                  name: 'More Settings',
                  id: 2,
                  selectedSubTab: { id: 'buynewphonenumber' }
                };
                this.changeTab.emit(tabDetails);
              }
            });
          }
        })
    );
  }

  /**
   * @description Get sms groups.
   */
  getGroups() {
    this.subscriptions.push(
      this.businessToolsService
        .getSmsGroups()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<IGroupDetails[]>;
          this.groups = response.data;
          if (this.smsForm.value?.group?.id) {
            const selectedGroup = this.groups.find(
              (element) => element.id == this.smsForm.value.group.id
            );
            if (selectedGroup) {
              this.smsForm.controls.group.setValue(selectedGroup);
            }
          }
        })
    );
  }

  /**
   * @description send sms function.
   */
  createCampaignAndSendSms() {
    if (this.smsForm.valid) {
      const sendingData = new FormData();
      sendingData.append(
        'campaignName',
        this.smsForm.controls.campaignName.value
      );
      sendingData.append(
        'fromNumber',
        this.smsForm.controls.fromNumber.value.id
      );
      sendingData.append('groupId', this.smsForm.controls.group.value.id);
      sendingData.append('message', this.smsForm.controls.message.value);
      this.isLoading = true;
      this.subscriptions.push(
        this.businessToolsService
          .sendSMS(sendingData)
          .pipe(
            catchError(() => {
              this.isLoading = false;
              return of(false);
            })
          )
          .subscribe((res) => {
            const reposnse = res as IApiResMesssage;
            if (reposnse.success) {
              const data = {
                close: true,
                timeout: 2000,
                title: 'Success!',
                content: 'Message Sent'
              };
              this._alertService.successAlert(data);
              this.isLoading = false;
              this.smsForm.reset();
              this.headerService.setHeaderValueChanged(true);
            }
          })
      );
    } else {
      this.smsForm.markAllAsTouched();
    }
  }

  /**
   * @description Get the remaining characters.
   */
  getMessageCoutText() {
    const messageCount = Math.ceil(
      this.smsForm.controls.message.value.length / 160
    );
    const charactersLeft =
      160 - (this.smsForm.controls.message.value.length % 160);
    return (
      charactersLeft + ' characters remaining, ' + messageCount + ' message(s)'
    );
  }

  /**
   * @description Check the urls in the message.
   */
  checkUrlsAndSendGroupCampaignSMS() {
    if (this.smsForm.valid) {
      if (this.checkURLs()) {
        const linkDetectedDialog = this._alertService.infoAlert({
          content:
            'You have included some links in your message. We will review this message before sending it.',
          doneMsg: 'Ok',
          isCancel: true,
          isOk: true
        });
        linkDetectedDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.confirmDialogGroupCampaign();
          }
        });
      } else {
        this.confirmDialogGroupCampaign();
      }
    } else {
      this.smsForm.markAllAsTouched();
    }
  }

  /**
   * @description Confirm to send the message.
   */
  confirmDialogGroupCampaign() {
    const dRef = this._alertService.infoAlert({
      content:
        'This message will be sent to the group "' +
        this.smsForm.controls.group.value.name +
        '" from phonenumber "' +
        this.smsForm.controls.fromNumber.value.fromNumber +
        '"',
      doneMsg: 'OK',
      isCancel: true,
      isOk: true
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.createCampaignAndSendSms();
      }
    });
  }

  /**
   * @description Open modal for create group.
   */
  openCreateGroup() {
    const dialogRef = this.matDialogue.open(GroupDetailsComponent, {
      maxWidth: '800px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'create' }
    });
    dialogRef.afterClosed().subscribe((isRefresh) => {
      if (isRefresh) {
        this.getGroups();
      }
    });
  }

  /**
   * @description Open modal for edit group.
   */
  editGroup(data: IGroupDetails) {
    const dialogRef = this.matDialogue.open(GroupDetailsComponent, {
      maxWidth: '800px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'details', groupData: data },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((isRefresh) => {
      if (isRefresh) {
        this.getGroups();
      }
    });
  }

  /**
   * @description Add codes to the message.
   */
  addCodesToMessage(textToInject: string) {
    const message = this.smsForm.controls.message.value;
    try {
      const messageTextAreaElement = document?.getElementById(
        'messagetext'
      ) as HTMLInputElement;
      const cursorPositionInTextArea: number =
        messageTextAreaElement.selectionStart!;
      this.smsForm.controls.message.setValue(
        [
          message.slice(0, cursorPositionInTextArea),
          textToInject,
          message.slice(cursorPositionInTextArea)
        ].join('')
      );
      setTimeout(() => {
        messageTextAreaElement.setSelectionRange(
          cursorPositionInTextArea + textToInject.length,
          cursorPositionInTextArea + textToInject.length
        ); // sets textarea cursor
      }, 0); //to skip this digest cycle in angular meanwhlie  this.smsForm.controls.message.setValue will be executed
    } catch (err) {
      this.smsForm.controls.message.setValue(message + textToInject);
    }
  }

  /**
   * @description show group details.
   */
  showGroupDetails() {
    this.isShowGroupDetails = true;
  }

  /**
   * @description Hide group details.
   */
  hideGroupDetails() {
    this.isShowGroupDetails = false;
  }

  /**
   * @description Check urls in message.
   */
  checkURLs(): boolean {
    const urlRegex =
      /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;
    if (this.smsForm.value.message.match(urlRegex)) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
