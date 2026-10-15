import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IOwnCompany } from 'src/app/layout/model/header';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  DOUBLE_SIDE_MODAL_DATA,
  DOUBLE_SIDE_MODAL_REF
} from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';

@Component({
  selector: 'app-delete-company-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './delete-company-modal-v4.component.html',
  styleUrls: ['./delete-company-modal-v4.component.scss']
})
export class DeleteCompanyModalV4Component {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private alertService = inject(V4AlertService);
  private companyManagementService = inject(CompanyManagementService);
  private headerService = inject(HeaderService);
  public data = inject(DOUBLE_SIDE_MODAL_DATA) as { companyId: string };
  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);

  /** Steps: 1=permanent warning (instructions), 2=password, 3=final (grace period). Confirm is handled by V4AlertService before opening. */
  step = signal(1);
  loading = signal(false);
  showPassword = signal(false);

  passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required]]
  });

  private parentCompany: IOwnCompany | undefined;

  nextStep(): void {
    const currentStep = this.step();

    if (currentStep === 1) {
      // Instructions → password
      this.step.set(2);
    } else if (currentStep === 2) {
      // Password step → validate, then final
      this.passwordForm.markAllAsTouched();
      if (this.passwordForm.invalid) return;
      this.loadParentCompany();
      this.step.set(3);
    } else if (currentStep === 3) {
      // Final → delete
      this.deleteCompany();
    }
  }

  private loadParentCompany(): void {
    this.companySwitchRepo
      .getAllCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.parentCompany = res.data.ownCompanies.find(
          (e: IOwnCompany) => e.isItDefault === 1
        );
      });
  }

  private deleteCompany(): void {
    const password = this.passwordForm.controls.password.value;
    this.loading.set(true);

    this.companySwitchRepo
      .deleteCompany(this.data.companyId, password)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Company Deleted Successfully',
              close: true
            });

            if (this.parentCompany) {
              this.companyManagementService.setActiveCompanyInfo(
                this.parentCompany.companyId,
                this.parentCompany.companyName,
                'owncmp',
                this.parentCompany.isItDefault ?? 0
              );
            }

            this.headerService.setHeaderValueChanged(true);
            this.modalRef.close({ success: true, id: res?.data?.id });
          }
        },
        error: () => {
          // Go back to password step on error (e.g. wrong password)
          this.step.set(2);
        }
      });
  }

  close(): void {
    this.modalRef.close();
  }
}
