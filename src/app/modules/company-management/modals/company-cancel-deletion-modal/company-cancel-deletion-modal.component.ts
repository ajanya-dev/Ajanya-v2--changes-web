import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { NgStyle } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Modal component for cancelling the deletion of component
 */
@Component({
  selector: 'app-company-cancel-deletion-modal',
  templateUrl: './company-cancel-deletion-modal.component.html',
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    NgStyle
  ]
})
export class CompanyCancelDeletionModalComponent implements OnInit, OnDestroy {
  /**variables */
  confirmationForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  loading = false;

  /**
   * @description Dependancy injection via constructor
   * @param data
   * @param fb
   * @param companyManagementService
   * @param _dialogRef
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: { companyId: string }) {}

  private fb = inject(UntypedFormBuilder);
  private dialogRef = inject(MatDialogRef<CompanyCancelDeletionModalComponent>);
  private companySwitchRepo = inject(CompanySwitchRepository);

  ngOnInit(): void {
    this.initAddCompanyForm();
  }

  /**
   * @description Initialization of confirmation form to cancel deletion
   */
  initAddCompanyForm(): void {
    this.confirmationForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  /**
   * @description Deletion cancelling api call and modal closing
   * @returns
   */
  reStartCompany() {
    if (this.confirmationForm.invalid) {
      return;
    }

    this.loading = true;
    const data = { password: this.confirmationForm.controls.password.value };
    this.subscriptions.push(
      this.companySwitchRepo
        .cancelDeleteCompany(this.data.companyId, data)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close({ success: true, id: res.data.id });
          }
        })
    );
  }

  /**
   * @description Unsubscribe the existing subscription when this component destroys
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
