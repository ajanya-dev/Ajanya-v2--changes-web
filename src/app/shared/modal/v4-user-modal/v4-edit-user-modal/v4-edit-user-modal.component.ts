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
import { LucideAngularModule, X, Pencil } from 'lucide-angular';
import { Subject, Subscription, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { IUserForm, IUsersList, UserType } from 'src/app/models/user';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

export interface IEditUserFormBody {
  name: string;
  nickName: string;
  clientType: number;
  companyName: string;
}

@Component({
  selector: 'app-v4-edit-user-modal',
  templateUrl: './v4-edit-user-modal.component.html',
  styleUrls: ['./v4-edit-user-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class EditUserModalComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef);
  private userManagementService = inject(UserManagementV35Service);
  private alertService = inject(V4AlertService);
  private user: IUsersList = inject(MAT_DIALOG_DATA);
  private destroy$ = new Subject<boolean>();

  readonly XIcon = X;
  readonly PencilIcon = Pencil;

  loading = false;
  subscriptions: Subscription[] = [];
  userForm: FormGroup<IUserForm>;
  userTypeOptions: string[] = ['User', 'Accountant', 'Clerk', 'Approver'];

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

  userTypeNubmer(type: UserType | null | undefined) {
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
      clientType: this.userTypeNubmer(userData.userType) as number,
      companyName: userData.companyName as string
    };
  }

  submit() {
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid) return;

    const body = this.formBody();
    this.loading = true;
    this.subscriptions.push(
      this.userService
        .editUser(this.user.client_id, body)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.dialogRef.close(true);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'User info updated successfully.',
              title: 'Success'
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
