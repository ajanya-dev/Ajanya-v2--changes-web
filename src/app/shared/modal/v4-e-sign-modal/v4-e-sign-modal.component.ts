import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-e-sign-modal',
  templateUrl: './v4-e-sign-modal.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component]
})
export class V4ESignModalComponent {
  readonly XIcon = X;
  esignUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.esignUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/esign.pdf');
  }
}
