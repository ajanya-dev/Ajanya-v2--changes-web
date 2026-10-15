import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import {
  LucideAngularModule,
  X,
  Info
} from 'lucide-angular';

import { IBankDropdown } from 'src/app/models/bank';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

interface IInjectData {
  bankAc?: IBankDropdown;
}

@Component({
  selector: 'app-v4-wire-routingnumber-add',
  templateUrl: './v4-wire-routingnumber-add.component.html',
  styleUrls: ['./v4-wire-routingnumber-add.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    MatDialogClose
  ]
})
export class V4WireRoutingnumberAddComponent {
  private dialogRef = inject(MatDialogRef<V4WireRoutingnumberAddComponent>);
  private dialogData = inject<IInjectData>(MAT_DIALOG_DATA, { optional: true });

  readonly XIcon = X;
  readonly InfoIcon = Info;

  wireRoutingNumber = new FormControl('', [
    Validators.required,
    ValidationService.routingNumberValidator
  ]);

  bankAc: IBankDropdown | undefined = this.dialogData?.bankAc;

  get noteMessage(): string {
    const bankInfo = this.bankAc
      ? ` for ${this.bankAc.name} - ${this.bankAc.accountNumber}`
      : '';
    return `The routing number you provided${bankInfo} is not valid for wire transfers. Please provide your wire routing number, we will use this routing number to transfer money to your account.`;
  }

  submit(): void {
    if (this.wireRoutingNumber.valid) {
      this.dialogRef.close({
        wireRoutingNumber: this.wireRoutingNumber.value
      });
    } else {
      this.wireRoutingNumber.markAllAsTouched();
    }
  }
}
