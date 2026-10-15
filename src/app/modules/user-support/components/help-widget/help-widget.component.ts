import { Component } from '@angular/core';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-help-widget',
  templateUrl: './help-widget.component.html',
  styleUrls: ['./help-widget.component.scss'],
  standalone: true,
  imports: [FaIconComponent]
})
export class HelpWidgetComponent {

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  environment = environment;

  goToLiveChat(): void {
    if (this.staticWhiteLabelConditions.zohoSupportChat) {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }
    else window.open(this.staticWhiteLabelConditions?.helpWebsite!, '_blank');
  }
}
