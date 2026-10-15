import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  IOdooConnectionForm,
  IOdooConnectionPayload
} from 'src/app/modules/integration/odoo/model/odoo';
import { odooConnectedOverride } from '../../odoo-connection-state';

@Component({
  selector: 'app-v4-connect-odoo-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    NgOptimizedImage,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-connect-odoo-modal.component.html',
  styleUrl: './v4-connect-odoo-modal.component.scss'
})
export class V4ConnectOdooModalComponent {
  private fb = inject(FormBuilder);
  private odooService = inject(OdooService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<V4ConnectOdooModalComponent>);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;

  isLoading = false;

  odooForm: FormGroup<IOdooConnectionForm> = this.fb.group({
    db: ['', [Validators.required]],
    username: ['', [Validators.required]],
    api_key: ['', [Validators.required]]
  });

  onSubmit(): void {
    this.odooForm.markAllAsTouched();
    if (this.odooForm.invalid) {
      this.changeDetector.markForCheck();
      return;
    }

    this.isLoading = true;
    const formValue = this.odooForm.getRawValue();
    const body: IOdooConnectionPayload = {
      db: formValue.db ?? '',
      username: formValue.username ?? '',
      api_key: formValue.api_key ?? ''
    };

    this.odooService
      .authenticateOdoo(body)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          odooConnectedOverride.set(true);
          this.dialogRef.close(true);
          this.alertService.successAlert({
            content: 'Successfully Connected.',
            close: true
          });
        }
      });
  }
}
