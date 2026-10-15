import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS_V4 } from 'src/app/shared/V4/lucide-icons';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-support-resources-v4',
  templateUrl: './support-resources-v4.component.html',
  styleUrls: ['./support-resources-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, CommonButtonV4Component, WhiteLabelDirective]
})
export class SupportResourcesV4Component {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  readonly icons = LUCIDE_ICONS_V4;
  readonly wl = StaticWhiteLabelConditions;

  readonly webhookDocsUrl =
    'https://support.onlinecheckwriter.com/portal/en/kb/articles/how-to-enable-webhook?_ga=2.138098096.1293115439.1644816732-43713359.1639371874';

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }
}
