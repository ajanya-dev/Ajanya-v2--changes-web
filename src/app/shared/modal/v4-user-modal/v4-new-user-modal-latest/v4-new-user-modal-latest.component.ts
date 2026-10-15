import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
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
import { LucideAngularModule, X, UserPlus } from 'lucide-angular';
import { UserService } from 'src/app/shared/service/user/user.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Subscription, finalize } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { environment } from 'src/environments/environment';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';

export type CurrentTab =
  | 'Add User'
  | 'Add Your Accountant'
  | 'Add Clerk'
  | 'Add Approver';

@Component({
  selector: 'app-v4-new-user-modal-latest',
  templateUrl: './v4-new-user-modal-latest.component.html',
  styleUrls: ['./v4-new-user-modal-latest.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    WhiteLabelDirective
  ]
})
export class NewUserModalLatestV4Component implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<NewUserModalLatestV4Component>);
  private dialog = inject(MatDialog);
  private fb = inject(UntypedFormBuilder);
  private userService = inject(UserService);
  private alertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  private userManagementServiceV35 = inject(UserManagementV35Service);
  private injectData = inject<'drop-down'>(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly UserPlusIcon = UserPlus;

  private env = environment;
  CurrentTab: CurrentTab = 'Add User';
  userTypeOptions: string[] = [
    'Add User',
    'Add Your Accountant',
    'Add Clerk',
    'Add Approver'
  ];

  label: string;
  checking: boolean;
  usercheck: boolean;
  olduser: boolean;
  buttonText = 'Send Invitation';
  isSubmitDisabled = false;
  subscriptions: Subscription[] = [];
  isUserAdding: boolean = false;
  sessionKey: string = '';

  newUserForm: UntypedFormGroup = new UntypedFormGroup({
    userType: new UntypedFormControl(''),
    email: new UntypedFormControl(''),
    confirmUserEmail: new UntypedFormControl(''),
    name: new UntypedFormControl(''),
    nickName: new UntypedFormControl(''),
    companyName: new UntypedFormControl('')
  });

  ngOnInit() {
    this.initForm();
    this.patchCompanyName();
  }

  initForm() {
    this.newUserForm = this.fb.group({
      userType: ['', [Validators.required]],
      email: ['', [Validators.required, ValidationService.emailValidator]],
      confirmUserEmail: [
        '',
        [
          Validators.required,
          ValidationService.emailValidator,
          ValidationService.isMatchingValidator(
            'email',
            'Please check the confirmation email'
          )
        ]
      ],
      name: ['', [Validators.required]],
      nickName: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      clientType: 1
    });
  }

  patchCompanyName() {
    this.newUserForm.patchValue({
      companyName: this.localStorageService.getItem('activeCompanyName') || null
    });
  }

  onUserTypeChange(value: string) {
    this.newUserForm.patchValue({ userType: value });
    this.clientTypeChange();
    this.CurrentTab = value as CurrentTab;
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
      this.newUserForm.controls.nickName.setValue(this.newUserForm.value.name);
      this.newUserForm.controls.userType.setValue('Add User');
    }

    if (this.newUserForm.valid) {
      const formData = new FormData();
      formData.append('name', this.newUserForm.value.name);
      formData.append('email', this.newUserForm.value.email);
      formData.append('nickName', this.newUserForm.value.nickName);
      formData.append('clientType', this.newUserForm.value.clientType);
      formData.append('companyName', this.newUserForm.value.companyName);
      if (this.sessionKey) {
        formData.append('session_key', this.sessionKey);
      }
      this.isUserAdding = true;
      this.subscriptions.push(
        this.userService
          .addUsers(formData)
          .pipe(
            finalize(() => {
              this.isUserAdding = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                if (this.injectData === 'drop-down') {
                  const newUSer = {
                    client_id: res.data,
                    client_name: this.newUserForm.value.name
                  };
                  this.dialogRef.close(newUSer);
                  return;
                }
                this.close('success');
                if (this.newUserForm.value.clientType === 3) {
                  this.alertService.successAlert({
                    title: 'Success',
                    content: 'Invitation sent.'
                  });
                } else {
                  const obj = {
                    client_id: res.data,
                    client_name: this.newUserForm.value.name,
                    type: 'Add'
                  };
                  this.localStorageService.setItem('userPermission', obj);
                  this.userManagementServiceV35.createUserWithoutPermission.subscribe(
                    (response) => {
                      if (response === false) {
                        this.dialogRef.close('success');
                      }
                    }
                  );
                }
              }
            },
            error: (err: HttpErrorResponse) => {
              if (err.error.errorCode === '112') {
                this.sessionKey = err.error.session_key;
                const otpDialog = this.dialog.open(OtpModalV4Component, {
                  maxWidth: '410px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  panelClass: 'paddingless-modal-rounded',
                  data: err.error
                });
                otpDialog.afterClosed().subscribe((result) => {
                  if (result) {
                    this.newUserSubmit();
                  }
                });
              }
            }
          })
      );
    }
  }

  close(value: string): void {
    this.dialogRef.close(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
