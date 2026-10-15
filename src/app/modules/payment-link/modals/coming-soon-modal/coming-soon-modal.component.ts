import { Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-coming-soon-modal',
  templateUrl: './coming-soon-modal.component.html',
  styleUrls: ['./coming-soon-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose]
})
export class ComingSoonModalComponent {}
