import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  DOUBLE_SIDE_MODAL_DATA,
  DOUBLE_SIDE_MODAL_REF
} from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';

@Component({
  selector: 'app-cancel-deletion-modal-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './cancel-deletion-modal-v4.component.html'
})
export class CancelDeletionModalV4Component {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private companySwitchRepo = inject(CompanySwitchRepository);
  public data = inject(DOUBLE_SIDE_MODAL_DATA) as { companyId: string };
  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);

  loading = signal(false);
  showPassword = signal(false);

  passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required]]
  });

  reopenCompany(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;

    this.loading.set(true);
    const body = { password: this.passwordForm.controls.password.value };

    this.companySwitchRepo
      .cancelDeleteCompany(this.data.companyId, body)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.modalRef.close({ success: true, id: res.data?.id });
        }
      });
  }

  close(): void {
    this.modalRef.close();
  }
}
