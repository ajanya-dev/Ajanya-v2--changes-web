import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { NgClass } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-wire-type-v4',
  templateUrl: './wire-type-v4.component.html',
  styleUrls: ['./wire-type-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgClass,
    CommonButtonV4Component,
    LucideAngularModule
  ]
})
export class WireTypeV4Component {
  selectedWireType = 'domestic';
  XIcon = X;

  dialogRef = inject(MatDialogRef<WireTypeV4Component>);

  onSubmit(): void {
    this.dialogRef.close(this.selectedWireType);
  }
}
