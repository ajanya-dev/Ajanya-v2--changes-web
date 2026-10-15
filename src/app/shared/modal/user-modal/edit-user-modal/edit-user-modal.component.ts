import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription, finalize } from 'rxjs';
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
import { IUserForm, IUsersList, UserType } from 'src/app/models/user';
import { UserService } from 'src/app/shared/service/user/user.service';
import { NgFor, NgIf } from '@angular/common';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

export interface IEditUserFormBody {
  name: string;
  nickName: string;
  clientType: number;
  companyName: string;
}

@Component({
  selector: 'app-edit-user-modal',
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    ControlMessageComponent,
    NgIf,
    FontAwesomeModule,
    CommonButtonV35Component
  ]
})
export class EditUserModalComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef);
  private userManagementService = inject(UserManagementV35Service);
  private alertService = inject(AlertService);

  private user: IUsersList = inject(MAT_DIALOG_DATA);
  private destroy$ = new Subject<boolean>();
  loading = false;

  subscriptions: Subscription[] = [];
  userForm: FormGroup<IUserForm>;
  userType: UserType[] = ['User', 'Accountant', 'Clerk', 'Approver'];

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Inittializing form
   */
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

  /**
   * Getting the corresponding user type from the number got from API.
   */
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

  /**
   * Getting the corresponding number according to selected user type to store in DB.
   * @param type
   * @returns
   */
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

  /**
   * creating form body
   * @returns
   */
  formBody() {
    const userData = this.userForm.value;
    return {
      name: userData.name as string,
      nickName: userData.nickName as string,
      clientType: this.userTypeNubmer(userData.userType) as number,
      companyName: userData.companyName as string
    };
  }

  /**
   * Submitting data to API.
   */
  submit() {
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
              close: true
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
