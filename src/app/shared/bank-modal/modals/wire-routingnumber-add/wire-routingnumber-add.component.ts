import { Component, Inject } from '@angular/core';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * @description Modal component to add wire routing number for bank account.
 */
@Component({
  selector: 'app-wire-routingnumber-add',
  templateUrl: './wire-routingnumber-add.component.html',
  styleUrls: ['./wire-routingnumber-add.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions
  ]
})
export class WireRoutingnumberAddComponent {
  wireRoutingNumber = new FormControl('', [
    Validators.required,
    ValidationService.routingNumberValidator
  ]);
  utils = Utils;
  bankAc: IBankDropdown;

  constructor(
    private dialogRef: MatDialogRef<WireRoutingnumberAddComponent>,
    @Inject(MAT_DIALOG_DATA) dialogData: { bankAc: IBankDropdown }
  ) {
    this.bankAc = dialogData?.bankAc;
  }

  /**
   * @description Method to submit the wire routing number data.
   */
  submit() {
    if (this.wireRoutingNumber.valid) {
      this.dialogRef.close({ wireRoutingNumber: this.wireRoutingNumber.value });
    } else {
      this.wireRoutingNumber.markAllAsTouched();
    }
  }
}
