import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { addPayeeData } from 'src/app/data/data/payee';
import { IPayeeDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import {
  V4RadioGroupComponent,
  IV4RadioOption
} from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';

@Component({
  selector: 'app-default-payment-method-v4',
  templateUrl: './default-payment-method-v4.component.html',
  styleUrls: ['./default-payment-method-v4.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    V4RadioGroupComponent,
    V4ControlMessageComponent,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class DefaultPaymentMethodV4Component implements OnInit {
  readonly XIcon = X;

  public data: { payeeId: string } = inject(MAT_DIALOG_DATA);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<DefaultPaymentMethodV4Component>);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  DefaultPayMethods = addPayeeData.loadDefaultPayMethod();
  submitting = signal(false);
  payeeTypeOptions: IV4RadioOption[] = [
    { id: '1', name: 'Customer/AnyOne' },
    { id: '2', name: 'Vendor' },
    { id: '3', name: 'Employee' }
  ];

  payeeData: IPayeeDetails;
  updateForm: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.getPayeeEditData();
  }

  initForm() {
    this.updateForm = this.fb.group({
      payeeTypeId: ['', Validators.required],
      defaultPaymentMethod: ['', Validators.required]
    });
  }

  getPayeeEditData() {
    this.payeeService
      .getPayeeEditData(this.data?.payeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) {
          this.payeeData = data.data;
          this.updateForm.controls.payeeTypeId.setValue(
            data.data?.payeeTypeId?.toString()
          );
        }
      });
  }

  submit() {
    if (this.updateForm.invalid) {
      return;
    }

    const body = {
      id: this.data?.payeeId,
      ...this.updateForm.value
    };

    this.submitting.set(true);
    this.payeeService
      .updatePaymentMethod(body)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({
            content: 'Default payment method updated'
          });
          this.dialogRef.close({ success: true });
        }
      });
  }
}
