import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-jpg-png-modal-v4',
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component],
  templateUrl: './jpg-png-modal-v4.component.html'
})
export class JpgPngModalV4Component {
  readonly data: string = inject(MAT_DIALOG_DATA);
  readonly closeIcon = X;
  imageLoaded = false;

  onImageLoad(): void {
    this.imageLoaded = true;
  }
}
