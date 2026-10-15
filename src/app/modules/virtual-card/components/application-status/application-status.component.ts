import { Component, input, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGift } from '@fortawesome/pro-solid-svg-icons';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-application-status',
  standalone: true,
  imports: [CommonButtonV35Component,FaIconComponent,RouterLink],
  templateUrl: './application-status.component.html',
  styleUrl: './application-status.component.scss'
})
export class ApplicationStatusComponent {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  status = input.required<'pending' | 'rejected'>();
  receivedCardCount = input.required<number>();
  showReceivedGiftCards = output<boolean>();
  faGift = faGift;

  contactSupport() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  viewReceivedGiftCards() {
    this.showReceivedGiftCards.emit(true);
  }
}
