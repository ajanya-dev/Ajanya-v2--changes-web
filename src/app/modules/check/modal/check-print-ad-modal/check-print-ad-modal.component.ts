import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Component } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-check-print-ad-modal',
  templateUrl: './check-print-ad-modal.component.html',
  styleUrls: ['./check-print-ad-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, MatCheckbox, MatDialogActions]
})
export class CheckPrintAdModalComponent {
  content = [
    'We print the same check you design.',
    'Same business day Mailing (within hours).',
    'Includes Stamps, Envelope, MICR Printing.',
    'No other hidden fees.'
  ];
  constructor(
    private __matDialogRef: MatDialogRef<CheckPrintAdModalComponent>
  ) {}

  modalClose(btnType: string) {
    this.__matDialogRef.close(btnType);
  }
}
