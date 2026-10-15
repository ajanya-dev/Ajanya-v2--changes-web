import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgStyle, NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

/**
 * Component for connecting to Bill.com.
 */
@Component({
  selector: 'app-bill-dot-com-connect-modal',
  templateUrl: './bill-dot-com-connect-modal.component.html',
  styleUrls: ['./bill-dot-com-connect-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgStyle,
    NgIf
  ]
})
export class BillDotComConnectModalComponent implements OnInit {
  myForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  submitting = false;

  constructor(
    private fb: UntypedFormBuilder,
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private _dialogRef: MatDialogRef<BillDotComConnectModalComponent>
  ) {}

  /**
   * Initializes the component and the form.
   */
  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initializes the form with form controls.
   */
  initForm() {
    this.myForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  /**
   * Submits the form data to connect to Bill.com.
   */
  submit() {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }
    const body = this.myForm.value;
    this.submitting = true;
    this.subscriptions.push(
      this._integrationService
        .connectBilldotCom(body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((data) => {
          if (data?.success) {
            this._alertService.successAlert({ content: 'Connected' });
            this._dialogRef.close({ success: true });
          }
        })
    );
  }
}
