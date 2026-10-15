import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';

/**
 * @description Component customer support.
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-customer-support',
  templateUrl: './customer-support.component.html',
  styleUrls: ['./customer-support.component.scss']
})
export class CustomerSupportComponent {
  
  environment = environment;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  /**
   * @description Redirects to live chat for support.
   */
  goToLiveChat(): void {
    const chatBox = document.getElementById('zsiq_float');
    if (chatBox) chatBox.click();
    return;
  }

  /**
   * @description Redirects to help website.
   */
  goToHelp(): void {
    window.open(this.staticWhiteLabelConditions?.helpWebsite!, '_blank');
  }
}
