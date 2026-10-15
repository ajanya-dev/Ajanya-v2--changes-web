import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  input,
  inject
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgClass } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  faCircleExclamation,
  faSpinner,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';

interface IIpAddress {
  id: string;
  ipAddress: string;
  name: string;
}

@Component({
  selector: 'app-user-whitelist-ip',
  templateUrl: './user-whitelist-ip.component.html',
  styleUrls: ['./user-whitelist-ip.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    CommonButtonV35Component,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent
  ]
})
export class UserWhitelistIpComponent implements OnInit, OnDestroy {
  private userService = inject(UserManagementService);
  private alertService = inject(AlertService);
  private userProfileService = inject(UserProfileService);
  private injectedData: { clientId: string , source?: string} = inject(MAT_DIALOG_DATA, {
    optional: true
  });

  dialogRef = inject(MatDialogRef<UserWhitelistIpComponent>);

  @Input() clientId: string;
  actAsChild = input(false);
  loading: boolean;
  subscriptions: Subscription[] = [];
  ipList: IIpAddress[] = [];
  isDeleteLoading: boolean[] = [];
  faXmark = faXmark;
  faTrash = faTrash;
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;
  source: string;

  IpAddressForm = new FormGroup({
    ipAddress: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/)
    ]),
    name: new FormControl('', [Validators.required]),
    nickname: new FormControl(''),
  });

  ngOnInit(): void {
    const clientIdFromModal = this.injectedData?.clientId;
    this.clientId = this.clientId || clientIdFromModal;
    this.source = this.injectedData?.source || '';
    if(!this.source) {
      this.getWhiteListIp(this.clientId);
    }
    this.initForm();
  }

  getWhiteListIp(clientId: string) {
    this.subscriptions.push(
      this.userService.getWhiteListIp(clientId).subscribe((res) => {
        if (res.success) {
          this.ipList = res.data;
          if (res.data.length > 0) {
            this.isDeleteLoading.length = res.data.length;
            this.isDeleteLoading.fill(false);
          }
        }
      })
    );
  }

  initForm() {
    const nameCtrl = this.IpAddressForm.get('name');
    const nicknameCtrl = this.IpAddressForm.get('nickname');
    if(this.source === 'profile') {
      nicknameCtrl?.enable();
      nicknameCtrl?.setValidators([Validators.required]);
      nameCtrl?.clearValidators();
    }else{
      nicknameCtrl?.disable();
      nicknameCtrl?.clearValidators();
      nameCtrl?.setValidators([Validators.required]);
    }

    nameCtrl?.updateValueAndValidity();
    nicknameCtrl?.updateValueAndValidity();
  }

  onSubmit() {
    this.IpAddressForm.markAllAsTouched();
    if (this.IpAddressForm.invalid) {
      return;
    }

    this.loading = true;
    if(this.source === 'profile') {
      const data = {
        ip: this.IpAddressForm.get('ipAddress')?.value || '',
        nickname: this.IpAddressForm.get('nickname')?.value || ''
      };
      this.subscriptions.push(
        this.userProfileService.addIpWhitelist(data).pipe(
          finalize(() => {
            this.loading = false;
          })
        ).subscribe((res) => {
          if(res.success) {
            this.alertService.successAlert({
              content: 'IP Address Added.'
            });
            this.IpAddressForm.reset();
            this.dialogRef.close(true);
          }
        })
      );
    }else{
    this.subscriptions.push(
      this.userService
        .createWhiteListIp(
          this.IpAddressForm.value as { ipAddress: string; name: string },
          this.clientId
        )
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.getWhiteListIp(this.clientId);
            this.IpAddressForm.reset();
          }
        })
    );
    }
  }

  onDeleteIP(id: string, i: number) {
    const alert = this.alertService.confirmAlert({
      content: 'You Want to delete this IP Address.'
    });
    alert.afterClosed().subscribe((r) => {
      if (r) {
        this.isDeleteLoading[i] = true;
        this.subscriptions.push(
          this.userService
            .deleteIpAddress(this.clientId, id)
            .pipe(
              finalize(() => {
                this.isDeleteLoading[i] = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  content: 'IP Address Deleted.'
                });
                this.ipList.splice(i, 1);
              }
            })
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
