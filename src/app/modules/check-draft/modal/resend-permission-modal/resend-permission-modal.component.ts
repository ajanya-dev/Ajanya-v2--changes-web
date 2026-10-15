import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ICheckDraftTableRow } from '../../model/Checkdraft';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

interface IResendPermissionForm {
  email: FormControl<string | null>;
  sms: FormControl<string | null>;
}

/**
 * @description Component for asking permission to resend via modal dialog for check drafts.
 */
@Component({
  selector: 'app-resend-permission-modal',
  templateUrl: './resend-permission-modal.component.html',
  styleUrls: ['./resend-permission-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    MatDialogActions,
    MatDialogClose,
    NgIf
  ]
})
export class ResendPermissionModalComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  resendPermissionForm: FormGroup<IResendPermissionForm>;
  isEshow = false;
  isSshow = false;
  isClick = false;
  btnDisable = false;
  constructor(
    private _headerservice: HeaderService,
    private fb: FormBuilder,
    private checkDraftService: CheckDraftService,
    private _alertService: AlertService,
    public dialogRef: MatDialogRef<ResendPermissionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ICheckDraftTableRow
  ) {}

  ngOnInit(): void {
    this.initFormGroup();

    if (this.data) {
      this.setData(this.data);
    }
  }

  /** Sets the initial data for the form. */
  setData(data: ICheckDraftTableRow) {
    this.resendPermissionForm.patchValue({
      email: data.payee_email,
      sms: data.payee_phone
    });
  }

  /** Initializes the form group with form controls and validators. */
  initFormGroup(): void {
    this.resendPermissionForm = this.fb.group({
      email: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator
      ]),
      sms: new FormControl('', [
        Validators.required,
        ValidationService.phoneNumberValidator
      ])
    });
  }

  /**
   * @description Checks the validation status for email or SMS.
   * @param type The type of validation ('e' for email, 's' for SMS).
   */
  checkValidate(type: 'e' | 's') {
    if (type === 'e') {
      if (this.resendPermissionForm.controls.email.value !== '') {
        this.isEshow = true;
        this.isClick = false;
      } else {
        this.isEshow = false;
      }
    } else {
      if (this.resendPermissionForm.controls.sms.value !== '') {
        this.isSshow = true;
        this.isClick = false;
      } else {
        this.isSshow = false;
      }
    }
  }

  /** Handles the resend permission process. */
  resendCheckDraftPermission() {
    if (this.resendPermissionForm.invalid) {
      this.resendPermissionForm.markAllAsTouched();
      return;
    }

    this.btnDisable = true;
    this.resendPermission();
  }

  /** Performs the actual resend permission operation. */
  resendPermission() {
    type T = { email: string; sms: string };

    this.subscription.push(
      this.checkDraftService
        .resendPermission(
          this.data.action,
          this.resendPermissionForm.value as T
        )
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.succesAlert();
            this._headerservice.setHeaderValueChanged(true);
            this.dialogRef.close(true);
          }
        })
    );
  }

  /** Displays a success alert message. */
  succesAlert() {
    const data = {
      title: 'Success',
      content: 'Permission resent',
      close: true
    };
    this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el.unsubscribe());
  }
}
