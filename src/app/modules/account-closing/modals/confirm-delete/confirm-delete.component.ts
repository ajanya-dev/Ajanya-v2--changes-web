import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { IReasonForClosing } from 'src/app/models/user';
import { ColseAccountService } from 'src/app/shared/service/close-account/colse-account.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Component for asking reason for closing the account and proceed accordingly.
 */
@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    ControlMessageComponent,
    CommonButtonV35Component
  ]
})
export class ConfirmDeleteComponent implements OnInit, OnDestroy {
  public data: { username: string; password: string } = inject(MAT_DIALOG_DATA);
  private closeAccService = inject(ColseAccountService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ConfirmDeleteComponent>);
  private localStorageService = inject(LocalStorageService);

  optionSelected = false;
  btnDisable = false;
  subscriptions: Subscription[] = [];
  closereason: IReasonForClosing[];
  selectedReason: string;
  isReasonLoading = false;
  faXmark = faXmark;

  deleteForm = new FormGroup({
    message: new FormControl('', [Validators.required, Validators.minLength(20)])
  });

  ngOnInit(): void {
    this.closeReason();
  }

  /**
   * @description Gets the list of preset reasons for closing account.
   */
  closeReason() {
    this.isReasonLoading = true;
    this.subscriptions.push(
      this.closeAccService
        .reasonsforClosing()
        .pipe(
          finalize(() => {
            this.isReasonLoading = false;
          })
        )
        .subscribe((res) => {
          this.closereason = res.data;
        })
    );
  }

  /**
   * @description Submits the reason for closing and proceeds to account deletion.
   * @returns
   */
  onSubmit() {
    this.deleteForm.markAllAsTouched();
    if (this.deleteForm.invalid) {
      return;
    }

    this.btnDisable = true;

    const data = {
      message: this.deleteForm.controls.message.value as string,
      password: this.data.password
    };
    this.subscriptions.push(
      this.closeAccService
        .deleteAccount(data)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res) {
              this.localStorageService.setItem(
                'restore-date',
                res?.message['restore-date']
              );
              this.dialogRef.close();
              this.router.navigateByUrl('/restoreAccount');
            }
          }
        })
    );
  }

  /**
   * @description Chooses the reason for closing account from pre
   * @param ev - event.
   * @param reason - selected item.
   */
  getRadioChange(reason: string) {
    this.selectedReason = reason;
    this.optionSelected = true;
    if (this.selectedReason === 'Other') {
      this.deleteForm.controls.message.reset();
    } else {
      this.deleteForm.controls.message.setValue(reason);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
