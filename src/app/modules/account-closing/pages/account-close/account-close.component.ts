import { Component } from '@angular/core';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { environment } from 'src/environments/environment';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Component for account deletion.
 */
@Component({
  selector: 'app-account-close',
  templateUrl: './account-close.component.html',
  styleUrls: ['./account-close.component.scss'],
  standalone: true,
  imports: [RouterLink, CommonButtonV35Component, NgOptimizedImage]
})
export class AccountCloseComponent {
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  isOlliePay = environment.env_id === 'olliepay';

  /**
   * @description Open chat with support.
   */
  chat() {
    if (this.staticWhiteLabelConditions.zohoSupportChat) {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
    } else {
      window.open(StaticWhiteLabelConditions.helpWebsite, '_blank');
    }
  }

  openLink(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  onClickSupport(): void {
    const { customerSupportNo, helpWebsite } = this.staticWhiteLabelConditions;

    if (customerSupportNo) {
      // Navigate to the phone number link
      window.location.href = `tel:${customerSupportNo}`;
    } else if (helpWebsite) {
      // Navigate to the help website link
      window.open(helpWebsite, '_blank');
    }
  }
}
