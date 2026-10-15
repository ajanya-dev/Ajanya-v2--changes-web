import { Component, HostBinding, inject } from '@angular/core';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';

@Component({
  standalone: true,
  selector: 'app-cards-header-v4',
  imports: [V4PageHeaderComponent],
  templateUrl: './cards-header-v4.component.html'
})
export class CardsHeaderV4Component {
  @HostBinding('class') class = 'block';

  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  isGridView = this.commonLayoutToggleV4Service.gridView;

  viewToggle(isGrid: boolean): void {
    this.commonLayoutToggleV4Service.gridView.set(isGrid);
  }
}
