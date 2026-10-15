import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { OdooService } from '../../service/odoo.service';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, Subscription } from 'rxjs';
import { faAngleLeft, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IOdooConnectionForm, IOdooConnectionPayload } from '../../model/odoo';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-connect-odoo-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    FontAwesomeModule,
    MatDialogModule,
    NgOptimizedImage
  ],
  templateUrl: './connect-odoo-modal.component.html',
  styleUrl: './connect-odoo-modal.component.scss'
})
export class ConnectOdooModalComponent {
  private fb = inject(FormBuilder);
  private odooService = inject(OdooService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef);
  private alertService = inject(AlertService);

  subscription: Subscription[] = [];
  isLoading = false;
  isFirstSection = true;

  odooConnectionForm: FormGroup<IOdooConnectionForm> = this.fb.group({
    db: ['', [Validators.required]],
    username: ['', [Validators.required]],
    api_key: ['', [Validators.required]]
  });

  faXmark = faXmark;
  faAngleLeft = faAngleLeft;

  /**
   * @description Handles form submission for connecting to Netsuite.
   */
  onSubmit(): void {
    this.odooConnectionForm.markAllAsTouched();
    if (this.odooConnectionForm.invalid) return;
    this.isLoading = true;
    const formValue = this.odooConnectionForm.value;
    const body: IOdooConnectionPayload = {
      db: formValue.db || '',
      username: formValue.username,
      api_key: formValue.api_key
    } as IOdooConnectionPayload;
    this.subscription.push(
      this.odooService
        .authenticateOdoo(body)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.alertService.successAlert({
              content: 'Successfully Connected.'
            });
          }
          this.isFirstSection = true;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
