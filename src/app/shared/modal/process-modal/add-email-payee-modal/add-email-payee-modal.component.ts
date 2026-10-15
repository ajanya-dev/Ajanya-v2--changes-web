import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize } from 'rxjs/operators';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { NgClass } from '@angular/common';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Modal component for adding email address to the payee.
 */
@Component({
  selector: 'app-add-email-payee-modal',
  templateUrl: './add-email-payee-modal.component.html',
  styleUrls: ['./add-email-payee-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    NgClass,
    WhiteLabelPipe
  ]
})
export class AddEmailPayeeModalComponent implements OnInit, OnDestroy {
  emailPayee: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  isloading = false;
  constructor(
    private fb: UntypedFormBuilder,
    private __payeeService: PayeeService,
    @Inject(MAT_DIALOG_DATA) public data: IViewPayee,
    public dialogRef: MatDialogRef<AddEmailPayeeModalComponent>,
    private __alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data.nickName || this.data.name) {
      this.emailPayee.patchValue({
        name: this.data.name,
        nick_name: this.data.nickName
      });
    }
  }

  /**
   * @description Initializes email payee form.
   */
  initForm() {
    this.emailPayee = this.fb.group({
      // name:['',Validators.required],
      email: ['', [ValidationService.emailValidator, Validators.required]]
      // nick_name:['',Validators.required]
    });
  }

  /**
   * @description Invokes `this.addEmail` if `emailPayee` form is valid.
   */
  submit() {
    this.emailPayee.markAllAsTouched();
    if (!this.emailPayee.invalid) {
      this.addEmail();
    }
  }

  /**
   * @description Opens warning alert dialog.
   * @param content - content to be shown in alert.
   * @returns warning alert.
   */
  warningAlert(content: string) {
    const data = {
      title: 'Oops',
      content: content,
      doneMsg: 'OK',
      isCancel: false
    };
    return this.__alertService.warningAlert(data);
  }

  /**
   * @description Submits data to `addPayeetoEmail` method of payee service, for adding email to the payee.
   */
  addEmail() {
    this.isloading = true;
    this.subscriptions.push(
      this.__payeeService
        .addPayeetoEmail(this.data.id, this.emailPayee.value)
        .pipe(
          finalize(() => {
            this.isloading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isloading = false;
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
