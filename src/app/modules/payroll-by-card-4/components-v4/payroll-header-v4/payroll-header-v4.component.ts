import { Component, HostBinding, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

@Component({
  standalone: true,
  selector: 'app-payroll-header-v4',
  templateUrl: './payroll-header-v4.component.html',
  imports: [LucideAngularModule, MatTooltipModule, V4PageHeaderComponent]
})
export class PayrollHeaderV4Component {
  @HostBinding('class') class = 'block';

  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }
}
