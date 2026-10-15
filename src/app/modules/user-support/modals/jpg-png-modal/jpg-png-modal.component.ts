import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-jpg-png-modal',
  templateUrl: './jpg-png-modal.component.html',
  styleUrls: ['./jpg-png-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose]
})
export class JpgPngModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
