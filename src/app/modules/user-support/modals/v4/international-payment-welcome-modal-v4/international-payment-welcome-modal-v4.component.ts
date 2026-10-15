import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, Globe, Check, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Router } from '@angular/router';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { take } from 'rxjs';

@Component({
  selector: 'app-international-payment-welcome-modal-v4',
  templateUrl: './international-payment-welcome-modal-v4.component.html',
  styleUrls: ['./international-payment-welcome-modal-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InternationalPaymentWelcomeModalV4Component {
  private dialogRef = inject(
    MatDialogRef<InternationalPaymentWelcomeModalV4Component>
  );

  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private clickTrackingService = inject(ClickTrackingService);

  readonly GlobeIcon = Globe;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly faArrowRight = faArrowRight;

  readonly features = [
    'Best exchange rates guaranteed',
    'Transfer money in minutes globally',
    'Payment options for both personal and business use'
  ];

  closeModal(): void {
    this.dialogRef.close();
    this.localStorageService.removeItem('showInternationalPaymentWelcomeModal');
  }

  startSendingNow(): void {
    this.clickTrackingService
      .trackInternationalPaymentClick()
      .pipe(take(1))
      .subscribe();
    this.dialogRef.close(true);
    this.localStorageService.removeItem('showInternationalPaymentWelcomeModal');
    this.router.navigateByUrl('/v4/manage/international-payment/index');
  }
}
