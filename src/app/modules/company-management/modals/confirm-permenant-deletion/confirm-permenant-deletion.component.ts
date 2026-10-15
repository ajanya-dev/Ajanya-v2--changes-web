import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IOwnCompany } from 'src/app/layout/model/header';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

/**
 * @description To confirm and delete a company
 */
@Component({
  selector: 'app-confirm-permenant-deletion',
  templateUrl: './confirm-permenant-deletion.component.html',
  styleUrls: ['./confirm-permenant-deletion.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogClose,
    MatDialogActions,
    FontAwesomeModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule
  ]
})

export class ConfirmPermenantDeletionComponent implements OnDestroy {

  private companyManagementService = inject(CompanyManagementService);
  private headerservice = inject(HeaderService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<ConfirmPermenantDeletionComponent>);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private fb = inject(FormBuilder);
  private changeDet = inject(ChangeDetectorRef);
  public data: { companyId: string } = inject(MAT_DIALOG_DATA);

  /** variables */
  subscriptions: Subscription[] = [];
  loading = false;
  parantCompanyDetaills: IOwnCompany | undefined;
  faXmark = faXmark;
  heading = 'Permanently delete company';
  instructionSection = true;
  passwordSection = false;
  deleteSection = false;

  confirmationForm = this.fb.group({
    password: new FormControl('', [Validators.required])
  });

  /**
   * @description Load's all existing companies
   */
  loadAllCompanies(): void {
    this.subscriptions.push(
      this.companySwitchRepo.getAllCompanies().subscribe((res) => {
        this.parantCompanyDetaills = res.data.ownCompanies.find(
          (e: IOwnCompany) => e.isItDefault === 1
        );
      })
    );
  }

  /**
   * @description Toggles the deletion process for a company.
   */
  stepToDeleteCompany(): void {
    if (!this.deleteSection) {
      this.passwordSection = true;
      this.heading = 'Confirm password';
    }
    this.instructionSection = false;
    if (this.deleteSection) {
      this.deleteCompany();
    }
  }

  /**
   * @description Handles the submission of the password form.
   */
  submitPassword(): void {
    this.confirmationForm.markAllAsTouched();
    if (this.confirmationForm.invalid) return;
    this.heading = 'Permanently delete company';
    this.passwordSection = false;
    this.deleteSection = true;
    this.loadAllCompanies();
  }

  /**
   * @description Delete the company and closes the modal
   */
  deleteCompany() {
    const password = this.confirmationForm.controls.password.value as string;
    this.loading = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .deleteCompany(this.data.companyId, password)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.changeDet.detectChanges();
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialogRef.close({ success: true, id: res?.data.id });
              this.changeDet.detectChanges();
              this.openSuccessAlert();
              this.changeCompany(
                this.parantCompanyDetaills?.companyId as string,
                this.parantCompanyDetaills?.companyName as string,
                'owncmp',
                this.parantCompanyDetaills?.isItDefault ?? 0
              );
              this.headerservice.setHeaderValueChanged(true);
            }
          },
          error: (err) => {
            if (err) {
              this.changeDet.detectChanges();
              this.passwordSection = true;
              this.deleteSection = false;
              this.heading = 'Confirm password';
            }
          }
        })
    );
  }

  /**
   * @description Change the active company
   */
  changeCompany(id: string, name: string, type: string, isItDefault: number): void {
    this.companyManagementService.setActiveCompanyInfo(id, name, type, isItDefault);
  }

  /**
   * @description Sucess alert
   */
  openSuccessAlert() {
    const data = {
      content: 'Company Deleted Successfully',
      close: true
    };
    return this.alertService.successAlert(data);
  }

  /**
   * @description Unsubscribe all subscriptions when the component destroys
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
