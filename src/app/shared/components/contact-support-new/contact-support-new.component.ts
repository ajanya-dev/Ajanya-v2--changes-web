import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMessage,
  faEnvelope,
  faHeadset
} from '@fortawesome/pro-solid-svg-icons';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-contact-support-new',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './contact-support-new.component.html',
  styleUrl: './contact-support-new.component.scss'
})
export class ContactSupportNewComponent {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faHeadset = faHeadset;

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }
}
