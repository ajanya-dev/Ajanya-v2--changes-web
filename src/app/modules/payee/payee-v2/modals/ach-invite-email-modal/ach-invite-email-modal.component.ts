import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

@Component({
  selector: 'app-ach-invite-email-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FontAwesomeModule,
    MatDialogClose,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './ach-invite-email-modal.component.html',
  styleUrl: './ach-invite-email-modal.component.scss',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class AchInviteEmailModalComponent implements OnInit, OnDestroy {
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private matDialogRef = inject(MatDialogRef<AchInviteEmailModalComponent>);
  public modalData: { id: string[]; email: string } = inject(MAT_DIALOG_DATA);

  private destroy$ = new Subject<void>();

  faXmark = faXmark;
  faUser = faUser;
  emailTemplates: { id: number; name: string }[] = [];
  isSubmitSignal = signal(false);
  loadingSignal = signal(false);
  selectedPayeeCount = signal(0);
  achInviteForm = new FormGroup({
    email: new FormControl(this.modalData?.email ?? ''),
    template: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {    
    this.getTemplates();
    this.getSelectedPayeeCount();
  }

  getSelectedPayeeCount(){
    if(this.modalData.id?.length > 1){
      this.selectedPayeeCount.set(this.modalData.id?.length);
    }else{
      this.selectedPayeeCount.set(1);
    }
  }

  /**
   * @description Get email templates list.
   */
  getTemplates(): void {
    this.loadingSignal.set(true);
    this.payeeService
      .getTemplates()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingSignal.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          res.data.forEach((item, index) => {
            const obj = {
              id: index + 1,
              name: item
            };
            this.emailTemplates.push(obj);
          });
        }
      });
  }

  /**
   * @description Submit the email templates form.
   */
  submit(): void {
    this.achInviteForm.markAllAsTouched();
    if (this.achInviteForm.invalid) return;
    const formValue = this.achInviteForm.value;
    const payload = {
      payeeIds: this.modalData.id,
      template: formValue.template as string
    };
    this.isSubmitSignal.set(true);
    this.payeeService
      .sendInvite(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSubmitSignal.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.message });
          this.matDialogRef.close(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
