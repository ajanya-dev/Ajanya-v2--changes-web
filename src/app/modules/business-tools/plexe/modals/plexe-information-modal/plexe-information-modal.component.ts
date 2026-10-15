import { Component, inject } from '@angular/core';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';

@Component({
  selector: 'app-plexe-information-modal',
  templateUrl: './plexe-information-modal.component.html',
  styleUrls: ['./plexe-information-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, MatDialogActions]
})
export class PlexeInformationModalComponent {
  private dialogRef = inject(MatDialogRef<PlexeInformationModalComponent>);

  onContinue() {
    this.dialogRef.close(true);
  }
}
