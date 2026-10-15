import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, Subscription, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IUserForm, IUsersList, UserType } from 'src/app/models/user';
import { UserService } from 'src/app/shared/service/user/user.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

@Component({
  selector: 'app-edit-user-modal-v4',
  templateUrl: './edit-user-modal-v4.component.html',
  styleUrls: ['./edit-user-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class EditUserModalV4Component implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef);
  private userManagementService = inject(UserManagementV35Service);
  private alertService = inject(V4AlertService);
  private user: IUsersList = inject(MAT_DIALOG_DATA);
  private destroy$ = new Subject<boolean>();

  loading = false;
  subscriptions: Subscription[] = [];
  userForm: FormGroup<IUserForm>;
  userType: UserType[] = ['User', 'Accountant', 'Clerk', 'Approver'];

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.userForm = new FormGroup<IUserForm>({
      userType: new FormControl(this.currentUserType, [Validators.required]),
      name: new FormControl(this.user.client_name, [Validators.required]),
      nickName: new FormControl(this.user.client_nick_name ?? null, [
        Validators.required
      ]),
      companyName: new FormControl(this.user.company_name, [
        Validators.required
      ])
    });
  }

  get currentUserType(): UserType | null {
    switch (this.user.client_type) {
      case 1:
        return 'User';
      case 2:
        return 'Accountant';
      case 4:
        return 'Clerk';
      case 5:
        return 'Approver';
      default:
        return null;
    }
  }

  userTypeNumber(type: UserType | null | undefined) {
    switch (type) {
      case 'User':
        return 1;
      case 'Accountant':
        return 2;
      case 'Clerk':
        return 4;
      case 'Approver':
        return 5;
      default:
        return undefined;
    }
  }

  formBody() {
    const userData = this.userForm.value;
    return {
      name: userData.name as string,
      nickName: userData.nickName as string,
      clientType: this.userTypeNumber(userData.userType) as number,
      companyName: userData.companyName as string
    };
  }

  submit() {
    const body = this.formBody();
    this.loading = true;
    this.subscriptions.push(
      this.userService
        .editUser(this.user.client_id, body)
        .pipe(
          finalize(() => {
            this.loading = false;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.alertService.successAlert({
              content: 'User info updated successfully.'
            });
            if (this.userManagementService?.selectedUser) {
              this.userManagementService.selectedUser.client_type =
                body.clientType;
              this.userManagementService.selectedUser.company_name =
                body.companyName;
              this.userManagementService.selectedUser.client_name = body.name;
              this.userManagementService.selectedUser.client_nick_name =
                body.nickName;
              this.userManagementService.onSingleUser(
                this.userManagementService.selectedUser,
                this.userManagementService.userIndex
              );
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.destroy$.next(true);
  }
}
