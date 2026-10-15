import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Subscription, finalize } from 'rxjs';
import { LucideAngularModule, X, Loader2 } from 'lucide-angular';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { IReasonForClosing } from 'src/app/models/user';
import { ColseAccountService } from 'src/app/shared/service/close-account/colse-account.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4RestoreAccountComponent } from 'src/app/modules/user-v4/modals/v4-restore-account/v4-restore-account.component';

@Component({
  selector: 'app-v4-confirm-delete',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    MatRadioGroup,
    MatRadioButton,
    CommonButtonV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './v4-confirm-delete.component.html'
})
export class V4ConfirmDeleteComponent implements OnInit, OnDestroy {
  public data: { username: string; password: string } = inject(MAT_DIALOG_DATA);
  private closeAccService = inject(ColseAccountService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4ConfirmDeleteComponent>);
  private localStorageService = inject(LocalStorageService);

  readonly XIcon = X;
  readonly LoaderIcon = Loader2;

  subscriptions: Subscription[] = [];
  closereason: IReasonForClosing[] = [];
  selectedReason = '';
  optionSelected = false;
  btnDisable = false;
  isReasonLoading = signal(false);

  deleteForm = new FormGroup({
    message: new FormControl('', [
      Validators.required,
      Validators.minLength(20)
    ])
  });

  ngOnInit(): void {
    this.closeReason();
  }

  closeReason(): void {
    this.isReasonLoading.set(true);
    this.subscriptions.push(
      this.closeAccService
        .reasonsforClosing()
        .pipe(finalize(() => this.isReasonLoading.set(false)))
        .subscribe((res) => {
          this.closereason = res.data;
        })
    );
  }

  onSubmit(): void {
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
              this.dialog.open(V4RestoreAccountComponent, {
                maxWidth: '560px',
                width: '93%',
                autoFocus: false,
                disableClose: true,
                panelClass: 'paddingless-modal-rounded'
              });
            }
          }
        })
    );
  }

  getRadioChange(reason: string): void {
    this.selectedReason = reason;
    this.optionSelected = true;
    if (this.selectedReason === 'Other') {
      this.deleteForm.controls.message.reset();
    } else {
      this.deleteForm.controls.message.setValue(reason);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
