import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGlobe, faXmark, faCheckCircle, faArrowRight, faUsers, faMapMarkerAlt } from '@fortawesome/pro-regular-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Router } from '@angular/router';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-international-payment-welcome-modal',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgOptimizedImage,
    CommonButtonV35Component
  ],
  templateUrl: './international-payment-welcome-modal.component.html',
  styleUrl: './international-payment-welcome-modal.component.scss'
})
export class InternationalPaymentWelcomeModalComponent {
  private dialogRef = inject(MatDialogRef);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private clickTrackingService = inject(ClickTrackingService);
  
  faGlobe = faGlobe;
  faXmark = faXmark;
  faCheckCircle = faCheckCircle;
  faArrowRight = faArrowRight;
  faUsers = faUsers;
  faMapMarkerAlt = faMapMarkerAlt;

  closeModal() {
    this.dialogRef.close();
    this.localStorageService.removeItem('showInternationalPaymentWelcomeModal');
  }

  startSendingNow() {
    this.clickTrackingService.trackInternationalPaymentClick().pipe(take(1)).subscribe();
    this.dialogRef.close(true);
    this.localStorageService.removeItem('showInternationalPaymentWelcomeModal');
    this.router.navigateByUrl('/manage/international-payment/index');
  }
}
