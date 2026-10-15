import { CommonButtonV35Component } from './../../../v3/buttons/common-button-v35/common-button-v35.component';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MatDialogClose, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from 'src/app/shared/service/user/user.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Subscription, finalize } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { environment } from 'src/environments/environment';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';

export type currentTab =
  | 'Add User'
  | 'Add Your Accountant'
  | 'Add Clerk'
  | 'Add Approver';

/**
 * @description Modal component to create new user.
 */
@Component({
  selector: 'app-new-user-modal-latest',
  templateUrl: './new-user-modal-latest.component.html',
  styleUrls: ['./new-user-modal-latest.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    OcwPreventMultiClickDirective,
    WhiteLabelDirective,
    MatTooltip,
    CommonButtonV35Component
  ]
})
export class NewUserModalLatestComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<NewUserModalLatestComponent>);
  private dialog = inject(MatDialog);
  private fb = inject(UntypedFormBuilder);
  private userService = inject(UserService);
  private alertService = inject(AlertService);
  private localStorageService = inject(LocalStorageService);
  private userManagementServiceV35 = inject(UserManagementV35Service);
  private injectData = inject<'drop-down'>(MAT_DIALOG_DATA);

  private env = environment;
  currentTab: currentTab = 'Add User';
  userType: currentTab[] = [
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

  /**
   * @description Initializes new user form.
   */
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

  /**
   * @description Updates the company name in `newUserForm`.
   */
  patchCompanyName() {
    this.newUserForm.patchValue({
      companyName: this.localStorageService.getItem('activeCompanyName') || null
    });
  }

  /**
   * @description Method invoked user type is selected.
   * Adds acttive class list to selection.
   * Invokes `this.clientTypeChange` method to change client type.
   * Sets the current tab according to user type selection.
   * @param small - HTML element containing user type.
   */
  userChange(small: HTMLElement) {
    small.classList.add('active');
    this.clientTypeChange();
    this.userType.forEach((iterable) => {
      if (iterable === this.newUserForm.controls.userType.value) {
        this.currentTab = iterable;
      }
    });
  }

  /**
   * @description Sets the `clientType` field of `newUserForm` according to user type selection.
   */
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

    this.newUserForm.patchValue({
      clientType
    });
  }

  /**
   * @description Method invoked when 'Send Invitation' button is clicked in template.
   * Submits data from `newUserForm` to `addUsers` method of user service.
   * Navigates to add permissions page and sets user permissions.
   */
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
        this.userService.addUsers(formData)
        .pipe(finalize(() => {
          this.isUserAdding = false;
        }))
        .subscribe({
          next: (res) => {
            if (res.success) {
              if(this.injectData === 'drop-down'){
                const newUSer = {
                  client_id: res.data,
                  client_name: this.newUserForm.value.name,
                };
                this.dialogRef.close(newUSer);
                return;
              }
              this.close('success');
              if (this.newUserForm.value.clientType === 3) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Invitation sent.',
                  close: true,
                  timeout: 2000
                });
              } else {
                const obj = {
                  client_id: res.data,
                  client_name: this.newUserForm.value.name,
                  type: 'Add'
                };
                this.localStorageService.setItem('userPermission', obj);
                this.userManagementServiceV35.createUserWithoutPermission.subscribe((response) => {
                    if (response === false){
                      this.dialogRef.close('success');
                    }
                });
              }
            }
          },
          error: (err: HttpErrorResponse) => {
            if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const otpDialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
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

  /**
   * @description Closes the dialog.
   */
  close(value: string): void {
    this.dialogRef.close(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
