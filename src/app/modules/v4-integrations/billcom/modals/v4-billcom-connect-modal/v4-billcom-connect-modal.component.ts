import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  selector: 'app-v4-billcom-connect-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-billcom-connect-modal.component.html',
  styleUrl: './v4-billcom-connect-modal.component.scss'
})
export class V4BillcomConnectModalComponent {
  private fb = inject(FormBuilder);
  private integrationService = inject(IntegrationService);
  private dialogRef = inject(MatDialogRef<V4BillcomConnectModalComponent>);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private changeDetector = inject(ChangeDetectorRef);

  readonly XIcon = X;

  isLoading = false;

  billcomForm: FormGroup = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    this.billcomForm.markAllAsTouched();
    if (this.billcomForm.invalid) {
      this.changeDetector.markForCheck();
      return;
    }

    this.isLoading = true;
    const body = {
      userName: this.billcomForm.value.userName,
      password: this.billcomForm.value.password
    };

    this.integrationService
      .connectBilldotCom(body)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Connected',
            close: true
          });
          this.dialogRef.close({ success: true });
        }
      });
  }
}
