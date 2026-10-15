import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBookMedical, faCreditCard, faFileShield, faGlobe, faLock, faShield, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';


@Component({
  selector: 'app-certification-modal',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgOptimizedImage,
    CommonButtonV35Component
  ],
  templateUrl: './certification-modal.component.html',
  styleUrl: './certification-modal.component.scss'
})
export class CertificationModalComponent {
  private dialogRef = inject(MatDialogRef);
  private localStorageService = inject(LocalStorageService);
  faCreditcard = faCreditCard;
  faLock = faLock;
  faGlobe = faGlobe;
  faHealthBook = faBookMedical;
  faShield = faShield;
  faFileShield = faFileShield;
  facross =faXmark;




  closeModal() {
    this.dialogRef.close();
    this.localStorageService.removeItem('showComplianceModal');
  }
}
