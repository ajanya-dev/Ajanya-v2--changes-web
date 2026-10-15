import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FormsModule } from '@angular/forms';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-wire-type-v35',
  templateUrl: './wire-type-v35.component.html',
  styleUrls: ['./wire-type-v35.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    CommonButtonV35Component
  ]
})
export class WireTypeV35Component {
  selectedWireType = 'domestic';

  dialogRef = inject(MatDialogRef<WireTypeV35Component>);
  /**
   * Closes the wire transfer type modal dialog by passing the selected wire transfer type.
   * It invokes the 'close' method of the MatDialogRef and passes the selected wire transfer type as the result.
   */
  onSubmit(): void {
    this.dialogRef.close(this.selectedWireType);
  }
}
