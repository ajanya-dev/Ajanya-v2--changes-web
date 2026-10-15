import { Component } from '@angular/core';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';

@Component({
  selector: 'app-group-name-modal',
  templateUrl: './group-name-modal.component.html',
  styleUrls: ['./group-name-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, MatDialogActions]
})
export class GroupNameModalComponent {
  constructor(private dialogRef: MatDialogRef<GroupNameModalComponent>) {}

  save(groupName: HTMLInputElement) {
    if (!groupName.value) {
      return;
    }

    this.dialogRef.close(groupName.value);
  }
}
