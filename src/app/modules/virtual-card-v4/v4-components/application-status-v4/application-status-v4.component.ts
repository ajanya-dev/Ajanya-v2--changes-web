import { Component, input, output, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Headphones, Gift } from 'lucide-angular';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-application-status-v4',
  standalone: true,
  imports: [CommonButtonV4Component, LucideAngularModule, NgOptimizedImage],
  templateUrl: './application-status-v4.component.html'
})
export class ApplicationStatusV4Component {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private router = inject(Router);

  status = input.required<'pending' | 'rejected'>();
  receivedCardCount = input.required<number>();

  showReceivedGiftCards = output<boolean>();

  readonly headphonesIcon = Headphones;
  readonly giftIcon = Gift;

  contactSupport() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  goHome() {
    this.router.navigate(['/v4/manage/home']);
  }

  viewReceivedGiftCards() {
    this.showReceivedGiftCards.emit(true);
  }
}
