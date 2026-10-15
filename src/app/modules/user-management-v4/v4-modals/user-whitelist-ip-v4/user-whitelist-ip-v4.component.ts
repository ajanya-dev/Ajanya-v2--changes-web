import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { filter, finalize, switchMap, tap } from 'rxjs';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

interface IIpAddress {
  id: string;
  ipAddress: string;
  name: string;
}

@Component({
  selector: 'app-user-whitelist-ip-v4',
  templateUrl: './user-whitelist-ip-v4.component.html',
  styleUrls: ['./user-whitelist-ip-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ]
})
export class UserWhitelistIpV4Component implements OnInit {
  private userService = inject(UserManagementService);
  private alertService = inject(V4AlertService);
  private injectedData: { clientId: string } = inject(MAT_DIALOG_DATA, {
    optional: true
  });

  private destroyRef = inject(DestroyRef);
  dialogRef = inject(MatDialogRef<UserWhitelistIpV4Component>);

  clientId: string;
  loading = false;
  ipList: IIpAddress[] = [];
  isDeleteLoading: boolean[] = [];

  IpAddressForm = new FormGroup({
    ipAddress: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/)
    ]),
    name: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.clientId = this.injectedData?.clientId;
    this.getWhiteListIp(this.clientId);
  }

  getWhiteListIp(clientId: string) {
    this.userService
      .getWhiteListIp(clientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.ipList = res.data;
          if (res.data.length > 0) {
            this.isDeleteLoading.length = res.data.length;
            this.isDeleteLoading.fill(false);
          }
        }
      });
  }

  onSubmit() {
    this.IpAddressForm.markAllAsTouched();
    if (this.IpAddressForm.invalid) return;

    this.loading = true;
    this.userService
      .createWhiteListIp(
        this.IpAddressForm.value as { ipAddress: string; name: string },
        this.clientId
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.getWhiteListIp(this.clientId);
          this.IpAddressForm.reset();
        }
      });
  }

  onDeleteIP(id: string, i: number) {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this IP address?'
    });
    alert
      .afterClosed()
      .pipe(
        filter((r) => !!r),
        tap(() => {
          this.isDeleteLoading[i] = true;
        }),
        switchMap(() =>
          this.userService.deleteIpAddress(this.clientId, id).pipe(
            finalize(() => {
              this.isDeleteLoading[i] = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'IP Address Deleted.' });
          this.ipList.splice(i, 1);
        }
      });
  }
}
