import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { ColseAccountService } from 'src/app/shared/service/close-account/colse-account.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ConfirmDeleteComponent } from 'src/app/modules/user-v4/modals/v4-confirm-delete/v4-confirm-delete.component';

@Component({
  selector: 'app-v4-delete-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-delete-modal.component.html'
})
export class V4DeleteModalComponent implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private closeAccService = inject(ColseAccountService);
  private dialogRef = inject(MatDialogRef<V4DeleteModalComponent>);
  private dialog = inject(MatDialog);
  public injectData = inject<{ type?: string; enableBack: boolean }>(
    MAT_DIALOG_DATA,
    {
      optional: true
    }
  );

  readonly XIcon = X;

  subscriptions: Subscription[] = [];
  isSubmit = signal(false);
  email = '';
  userName = '';

  confirmAccount = new FormGroup({
    password: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.email = this.localStorageService.getItem('email') as string;
    if (this.injectData?.type === 'restore') {
      this.userName = this.localStorageService.getItem('username') as string;
    }
  }

  submit(): void {
    this.confirmAccount.markAllAsTouched();
    if (this.confirmAccount.invalid) {
      return;
    }
    this.isSubmit.set(true);

    const data = this.confirmAccount.value;
    const processedData = {
      password: data.password as string,
      username: this.email ? this.email : this.userName
    };

    const apis$ =
      this.injectData?.type === 'restore'
        ? this.closeAccService.restoreAccount(processedData)
        : this.closeAccService.confirmPassword(processedData);

    this.subscriptions.push(
      apis$.pipe(finalize(() => this.isSubmit.set(false))).subscribe((res) => {
        if (res.success) {
          if (
            this.injectData?.type === 'restore' ||
            this.injectData?.type === 'report'
          ) {
            this.dialogRef.close(processedData);
          } else {
            this.dialogRef.close();
            this.dialog.open(V4ConfirmDeleteComponent, {
              maxWidth: '570px',
              width: '93%',
              autoFocus: false,
              disableClose: true,
              panelClass: 'paddingless-modal-rounded',
              data: processedData
            });
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
