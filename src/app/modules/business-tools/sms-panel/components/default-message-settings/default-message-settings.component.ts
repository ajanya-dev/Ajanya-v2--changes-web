import { Component, OnDestroy, OnInit } from '@angular/core';
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
  IDefaultMessageDetails,
  IPhonenumberDetailsModel,
  IGroupDetails
} from 'src/app/modules/business-tools/model/business-tools-common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { IApiRes } from 'src/app/models/api';
import { DefaultSmsDetailsComponent } from '../default-sms-details/default-sms-details.component';
import { GroupDetailsComponent } from '../group-details/group-details.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-default-message-settings',
  templateUrl: './default-message-settings.component.html',
  styleUrls: ['./default-message-settings.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    ControlMessageComponent,
    NgIf,
    SlicePipe
  ]
})
export class DefaultMessageSettingsComponent implements OnInit, OnDestroy {
  defaultSettingsForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  groups: IGroupDetails[] = [];
  fromNumbers: IPhonenumberDetailsModel[] = [];
  serviceArray: IDefaultMessageDetails[] = [];
  isShowGroupDetails = false;
  isLoading: boolean;
  constructor(
    private matDialogue: MatDialog,
    private businessToolsService: BusinessToolsService,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.defaultSettingsForm = new UntypedFormGroup({
      group: new UntypedFormControl('', [Validators.required]),
      fromNumber: new UntypedFormControl('', [Validators.required]),
      message: new UntypedFormControl(
        'Hi, Please visit our website for more services',
        [Validators.required]
      )
    });
    this.getFromNumbers();
    this.getGroups();
    this.getDefaultMesssageServices();
  }

  /**
   * @description Get from numbers.
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
          const response = res as IApiRes<IPhonenumberDetailsModel[]>;
          this.fromNumbers = response.data;
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
          if (this.defaultSettingsForm.value?.group?.id) {
            const selectedGroup = this.groups.find(
              (element) => element.id == this.defaultSettingsForm.value.group.id
            );
            if (selectedGroup) {
              this.defaultSettingsForm.controls.group.setValue(selectedGroup);
            }
          }
        })
    );
  }

  /**
   * @description Adding default messages.
   */
  addDefaultMessage() {
    if (this.defaultSettingsForm.valid) {
      const sendingData = {
        fromNumber: this.defaultSettingsForm.value.fromNumber,
        groupId: this.defaultSettingsForm.value.group.id,
        message: this.defaultSettingsForm.value.message
      };
      this.subscriptions.push(
        this.businessToolsService
          .addDefaultMesssageService(sendingData)
          .pipe(
            catchError(() => {
              return of(false);
            })
          )
          .subscribe((res) => {
            if (res.success) {
              const data = {
                close: true,
                timeout: 3000,
                title: 'Success!',
                content: 'Default SMS added!'
              };
              this._alertService.successAlert(data);
            }
            this.defaultSettingsForm.reset();
            this.getDefaultMesssageServices();
          })
      );
    } else {
      this.defaultSettingsForm.markAllAsTouched();
    }
  }

  /**
   * @description Delete default sms service.
   */
  deleteDefaultSMSService(item: IDefaultMessageDetails, i: number) {
    const alert = this.openConfirmAlert(
      `Are you sure you want to delete this default sms service?`
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.businessToolsService
            .deleteDefaultMesssageService(item.id as string)
            .pipe(
              catchError(() => {
                return of(false);
              })
            )
            .subscribe((res) => {
              if (res.success) {
                const data = {
                  close: true,
                  timeout: 3000,
                  title: 'Success!',
                  content: 'Default SMS removed successfully!'
                };
                this._alertService.successAlert(data);
                this.serviceArray.splice(i, 1);
              }
            })
        );
      }
    });
  }

  /**
   * @description get default sms services.
   */
  getDefaultMesssageServices() {
    this.subscriptions.push(
      this.businessToolsService
        .getDefaultMesssageServices()
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          this.serviceArray = res.data;
        })
    );
  }

  /**
   * @description Open create group component.
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
   * @description Open edit group component.
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
   * @description Open edit default sms details component.
   */
  editDefaultSMSGroup(data: IDefaultMessageDetails) {
    const dialogRef = this.matDialogue.open(DefaultSmsDetailsComponent, {
      maxWidth: '1300px',
      width: '93%',
      minHeight: '200px',
      data: { mode: 'details', details: data },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((isRefresh) => {
      if (isRefresh) {
        this.getDefaultMesssageServices();
      }
    });
  }

  /**
   * @description Confirm alert.
   */
  openConfirmAlert(
    content: string,
    cancelMsg?: string,
    doneMsg?: string,
    title = 'Confirm'
  ) {
    const data = {
      title: title,
      content: content,
      cancelMsg: cancelMsg ? cancelMsg : 'cancel',
      doneMsg: doneMsg ? doneMsg : 'OK'
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * @description Show group details.
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
