import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ColseAccountService } from 'src/app/shared/service/close-account/colse-account.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faXmark,faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

/**
 * @description Modal component for account deletion.
 */
@Component({
  selector: 'app-delete-modal',
  templateUrl: './delete-modal.component.html',
  styleUrls: ['./delete-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent
  ]
})
export class DeleteModalComponent implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private closeAccService = inject(ColseAccountService);
  private dialogRef = inject(MatDialogRef<DeleteModalComponent>);
  private dialog = inject(MatDialog);
  public injectData = inject<{ type?: string; enableBack: boolean }>(MAT_DIALOG_DATA);

  subscription: Subscription[] = [];
  isSubmit = signal(false);
  email: string;
  userName: string;
  returnUrl: string;
  returnUrlIfCompanyZero: string;
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  confirmAccount = new FormGroup({
    password: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.email = this.localStorageService.getItem('email') as string;
    if (this.injectData?.type === 'restore') {
      this.userName = this.localStorageService.getItem('username') as string;
    }
  }

  /**
   * @description Submits the form data along with username / email to confirm password API or restore account API..
   */
  submit() {
    this.confirmAccount.markAllAsTouched();
    if (this.confirmAccount.invalid) {
      return;
    }
    this.isSubmit.set(true);

    const data = this.confirmAccount.value;
    const ProcessedData = {
      password: data.password as string,
      username: this.email ? this.email : this.userName
    };

    const apis$ =
      this.injectData?.type === 'restore'
        ? this.closeAccService.restoreAccount(ProcessedData)
        : this.closeAccService.confirmPassword(ProcessedData);

    this.subscription.push(
      apis$
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (this.injectData?.type === 'restore' || this.injectData?.type === 'report') {
              this.dialogRef.close(ProcessedData);
            } else {
              this.dialogRef.close();
              this.dialog.open(ConfirmDeleteComponent, {
                maxWidth: '570px',
                width: '93%',
                autoFocus: false,
                disableClose: true,
                data: ProcessedData
              });
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
