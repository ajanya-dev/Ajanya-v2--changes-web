import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IApiResMesssage } from 'src/app/models/api';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Modal component for emailing ach authorization form.
 */
@Component({
  selector: 'app-ach-email-modal',
  templateUrl: './ach-email-modal.component.html',
  styleUrls: ['./ach-email-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    MatDialogActions,
    NgIf
  ]
})
export class AchEmailModalComponent implements OnInit, OnDestroy {

  private fb = inject(UntypedFormBuilder);
  private achService = inject(AchService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<AchEmailModalComponent>);
  public data: string = inject(MAT_DIALOG_DATA);

  achEmailForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  loading = false;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * @description Initializes the ach email form.
   */
  initForm() {
    this.achEmailForm = this.fb.group({
      email: ['', [Validators.required, ValidationService.emailValidator]]
    });
  }

  /**
   * @description Creates the ach email form body object and returns it.
   * @returns email form body object.
   */
  emailFormBody() {
    const formValue = this.achEmailForm.value;
    return {
      email: formValue.email,
      id: this.data
    };
  }

  /**
   * @description Posts the ach email form data to the `emailAchForm` method of ach service.
   */
  onSubmit() {
    if (this.achEmailForm.invalid) {
      return;
    }
    this.loading = true;
    const proccessedDat = this.emailFormBody();
    this.subscriptions.push(
      this.achService
        .emailAchForm(proccessedDat)
        .pipe(
          catchError(() => of(false))
        )
        .subscribe((response) => {
          const res = response as IApiResMesssage;
          this.loading = false;
          if (res.success) {
            this.dialogRef.close();
            const data = {
              content: 'Successfully sent',
              close: true,
              timeout: 1500
            };
            this.alertService.successAlert(data);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
