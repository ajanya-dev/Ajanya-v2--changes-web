import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-v4-new-credit-card-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './v4-new-credit-card-modal.component.html',
  styleUrl: './v4-new-credit-card-modal.component.scss'
})
export class V4NewCreditCardModalComponent implements OnDestroy {
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef);
  private cyberSourceService = inject(CybersourceService);
  private alertService = inject(V4AlertService);
  private dialogData = inject<{ cardId: string; nickName: string }>(
    MAT_DIALOG_DATA
  );

  destroy$ = new Subject<boolean>();
  loading = signal(false);

  nickNameControl = new FormControl(
    this.dialogData.nickName ?? '',
    Validators.required
  );

  updateCard(): void {
    this.nickNameControl.markAsTouched();
    if (this.nickNameControl.invalid) return;

    this.loading.set(true);
    this.cyberSourceService
      .updateCard(
        this.dialogData.cardId,
        { nickName: this.nickNameControl.value as string },
        false
      )
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Updated Successfully' });
          this.dialogRef.close({ nickName: this.nickNameControl.value });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
