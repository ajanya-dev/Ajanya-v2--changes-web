import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { filter, finalize } from 'rxjs';
import { UserService } from 'src/app/shared/service/user/user.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { OcwPreventMultiClickDirective } from 'src/app/directive/ocw-prevent-multi-click.directive';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { environment } from 'src/environments/environment';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';

export type CurrentTab =
  | 'Add User'
  | 'Add Your Accountant'
  | 'Add Clerk'
  | 'Add Approver';

interface INewUserForm {
  userType: FormControl<string>;
  email: FormControl<string>;
  confirmUserEmail: FormControl<string>;
  name: FormControl<string>;
  nickName: FormControl<string>;
  companyName: FormControl<string>;
  clientType: FormControl<number>;
}

@Component({
  selector: 'app-invite-user-modal-v4',
  templateUrl: './invite-user-modal-v4.component.html',
  styleUrls: ['./invite-user-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    OcwPreventMultiClickDirective,
    WhiteLabelDirective,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ]
})
export class InviteUserModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<InviteUserModalV4Component>);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private localStorageService = inject(LocalStorageService);
  private userManagementServiceV35 = inject(UserManagementV35Service);
  private injectData = inject<'drop-down'>(MAT_DIALOG_DATA, { optional: true });
  private destroyRef = inject(DestroyRef);

  private env = environment;
  currentTab: CurrentTab = 'Add User';
  userType: CurrentTab[] = [
    'Add User',
    'Add Your Accountant',
    'Add Clerk',
    'Add Approver'
  ];

  buttonText = 'Send Invitation';
  isUserAdding = false;
  sessionKey = '';

  newUserForm = new FormGroup<INewUserForm>({
    userType: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    confirmUserEmail: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
    nickName: new FormControl('', { nonNullable: true }),
    companyName: new FormControl('', { nonNullable: true }),
    clientType: new FormControl(1, { nonNullable: true })
  });

  ngOnInit() {
    this.initForm();
    this.patchCompanyName();
  }

  initForm() {
    this.newUserForm = this.fb.group<INewUserForm>({
      userType: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, ValidationService.emailValidator]
      }),
      confirmUserEmail: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          ValidationService.emailValidator,
          ValidationService.isMatchingValidator(
            'email',
            'Please check the confirmation email'
          )
        ]
      }),
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      nickName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      companyName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      clientType: new FormControl(1, { nonNullable: true })
    });
  }

  patchCompanyName() {
    this.newUserForm.patchValue({
      companyName: this.localStorageService.getItem('activeCompanyName') || ''
    });
  }

  userChange() {
    this.clientTypeChange();
    this.userType.forEach((iterable) => {
      if (iterable === this.newUserForm.controls.userType.value) {
        this.currentTab = iterable;
      }
    });
  }

  clientTypeChange() {
    let clientType = 0;
    if (this.newUserForm.controls.userType.value === 'Add User') {
      clientType = 1;
    } else if (
      this.newUserForm.controls.userType.value === 'Add Your Accountant'
    ) {
      clientType = 2;
    } else if (this.newUserForm.controls.userType.value === 'Add Clerk') {
      clientType = 4;
    } else if (this.newUserForm.controls.userType.value === 'Add Approver') {
      clientType = 5;
    }
    this.newUserForm.patchValue({ clientType });
  }

  newUserSubmit() {
    this.newUserForm.markAllAsTouched();
    if (this.env.env_id === 'compass') {
      this.newUserForm.controls.nickName.setValue(
        this.newUserForm.controls.name.value
      );
      this.newUserForm.controls.userType.setValue('Add User');
    }

    if (this.newUserForm.valid) {
      const { name, email, nickName, clientType, companyName } =
        this.newUserForm.getRawValue();
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('nickName', nickName);
      formData.append('clientType', String(clientType));
      formData.append('companyName', companyName);
      if (this.sessionKey) {
        formData.append('session_key', this.sessionKey);
      }
      this.isUserAdding = true;
      this.userService
        .addUsers(formData)
        .pipe(
          finalize(() => {
            this.isUserAdding = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              if (this.injectData === 'drop-down') {
                this.dialogRef.close({
                  client_id: res.data,
                  client_name: this.newUserForm.value.name
                });
                return;
              }
              this.close('success');
              if (this.newUserForm.value.clientType !== 3) {
                const obj = {
                  client_id: res.data,
                  client_name: this.newUserForm.value.name,
                  type: 'Add'
                };
                this.localStorageService.setItem('userPermission', obj);
                this.userManagementServiceV35.createUserWithoutPermission
                  .pipe(
                    filter((response) => response === false),
                    takeUntilDestroyed(this.destroyRef)
                  )
                  .subscribe(() => {
                    this.dialogRef.close('success');
                  });
              }
            }
          },
          error: (err: HttpErrorResponse) => {
            if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const otpDialog = this.dialog.open(OtpModalV4Component, {
                maxWidth: '410px',
                width: '100%',
                panelClass: 'paddingless-modal-rounded',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              otpDialog
                .afterClosed()
                .pipe(
                  filter((result) => !!result),
                  takeUntilDestroyed(this.destroyRef)
                )
                .subscribe(() => {
                  this.newUserSubmit();
                });
            }
          }
        });
    }
  }

  close(value: string): void {
    this.dialogRef.close(value);
  }
}
