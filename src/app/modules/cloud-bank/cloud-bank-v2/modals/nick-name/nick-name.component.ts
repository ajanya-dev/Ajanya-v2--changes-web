import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

/**
 * @description Component for managing nicknames in a modal dialog.
 */
@Component({
  selector: 'app-nick-name',
  templateUrl: './nick-name.component.html',
  styleUrls: ['./nick-name.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    MatDialogModule,
    FontAwesomeModule
  ]
})
export class NickNameComponent implements OnInit, OnDestroy {
  private cloudService = inject(CloudBankService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  public dialogData: { accountId: string; mode: string; name?: string } =
    inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<NickNameComponent>);

  nickForm: FormGroup;
  subscriptions: Subscription[] = [];
  loading = false;
  faXmark = faXmark;

  ngOnInit(): void {
    this.nickFromInit();
  }

  /**
   * @description Initializes the form for managing nicknames.
   */
  nickFromInit() {
    this.nickForm = this.fb.group({
      nickName: new FormControl('', [
        ValidationService.noWhitespaceValidator,
        Validators.required
      ])
    });
    if (this.dialogData?.name) {
      this.nickForm.controls.nickName.setValue(this.dialogData?.name);
    }
  }

  /**
   * @description Handles the submission of the form to create nickname for selectd account.
   */
  submitBusinessAccount() {
    this.nickForm.markAllAsTouched();
    if (this.nickForm.invalid) {
      return;
    }
    this.loading = true;
    const { nickName } = this.nickForm.value;
    let formatedNickName = nickName.trim()
    this.subscriptions.push(
      this.cloudService
        .addNickName(this.dialogData.accountId, { accountNickName: nickName })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const alertData = {
              content: `${
                this.dialogData.mode === 'add' ? ' Added' : 'Updated '
              } Successfully`,
              close: true
            };
            this.alertService.successAlert(alertData);
            this.dialogRef.close({ sucees: true, nickName:formatedNickName });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
